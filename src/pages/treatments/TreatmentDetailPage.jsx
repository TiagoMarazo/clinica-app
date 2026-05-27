import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2, Check, ChevronDown, ChevronUp, Save, Search } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { usePatients } from '../../hooks/usePatients'
import {
  createTreatment,
  updateTreatment,
  deleteTreatment,
  getPatient,
} from '../../lib/db'
import { db } from '../../lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import PageHeader from '../../components/ui/PageHeader'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import toast from 'react-hot-toast'
import styles from './TreatmentDetailPage.module.css'

const isNew = (id) => !id || id === 'novo'

export default function TreatmentDetailPage() {
  const { clinic }   = useAuth()
  const { patients } = usePatients()
  const navigate     = useNavigate()
  const { id }       = useParams()

  const creating = isNew(id)

  // Campos principais
  const [title, setTitle]       = useState('')
  const [status, setStatus]     = useState('active')
  const [stages, setStages]     = useState([])
  const [loading, setLoading]   = useState(!creating)
  const [saving, setSaving]     = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Paciente
  const [patientId, setPatientId]     = useState('')
  const [patientName, setPatientName] = useState('')
  const [patientSearch, setPatientSearch] = useState('')
  const [showPatientSearch, setShowPatientSearch] = useState(false)
  const [patientConfirmed, setPatientConfirmed]   = useState(false)

  // Nova etapa
  const [newStageLabel, setNewStageLabel] = useState('')
  const [newStageNotes, setNewStageNotes] = useState('')
  const [addingStage, setAddingStage]     = useState(false)

  // Etapa expandida
  const [expandedStage, setExpandedStage] = useState(null)

  // Carrega tratamento existente
  useEffect(() => {
    if (creating || !clinic?.id) return
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'clinics', clinic.id, 'treatments', id))
        if (!snap.exists()) {
          toast.error('Tratamento não encontrado.')
          navigate('/tratamentos')
          return
        }
        const data = snap.data()
        setTitle(data.title || '')
        setStatus(data.status || 'active')
        setStages(data.stages || [])
        setPatientId(data.patientId || '')
        setPatientName(data.patientName || '')
        setPatientConfirmed(true)
      } catch (err) {
        console.error('Erro ao carregar tratamento:', err)
        toast.error('Erro ao carregar dados.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [creating, id, clinic?.id])

  // Busca de paciente
  const filteredPatients = patientSearch.length >= 2
    ? patients.filter(p =>
        p.name.toLowerCase().includes(patientSearch.toLowerCase())
      ).slice(0, 6)
    : []

  function selectPatient(p) {
    setPatientId(p.id)
    setPatientName(p.name)
    setPatientConfirmed(true)
    setPatientSearch('')
    setShowPatientSearch(false)
  }

  function clearPatient() {
    setPatientId('')
    setPatientName('')
    setPatientConfirmed(false)
  }

  // Gerenciamento de etapas
  function addStage() {
    if (!newStageLabel.trim()) { toast.error('Informe o nome da etapa.'); return }
    const stage = {
      id:    Date.now().toString(),
      label: newStageLabel.trim(),
      notes: newStageNotes.trim(),
      done:  false,
    }
    setStages(prev => [...prev, stage])
    setNewStageLabel('')
    setNewStageNotes('')
    setAddingStage(false)
  }

  function toggleStage(stageId) {
    setStages(prev =>
      prev.map(s => s.id === stageId ? { ...s, done: !s.done } : s)
    )
  }

  function removeStage(stageId) {
    setStages(prev => prev.filter(s => s.id !== stageId))
  }

  function updateStageNotes(stageId, notes) {
    setStages(prev =>
      prev.map(s => s.id === stageId ? { ...s, notes } : s)
    )
  }

  function moveStage(index, direction) {
    const newStages = [...stages]
    const target = index + direction
    if (target < 0 || target >= newStages.length) return
    ;[newStages[index], newStages[target]] = [newStages[target], newStages[index]]
    setStages(newStages)
  }

  // Salvar
  async function handleSave() {
    if (!title.trim()) { toast.error('Informe o título do tratamento.'); return }
    if (!patientConfirmed || !patientId) {
      toast.error('Selecione um paciente cadastrado.'); return
    }

    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        patientId,
        patientName,
        stages,
        status,
      }

      if (creating) {
        const newId = await createTreatment(clinic.id, payload)
        toast.success('Tratamento criado!')
        navigate(`/tratamentos/${newId}`)
      } else {
        await updateTreatment(clinic.id, id, payload)
        toast.success('Tratamento salvo!')
      }
    } catch (err) {
      console.error('Erro ao salvar tratamento:', err)
      toast.error('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  // Deletar
  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteTreatment(clinic.id, id)
      toast.success('Tratamento removido.')
      navigate('/tratamentos')
    } catch (err) {
      console.error('Erro ao deletar:', err)
      toast.error('Erro ao remover.')
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  const done  = stages.filter(s => s.done).length
  const total = stages.length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0

  if (loading) {
    return (
      <div>
        <PageHeader title="Tratamento" />
        <div style={{ display:'flex', justifyContent:'center', padding:'48px 0' }}>
          <div className={styles.spinner} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={creating ? 'Novo tratamento' : 'Plano de tratamento'}
        subtitle={creating ? 'Defina as etapas do tratamento' : patientName}
        action={
          !creating && (
            <button
              className="btn btn-danger-outline btn-sm"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 size={14} />
            </button>
          )
        }
      />

      <div className={styles.page}>

        {/* Título */}
        <div className="card" style={{ marginBottom: 12 }}>
          <p className={styles.sectionLabel}>📋 Identificação</p>

          <div className={styles.field}>
            <label className="field-label">
              Título do tratamento <span className="required">*</span>
            </label>
            <input
              className="input"
              placeholder="Ex: Reabilitação pós-cirúrgica"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Paciente */}
          <div className={styles.field} style={{ marginTop: 12 }}>
            <label className="field-label">
              Paciente <span className="required">*</span>
            </label>

            {patientConfirmed ? (
              <div className={styles.selectedPatient}>
                <span className={styles.selectedName}>{patientName}</span>
                {creating && (
                  <button type="button" className={styles.clearBtn} onClick={clearPatient}>✕</button>
                )}
              </div>
            ) : (
              <>
                <div className={styles.searchWrap}>
                  <Search size={15} className={styles.searchIcon} />
                  <input
                    className={styles.searchInput}
                    placeholder="Buscar paciente cadastrado…"
                    value={patientSearch}
                    onChange={e => { setPatientSearch(e.target.value); setShowPatientSearch(true) }}
                    onFocus={() => setShowPatientSearch(true)}
                    onBlur={() => setTimeout(() => setShowPatientSearch(false), 150)}
                  />
                </div>
                {showPatientSearch && filteredPatients.length > 0 && (
                  <div className={styles.dropdown}>
                    {filteredPatients.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        className={styles.dropdownItem}
                        onMouseDown={() => selectPatient(p)}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Status */}
          {!creating && (
            <div className={styles.field} style={{ marginTop: 12 }}>
              <label className="field-label">Status</label>
              <div className={styles.statusRow}>
                {[
                  { key: 'active',    label: 'Em andamento' },
                  { key: 'completed', label: 'Concluído' },
                ].map(s => (
                  <button
                    key={s.key}
                    type="button"
                    className={`${styles.statusBtn} ${status === s.key ? styles.statusActive : ''}`}
                    onClick={() => setStatus(s.key)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Progresso */}
        {!creating && total > 0 && (
          <div className={styles.progressCard}>
            <div className={styles.progressHeader}>
              <span className={styles.progressTitle}>Progresso</span>
              <span className={styles.progressPct}>{pct}%</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${pct}%` }} />
            </div>
            <p className={styles.progressSub}>{done} de {total} etapas concluídas</p>
          </div>
        )}

        {/* Etapas */}
        <div className="card" style={{ marginBottom: 12 }}>
          <div className={styles.stagesHeader}>
            <p className={styles.sectionLabel}>🔖 Etapas</p>
            <span className={styles.stageCount}>{total} etapa{total !== 1 ? 's' : ''}</span>
          </div>

          {stages.length === 0 && !addingStage && (
            <p className={styles.emptyStages}>
              Nenhuma etapa adicionada ainda.
            </p>
          )}

          {/* Lista de etapas */}
          <div className={styles.stageList}>
            {stages.map((stage, index) => (
              <div
                key={stage.id}
                className={`${styles.stageItem} ${stage.done ? styles.stageDone : ''}`}
              >
                <div className={styles.stageTop}>
                  <button
                    type="button"
                    className={`${styles.checkBtn} ${stage.done ? styles.checkDone : ''}`}
                    onClick={() => toggleStage(stage.id)}
                    title={stage.done ? 'Marcar como pendente' : 'Marcar como concluída'}
                  >
                    {stage.done && <Check size={13} />}
                  </button>

                  <span className={styles.stageLabel}>{stage.label}</span>

                  <div className={styles.stageActions}>
                    <button
                      type="button"
                      className={styles.stageActionBtn}
                      onClick={() => moveStage(index, -1)}
                      disabled={index === 0}
                      title="Mover para cima"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      className={styles.stageActionBtn}
                      onClick={() => moveStage(index, 1)}
                      disabled={index === stages.length - 1}
                      title="Mover para baixo"
                    >
                      <ChevronDown size={14} />
                    </button>
                    <button
                      type="button"
                      className={`${styles.stageActionBtn} ${styles.stageActionExpand}`}
                      onClick={() => setExpandedStage(expandedStage === stage.id ? null : stage.id)}
                      title="Observações"
                    >
                      📝
                    </button>
                    <button
                      type="button"
                      className={`${styles.stageActionBtn} ${styles.stageActionDelete}`}
                      onClick={() => removeStage(stage.id)}
                      title="Remover etapa"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Observações da etapa */}
                {expandedStage === stage.id && (
                  <div className={styles.stageNotesWrap}>
                    <textarea
                      className={`input ${styles.stageNotesInput}`}
                      placeholder="Observações desta etapa…"
                      value={stage.notes || ''}
                      onChange={e => updateStageNotes(stage.id, e.target.value)}
                    />
                  </div>
                )}

                {stage.notes && expandedStage !== stage.id && (
                  <p className={styles.stageNotePreview}>{stage.notes}</p>
                )}
              </div>
            ))}
          </div>

          {/* Formulário de nova etapa */}
          {addingStage ? (
            <div className={styles.newStageForm}>
              <input
                className="input"
                placeholder="Nome da etapa *"
                value={newStageLabel}
                onChange={e => setNewStageLabel(e.target.value)}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); addStage() }
                  if (e.key === 'Escape') setAddingStage(false)
                }}
              />
              <textarea
                className={`input ${styles.newStageNotes}`}
                placeholder="Observações (opcional)"
                value={newStageNotes}
                onChange={e => setNewStageNotes(e.target.value)}
              />
              <div className={styles.newStageActions}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={addStage}
                >
                  <Check size={14} /> Adicionar
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => { setAddingStage(false); setNewStageLabel(''); setNewStageNotes('') }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className={styles.addStageBtn}
              onClick={() => setAddingStage(true)}
            >
              <Plus size={15} /> Adicionar etapa
            </button>
          )}
        </div>

        {/* Salvar */}
        <button
          className="btn btn-primary btn-full"
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={18} />
          {saving ? 'Salvando…' : creating ? 'Criar tratamento' : 'Salvar alterações'}
        </button>

        <button
          className="btn btn-outline btn-full"
          style={{ marginTop: 8 }}
          onClick={() => navigate(-1)}
          disabled={saving}
        >
          Cancelar
        </button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Remover tratamento?"
        description="O plano de tratamento e todas as etapas serão removidos permanentemente."
        cancelLabel="Manter tratamento"
        confirmLabel="Sim, remover"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  )
}
