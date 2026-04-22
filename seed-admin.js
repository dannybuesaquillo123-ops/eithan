// seed-admin.js
// Ejecuta este script UNA SOLA VEZ después de crear tu primer usuario en Firebase Auth
// Uso: node seed-admin.js
//
// Antes de ejecutar:
// 1. Crea el usuario en Firebase Console → Authentication → Agregar usuario
// 2. Copia el UID del usuario creado
// 3. Pega el UID y los datos abajo
// 4. Ejecuta: node seed-admin.js

import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc } from 'firebase/firestore'

// ⚠️ Copia tu configuración de Firebase aquí (igual que src/firebase.js)
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO_ID",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_MESSAGING_ID",
  appId: "TU_APP_ID"
}

// ⚠️ Datos del administrador
const ADMIN_UID    = "UID_DEL_USUARIO_EN_FIREBASE_AUTH"
const ADMIN_NOMBRE = "Administrador"
const ADMIN_EMAIL  = "admin@tuempresa.com"

// -------------------------------------------------------
const app = initializeApp(firebaseConfig)
const db  = getFirestore(app)

async function seed() {
  console.log('Creando usuario administrador...')
  await setDoc(doc(db, 'usuarios', ADMIN_UID), {
    nombre:    ADMIN_NOMBRE,
    email:     ADMIN_EMAIL,
    rol:       'admin',
    creadoEn:  new Date()
  })
  console.log('✅ Admin creado con UID:', ADMIN_UID)

  console.log('Creando configuración inicial de empresa...')
  await setDoc(doc(db, 'configuracion', 'empresa'), {
    empresa:    'Mi Empresa S.A.S.',
    nit:        '900.000.000-0',
    direccion:  'Calle 123 #45-67, Medellín',
    telefono:   '+57 300 000 0000',
    email:      ADMIN_EMAIL,
    ciudad:     'Medellín',
    moneda:     'COP',
    prefijoFactura: 'F',
    creadoEn:   new Date()
  })
  console.log('✅ Configuración inicial creada')
  process.exit(0)
}

seed().catch(e => { console.error('❌ Error:', e); process.exit(1) })
