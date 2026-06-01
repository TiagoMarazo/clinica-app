import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import styles from './Auth.module.css'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [clinicName, setClinicName] = useState('')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [showPwd, setShowPwd]       = useState(false)
  const [loading, setLoading]       = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!clinicName || !email || !password || !confirm) {
      toast.error('Preencha todos os campos.'); return
    }
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.'); return
    }
    if (password !== confirm) {
      toast.error('As senhas não coincidem.'); return
    }
    setLoading(true)
    try {
      await register(email, password, clinicName)
      toast.success('Conta criada! Verifique seu e-mail para continuar.')
      navigate('/verificar-email')
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'Este e-mail já está cadastrado.'
        : 'Erro ao criar conta. Tente novamente.'
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

        <h1 className={styles.title}>Criar conta</h1>
        <p className={styles.subtitle}>Cadastre sua clínica para começar</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className="field-label">
              Nome da clínica <span className="required">*</span>
            </label>
            <input
              className="input"
              type="text"
              placeholder="Ex: Clínica São Lucas"
              value={clinicName}
              onChange={e => setClinicName(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className="field-label">
              E-mail <span className="required">*</span>
            </label>
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
            <label className="field-label">
              Senha <span className="required">*</span>
            </label>
            <div className={styles.pwdWrap}>
              <input
                className="input"
                type={showPwd ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
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

          <div className={styles.field}>
            <label className="field-label">
              Confirmar senha <span className="required">*</span>
            </label>
            <input
              className="input"
              type={showPwd ? 'text' : 'password'}
              placeholder="Repita a senha"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            <UserPlus size={18} />
            {loading ? 'Criando conta…' : 'Criar conta'}
          </button>
        </form>

        <p className={styles.footer}>
          Já tem conta?{' '}
          <Link to="/login" className={styles.link}>Entrar</Link>
        </p>
      </div>
    </div>
  )
}
