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
  const [user, setUser]               = useState(null)
  const [clinic, setClinic]           = useState(null)
  const [loading, setLoading]         = useState(true)
  const [clinicError, setClinicError] = useState(null)
  // emailVerified separado para facilitar checagem em qualquer componente
  const [emailVerified, setEmailVerified] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        setEmailVerified(firebaseUser.emailVerified)
        setClinicError(null)

        // Só carrega dados da clínica se o e-mail já foi verificado
        // Evita criar documento para contas que ainda não confirmaram o e-mail
        if (!firebaseUser.emailVerified) {
          console.log('[Auth] E-mail não verificado — aguardando confirmação')
          setLoading(false)
          return
        }

        try {
          const ref  = doc(db, 'clinics', firebaseUser.uid)
          const snap = await getDoc(ref)

          if (snap.exists()) {
            console.log('[Auth] Clínica carregada:', snap.id)
            setClinic({ id: snap.id, ...snap.data() })
          } else {
            // Documento não existe — cria apenas se e-mail verificado
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
          console.error('[Auth] Erro ao carregar clínica:', err.code, err.message)
          setClinicError(err.code || 'unknown')
        }
      } else {
        setUser(null)
        setClinic(null)
        setEmailVerified(false)
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

    // Salva nome da clínica temporariamente no localStorage
    // O documento no Firestore só será criado após verificação do e-mail
    localStorage.setItem(`pendingClinicName_${uid}`, clinicName)

    // Envia e-mail de verificação ANTES de qualquer outra coisa
    try {
      await sendEmailVerification(cred.user)
      console.log('[Auth] E-mail de verificação enviado para:', email)
    } catch (err) {
      console.error('[Auth] Erro ao enviar verificação:', err.code)
    }

    return cred.user
  }

  // Chamado pela VerifyEmailPage após confirmar que o e-mail foi verificado
  async function createClinicAfterVerification(uid, email) {
    const clinicName = localStorage.getItem(`pendingClinicName_${uid}`)
      || email?.split('@')[0]
      || 'Minha Clínica'

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
      localStorage.removeItem(`pendingClinicName_${uid}`)
      console.log('[Auth] Clínica criada após verificação:', uid)
    } catch (err) {
      console.error('[Auth] Erro ao criar clínica após verificação:', err.code)
      throw err
    }
  }

  async function logout() {
    await signOut(auth)
  }

  const value = {
    user,
    clinic,
    loading,
    clinicError,
    emailVerified,
    login,
    register,
    logout,
    createClinicAfterVerification,
  }

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
