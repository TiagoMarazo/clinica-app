import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, RefreshCw, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { sendEmailVerification } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import toast from 'react-hot-toast'
import styles from './Auth.module.css'
import vStyles from './VerifyEmailPage.module.css'

export default function VerifyEmailPage() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const [sending, setSending]   = useState(false)
  const [checking, setChecking] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  // Contagem regressiva do cooldown de reenvio
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  // Verifica periodicamente se o usuário confirmou o e-mail
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!auth.currentUser) return
      await auth.currentUser.reload()
      if (auth.currentUser.emailVerified) {
        clearInterval(interval)
        toast.success('E-mail verificado! Bem-vindo.')
        navigate('/')
      }
    }, 3000) // checa a cada 3 segundos
    return () => clearInterval(interval)
  }, [navigate])

  async function handleResend() {
    if (!auth.currentUser || cooldown > 0) return
    setSending(true)
    try {
      await sendEmailVerification(auth.currentUser)
      toast.success('E-mail reenviado!')
      setCooldown(60) // bloqueia reenvio por 60 segundos
    } catch (err) {
      if (err.code === 'auth/too-many-requests') {
        toast.error('Muitas tentativas. Aguarde alguns minutos.')
      } else {
        toast.error('Erro ao reenviar. Tente novamente.')
      }
    } finally {
      setSending(false)
    }
  }

  async function handleCheckNow() {
    setChecking(true)
    try {
      await auth.currentUser.reload()
      if (auth.currentUser.emailVerified) {
        toast.success('E-mail verificado! Bem-vindo.')
        navigate('/')
      } else {
        toast.error('E-mail ainda não verificado. Verifique sua caixa de entrada.')
      }
    } catch {
      toast.error('Erro ao verificar. Tente novamente.')
    } finally {
      setChecking(false)
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <div className={vStyles.mailIcon}>
            <Mail size={28} />
          </div>
        </div>

        <h1 className={styles.title}>Verifique seu e-mail</h1>
        <p className={styles.subtitle}>
          Enviamos um link de confirmação para
        </p>
        <p className={vStyles.emailHighlight}>{user?.email}</p>

        <div className={vStyles.steps}>
          <div className={vStyles.step}>
            <span className={vStyles.stepNum}>1</span>
            <p>Abra seu e-mail e procure a mensagem da clínica</p>
          </div>
          <div className={vStyles.step}>
            <span className={vStyles.stepNum}>2</span>
            <p>Clique no link <strong>"Verificar e-mail"</strong> dentro da mensagem</p>
          </div>
          <div className={vStyles.step}>
            <span className={vStyles.stepNum}>3</span>
            <p>Volte aqui — o app vai entrar automaticamente</p>
          </div>
        </div>

        <button
          className="btn btn-primary btn-full"
          onClick={handleCheckNow}
          disabled={checking}
          style={{ marginBottom: 8 }}
        >
          <RefreshCw size={16} className={checking ? vStyles.spinning : ''} />
          {checking ? 'Verificando…' : 'Já verifiquei, entrar'}
        </button>

        <button
          className="btn btn-outline btn-full"
          onClick={handleResend}
          disabled={sending || cooldown > 0}
          style={{ marginBottom: 16 }}
        >
          {cooldown > 0
            ? `Reenviar em ${cooldown}s`
            : sending ? 'Enviando…' : 'Reenviar e-mail'}
        </button>

        <p className={styles.footer}>
          E-mail errado?{' '}
          <button
            className={styles.link}
            style={{ background:'none', border:'none', cursor:'pointer', padding:0, font:'inherit' }}
            onClick={handleLogout}
          >
            <LogOut size={13} style={{verticalAlign:'middle', marginRight:3}} />
            Sair e usar outro e-mail
          </button>
        </p>
      </div>
    </div>
  )
}
