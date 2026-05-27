import { useState, useEffect } from 'react'
import { Bell, MessageCircle, Calendar, CheckCircle, Clock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useAppointments } from '../../hooks/useAppointments'
import { formatTime, formatDateFriendly, toDate, initials } from '../../lib/utils'
import { isTomorrow, isToday, isPast, startOfDay } from 'date-fns'
import EmptyState from '../../components/ui/EmptyState'
import styles from './NotificationsPage.module.css'

export default function NotificationsPage() {
  const { clinic }                   = useAuth()
  const { appointments, loading }    = useAppointments()
  const [tab, setTab]                = useState('pending') // 'pending' | 'sent'

  // Consultas de amanhã com telefone — vão receber lembrete
  const pending = appointments.filter(a => {
    const d = toDate(a.dateTime)
    return d
      && isTomorrow(d)
      && a.status === 'scheduled'
      && a.patientPhone
      && !a.reminderSent
  })

  // Consultas cujo lembrete já foi enviado
  const sent = appointments.filter(a => a.reminderSent)
    .sort((a, b) => toDate(b.dateTime) - toDate(a.dateTime))

  // Consultas de amanhã SEM telefone — não vão receber lembrete
  const noPhone = appointments.filter(a => {
    const d = toDate(a.dateTime)
    return d
      && isTomorrow(d)
      && a.status === 'scheduled'
      && !a.patientPhone
  })

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Notificações</h2>
          <p className={styles.subtitle}>Lembretes automáticos via WhatsApp</p>
        </div>
        <div className={styles.bellWrap}>
          <Bell size={22} className={styles.bellIcon} />
          {pending.length > 0 && (
            <span className={styles.bellBadge}>{pending.length}</span>
          )}
        </div>
      </div>

      {/* Card informativo */}
      <div className={styles.infoCard}>
        <MessageCircle size={18} className={styles.infoIcon} />
        <p className={styles.infoText}>
          Todo dia às <strong>8h</strong> o sistema envia automaticamente uma mensagem
          de lembrete pelo WhatsApp para os pacientes com consulta no dia seguinte
          que tenham telefone cadastrado.
        </p>
      </div>

      {/* Resumo de amanhã */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <Calendar size={16} className={styles.summaryIcon} />
          <span className={styles.summaryVal}>{pending.length}</span>
          <span className={styles.summaryLabel}>Vão receber lembrete</span>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryWarn}`}>
          <Bell size={16} className={styles.summaryIcon} />
          <span className={styles.summaryVal}>{noPhone.length}</span>
          <span className={styles.summaryLabel}>Sem telefone</span>
        </div>
        <div className={`${styles.summaryCard} ${styles.summarySuccess}`}>
          <CheckCircle size={16} className={styles.summaryIcon} />
          <span className={styles.summaryVal}>{sent.length}</span>
          <span className={styles.summaryLabel}>Já enviados</span>
        </div>
      </div>

      {/* Abas */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'pending' ? styles.tabActive : ''}`}
          onClick={() => setTab('pending')}
        >
          Amanhã
          {pending.length > 0 && (
            <span className={styles.tabBadge}>{pending.length}</span>
          )}
        </button>
        <button
          className={`${styles.tab} ${tab === 'sent' ? styles.tabActive : ''}`}
          onClick={() => setTab('sent')}
        >
          Enviados
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Carregando…</p>
        </div>
      ) : tab === 'pending' ? (

        /* ── Aba Amanhã ── */
        <div>
          {pending.length === 0 && noPhone.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="Nenhuma consulta amanhã"
              description="Quando houver consultas agendadas para amanhã elas aparecerão aqui."
            />
          ) : (
            <>
              {/* Com lembrete */}
              {pending.length > 0 && (
                <>
                  <p className={styles.groupLabel}>
                    <MessageCircle size={13} /> Vão receber lembrete
                  </p>
                  {pending.map(appt => (
                    <AppointmentRow key={appt.id} appt={appt} type="pending" />
                  ))}
                </>
              )}

              {/* Sem telefone */}
              {noPhone.length > 0 && (
                <>
                  <p className={`${styles.groupLabel} ${styles.groupWarn}`}>
                    <Bell size={13} /> Sem telefone cadastrado — não receberão lembrete
                  </p>
                  {noPhone.map(appt => (
                    <AppointmentRow key={appt.id} appt={appt} type="noPhone" />
                  ))}
                </>
              )}
            </>
          )}
        </div>

      ) : (

        /* ── Aba Enviados ── */
        <div>
          {sent.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="Nenhum lembrete enviado ainda"
              description="Os lembretes enviados aparecerão aqui após o disparo automático das 8h."
            />
          ) : (
            sent.map(appt => (
              <AppointmentRow key={appt.id} appt={appt} type="sent" />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function AppointmentRow({ appt, type }) {
  const d = toDate(appt.dateTime)

  return (
    <div className={`${styles.apptCard} ${styles[`appt_${type}`]}`}>
      <div className={styles.apptAvatar}>{initials(appt.patientName)}</div>
      <div className={styles.apptInfo}>
        <p className={styles.apptName}>{appt.patientName}</p>
        <p className={styles.apptMeta}>
          {formatDateFriendly(d)} às {formatTime(d)}
        </p>
        {type === 'pending' && appt.patientPhone && (
          <p className={styles.apptPhone}>📱 {appt.patientPhone}</p>
        )}
        {type === 'noPhone' && (
          <p className={styles.apptNoPhone}>Cadastre o telefone na ficha do paciente</p>
        )}
        {type === 'sent' && (
          <p className={styles.apptSent}>✓ Lembrete enviado</p>
        )}
      </div>
      <div className={styles.apptStatus}>
        {type === 'pending' && <Clock size={18} className={styles.iconPending} />}
        {type === 'noPhone' && <Bell size={18} className={styles.iconWarn} />}
        {type === 'sent'    && <CheckCircle size={18} className={styles.iconSent} />}
      </div>
    </div>
  )
}
