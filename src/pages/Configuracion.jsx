import { useState, useEffect, useRef } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Save, Upload, Building2, User, Plus, Trash2, Check, Palette } from 'lucide-react'
import { collection, getDocs, addDoc, deleteDoc } from 'firebase/firestore'

const inputCls = "w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-sm text-slate-800 transition-all bg-white"

export default function Configuracion() {
  const { isAdmin, userData, user } = useAuth()
  const { theme, setTheme, saveTheme, presetThemes, applyPreset } = useTheme()
  const [config, setConfig] = useState({
    empresa: '', nit: '', direccion: '', telefono: '', email: '', ciudad: '',
    instagram: '', whatsapp: '', facebook: '', website: '', logo: '',
    moneda: 'COP', prefijoFactura: 'F'
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [themeSaved, setThemeSaved] = useState(false)
  const fileRef = useRef(null)

  // Usuarios
  const [usuarios, setUsuarios] = useState([])
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: '', email: '', rol: 'vendedor' })
  const [addingUser, setAddingUser]     = useState(false)

  useEffect(() => {
    loadConfig()
    if (isAdmin) loadUsuarios()
  }, [isAdmin])

  const loadConfig = async () => {
    try {
      const snap = await getDoc(doc(db, 'configuracion', 'empresa'))
      if (snap.exists()) setConfig(p => ({ ...p, ...snap.data() }))
    } catch (_) {}
  }

  const loadUsuarios = async () => {
    try {
      const snap = await getDocs(collection(db, 'usuarios'))
      setUsuarios(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (_) {}
  }

  const guardar = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'configuracion', 'empresa'), { ...config, actualizadoEn: serverTimestamp() })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) { alert('Error al guardar: ' + e.message) }
    finally { setSaving(false) }
  }

  const guardarTema = async () => {
    const success = await saveTheme(theme)
    if (success) {
      setThemeSaved(true)
      setTimeout(() => setThemeSaved(false), 3000)
    }
  }

  const handlePresetClick = (preset) => {
    applyPreset(preset)
  }

  const handleColorChange = (key, value) => {
    setTheme(prev => ({ ...prev, [key]: value }))
  }

  const handleLogo = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 500000) { alert('El logo debe ser menor a 500KB'); return }
    const reader = new FileReader()
    reader.onload = (ev) => setConfig(p => ({ ...p, logo: ev.target.result }))
    reader.readAsDataURL(file)
  }

  const set = (k, v) => setConfig(p => ({ ...p, [k]: v }))

  const Section = ({ title, children }) => (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
      <h2 className="font-display text-lg text-slate-900 mb-5">{title}</h2>
      {children}
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-slate-900">Configuración</h1>
          <p className="text-slate-500 mt-1">Datos de tu empresa y preferencias</p>
        </div>
        <button onClick={guardar} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-slate-900 text-sm hover:scale-105 transition-all disabled:opacity-50"
                style={{ background: saved ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
          {saved ? <Check size={15} /> : <Save size={15} />}
          {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar cambios'}
        </button>
      </div>

      {/* Logo */}
      <Section title="Logo de la empresa">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 shrink-0">
            {config.logo
              ? <img src={config.logo} alt="Logo" className="w-full h-full object-contain p-1" />
              : <Building2 size={28} className="text-slate-300" />
            }
          </div>
          <div>
            <button onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors">
              <Upload size={15} /> Subir logo
            </button>
            <p className="text-slate-400 text-xs mt-2">PNG, JPG. Máximo 500KB.<br/>Recomendado: 200×200px</p>
            {config.logo && (
              <button onClick={() => set('logo', '')} className="text-red-400 text-xs mt-1 hover:underline">
                Eliminar logo
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleLogo} className="hidden" />
          </div>
        </div>
      </Section>

      {/* Datos empresa */}
      <Section title="Datos de la empresa">
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { k: 'empresa', l: 'Nombre de la empresa *', ph: 'Mi Empresa S.A.S.' },
            { k: 'nit', l: 'NIT / RUT', ph: '900.000.000-0' },
            { k: 'telefono', l: 'Teléfono', ph: '+57 300 000 0000' },
            { k: 'email', l: 'Email', ph: 'info@empresa.com', t: 'email' },
            { k: 'ciudad', l: 'Ciudad', ph: 'Medellín' },
            { k: 'prefijoFactura', l: 'Prefijo de factura', ph: 'F' },
          ].map(f => (
            <div key={f.k}>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">{f.l}</label>
              <input type={f.t || 'text'} value={config[f.k]} onChange={e => set(f.k, e.target.value)}
                     placeholder={f.ph} className={inputCls} />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Dirección</label>
            <input value={config.direccion} onChange={e => set('direccion', e.target.value)}
                   placeholder="Calle 123 #45-67, Barrio, Ciudad" className={inputCls} />
          </div>
        </div>
      </Section>

      {/* Redes sociales */}
      <Section title="Redes sociales">
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { k: 'instagram', l: 'Instagram', ph: '@miempresa' },
            { k: 'whatsapp', l: 'WhatsApp', ph: '+57 300 000 0000' },
            { k: 'facebook', l: 'Facebook', ph: 'facebook.com/miempresa' },
            { k: 'website', l: 'Sitio web', ph: 'www.miempresa.com' },
          ].map(f => (
            <div key={f.k}>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">{f.l}</label>
              <input value={config[f.k]} onChange={e => set(f.k, e.target.value)}
                     placeholder={f.ph} className={inputCls} />
            </div>
          ))}
        </div>
      </Section>

      {/* Preferencias */}
      <Section title="Preferencias de facturación">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Moneda</label>
            <select value={config.moneda} onChange={e => set('moneda', e.target.value)} className={inputCls}>
              <option value="COP">COP - Peso colombiano</option>
              <option value="USD">USD - Dólar estadounidense</option>
              <option value="EUR">EUR - Euro</option>
              <option value="MXN">MXN - Peso mexicano</option>
            </select>
          </div>
        </div>
      </Section>

      {/* Personalizar Tema */}
      <Section title="Personalizar Tema">
        <div className="space-y-6">
          {/* Temas predefinidos */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-3">Temas predefinidos</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {presetThemes.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePresetClick(preset)}
                  className="p-3 rounded-xl border-2 transition-all hover:scale-105 text-left"
                  style={{
                    borderColor: theme.primaryColor === preset.primary ? preset.primary : '#e2e8f0',
                    background: theme.primaryColor === preset.primary ? `${preset.primary}10` : 'white'
                  }}
                >
                  <div className="flex gap-1 mb-2">
                    <div className="w-5 h-5 rounded-full" style={{ background: preset.primary }} />
                    <div className="w-5 h-5 rounded-full" style={{ background: preset.sidebar }} />
                  </div>
                  <p className="text-xs font-medium text-slate-700 truncate">{preset.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Colores personalizados */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-3">Colores personalizados</label>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Color primario</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <input
                    type="text"
                    value={theme.primaryColor}
                    onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                    className={inputCls + ' flex-1'}
                    placeholder="#f59e0b"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Color secundario</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.secondaryColor}
                    onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <input
                    type="text"
                    value={theme.secondaryColor}
                    onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                    className={inputCls + ' flex-1'}
                    placeholder="#d97706"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Color del sidebar</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.sidebarBg}
                    onChange={(e) => handleColorChange('sidebarBg', e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <input
                    type="text"
                    value={theme.sidebarBg}
                    onChange={(e) => handleColorChange('sidebarBg', e.target.value)}
                    className={inputCls + ' flex-1'}
                    placeholder="#0f172a"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Color acento</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.accentColor}
                    onChange={(e) => handleColorChange('accentColor', e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <input
                    type="text"
                    value={theme.accentColor}
                    onChange={(e) => handleColorChange('accentColor', e.target.value)}
                    className={inputCls + ' flex-1'}
                    placeholder="#10b981"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Vista previa */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-3">Vista previa</label>
            <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: theme.sidebarBg }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                   style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}>
                <Palette size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Vista previa del tema</p>
                <p className="text-slate-400 text-xs">Asi se vera tu sidebar</p>
              </div>
            </div>
          </div>

          {/* Boton guardar tema */}
          <button
            onClick={guardarTema}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm hover:scale-105 transition-all"
            style={{ background: themeSaved ? '#10b981' : `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}
          >
            {themeSaved ? <Check size={15} /> : <Palette size={15} />}
            {themeSaved ? 'Tema guardado!' : 'Guardar tema'}
          </button>
        </div>
      </Section>

      {/* Mi perfil */}
      <Section title="Mi perfil">
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-slate-900"
               style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            {(userData?.nombre || 'U')[0]}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{userData?.nombre || 'Usuario'}</p>
            <p className="text-slate-500 text-sm">{user?.email}</p>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 capitalize">
              {userData?.rol || 'vendedor'}
            </span>
          </div>
        </div>
      </Section>

      {/* Usuarios (solo admin) */}
      {isAdmin && (
        <Section title="Gestión de usuarios">
          <p className="text-xs text-slate-400 mb-4">
            ⚠️ Para crear usuarios nuevos, hazlo desde Firebase Console → Authentication. Luego agrega el documento en la colección "usuarios" con: nombre, email, rol (admin/vendedor) y uid.
          </p>
          <div className="space-y-2">
            {usuarios.map(u => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-slate-900"
                     style={{ background: 'rgba(245,158,11,0.2)' }}>
                  {(u.nombre || 'U')[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{u.nombre}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  u.rol === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>{u.rol}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
