import { useState, useEffect } from 'react'
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc,
  serverTimestamp, query, where
} from 'firebase/firestore'
import { db } from '../firebase'
import { useTheme } from '../contexts/ThemeContext'
import {
  Plus, Edit2, Trash2, Truck, Search, X, Save,
  Wallet, ArrowDownCircle, ArrowUpCircle, ChevronLeft
} from 'lucide-react'

const emptyProveedor = () => ({ nombre: '', nit: '', telefono: '', email: '', ciudad: '', direccion: '' })
const emptyMovimiento = () => ({ tipo: 'deuda', monto: '', descripcion: '' })

const fmt = (n) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', minimumFractionDigits: 0
}).format(n || 0)

export default function Proveedores() {
  const { theme } = useTheme()
  const primaryGradient = `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`

  const [proveedores, setProveedores] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [filtered, setFiltered]       = useState([])
  const [search, setSearch]           = useState('')
  const [loading, setLoading]         = useState(true)

  // Modal proveedor
  const [modal, setModal]     = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(emptyProveedor())
  const [saving, setSaving]   = useState(false)

  // Vista de detalle (cuenta por pagar)
  const [detalle, setDetalle]         = useState(null)
  const [movModal, setMovModal]       = useState(false)
  const [movForm, setMovForm]         = useState(emptyMovimiento())
  const [savingMov, setSavingMov]     = useState(false)

  useEffect(() => { load() }, [])
  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(proveedores.filter(p =>
      p.nombre?.toLowerCase().includes(q) ||
      p.ciudad?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.nit?.toLowerCase().includes(q)
    ))
  }, [search, proveedores])

  const load = async () => {
    try {
      const [provSnap, movSnap] = await Promise.all([
        getDocs(collection(db, 'proveedores')),
        getDocs(collection(db, 'movimientos_proveedor')),
      ])
      const prov = provSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      const mov  = movSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      setProveedores(prov); setFiltered(prov); setMovimientos(mov)
    } catch (_) {}
    finally { setLoading(false) }
  }

  // Calcula el saldo pendiente de un proveedor (deudas - pagos)
  const saldoDe = (proveedorId) => {
    return movimientos
      .filter(m => m.proveedorId === proveedorId)
      .reduce((acc, m) => acc + (m.tipo === 'deuda' ? Number(m.monto) : -Number(m.monto)), 0)
  }

  const totalPorPagar = proveedores.reduce((acc, p) => acc + saldoDe(p.id), 0)

  // -------- Proveedor CRUD --------
  const openModal = (p = null) => {
    setEditing(p)
    setForm(p ? {
      nombre: p.nombre, nit: p.nit || '', telefono: p.telefono || '',
      email: p.email || '', ciudad: p.ciudad || '', direccion: p.direccion || ''
    } : emptyProveedor())
    setModal(true)
  }

  const guardar = async () => {
    if (!form.nombre.trim()) return
    setSaving(true)
    try {
      const payload = { ...form, actualizadoEn: serverTimestamp() }
      if (editing) {
        await updateDoc(doc(db, 'proveedores', editing.id), payload)
      } else {
        payload.creadoEn = serverTimestamp()
        await addDoc(collection(db, 'proveedores'), payload)
      }
      setModal(false); load()
    } catch (_) {}
    finally { setSaving(false) }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este proveedor? También se borrarán sus movimientos.')) return
    try {
      await deleteDoc(doc(db, 'proveedores', id))
      // Borrar movimientos asociados
      const movSnap = await getDocs(query(collection(db, 'movimientos_proveedor'), where('proveedorId', '==', id)))
      await Promise.all(movSnap.docs.map(d => deleteDoc(doc(db, 'movimientos_proveedor', d.id))))
      setProveedores(p => p.filter(x => x.id !== id))
      setMovimientos(m => m.filter(x => x.proveedorId !== id))
    } catch (_) {}
  }

  // -------- Movimientos (cuenta por pagar) --------
  const openMovModal = (tipo) => {
    setMovForm({ ...emptyMovimiento(), tipo })
    setMovModal(true)
  }

  const guardarMov = async () => {
    const monto = Number(movForm.monto)
    if (!monto || monto <= 0) return
    setSavingMov(true)
    try {
      const payload = {
        proveedorId: detalle.id,
        tipo: movForm.tipo,
        monto,
        descripcion: movForm.descripcion.trim(),
        fecha: serverTimestamp(),
      }
      const ref = await addDoc(collection(db, 'movimientos_proveedor'), payload)
      setMovimientos(m => [...m, { id: ref.id, ...payload, fecha: { seconds: Date.now() / 1000 } }])
      setMovModal(false)
    } catch (_) {}
    finally { setSavingMov(false) }
  }

  const eliminarMov = async (id) => {
    if (!confirm('¿Eliminar este movimiento?')) return
    await deleteDoc(doc(db, 'movimientos_proveedor', id))
    setMovimientos(m => m.filter(x => x.id !== id))
  }

  const inputCls = "w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-sm text-slate-800 transition-all"

  // ============ VISTA DE DETALLE ============
  if (detalle) {
    const movs = movimientos
      .filter(m => m.proveedorId === detalle.id)
      .sort((a, b) => (b.fecha?.seconds || 0) - (a.fecha?.seconds || 0))
    const totalDeuda = movs.filter(m => m.tipo === 'deuda').reduce((a, m) => a + Number(m.monto), 0)
    const totalPagos = movs.filter(m => m.tipo === 'pago').reduce((a, m) => a + Number(m.monto), 0)
    const saldo = totalDeuda - totalPagos

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => setDetalle(null)}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ChevronLeft size={16} /> Volver a proveedores
        </button>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-bold text-slate-900"
               style={{ background: primaryGradient }}>
            {(detalle.nombre || '?')[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-display text-slate-900">{detalle.nombre}</h1>
            <p className="text-slate-400 text-xs mt-0.5">
              {[detalle.nit, detalle.telefono, detalle.email].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <ArrowDownCircle size={14} className="text-red-500" /> Total deuda
            </div>
            <p className="text-xl font-bold text-slate-800">{fmt(totalDeuda)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <ArrowUpCircle size={14} className="text-emerald-500" /> Total pagado
            </div>
            <p className="text-xl font-bold text-slate-800">{fmt(totalPagos)}</p>
          </div>
          <div className="rounded-2xl shadow-sm p-5 text-white"
               style={{ background: saldo > 0 ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)' }}>
            <div className="flex items-center gap-2 text-white/80 text-xs mb-1">
              <Wallet size={14} /> Saldo pendiente
            </div>
            <p className="text-xl font-bold">{fmt(saldo)}</p>
          </div>
        </div>

        {/* Botones agregar */}
        <div className="flex gap-3">
          <button onClick={() => openMovModal('deuda')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm hover:scale-105 transition-all"
                  style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            <ArrowDownCircle size={16} /> Registrar deuda
          </button>
          <button onClick={() => openMovModal('pago')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm hover:scale-105 transition-all"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <ArrowUpCircle size={16} /> Registrar pago
          </button>
        </div>

        {/* Lista de movimientos */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {movs.length === 0 ? (
            <div className="p-16 text-center">
              <Wallet size={40} className="mx-auto text-slate-200 mb-3" />
              <p className="text-slate-400">Sin movimientos registrados</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {movs.map(m => {
                const esDeuda = m.tipo === 'deuda'
                const fecha = m.fecha?.seconds ? new Date(m.fecha.seconds * 1000).toLocaleDateString('es-CO') : ''
                return (
                  <div key={m.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${esDeuda ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                      {esDeuda ? <ArrowDownCircle size={18} /> : <ArrowUpCircle size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800">{esDeuda ? 'Deuda' : 'Pago'}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{[m.descripcion, fecha].filter(Boolean).join(' · ')}</p>
                    </div>
                    <span className={`font-semibold text-sm ${esDeuda ? 'text-red-500' : 'text-emerald-600'}`}>
                      {esDeuda ? '+' : '-'}{fmt(m.monto)}
                    </span>
                    <button onClick={() => eliminarMov(m.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Modal movimiento */}
        {movModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 fade-in">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-xl text-slate-900">
                  {movForm.tipo === 'deuda' ? 'Registrar deuda' : 'Registrar pago'}
                </h3>
                <button onClick={() => setMovModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Monto *</label>
                  <input type="number" value={movForm.monto}
                         onChange={e => setMovForm(p => ({ ...p, monto: e.target.value }))}
                         placeholder="0" className={inputCls} min="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Descripción</label>
                  <input type="text" value={movForm.descripcion}
                         onChange={e => setMovForm(p => ({ ...p, descripcion: e.target.value }))}
                         placeholder="Ej: Compra de mercancía, abono, etc." className={inputCls} />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setMovModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors">Cancelar</button>
                <button onClick={guardarMov} disabled={savingMov}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-white text-sm disabled:opacity-50 transition-all"
                        style={{ background: movForm.tipo === 'deuda' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)' }}>
                  <Save size={14} /> {savingMov ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ============ VISTA PRINCIPAL (LISTA) ============
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-slate-900">Proveedores</h1>
          <p className="text-slate-500 mt-1">{filtered.length} proveedor{filtered.length !== 1 ? 'es' : ''}</p>
        </div>
        <button onClick={() => openModal()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-slate-900 text-sm hover:scale-105 transition-all"
                style={{ background: primaryGradient }}>
          <Plus size={16} /> Nuevo Proveedor
        </button>
      </div>

      {/* Total por pagar */}
      {proveedores.length > 0 && (
        <div className="rounded-2xl shadow-sm p-5 text-white flex items-center justify-between"
             style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <Wallet size={16} /> Total por pagar
          </div>
          <p className="text-2xl font-bold">{fmt(totalPorPagar)}</p>
        </div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
               placeholder="Buscar proveedores..."
               className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-sm transition-all" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Truck size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-400 mb-4">No hay proveedores registrados</p>
            <button onClick={() => openModal()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-900"
                    style={{ background: primaryGradient }}>
              <Plus size={14} /> Agregar proveedor
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map(p => {
              const saldo = saldoDe(p.id)
              return (
                <div key={p.id} onClick={() => setDetalle(p)}
                     className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm text-slate-900"
                       style={{ background: `linear-gradient(135deg, ${theme.primaryColor}33, ${theme.secondaryColor}33)` }}>
                    {(p.nombre || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800">{p.nombre}</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {[p.ciudad, p.telefono, p.email].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${saldo > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{fmt(saldo)}</p>
                    <p className="text-slate-400 text-[10px]">{saldo > 0 ? 'pendiente' : 'al día'}</p>
                  </div>
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openModal(p)} className="p-1.5 rounded-lg hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition-colors"><Edit2 size={14} /></button>
                    <button onClick={() => eliminar(p.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal proveedor */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-xl text-slate-900">{editing ? 'Editar proveedor' : 'Nuevo proveedor'}</h3>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              {[
                { key: 'nombre', label: 'Nombre / Empresa *', placeholder: 'Nombre del proveedor' },
                { key: 'nit', label: 'NIT / Cédula', placeholder: '000.000.000-0' },
                { key: 'ciudad', label: 'Ciudad', placeholder: 'Ciudad' },
                { key: 'direccion', label: 'Dirección', placeholder: 'Dirección' },
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
                      style={{ background: primaryGradient }}>
                <Save size={14} /> {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
