import { useState, useEffect } from 'react'

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isInstalled, setIsInstalled]     = useState(false)
  const [isIOS, setIsIOS]                 = useState(false)
  const [isIOSSafari, setIsIOSSafari]     = useState(false)

  useEffect(() => {
    // Detecta se já está instalado como PWA
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    setIsInstalled(standalone)

    // Detecta iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)

    // Detecta Safari no iOS especificamente
    const iosSafari = ios && /safari/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent)
    setIsIOSSafari(iosSafari)

    // Captura o evento de instalação (Chrome Android e outros)
    function handleBeforeInstall(e) {
      e.preventDefault()
      setInstallPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Detecta quando o usuário instala pelo banner nativo
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  async function triggerInstall() {
    if (!installPrompt) return false
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
      setInstallPrompt(null)
      return true
    }
    return false
  }

  return {
    canInstall:  !!installPrompt,   // Chrome Android — botão direto
    isIOS,                          // iOS qualquer navegador
    isIOSSafari,                    // iOS Safari — único que suporta instalação no iOS
    isInstalled,
    triggerInstall,
  }
}
