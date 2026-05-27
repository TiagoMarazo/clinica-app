import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import styles from './PageHeader.module.css'

export default function PageHeader({ title, subtitle, action }) {
  const navigate = useNavigate()

  return (
    <header className={styles.header}>
      <button
        className={styles.backBtn}
        onClick={() => navigate(-1)}
        aria-label="Voltar"
      >
        <ArrowLeft size={20} />
      </button>
      <div className={styles.text}>
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </header>
  )
}
