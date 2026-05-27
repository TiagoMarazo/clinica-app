import { useState, useEffect } from 'react'
import { subscribePatients } from '../lib/db'
import { useAuth } from '../contexts/AuthContext'

export function usePatients() {
  const { clinic } = useAuth()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clinic?.id) return
    const unsub = subscribePatients(clinic.id, (data) => {
      setPatients(data)
      setLoading(false)
    })
    return unsub
  }, [clinic?.id])

  return { patients, loading }
}
