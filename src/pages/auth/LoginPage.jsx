import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { sendEmailVerification } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import toast from 'react-hot-toast'
import PWAInstallBanner from '../../components/ui/PWAInstallBanner'
import styles from './Auth.module.css'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) { toast.error('Preencha e-mail e senha.'); return }

    setLoading(true)
    try {
      const user = await login(email, password)

      // Bloqueia login se e-mail não foi verificado
      if (!user.emailVerified) {
        // Reenvia o e-mail de verificação automaticamente
        await sendEmailVerification(auth.currentUser)
        navigate('/verificar-email')
        return
      }

      navigate('/')
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'E-mail ou senha incorretos.'
        : 'Erro ao entrar. Tente novamente.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <div className={styles.logoIcon}>＋</div>
        </div>

        <h1 className={styles.title}>Bem-vindo de volta</h1>
        <p className={styles.subtitle}>Entre na sua conta para acessar a agenda</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className="field-label">E-mail</label>
            <input
              className="input"
              type="email"
              placeholder="clinica@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label className="field-label">Senha</label>
            <div className={styles.pwdWrap}>
              <input
                className="input"
                type={showPwd ? 'text' : 'password'}
                placeholder="Sua senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPwd(v => !v)}
                aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Link de recuperação de senha */}
          <div style={{ textAlign: 'right', marginTop: -8 }}>
            <Link to="/recuperar-senha" className={styles.link} style={{ fontSize: 13 }}>
              Esqueci minha senha
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            <LogIn size={18} />
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className={styles.footer}>
          Primeira vez?{' '}
          <Link to="/cadastro" className={styles.link}>Criar conta da clínica</Link>
        </p>

        <PWAInstallBanner />
      </div>
    </div>
  )
}
