import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Edit, Trash2, Plus, Phone, Mail, Calendar, FileText, Activity } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getPatient, deletePatient, getPatientAppointments, getPatientTreatments } from '../../lib/db'
import { initials, formatPhone, formatDateShort, formatTime, statusBadge, formatDateLong } from '../../lib/utils'
import PageHeader from '../../components/ui/PageHeader'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import toast from 'react-hot-toast'
import styles from './PatientDetailPage.module.css'

export default function PatientDetailPage() {
  const { clinic }  = useAuth()
  const navigate    = useNavigate()
  const { id }      = useParams()

  const [patient, setPatient]         = useState(null)
  const [appointments, setAppointments] = useState([])
  const [treatments, setTreatments]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [deleteOpen, setDeleteOpen]   = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [tab, setTab]                 = useState('history') // 'history' | 'treatments'

  useEffect(() => {
    if (!clinic?.id) return
    async function load() {
      try {
        const [p, appts, treats] = await Promise.all([
          getPatient(clinic.id, id),
          getPatientAppointments(clinic.id, id),
          getPatientTreatments(clinic.id, id),
        ])
        if (!p) { toast.error('Paciente não encontrado.'); navigate('/pacientes'); return }
        setPatient(p)
        setAppointments(appts)
        setTreatments(treats)
      } catch (err) {
        console.error('Erro ao carregar paciente:', err)
        toast.error('Erro ao carregar dados.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [clinic?.id, id])

  async function handleDelete() {
    setDeleting(true)
    try {
      await deletePatient(clinic.id, id)
      toast.success('Paciente removido.')
      navigate('/pacientes')
    } catch (err) {
      console.error('Erro ao deletar:', err)
      toast.error('Erro ao remover paciente.')
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Paciente" />
        <div style={{ display:'flex', justifyContent:'center', padding:'48px 0' }}>
          <div className={styles.spinner} />
        </div>
      </div>
    )
  }

  if (!patient) return null

  const doneAppts      = appointments.filter(a => a.status === 'done').length
  const activeТreatments = treatments.filter(t => t.status === 'active').length

  return (
    <div>
      <PageHeader
        title="Perfil do paciente"
        action={
          <button
            className="btn btn-outline btn-sm"
            onClick={() => navigate(`/pacientes/${id}/editar`)}
          >
            <Edit size={14} /> Editar
          </button>
        }
      />

      <div className={styles.page}>

        {/* Card de identidade */}
        <div className={styles.identityCard}>
          <div className={styles.bigAvatar}>{initials(patient.name)}</div>
          <div className={styles.identityInfo}>
            <h2 className={styles.patientName}>{patient.name}</h2>
            {patient.birthDate && (
              <p className={styles.patientMeta}>
                Nascimento: {formatDateShort(patient.birthDate)}
              </p>
            )}
            {patient.gender && (
              <p className={styles.patientMeta}>
                {patient.gender === 'F' ? 'Feminino' : patient.gender === 'M' ? 'Masculino' : 'Outro'}
              </p>
            )}
            {patient.tags?.length > 0 && (
              <div className={styles.tagRow}>
                {patient.tags.map(tag => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contato */}
        {(patient.phone || patient.email) && (
          <div className="card" style={{ marginBottom: 12 }}>
            <p className={styles.sectionLabel}>Contato</p>
            {patient.phone && (
              <a href={`tel:${patient.phone}`} className={styles.contactRow}>
                <Phone size={15} className={styles.contactIcon} />
                <span>{formatPhone(patient.phone)}</span>
              </a>
            )}
            {patient.email && (
              <a href={`mailto:${patient.email}`} className={styles.contactRow}>
                <Mail size={15} className={styles.contactIcon} />
                <span>{patient.email}</span>
              </a>
            )}
          </div>
        )}

        {/* Observações */}
        {patient.notes && (
          <div className="card" style={{ marginBottom: 12 }}>
            <p className={styles.sectionLabel}>Observações</p>
            <p className={styles.notes}>{patient.notes}</p>
          </div>
        )}

        {/* Resumo numérico */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <Calendar size={18} className={styles.statIcon} />
            <span className={styles.statVal}>{appointments.length}</span>
            <span className={styles.statLabel}>Consultas</span>
          </div>
          <div className={styles.statCard}>
            <FileText size={18} className={styles.statIcon} />
            <span className={styles.statVal}>{doneAppts}</span>
            <span className={styles.statLabel}>Realizadas</span>
          </div>
          <div className={styles.statCard}>
            <Activity size={18} className={styles.statIcon} />
            <span className={styles.statVal}>{activeТreatments}</span>
            <span className={styles.statLabel}>Tratamentos</span>
          </div>
        </div>

        {/* Abas: histórico / tratamentos */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'history' ? styles.tabActive : ''}`}
            onClick={() => setTab('history')}
          >
            Histórico
          </button>
          <button
            className={`${styles.tab} ${tab === 'treatments' ? styles.tabActive : ''}`}
            onClick={() => setTab('treatments')}
          >
            Tratamentos
          </button>
        </div>

        {/* Histórico de consultas */}
        {tab === 'history' && (
          <div className={styles.tabContent}>
            <div className={styles.tabActions}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/consulta/nova')}
              >
                <Plus size={14} /> Nova consulta
              </button>
            </div>
            {appointments.length === 0 ? (
              <p className={styles.empty}>Nenhuma consulta registrada.</p>
            ) : (
              appointments.map(appt => {
                const { label, cls } = statusBadge(appt.status)
                return (
                  <div key={appt.id} className={styles.apptRow}>
                    <div className={styles.apptDate}>
                      <span className={styles.apptDay}>
                        {formatDateShort(appt.dateTime)}
                      </span>
                      <span className={styles.apptTime}>
                        {formatTime(appt.dateTime)}
                      </span>
                    </div>
                    <div className={styles.apptMid}>
                      {appt.notes
                        ? <p className={styles.apptNote}>{appt.notes}</p>
                        : <p className={styles.apptNote} style={{color:'var(--color-text-muted)'}}>Sem observações</p>
                      }
                      <span className={`badge ${cls}`}>{label}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Tratamentos */}
        {tab === 'treatments' && (
          <div className={styles.tabContent}>
            <div className={styles.tabActions}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/tratamentos')}
              >
                <Plus size={14} /> Novo tratamento
              </button>
            </div>
            {treatments.length === 0 ? (
              <p className={styles.empty}>Nenhum tratamento registrado.</p>
            ) : (
              treatments.map(t => {
                const done  = t.stages?.filter(s => s.done).length || 0
                const total = t.stages?.length || 0
                const pct   = total > 0 ? Math.round((done / total) * 100) : 0
                return (
                  <button
                    key={t.id}
                    className={styles.treatmentRow}
                    onClick={() => navigate(`/tratamentos/${t.id}`)}
                  >
                    <div className={styles.treatmentInfo}>
                      <p className={styles.treatmentTitle}>{t.title}</p>
                      <p className={styles.treatmentMeta}>{done}/{total} etapas concluídas</p>
                      <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className={`badge ${t.status === 'active' ? 'badge-scheduled' : 'badge-done'}`}>
                      {t.status === 'active' ? 'Em andamento' : 'Concluído'}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        )}

        {/* Zona de perigo */}
        <div className={styles.dangerZone}>
          <button
            className="btn btn-danger-outline btn-full"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 size={16} /> Remover paciente
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Remover paciente?"
        description={`Todos os dados de ${patient.name} serão removidos permanentemente. Essa ação não pode ser desfeita.`}
        cancelLabel="Manter paciente"
        confirmLabel="Sim, remover paciente"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  )
}
