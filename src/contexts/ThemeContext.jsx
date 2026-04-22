import { createContext, useContext, useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

const ThemeContext = createContext()

const defaultTheme = {
  primaryColor: '#f59e0b',    // Amber/Gold
  secondaryColor: '#d97706',  // Amber darker
  sidebarBg: '#0f172a',       // Slate 900
  sidebarBgEnd: '#1e293b',    // Slate 800
  accentColor: '#10b981',     // Emerald
}

const presetThemes = [
  { name: 'Dorado (Default)', primary: '#f59e0b', secondary: '#d97706', sidebar: '#0f172a', sidebarEnd: '#1e293b', accent: '#10b981' },
  { name: 'Azul Profesional', primary: '#3b82f6', secondary: '#2563eb', sidebar: '#1e3a5f', sidebarEnd: '#1e293b', accent: '#06b6d4' },
  { name: 'Verde Esmeralda', primary: '#10b981', secondary: '#059669', sidebar: '#064e3b', sidebarEnd: '#1e293b', accent: '#f59e0b' },
  { name: 'Rojo Elegante', primary: '#ef4444', secondary: '#dc2626', sidebar: '#450a0a', sidebarEnd: '#1e293b', accent: '#f59e0b' },
  { name: 'Morado Royal', primary: '#8b5cf6', secondary: '#7c3aed', sidebar: '#2e1065', sidebarEnd: '#1e293b', accent: '#f59e0b' },
  { name: 'Rosa Moderno', primary: '#ec4899', secondary: '#db2777', sidebar: '#500724', sidebarEnd: '#1e293b', accent: '#06b6d4' },
  { name: 'Naranja Vibrante', primary: '#f97316', secondary: '#ea580c', sidebar: '#431407', sidebarEnd: '#1e293b', accent: '#10b981' },
  { name: 'Cyan Tech', primary: '#06b6d4', secondary: '#0891b2', sidebar: '#083344', sidebarEnd: '#1e293b', accent: '#f59e0b' },
]

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(defaultTheme)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTheme()
  }, [])

  const loadTheme = async () => {
    try {
      const snap = await getDoc(doc(db, 'configuracion', 'tema'))
      if (snap.exists()) {
        setTheme({ ...defaultTheme, ...snap.data() })
      }
    } catch (e) {
      console.error('Error loading theme:', e)
    } finally {
      setLoading(false)
    }
  }

  const saveTheme = async (newTheme) => {
    try {
      await setDoc(doc(db, 'configuracion', 'tema'), newTheme)
      setTheme(newTheme)
      return true
    } catch (e) {
      console.error('Error saving theme:', e)
      return false
    }
  }

  const applyPreset = (preset) => {
    const newTheme = {
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      sidebarBg: preset.sidebar,
      sidebarBgEnd: preset.sidebarEnd,
      accentColor: preset.accent,
    }
    setTheme(newTheme)
    return newTheme
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, saveTheme, loading, presetThemes, applyPreset }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
