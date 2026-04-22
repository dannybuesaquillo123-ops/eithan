// ============================================================
// ⚠️  CONFIGURACIÓN DE FIREBASE
// ============================================================
// 1. Ve a https://console.firebase.google.com
// 2. Crea un proyecto nuevo (gratis)
// 3. En "Descripción general del proyecto" > Agrega una app web (</>)
// 4. Copia tu configuración aquí abajo
// 5. En Firebase Console: activa Authentication (Email/Contraseña)
// 6. En Firebase Console: activa Firestore Database
// ============================================================

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyC86vmfriGsKihnWDR8FUsJ0O-WgZYvte8",
  authDomain: "facturacioneithan.firebaseapp.com",
  databaseURL: "https://facturacioneithan-default-rtdb.firebaseio.com",
  projectId: "facturacioneithan",
  storageBucket: "facturacioneithan.firebasestorage.app",
  messagingSenderId: "688058385063",
  appId: "1:688058385063:web:6e0620850585664b79d182",
  measurementId: "G-MK7K9E9GER"
}

const app = initializeApp(firebaseConfig)

console.log('[v0] Firebase inicializado correctamente')
console.log('[v0] Proyecto ID:', firebaseConfig.projectId)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

console.log('[v0] Auth:', auth)
console.log('[v0] Firestore:', db)
console.log('[v0] Storage:', storage)

export default app
