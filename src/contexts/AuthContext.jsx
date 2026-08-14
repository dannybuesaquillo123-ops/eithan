import { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, getDoc, setDoc, getDocs, collection, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        try {
          const snap = await getDoc(doc(db, 'usuarios', firebaseUser.uid))
          if (snap.exists()) setUserData(snap.data())
        } catch (_) {}
      } else {
        setUser(null)
        setUserData(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    const snap = await getDoc(doc(db, 'usuarios', cred.user.uid))
    if (snap.exists()) setUserData(snap.data())
    return cred
  }

  const register = async (nombre, email, password) => {
    // El primer usuario registrado sera admin, el resto vendedores
    let rol = 'vendedor'
    try {
      const usuariosSnap = await getDocs(collection(db, 'usuarios'))
      if (usuariosSnap.empty) rol = 'admin'
    } catch (_) {}

    const cred = await createUserWithEmailAndPassword(auth, email, password)
    if (nombre) {
      try { await updateProfile(cred.user, { displayName: nombre }) } catch (_) {}
    }

    const nuevoUsuario = {
      nombre: nombre || '',
      email,
      rol,
      creadoEn: serverTimestamp(),
    }
    await setDoc(doc(db, 'usuarios', cred.user.uid), nuevoUsuario)
    setUserData(nuevoUsuario)
    return cred
  }

  const logout = () => signOut(auth)

  const isAdmin = userData?.rol === 'admin'

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, register, logout, isAdmin }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
