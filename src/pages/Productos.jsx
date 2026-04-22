import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { Plus, Edit2, Trash2, Package, Search, X, Save } from 'lucide-react'

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0)

const empty = () => ({ nombre: '', descripcion: '', precio: '', categoria: '' })

export default function Productos() {
  const [productos, setProductos] = useState([])
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
    setFiltered(productos.filter(p =>
      p.nombre?.toLowerCase().includes(q) ||
      p.categoria?.toLowerCase().includes(q)
    ))
  }, [search, productos])

  const load = async () => {
    try {
      const snap = await getDocs(collection(db, 'productos'))
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setProductos(data); setFiltered(data)
    } catch (_) {}
    finally { setLoading(false) }
  }

  const openModal = (prod = null) => {
    setEditing(prod)
    setForm(prod ? { nombre: prod.nombre, descripcion: prod.descripcion || '', precio: prod.precio || '', categoria: prod.categoria || '' } : empty())
    setModal(true)
  }

  const guardar = async () => {
    if (!form.nombre.trim()) return
    setSaving(true)
    try {
      const payload = { ...form, precio: parseFloat(form.precio) || 0, actualizadoEn: serverTimestamp() }
      if (editing) {
        await updateDoc(doc(db, 'productos', editing.id), payload)
      } else {
        payload.creadoEn = serverTimestamp()
        await addDoc(collection(db, 'productos'), payload)
      }
      setModal(false)
      load()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return
    await deleteDoc(doc(db, 'productos', id))
    setProductos(p => p.filter(x => x.id !== id))
  }

  const inputCls = "w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-sm text-slate-800 transition-all"

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-slate-900">Productos</h1>
          <p className="text-slate-500 mt-1">{filtered.length} producto{filtered.length !== 1 ? 's' : ''} en catálogo</p>
        </div>
        <button onClick={() => openModal()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-slate-900 text-sm hover:scale-105 transition-all"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
          <Plus size={16} /> Nuevo Producto
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
               placeholder="Buscar productos..."
               className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-sm transition-all" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Package size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-400 mb-4">No hay productos</p>
            <button onClick={() => openModal()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-900"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <Plus size={14} /> Agregar primero
            </button>
          </div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-100 text-xs font-medium text-slate-400 uppercase tracking-wider">
              <div className="col-span-5">Nombre</div>
              <div className="col-span-3">Categoría</div>
              <div className="col-span-2 text-right">Precio</div>
              <div className="col-span-2 text-right">Acc.</div>
            </div>
            <div className="divide-y divide-slate-50">
              {filtered.map(p => (
                <div key={p.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50 transition-colors items-center">
                  <div className="col-span-7 sm:col-span-5">
                    <p className="font-medium text-slate-800">{p.nombre}</p>
                    {p.descripcion && <p className="text-slate-400 text-xs mt-0.5 truncate">{p.descripcion}</p>}
                  </div>
                  <div className="hidden sm:block col-span-3">
                    {p.categoria && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                        {p.categoria}
                      </span>
                    )}
                  </div>
                  <div className="col-span-3 sm:col-span-2 text-right">
                    <span className="font-semibold text-slate-900">{fmt(p.precio)}</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <button onClick={() => openModal(p)}
                            className="p-1.5 rounded-lg hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => eliminar(p.id)}
                            className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-xl text-slate-900">{editing ? 'Editar producto' : 'Nuevo producto'}</h3>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Nombre *</label>
                <input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                       placeholder="Nombre del producto" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Descripción</label>
                <input value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                       placeholder="Descripción breve" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Precio</label>
                  <input type="number" min="0" value={form.precio} onChange={e => setForm(p => ({ ...p, precio: e.target.value }))}
                         placeholder="0" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Categoría</label>
                  <input value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}
                         placeholder="Ej: Servicio" className={inputCls} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
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
