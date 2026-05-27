import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Calendar, ChevronLeft, ChevronRight, WifiOff } from 'lucide-react'
import { format, isToday, isSameDay, addWeeks, subWeeks } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAppointments } from '../../hooks/useAppointments'
import { useAuth } from '../../contexts/AuthContext'
import { updateAppointment } from '../../lib/db'
import {
  getWeekDays,
  appointmentsForDay,
  formatTime,
  statusBadge,
  initials,
  toDate,
} from '../../lib/utils'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import toast from 'react-hot-toast'
import styles from './AgendaPage.module.css'

export default function AgendaPage() {
  const { clinic } = useAuth()
  const { appointments, loading, error } = useAppointments()
  const navigate = useNavigate()

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [weekAnchor, setWeekAnchor]     = useState(new Date())
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling]     = useState(false)

  const weekDays  = getWeekDays(weekAnchor)
  const dayAppts  = appointmentsForDay(appointments, selectedDate)
    .sort((a, b) => toDate(a.dateTime) - toDate(b.dateTime))

  const todayAppts = appointmentsForDay(appointments, new Date())
  const doneToday  = todayAppts.filter(a => a.status === 'done').length
  const nextAppt   = dayAppts.find(a => a.status === 'scheduled')

  const daysWithAppts = new Set(
    appointments.map(a => {
      const d = toDate(a.dateTime)
      return d ? format(d, 'yyyy-MM-dd') : null
    }).filter(Boolean)
  )

  async function handleCancel() {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await updateAppointment(clinic.id, cancelTarget.id, { status: 'cancelled' })
      toast.success('Consulta cancelada.')
    } catch {
      toast.error('Erro ao cancelar. Tente novamente.')
    } finally {
      setCancelling(false)
      setCancelTarget(null)
    }
  }

  async function handleMarkDone(appt) {
    try {
      await updateAppointment(clinic.id, appt.id, { status: 'done' })
      toast.success('Consulta marcada como realizada.')
    } catch {
      toast.error('Erro ao atualizar. Tente novamente.')
    }
  }

  async function handleRestore(appt) {
    try {
      await updateAppointment(clinic.id, appt.id, { status: 'scheduled' })
      toast.success('Consulta reagendada.')
    } catch {
      toast.error('Erro ao atualizar. Tente novamente.')
    }
  }

  return (
    <div className={styles.page}>

      {/* Resumo do dia */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Hoje</span>
          <span className={styles.summaryVal}>{todayAppts.length}</span>
          <span className={styles.summarySub}>consultas</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Realizadas</span>
          <span className={styles.summaryVal}>{doneToday}</span>
          <span className={styles.summarySub}>de {todayAppts.length}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Próxima</span>
          <span className={`${styles.summaryVal} ${styles.summaryTime}`}>
            {nextAppt ? formatTime(nextAppt.dateTime) : '—'}
          </span>
          <span className={styles.summarySub}>
            {nextAppt ? nextAppt.patientName : 'nenhuma'}
          </span>
        </div>
      </div>

      {/* Navegação de semana */}
      <div className={styles.weekHeader}>
        <button className={styles.weekNav} onClick={() => setWeekAnchor(w => subWeeks(w, 1))}>
          <ChevronLeft size={18} />
        </button>
        <span className={styles.weekLabel}>
          {format(weekDays[0], "dd MMM", { locale: ptBR })} –{' '}
          {format(weekDays[6], "dd MMM", { locale: ptBR })}
        </span>
        <button className={styles.weekNav} onClick={() => setWeekAnchor(w => addWeeks(w, 1))}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Calendário semanal */}
      <div className={styles.weekRow}>
        {weekDays.map(day => {
          const key    = format(day, 'yyyy-MM-dd')
          const active = isSameDay(day, selectedDate)
          const today  = isToday(day)
          const hasDot = daysWithAppts.has(key)

          return (
            <button
              key={key}
              className={`${styles.dayBtn} ${active ? styles.dayActive : ''} ${today && !active ? styles.dayToday : ''}`}
              onClick={() => setSelectedDate(day)}
            >
              <span className={styles.dayLabel}>
                {format(day, 'EEE', { locale: ptBR }).slice(0, 3)}
              </span>
              <span className={styles.dayNum}>{format(day, 'd')}</span>
              {hasDot && <span className={styles.dayDot} />}
            </button>
          )
        })}
      </div>

      {/* Cabeçalho do dia selecionado */}
      <div className={styles.dayHeader}>
        <span className={styles.dayTitle}>
          {isToday(selectedDate)
            ? 'Hoje'
            : format(selectedDate, "EEE, dd 'de' MMM", { locale: ptBR })}
        </span>
        <span className={styles.dayCount}>
          {dayAppts.length} {dayAppts.length === 1 ? 'consulta' : 'consultas'}
        </span>
      </div>

      {/* Lista de consultas */}
      <div className={styles.list}>
        {loading ? (
          <div className={styles.loadingWrap}>
            <div className={styles.loadingSpinner} />
            <p className={styles.loadingText}>Carregando consultas…</p>
          </div>
        ) : error === 'connection' ? (
          <div className={styles.errorWrap}>
            <div className={styles.errorIcon}>
              <WifiOff size={28} />
            </div>
            <p className={styles.errorTitle}>Sem conexão com o banco</p>
            <p className={styles.errorDesc}>
              Não foi possível conectar ao Firebase. Verifique se as credenciais
              no arquivo <code>.env</code> estão corretas e se o Firestore está
              ativado no seu projeto.
            </p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => window.location.reload()}
            >
              Tentar novamente
            </button>
          </div>
        ) : dayAppts.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Nenhuma consulta"
            description="Não há consultas para este dia."
          />
        ) : (
          dayAppts.map(appt => {
            const { label, cls } = statusBadge(appt.status)
            return (
              <div
                key={appt.id}
                className={`${styles.apptCard} ${styles[`appt_${appt.status}`]}`}
              >
                <div className={styles.apptTime}>
                  <span className={styles.apptHour}>{formatTime(appt.dateTime)}</span>
                  <span className={styles.apptDur}>{appt.duration}min</span>
                </div>

                <div className={styles.apptBar} />

                <div className={styles.apptInfo}>
                  <div className={styles.apptNameRow}>
                    <div className={styles.apptAvatar}>
                      {initials(appt.patientName)}
                    </div>
                    <div className={styles.apptNameBlock}>
                      <p className={styles.apptName}>{appt.patientName}</p>
                      {appt.notes && (
                        <p className={styles.apptNotes}>{appt.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className={styles.apptFooter}>
                    <span className={`badge ${cls}`}>{label}</span>
                    <div className={styles.apptActions}>
                      {appt.status === 'scheduled' && (
                        <>
                          <button
                            className={styles.actionBtn}
                            onClick={() => handleMarkDone(appt)}
                            title="Marcar como realizada"
                          >✓</button>
                          <button
                            className={styles.actionBtn}
                            onClick={() => navigate(`/consulta/${appt.id}/editar`)}
                            title="Editar"
                          >✎</button>
                          <button
                            className={`${styles.actionBtn} ${styles.actionDanger}`}
                            onClick={() => setCancelTarget(appt)}
                            title="Cancelar"
                          >✕</button>
                        </>
                      )}
                      {appt.status === 'cancelled' && (
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleRestore(appt)}
                          title="Reagendar"
                        >↩</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* FAB — sempre visível, independente de haver consultas */}
      <button
        className={styles.fab}
        onClick={() => navigate('/consulta/nova')}
        aria-label="Nova consulta"
        title="Nova consulta"
      >
        <Plus size={24} />
      </button>

      {/* Dialog de cancelamento */}
      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancelar consulta?"
        description={
          cancelTarget
            ? `Deseja cancelar a consulta de ${cancelTarget.patientName}? Essa ação não pode ser desfeita.`
            : ''
        }
        cancelLabel="Manter consulta"
        confirmLabel="Sim, cancelar consulta"
        danger
        loading={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  )
}
