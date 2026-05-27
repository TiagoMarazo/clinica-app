import { createContext, useContext, useEffect, useState } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null)
  const [clinic, setClinic]       = useState(null)
  const [loading, setLoading]     = useState(true)
  const [clinicError, setClinicError] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        setClinicError(null)

        try {
          const ref  = doc(db, 'clinics', firebaseUser.uid)
          const snap = await getDoc(ref)

          if (snap.exists()) {
            // Documento encontrado — situação normal
            console.log('[Auth] Clínica carregada:', snap.id)
            setClinic({ id: snap.id, ...snap.data() })
          } else {
            // Documento NÃO existe — pode ter falhado no cadastro
            // Cria um documento mínimo para não bloquear o uso do app
            console.warn('[Auth] Documento da clínica não encontrado. Criando...')
            const fallback = {
              name: firebaseUser.email?.split('@')[0] || 'Minha Clínica',
              ownerUid: firebaseUser.uid,
              email: firebaseUser.email || '',
              timezone: 'America/Sao_Paulo',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }
            await setDoc(ref, fallback)
            setClinic({ id: firebaseUser.uid, ...fallback })
            console.log('[Auth] Documento da clínica criado automaticamente.')
          }
        } catch (err) {
          // Falha ao acessar o Firestore (regras, sem internet, etc.)
          console.error('[Auth] Erro ao carregar clínica:', err.code, err.message)
          setClinicError(err.code || 'unknown')
          // Mantém clinic como null — o app vai mostrar erro de conexão
        }
      } else {
        setUser(null)
        setClinic(null)
        setClinicError(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred.user
  }

  async function register(email, password, clinicName) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const uid  = cred.user.uid

    const clinicData = {
      name: clinicName,
      ownerUid: uid,
      email,
      timezone: 'America/Sao_Paulo',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    try {
      await setDoc(doc(db, 'clinics', uid), clinicData)
      setClinic({ id: uid, ...clinicData })
      console.log('[Auth] Clínica criada no cadastro:', uid)
    } catch (err) {
      // Se falhar aqui, o onAuthStateChanged vai tentar criar novamente no próximo login
      console.error('[Auth] Erro ao criar clínica no cadastro:', err.code, err.message)
    }

    return cred.user
  }

  async function logout() {
    await signOut(auth)
  }

  const value = { user, clinic, loading, clinicError, login, register, logout }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
