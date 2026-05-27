import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, Search, User, X, Check } from 'lucide-react'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '../../contexts/AuthContext'
import { usePatients } from '../../hooks/usePatients'
import { createAppointment, updateAppointment } from '../../lib/db'
import { toDate } from '../../lib/utils'
import PageHeader from '../../components/ui/PageHeader'
import toast from 'react-hot-toast'
import styles from './AppointmentFormPage.module.css'

const DURATIONS = [15, 30, 45, 60, 90, 120]

// ─── Máscara de telefone ──────────────────────────────────────────────────────
// Formata enquanto o usuário digita: (11) 99999-9999
function maskPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2)  return digits.length ? `(${digits}` : ''
  if (digits.length <= 7)  return `(${digits.slice(0,2)}) ${digits.slice(2)}`
  if (digits.length <= 11) return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`
  return value
}

export default function AppointmentFormPage() {
  const { clinic }   = useAuth()
  const { patients } = usePatients()
  const navigate     = useNavigate()
  const { id }       = useParams()

  const isEdit = !!id

  // Campos do formulário
  const [date, setDate]         = useState(formatToday())
  const [time, setTime]         = useState('08:00')
  const [duration, setDuration] = useState(30)
  const [notes, setNotes]       = useState('')
  const [loading, setLoading]   = useState(false)

  // Paciente
  // patientConfirmed: controla se o nome manual foi confirmado pelo usuário
  // Isso evita o bug de submit ao digitar o primeiro caractere
  const [patientId, setPatientId]         = useState('')
  const [patientName, setPatientName]     = useState('')
  const [patientPhone, setPatientPhone]   = useState('')
  const [manualName, setManualName]       = useState('')   // digitação em andamento
  const [manualPhone, setManualPhone]     = useState('')   // digitação em andamento
  const [patientConfirmed, setPatientConfirmed] = useState(false)
  const [search, setSearch]               = useState('')
  const [showSearch, setShowSearch]       = useState(false)

  // Carrega dados se for edição
  useEffect(() => {
    if (!isEdit || !clinic?.id) return
    async function load() {
      try {
        const { getDoc, doc } = await import('firebase/firestore')
        const { db } = await import('../../lib/firebase')
        const snap = await getDoc(doc(db, 'clinics', clinic.id, 'appointments', id))
        if (!snap.exists()) {
          toast.error('Consulta não encontrada.')
          navigate('/')
          return
        }
        const data = snap.data()
        const dt = toDate(data.dateTime)
        setDate(dt ? dt.toISOString().slice(0, 10) : formatToday())
        setTime(dt
          ? `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`
          : '08:00')
        setDuration(data.duration || 30)
        setNotes(data.notes || '')
        setPatientId(data.patientId || '')
        setPatientName(data.patientName || '')
        setPatientPhone(data.patientPhone || '')
        // Em edição, o paciente já está confirmado
        setPatientConfirmed(true)
      } catch (err) {
        console.error('Erro ao carregar consulta:', err)
        toast.error('Erro ao carregar consulta.')
      }
    }
    load()
  }, [isEdit, id, clinic?.id])

  // ── Busca de paciente cadastrado ──
  const filtered = search.length >= 2
    ? patients.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 8)
    : []

  function selectPatient(p) {
    setPatientId(p.id)
    setPatientName(p.name)
    setPatientPhone(p.phone || '')
    setPatientConfirmed(true)
    setSearch('')
    setShowSearch(false)
    setManualName('')
    setManualPhone('')
  }

  function clearPatient() {
    setPatientId('')
    setPatientName('')
    setPatientPhone('')
    setPatientConfirmed(false)
    setManualName('')
    setManualPhone('')
  }

  // ── Confirma o nome manual — só aqui o patientName é preenchido ──
  // Isso evita que o React re-renderize o formulário enquanto o usuário digita
  function confirmManual() {
    if (!manualName.trim()) {
      toast.error('Digite o nome do paciente.')
      return
    }
    setPatientName(manualName.trim())
    setPatientPhone(manualPhone.replace(/\D/g, ''))
    setPatientConfirmed(true)
  }

  // ── Máscara de telefone no input manual ──
  function handlePhoneChange(e) {
    setManualPhone(maskPhone(e.target.value))
  }

  // ── Submit ──
  async function handleSubmit(e) {
    e.preventDefault()

    if (!patientConfirmed || !patientName) {
      toast.error('Confirme o nome do paciente antes de agendar.')
      return
    }
    if (!date || !time) {
      toast.error('Informe data e horário.')
      return
    }
    if (!clinic?.id) {
      toast.error('Sessão expirada. Faça login novamente.')
      return
    }

    const [year, month, day] = date.split('-').map(Number)
    const [hour, min]        = time.split(':').map(Number)
    const dt = new Date(year, month - 1, day, hour, min)

    setLoading(true)
    try {
      const payload = {
        patientId:    patientId   || null,
        patientName,
        patientPhone: patientPhone || null,
        dateTime:     Timestamp.fromDate(dt),
        duration,
        notes,
      }

      if (isEdit) {
        await updateAppointment(clinic.id, id, payload)
        toast.success('Consulta atualizada!')
      } else {
        await createAppointment(clinic.id, payload)
        toast.success('Consulta agendada!')
      }
      navigate('/')
    } catch (err) {
      // Expõe o erro real no console para facilitar o diagnóstico
      console.error('Erro ao salvar consulta:', err)
      const msg = err?.code === 'permission-denied'
        ? 'Sem permissão. Verifique as regras do Firestore.'
        : err?.code === 'unavailable'
        ? 'Sem conexão com o banco. Verifique sua internet.'
        : `Erro ao salvar: ${err?.message || 'tente novamente.'}`
      toast.error(msg, { duration: 5000 })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Editar consulta' : 'Nova consulta'}
        subtitle={isEdit ? 'Altere os dados abaixo' : 'Preencha os dados da consulta'}
      />

      <form onSubmit={handleSubmit} className={styles.form}>

        {/* ── Bloco do paciente ── */}
        <div className="card" style={{ marginBottom: 12 }}>
          <p className={styles.sectionLabel}>
            <User size={14} /> Paciente
          </p>

          {/* Paciente já confirmado — mostra card de resumo */}
          {patientConfirmed ? (
            <div className={styles.selectedPatient}>
              <div className={styles.selectedInfo}>
                <p className={styles.selectedName}>{patientName}</p>
                {patientPhone && (
                  <p className={styles.selectedPhone}>
                    {maskPhone(patientPhone)}
                  </p>
                )}
                {!patientId && (
                  <span className={styles.anonBadge}>Sem cadastro</span>
                )}
              </div>
              <button
                type="button"
                className={styles.clearBtn}
                onClick={clearPatient}
                title="Alterar paciente"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              {/* Busca de paciente cadastrado */}
              <div className={styles.searchWrap}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  className={styles.searchInput}
                  placeholder="Buscar paciente cadastrado…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setShowSearch(true) }}
                  onFocus={() => setShowSearch(true)}
                  onBlur={() => setTimeout(() => setShowSearch(false), 150)}
                />
              </div>

              {showSearch && filtered.length > 0 && (
                <div className={styles.dropdown}>
                  {filtered.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      className={styles.dropdownItem}
                      onMouseDown={() => selectPatient(p)}
                    >
                      <span className={styles.dropdownName}>{p.name}</span>
                      {p.phone && (
                        <span className={styles.dropdownPhone}>
                          {maskPhone(p.phone)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <hr className="divider" style={{ margin: '12px 0' }} />
              <p className={styles.orLabel}>Ou informe manualmente</p>

              {/* Nome manual — NÃO preenche patientName diretamente */}
              {/* Só confirma ao clicar no botão, evitando re-render prematuro */}
              <div className={styles.fieldGroup}>
                <label className="field-label">
                  Nome do paciente <span className="required">*</span>
                </label>
                <input
                  className="input"
                  placeholder="Nome completo"
                  value={manualName}
                  onChange={e => setManualName(e.target.value)}
                  onKeyDown={e => {
                    // Enter no campo de nome não submete o form
                    if (e.key === 'Enter') { e.preventDefault(); confirmManual() }
                  }}
                />
              </div>

              <div className={styles.fieldGroup} style={{ marginTop: 10 }}>
                <label className="field-label">WhatsApp (para lembrete)</label>
                <input
                  className="input"
                  placeholder="(11) 99999-9999"
                  value={manualPhone}
                  onChange={handlePhoneChange}
                  inputMode="numeric"
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); confirmManual() }
                  }}
                />
                <p className={styles.hint}>
                  Se preenchido, o paciente receberá lembrete no dia anterior.
                </p>
              </div>

              {/* Botão explícito para confirmar — evita submit acidental */}
              <button
                type="button"
                className={`btn btn-primary btn-full ${styles.confirmBtn}`}
                onClick={confirmManual}
                disabled={!manualName.trim()}
              >
                <Check size={16} /> Usar este paciente
              </button>
            </>
          )}
        </div>

        {/* ── Data e hora ── */}
        <div className="card" style={{ marginBottom: 12 }}>
          <p className={styles.sectionLabel}>📅 Data e horário</p>
          <div className={styles.row2}>
            <div className={styles.fieldGroup}>
              <label className="field-label">
                Data <span className="required">*</span>
              </label>
              <input
                className="input"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className="field-label">
                Horário <span className="required">*</span>
              </label>
              <input
                className="input"
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.fieldGroup} style={{ marginTop: 12 }}>
            <label className="field-label">Duração</label>
            <div className={styles.durationRow}>
              {DURATIONS.map(d => (
                <button
                  key={d}
                  type="button"
                  className={`${styles.durationBtn} ${duration === d ? styles.durationActive : ''}`}
                  onClick={() => setDuration(d)}
                >
                  {d < 60 ? `${d}min` : `${d / 60}h`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Observações ── */}
        <div className="card" style={{ marginBottom: 20 }}>
          <p className={styles.sectionLabel}>📝 Observações</p>
          <textarea
            className={`input ${styles.textarea}`}
            placeholder="Motivo da consulta, anotações importantes…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={loading}
        >
          <Save size={18} />
          {loading ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Agendar consulta'}
        </button>

        <button
          type="button"
          className="btn btn-outline btn-full"
          style={{ marginTop: 8 }}
          onClick={() => navigate(-1)}
          disabled={loading}
        >
          Cancelar
        </button>
      </form>
    </div>
  )
}

function formatToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
