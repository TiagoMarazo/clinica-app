import { useState, useEffect } from 'react'
import { subscribeAppointments } from '../lib/db'
import { useAuth } from '../contexts/AuthContext'

export function useAppointments() {
  const { clinic } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null) // null | 'connection'

  useEffect(() => {
    if (!clinic?.id) {
      setLoading(false)
      return
    }

    setError(null)
    setLoading(true)

    // Se o Firestore não responder em 8s, é erro de conexão — não lista vazia
    const timeout = setTimeout(() => {
      setLoading(false)
      setError('connection')
    }, 8000)

    const unsub = subscribeAppointments(clinic.id, (data) => {
      clearTimeout(timeout)
      setAppointments(data)
      setError(null)
      setLoading(false)
    })

    return () => {
      clearTimeout(timeout)
      unsub()
    }
  }, [clinic?.id])

  return { appointments, loading, error }
}
