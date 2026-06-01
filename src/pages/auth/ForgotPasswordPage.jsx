import { useState } from 'react'
import { Link } from 'react-router-dom'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import styles from './Auth.module.css'
import fStyles from './ForgotPasswordPage.module.css'

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('')
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) { toast.error('Informe seu e-mail.'); return }

    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email)
      setSent(true)
    } catch (err) {
      // Não revelamos se o e-mail existe ou não — boa prática de segurança
      // Mostramos sucesso mesmo se o e-mail não existir
      setSent(true)
      console.error('Forgot password error:', err.code)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logoWrap}>
            <div className={fStyles.successIcon}>
              <CheckCircle size={28} />
            </div>
          </div>
          <h1 className={styles.title}>E-mail enviado</h1>
          <p className={styles.subtitle}>
            Se existe uma conta com o e-mail <strong>{email}</strong>, você
            receberá as instruções para redefinir sua senha em instantes.
          </p>
          <p className={fStyles.hint}>
            Não recebeu? Verifique a pasta de spam ou tente novamente com outro e-mail.
          </p>
          <Link to="/login" className="btn btn-primary btn-full" style={{ marginTop: 20, textDecoration:'none' }}>
            <ArrowLeft size={16} /> Voltar ao login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <div className={fStyles.mailIcon}>
            <Mail size={28} />
          </div>
        </div>

        <h1 className={styles.title}>Recuperar senha</h1>
        <p className={styles.subtitle}>
          Informe seu e-mail e enviaremos um link para você criar uma nova senha.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className="field-label">E-mail da conta</label>
            <input
              className="input"
              type="email"
              placeholder="clinica@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            <Mail size={16} />
            {loading ? 'Enviando…' : 'Enviar link de recuperação'}
          </button>
        </form>

        <p className={styles.footer}>
          Lembrou a senha?{' '}
          <Link to="/login" className={styles.link}>Voltar ao login</Link>
        </p>
      </div>
    </div>
  )
}
