import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Users, ChevronRight } from 'lucide-react'
import { usePatients } from '../../hooks/usePatients'
import { initials, formatPhone } from '../../lib/utils'
import EmptyState from '../../components/ui/EmptyState'
import styles from './PatientsPage.module.css'

export default function PatientsPage() {
  const { patients, loading } = usePatients()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const filtered = search.trim().length === 0
    ? patients
    : patients.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.phone && p.phone.includes(search.replace(/\D/g, '')))
      )

  return (
    <div className={styles.page}>

      {/* Cabeçalho */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Pacientes</h2>
          <p className={styles.subtitle}>
            {loading ? '…' : `${patients.length} cadastrado${patients.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/pacientes/novo')}
        >
          <Plus size={16} /> Novo
        </button>
      </div>

      {/* Busca */}
      <div className={styles.searchWrap}>
        <Search size={16} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="Buscar por nome ou telefone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className={styles.clearSearch} onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Carregando pacientes…</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'Nenhum resultado' : 'Nenhum paciente'}
          description={
            search
              ? `Nenhum paciente encontrado para "${search}".`
              : 'Cadastre o primeiro paciente para começar.'
          }
          action={
            !search && (
              <button
                className="btn btn-primary"
                onClick={() => navigate('/pacientes/novo')}
              >
                <Plus size={16} /> Cadastrar paciente
              </button>
            )
          }
        />
      ) : (
        <div className={styles.list}>
          {groupByLetter(filtered).map(({ letter, items }) => (
            <div key={letter}>
              <div className={styles.letterDivider}>{letter}</div>
              {items.map(patient => (
                <button
                  key={patient.id}
                  className={styles.patientCard}
                  onClick={() => navigate(`/pacientes/${patient.id}`)}
                >
                  <div className={styles.avatar}>
                    {initials(patient.name)}
                  </div>
                  <div className={styles.info}>
                    <p className={styles.name}>{patient.name}</p>
                    <p className={styles.detail}>
                      {patient.phone
                        ? formatPhone(patient.phone)
                        : patient.email || 'Sem contato cadastrado'}
                    </p>
                    {patient.tags?.length > 0 && (
                      <div className={styles.tags}>
                        {patient.tags.slice(0, 2).map(tag => (
                          <span key={tag} className={styles.tag}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={16} className={styles.chevron} />
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        className={styles.fab}
        onClick={() => navigate('/pacientes/novo')}
        aria-label="Novo paciente"
      >
        <Plus size={24} />
      </button>
    </div>
  )
}

function groupByLetter(patients) {
  const map = {}
  patients.forEach(p => {
    const letter = p.name[0].toUpperCase()
    if (!map[letter]) map[letter] = []
    map[letter].push(p)
  })
  return Object.keys(map).sort().map(letter => ({ letter, items: map[letter] }))
}
