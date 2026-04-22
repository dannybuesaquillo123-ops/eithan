import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { Plus, Edit2, Trash2, Users, Search, X, Save } from 'lucide-react'

const empty = () => ({ nombre: '', ciudad: '', telefono: '', email: '', nit: '' })

export default function Clientes() {
  const [clientes, setClientes]   = useState([])
  const [filtered, setFiltered]   = useState([])
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(empty())
  const [saving, setSaving]       = useState(false)

  useEffect(() => { load() }, [])
  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(clientes.filter(c =>
      c.nombre?.toLowerCase().includes(q) ||
      c.ciudad?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    ))
  }, [search, clientes])

  const load = async () => {
    try {
      const snap = await getDocs(collection(db, 'clientes'))
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setClientes(data); setFiltered(data)
    } catch (_) {}
    finally { setLoading(false) }
  }

  const openModal = (c = null) => {
    setEditing(c)
    setForm(c ? { nombre: c.nombre, ciudad: c.ciudad || '', telefono: c.telefono || '', email: c.email || '', nit: c.nit || '' } : empty())
    setModal(true)
  }

  const guardar = async () => {
    if (!form.nombre.trim()) return
    setSaving(true)
    try {
      const payload = { ...form, actualizadoEn: serverTimestamp() }
      if (editing) {
        await updateDoc(doc(db, 'clientes', editing.id), payload)
      } else {
        payload.creadoEn = serverTimestamp()
        await addDoc(collection(db, 'clientes'), payload)
      }
      setModal(false); load()
    } catch (_) {}
    finally { setSaving(false) }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este cliente?')) return
    await deleteDoc(doc(db, 'clientes', id))
    setClientes(p => p.filter(x => x.id !== id))
  }

  const inputCls = "w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-sm text-slate-800 transition-all"

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-slate-900">Clientes</h1>
          <p className="text-slate-500 mt-1">{filtered.length} cliente{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => openModal()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-slate-900 text-sm hover:scale-105 transition-all"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
          <Plus size={16} /> Nuevo Cliente
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
               placeholder="Buscar clientes..." 
               className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-sm transition-all" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Users size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-400 mb-4">No hay clientes registrados</p>
            <button onClick={() => openModal()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-900"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <Plus size={14} /> Agregar cliente
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map(c => (
              <div key={c.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm text-slate-900"
                     style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.2))' }}>
                  {(c.nombre || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800">{c.nombre}</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {[c.ciudad, c.telefono, c.email].filter(Boolean).join(' · ')}
                  </p>
                </div>
                {c.nit && <span className="hidden sm:block text-xs text-slate-400 font-mono">{c.nit}</span>}
                <div className="flex items-center gap-1">
                  <button onClick={() => openModal(c)} className="p-1.5 rounded-lg hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => eliminar(c.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-xl text-slate-900">{editing ? 'Editar cliente' : 'Nuevo cliente'}</h3>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              {[
                { key: 'nombre', label: 'Nombre / Empresa *', placeholder: 'Nombre completo' },
                { key: 'nit', label: 'NIT / Cédula', placeholder: '000.000.000-0' },
                { key: 'ciudad', label: 'Ciudad', placeholder: 'Ciudad' },
                { key: 'telefono', label: 'Teléfono', placeholder: 'Número de teléfono' },
                { key: 'email', label: 'Email', placeholder: 'correo@ejemplo.com', type: 'email' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">{f.label}</label>
                  <input type={f.type || 'text'} value={form[f.key]}
                         onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                         placeholder={f.placeholder} className={inputCls} />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors">Cancelar</button>
              <button onClick={guardar} disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-slate-900 text-sm disabled:opacity-50 transition-all"
                      style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                <Save size={14} /> {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
