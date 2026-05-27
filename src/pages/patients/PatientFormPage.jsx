import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { createPatient, updatePatient, getPatient } from '../../lib/db'
import PageHeader from '../../components/ui/PageHeader'
import toast from 'react-hot-toast'
import styles from './PatientFormPage.module.css'

const TAGS = ['Plano de saúde', 'Particular', 'Retorno', 'Prioritário', 'Idoso', 'Criança']

function maskPhone(value) {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2)  return d.length ? `(${d}` : ''
  if (d.length <= 7)  return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  return value
}

export default function PatientFormPage() {
  const { clinic }  = useAuth()
  const navigate    = useNavigate()
  const { id }      = useParams()
  const isEdit      = !!id

  const [name, setName]         = useState('')
  const [phone, setPhone]       = useState('')
  const [email, setEmail]       = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender]     = useState('')
  const [tags, setTags]         = useState([])
  const [notes, setNotes]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [fetching, setFetching] = useState(isEdit)

  useEffect(() => {
    if (!isEdit || !clinic?.id) return
    async function load() {
      try {
        const data = await getPatient(clinic.id, id)
        if (!data) { toast.error('Paciente não encontrado.'); navigate('/pacientes'); return }
        setName(data.name || '')
        setPhone(data.phone ? maskPhone(data.phone) : '')
        setEmail(data.email || '')
        setBirthDate(data.birthDate || '')
        setGender(data.gender || '')
        setTags(data.tags || [])
        setNotes(data.notes || '')
      } catch (err) {
        console.error('Erro ao carregar paciente:', err)
        toast.error('Erro ao carregar dados.')
      } finally {
        setFetching(false)
      }
    }
    load()
  }, [isEdit, id, clinic?.id])

  function toggleTag(tag) {
    setTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { toast.error('O nome é obrigatório.'); return }

    setLoading(true)
    try {
      const payload = {
        name: name.trim(),
        phone: phone.replace(/\D/g, '') || null,
        email: email.trim() || null,
        birthDate: birthDate || null,
        gender: gender || null,
        tags,
        notes: notes.trim() || null,
      }

      if (isEdit) {
        await updatePatient(clinic.id, id, payload)
        toast.success('Paciente atualizado!')
        navigate(`/pacientes/${id}`)
      } else {
        const newId = await createPatient(clinic.id, payload)
        toast.success('Paciente cadastrado!')
        navigate(`/pacientes/${newId}`)
      }
    } catch (err) {
      console.error('Erro ao salvar paciente:', err)
      const msg = err?.code === 'permission-denied'
        ? 'Sem permissão. Verifique as regras do Firestore.'
        : 'Erro ao salvar. Tente novamente.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div>
        <PageHeader title="Editar paciente" />
        <div style={{ display:'flex', justifyContent:'center', padding:'48px 0' }}>
          <div className={styles.spinner} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Editar paciente' : 'Novo paciente'}
        subtitle={isEdit ? 'Altere os dados abaixo' : 'Preencha os dados de cadastro'}
      />

      <form onSubmit={handleSubmit} className={styles.form}>

        {/* Dados pessoais */}
        <div className="card" style={{ marginBottom: 12 }}>
          <p className={styles.sectionLabel}>👤 Dados pessoais</p>

          <div className={styles.field}>
            <label className="field-label">
              Nome completo <span className="required">*</span>
            </label>
            <input
              className="input"
              placeholder="Ex: Maria Fernanda Silva"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label className="field-label">Data de nascimento</label>
              <input
                className="input"
                type="date"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className="field-label">Sexo</label>
              <select
                className="input"
                value={gender}
                onChange={e => setGender(e.target.value)}
              >
                <option value="">Selecionar</option>
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
                <option value="O">Outro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contato */}
        <div className="card" style={{ marginBottom: 12 }}>
          <p className={styles.sectionLabel}>📱 Contato</p>

          <div className={styles.field}>
            <label className="field-label">WhatsApp</label>
            <input
              className="input"
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={e => setPhone(maskPhone(e.target.value))}
              inputMode="numeric"
            />
            <p className={styles.hint}>
              Usado para enviar lembretes automáticos de consulta.
            </p>
          </div>

          <div className={styles.field}>
            <label className="field-label">E-mail</label>
            <input
              className="input"
              type="email"
              placeholder="paciente@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Classificação */}
        <div className="card" style={{ marginBottom: 12 }}>
          <p className={styles.sectionLabel}>🏷️ Classificação</p>

          <label className="field-label" style={{ marginBottom: 8 }}>Tags</label>
          <div className={styles.tagRow}>
            {TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                className={`${styles.tagBtn} ${tags.includes(tag) ? styles.tagActive : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          <hr className="divider" />

          <div className={styles.field}>
            <label className="field-label">Observações</label>
            <textarea
              className={`input ${styles.textarea}`}
              placeholder="Alergias, informações importantes, histórico relevante…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={loading}
        >
          <Save size={18} />
          {loading ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Cadastrar paciente'}
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
