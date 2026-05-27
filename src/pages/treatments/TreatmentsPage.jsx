import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Activity, ChevronRight, Search } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { subscribeTreatments } from '../../lib/db'
import { usePatients } from '../../hooks/usePatients'
import EmptyState from '../../components/ui/EmptyState'
import styles from './TreatmentsPage.module.css'

export default function TreatmentsPage() {
  const { clinic }    = useAuth()
  const { patients }  = usePatients()
  const navigate      = useNavigate()

  const [treatments, setTreatments] = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filter, setFilter]         = useState('all') // 'all' | 'active' | 'completed'

  useEffect(() => {
    if (!clinic?.id) return
    const unsub = subscribeTreatments(clinic.id, (data) => {
      setTreatments(data)
      setLoading(false)
    })
    return unsub
  }, [clinic?.id])

  // Enriquece cada tratamento com o nome do paciente
  const enriched = treatments.map(t => ({
    ...t,
    patientName: patients.find(p => p.id === t.patientId)?.name || t.patientName || 'Paciente',
  }))

  const filtered = enriched
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t => !search || t.patientName.toLowerCase().includes(search.toLowerCase())
                         || t.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Tratamentos</h2>
          <p className={styles.subtitle}>
            {loading ? '…' : `${treatments.length} registrado${treatments.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/tratamentos/novo')}
        >
          <Plus size={16} /> Novo
        </button>
      </div>

      {/* Busca */}
      <div className={styles.searchWrap}>
        <Search size={16} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="Buscar por paciente ou tratamento…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className={styles.clearSearch} onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      {/* Filtro de status */}
      <div className={styles.filterRow}>
        {[
          { key: 'all',       label: 'Todos' },
          { key: 'active',    label: 'Em andamento' },
          { key: 'completed', label: 'Concluídos' },
        ].map(f => (
          <button
            key={f.key}
            className={`${styles.filterBtn} ${filter === f.key ? styles.filterActive : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Carregando tratamentos…</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Activity}
          title={search ? 'Nenhum resultado' : 'Nenhum tratamento'}
          description={
            search
              ? `Nenhum tratamento encontrado para "${search}".`
              : 'Crie o primeiro plano de tratamento.'
          }
          action={
            !search && (
              <button
                className="btn btn-primary"
                onClick={() => navigate('/tratamentos/novo')}
              >
                <Plus size={16} /> Novo tratamento
              </button>
            )
          }
        />
      ) : (
        <div className={styles.list}>
          {filtered.map(t => {
            const done  = t.stages?.filter(s => s.done).length || 0
            const total = t.stages?.length || 0
            const pct   = total > 0 ? Math.round((done / total) * 100) : 0

            return (
              <button
                key={t.id}
                className={styles.card}
                onClick={() => navigate(`/tratamentos/${t.id}`)}
              >
                <div className={styles.cardTop}>
                  <div className={styles.cardInfo}>
                    <p className={styles.cardPatient}>{t.patientName}</p>
                    <p className={styles.cardTitle}>{t.title}</p>
                  </div>
                  <div className={styles.cardRight}>
                    <span className={`badge ${t.status === 'active' ? 'badge-scheduled' : 'badge-done'}`}>
                      {t.status === 'active' ? 'Andamento' : 'Concluído'}
                    </span>
                    <ChevronRight size={16} className={styles.chevron} />
                  </div>
                </div>

                <div className={styles.progressWrap}>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={styles.progressLabel}>{done}/{total} etapas</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <button
        className={styles.fab}
        onClick={() => navigate('/tratamentos/novo')}
        aria-label="Novo tratamento"
      >
        <Plus size={24} />
      </button>
    </div>
  )
}
