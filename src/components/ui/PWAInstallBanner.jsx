import { useState } from 'react'
import { Download, X, Share, Plus } from 'lucide-react'
import { usePWAInstall } from '../../hooks/usePWAInstall'
import styles from './PWAInstallBanner.module.css'

export default function PWAInstallBanner() {
  const { canInstall, isIOSSafari, isInstalled, triggerInstall } = usePWAInstall()
  const [dismissed, setDismissed]   = useState(false)
  const [installing, setInstalling] = useState(false)
  const [showIOSSteps, setShowIOSSteps] = useState(false)

  // Não mostra se já instalado, dispensado, ou não suporta instalação
  if (isInstalled || dismissed) return null
  if (!canInstall && !isIOSSafari) return null

  async function handleInstall() {
    setInstalling(true)
    await triggerInstall()
    setInstalling(false)
  }

  return (
    <div className={styles.banner}>
      <button
        className={styles.dismissBtn}
        onClick={() => setDismissed(true)}
        aria-label="Dispensar"
      >
        <X size={16} />
      </button>

      <div className={styles.iconWrap}>
        <span className={styles.appIcon}>＋</span>
      </div>

      <div className={styles.content}>
        <p className={styles.title}>Instale o app na tela inicial</p>
        <p className={styles.description}>
          Acesse mais rápido, funciona offline e parece um app nativo no seu celular.
        </p>
      </div>

      {/* Chrome Android — botão direto */}
      {canInstall && (
        <button
          className={styles.installBtn}
          onClick={handleInstall}
          disabled={installing}
        >
          <Download size={16} />
          {installing ? 'Instalando…' : 'Instalar agora'}
        </button>
      )}

      {/* iOS Safari — instrução manual */}
      {isIOSSafari && !canInstall && (
        <>
          <button
            className={styles.installBtn}
            onClick={() => setShowIOSSteps(v => !v)}
          >
            <Share size={16} />
            Como instalar
          </button>

          {showIOSSteps && (
            <div className={styles.iosSteps}>
              <div className={styles.iosStep}>
                <span className={styles.iosStepNum}>1</span>
                <p>Toque no botão de <strong>Compartilhar</strong> <Share size={13} style={{display:'inline', verticalAlign:'middle'}} /> na barra inferior do Safari</p>
              </div>
              <div className={styles.iosStep}>
                <span className={styles.iosStepNum}>2</span>
                <p>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong> <Plus size={13} style={{display:'inline', verticalAlign:'middle'}} /></p>
              </div>
              <div className={styles.iosStep}>
                <span className={styles.iosStepNum}>3</span>
                <p>Toque em <strong>"Adicionar"</strong> no canto superior direito</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
