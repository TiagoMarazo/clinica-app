import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import styles from './ConfirmDialog.module.css'

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel  = 'Cancelar',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  // Fecha com Esc
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.dialog} onClick={e => e.stopPropagation()}>
        <div className={`${styles.iconWrap} ${danger ? styles.iconDanger : styles.iconWarning}`}>
          <AlertTriangle size={24} />
        </div>

        <h3 className={styles.title}>{title}</h3>
        {description && <p className={styles.description}>{description}</p>}

        <div className={styles.actions}>
          {/* Botão principal em azul — "manter" / ação segura */}
          <button
            className="btn btn-primary btn-full"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>

          {/* Ação destrutiva em vermelho discreto — secundária visualmente */}
          <button
            className={`btn btn-full ${danger ? 'btn-danger-outline' : 'btn-outline'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Aguarde…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
