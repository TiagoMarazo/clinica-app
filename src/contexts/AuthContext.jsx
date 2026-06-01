import { createContext, useContext, useEffect, useState } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
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
            // Documento confirmadamente não existe (getDoc retornou sem erro)
            // Único caso seguro para criar: sabemos com certeza que não há nada
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
          // Falha de rede, regras, ou indisponibilidade do Firestore
          // NÃO tentamos criar o documento aqui — não sabemos se ele existe
          // Criar aqui poderia sobrescrever dados reais em caso de instabilidade
          console.error('[Auth] Erro ao carregar clínica:', err.code, err.message)
          setClinicError(err.code || 'unknown')
          // clinic permanece null — a UI vai mostrar erro de conexão
          // O usuário pode tentar novamente sem risco de perda de dados
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
      console.error('[Auth] Erro ao criar clínica no cadastro:', err.code, err.message)
    }

    // Envia e-mail de verificação
    try {
      await sendEmailVerification(cred.user)
      console.log('[Auth] E-mail de verificação enviado para:', email)
    } catch (err) {
      console.error('[Auth] Erro ao enviar verificação:', err.code)
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
