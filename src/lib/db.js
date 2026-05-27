import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

// ─── Helpers ────────────────────────────────────────────────────────────────

const clinicCol = (clinicId, col) =>
  collection(db, 'clinics', clinicId, col)

const clinicDoc = (clinicId, col, docId) =>
  doc(db, 'clinics', clinicId, col, docId)

// ─── Clínica ────────────────────────────────────────────────────────────────

export async function getClinic(clinicId) {
  const snap = await getDoc(doc(db, 'clinics', clinicId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function updateClinic(clinicId, data) {
  await updateDoc(doc(db, 'clinics', clinicId), { ...data, updatedAt: serverTimestamp() })
}

// ─── Pacientes ──────────────────────────────────────────────────────────────

export async function getPatients(clinicId) {
  const q = query(clinicCol(clinicId, 'patients'), orderBy('name'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export function subscribePatients(clinicId, callback) {
  const q = query(clinicCol(clinicId, 'patients'), orderBy('name'))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export async function getPatient(clinicId, patientId) {
  const snap = await getDoc(clinicDoc(clinicId, 'patients', patientId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function createPatient(clinicId, data) {
  const ref = await addDoc(clinicCol(clinicId, 'patients'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updatePatient(clinicId, patientId, data) {
  await updateDoc(clinicDoc(clinicId, 'patients', patientId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deletePatient(clinicId, patientId) {
  await deleteDoc(clinicDoc(clinicId, 'patients', patientId))
}

// ─── Consultas ───────────────────────────────────────────────────────────────

export function subscribeAppointments(clinicId, callback) {
  const q = query(
    clinicCol(clinicId, 'appointments'),
    orderBy('dateTime')
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export async function getAppointmentsByDate(clinicId, date) {
  // date: Date object — busca todas as consultas do dia
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  const q = query(
    clinicCol(clinicId, 'appointments'),
    where('dateTime', '>=', Timestamp.fromDate(start)),
    where('dateTime', '<=', Timestamp.fromDate(end)),
    orderBy('dateTime')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getPatientAppointments(clinicId, patientId) {
  const q = query(
    clinicCol(clinicId, 'appointments'),
    where('patientId', '==', patientId),
    orderBy('dateTime', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function createAppointment(clinicId, data) {
  const ref = await addDoc(clinicCol(clinicId, 'appointments'), {
    ...data,
    status: 'scheduled',
    reminderSent: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateAppointment(clinicId, appointmentId, data) {
  await updateDoc(clinicDoc(clinicId, 'appointments', appointmentId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteAppointment(clinicId, appointmentId) {
  await deleteDoc(clinicDoc(clinicId, 'appointments', appointmentId))
}

// ─── Tratamentos ─────────────────────────────────────────────────────────────

export function subscribeTreatments(clinicId, callback) {
  const q = query(clinicCol(clinicId, 'treatments'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export async function getPatientTreatments(clinicId, patientId) {
  const q = query(
    clinicCol(clinicId, 'treatments'),
    where('patientId', '==', patientId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function createTreatment(clinicId, data) {
  const ref = await addDoc(clinicCol(clinicId, 'treatments'), {
    ...data,
    stages: data.stages || [],
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateTreatment(clinicId, treatmentId, data) {
  await updateDoc(clinicDoc(clinicId, 'treatments', treatmentId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteTreatment(clinicId, treatmentId) {
  await deleteDoc(clinicDoc(clinicId, 'treatments', treatmentId))
}
