import { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
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

  const logout = () => signOut(auth)

  const isAdmin = userData?.rol === 'admin'

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, logout, isAdmin }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
