import { format, isToday, isTomorrow, isYesterday, startOfDay, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Timestamp } from 'firebase/firestore'

// Converte Timestamp do Firestore ou Date para Date
export function toDate(value) {
  if (!value) return null
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  if (typeof value === 'string') return new Date(value)
  return null
}

// Formata data de forma amigável: "Hoje", "Amanhã", "Ontem", ou "Seg, 14 mai"
export function formatDateFriendly(value) {
  const d = toDate(value)
  if (!d) return ''
  if (isToday(d))     return 'Hoje'
  if (isTomorrow(d))  return 'Amanhã'
  if (isYesterday(d)) return 'Ontem'
  return format(d, "EEE, dd MMM", { locale: ptBR })
}

// Formata só o horário: "09:30"
export function formatTime(value) {
  const d = toDate(value)
  if (!d) return ''
  return format(d, 'HH:mm')
}

// Formata data completa: "quarta-feira, 14 de maio de 2025"
export function formatDateLong(value) {
  const d = toDate(value)
  if (!d) return ''
  return format(d, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
}

// Converte string "YYYY-MM-DD" para Date no fuso local (sem conversão UTC)
// Usar para datas sem hora: nascimento, vencimentos, etc.
export function localDateFromString(str) {
  if (!str) return null
  const [year, month, day] = str.split('-').map(Number)
  return new Date(year, month - 1, day) // mês é 0-based
}

// Formata data curta: "14/05/2025"
export function formatDateShort(value) {
  // Se for string no formato YYYY-MM-DD, usa conversão local para evitar problema de fuso
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = localDateFromString(value)
    return d ? format(d, 'dd/MM/yyyy') : ''
  }
  const d = toDate(value)
  if (!d) return ''
  return format(d, 'dd/MM/yyyy')
}

// Retorna os 7 dias da semana a partir de uma data âncora (padrão: hoje)
export function getWeekDays(anchor = new Date()) {
  const start = startOfDay(anchor)
  const monday = new Date(start)
  const day = start.getDay()
  // Ajusta para segunda-feira da semana
  const diff = day === 0 ? -6 : 1 - day
  monday.setDate(start.getDate() + diff)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

// Filtra consultas de um dia específico
export function appointmentsForDay(appointments, date) {
  return appointments.filter(a => {
    const d = toDate(a.dateTime)
    return d && isSameDay(d, date)
  })
}

// Badge de status: retorna { label, className }
export function statusBadge(status) {
  switch (status) {
    case 'scheduled': return { label: 'Agendada',  cls: 'badge-scheduled' }
    case 'done':      return { label: 'Realizada', cls: 'badge-done' }
    case 'cancelled': return { label: 'Cancelada', cls: 'badge-cancelled' }
    default:          return { label: status,      cls: 'badge-scheduled' }
  }
}

// Iniciais de um nome: "Maria Fernanda Silva" → "MF"
export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

// Combina data (Date) com horário string "HH:mm" → Timestamp do Firestore
export function buildDateTime(date, timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date(date)
  d.setHours(h, m, 0, 0)
  return Timestamp.fromDate(d)
}

// Formata número de telefone para exibição: "11999999999" → "(11) 99999-9999"
export function formatPhone(phone = '') {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`
  }
  return phone
}
