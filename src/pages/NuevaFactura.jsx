import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  collection, addDoc, getDoc, updateDoc, doc,
  getDocs, serverTimestamp, query, orderBy, limit, where
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Trash2, Save, Image, Search, ChevronDown, AlertCircle } from 'lucide-react'
import FacturaViewer from '../components/FacturaViewer'

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0)

const emptyProducto = () => ({ nombre: '', cantidad: 1, precio: 0, total: 0 })
const emptyCliente  = () => ({ nombre: '', ciudad: '', telefono: '', email: '', nit: '' })

export default function NuevaFactura() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { userData } = useAuth()
  const isEditing    = !!id

  const [loading, setSaving]   = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError]      = useState('')

  // Datos del formulario
  const [numero, setNumero]       = useState('')
  const [fecha, setFecha]         = useState(new Date().toISOString().split('T')[0])
  const [estado, setEstado]       = useState('emitida')
  const [cliente, setCliente]     = useState(emptyCliente())
  const [productos, setProductos] = useState([emptyProducto()])
  const [descuento, setDescuento] = useState(0)
  const [impuesto, setImpuesto]   = useState(0)
  const [notas, setNotas]         = useState('')
  const [config, setConfig]       = useState({})

  // Autocompletado
  const [clientesSugeridos, setClientesSugeridos] = useState([])
  const [productosCatalogo, setProductosCatalogo]  = useState([])
  const [busqCliente, setBusqCliente] = useState('')
  const [showClienteDrop, setShowClienteDrop] = useState(false)
  const [busqProd, setBusqProd]   = useState({})
  const [showProdDrop, setShowProdDrop] = useState({})

  useEffect(() => {
    loadConfig()
    loadCatalogo()
    if (isEditing) loadFactura()
    else            generarNumero()
  }, [id])

  const loadConfig = async () => {
    try {
      const snap = await getDoc(doc(db, 'configuracion', 'empresa'))
      if (snap.exists()) setConfig(snap.data())
    } catch (_) {}
  }

  const loadCatalogo = async () => {
    try {
      const snap = await getDocs(collection(db, 'productos'))
      setProductosCatalogo(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (_) {}
  }

  const loadFactura = async () => {
    try {
      const snap = await getDoc(doc(db, 'facturas', id))
      if (!snap.exists()) { navigate('/facturas'); return }
      const d = snap.data()
      setNumero(d.numero)
      setFecha(d.fecha || new Date().toISOString().split('T')[0])
      setEstado(d.estado || 'emitida')
      setCliente(d.cliente || emptyCliente())
      setProductos(d.items || [emptyProducto()])
      setDescuento(d.descuento || 0)
      setImpuesto(d.impuesto || 0)
      setNotas(d.notas || '')
    } catch (_) { navigate('/facturas') }
  }

  const generarNumero = async () => {
    try {
      const snap = await getDocs(collection(db, 'facturas'))
      let maxNumero = 0
      snap.docs.forEach(doc => {
        const num = parseInt(doc.data().numero, 10) || 0
        if (num > maxNumero) maxNumero = num
      })
      setNumero(maxNumero + 1)
    } catch (_) { setNumero(1) }
  }

  // Cliente autocompletado
  const buscarClientes = async (term) => {
    setBusqCliente(term)
    setCliente(p => ({ ...p, nombre: term }))
    if (term.length < 2) { setClientesSugeridos([]); return }
    try {
      const snap = await getDocs(collection(db, 'clientes'))
      const res  = snap.docs.map(d => d.data()).filter(c =>
        c.nombre?.toLowerCase().includes(term.toLowerCase())
      ).slice(0, 5)
      setClientesSugeridos(res)
      setShowClienteDrop(true)
    } catch (_) {}
  }

  const seleccionarCliente = (c) => {
    setCliente({ nombre: c.nombre, ciudad: c.ciudad || '', telefono: c.telefono || '', email: c.email || '', nit: c.nit || '' })
    setBusqCliente(c.nombre)
    setClientesSugeridos([])
    setShowClienteDrop(false)
  }

  // Productos
  const actualizarProducto = (idx, campo, val) => {
    setProductos(prev => {
      const items = [...prev]
      items[idx] = { ...items[idx], [campo]: val }
      if (campo === 'cantidad' || campo === 'precio') {
        items[idx].total = (parseFloat(items[idx].cantidad) || 0) * (parseFloat(items[idx].precio) || 0)
      }
      return items
    })
  }

  const agregarProducto = () => setProductos(p => [...p, emptyProducto()])
  const eliminarProducto = (idx) => setProductos(p => p.filter((_, i) => i !== idx))

  const seleccionarDelCatalogo = (idx, prod) => {
    setProductos(prev => {
      const items = [...prev]
      items[idx] = { nombre: prod.nombre, cantidad: 1, precio: prod.precio || 0, total: prod.precio || 0 }
      return items
    })
    setBusqProd(p => ({ ...p, [idx]: '' }))
    setShowProdDrop(p => ({ ...p, [idx]: false }))
  }

  // Cálculos
  const subtotal  = productos.reduce((s, p) => s + (p.total || 0), 0)
  const descuVal  = (subtotal * (parseFloat(descuento) || 0)) / 100
  const baseImp   = subtotal - descuVal
  const impVal    = (baseImp * (parseFloat(impuesto) || 0)) / 100
  const total     = baseImp + impVal

  const facturaData = () => ({
    numero, fecha, estado, cliente,
    items: productos, descuento, impuesto,
    subtotal, descuentoValor: descuVal, impuestoValor: impVal, total,
    notas, vendedor: userData?.nombre || '',
    config
  })

  const guardar = async () => {
    if (!cliente.nombre.trim()) { setError('El nombre del cliente es requerido'); return }
    if (productos.every(p => !p.nombre.trim())) { setError('Agrega al menos un producto'); return }
    setError('')
    setSaving(true)
    try {
      const payload = { ...facturaData(), actualizadoEn: serverTimestamp() }
      if (!isEditing) payload.creadoEn = serverTimestamp()

      // Guardar/actualizar cliente
      if (cliente.nombre) {
        const cliSnap = await getDocs(query(collection(db, 'clientes'), where('nombre', '==', cliente.nombre)))
        if (cliSnap.empty) {
          await addDoc(collection(db, 'clientes'), { ...cliente, creadoEn: serverTimestamp() })
        }
      }

      if (isEditing) {
        await updateDoc(doc(db, 'facturas', id), payload)
      } else {
        await addDoc(collection(db, 'facturas'), payload)
      }
      navigate('/facturas')
    } catch (e) {
      setError('Error al guardar: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all text-sm text-slate-800"

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-slate-900">
            {isEditing ? 'Editar Factura' : 'Nueva Factura'}
          </h1>
          <p className="text-slate-500 mt-1">Factura #{numero}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPreview(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-all">
            <Image size={15} /> Vista previa
          </button>
          <button onClick={guardar} disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-slate-900 text-sm transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <Save size={15} />
            {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl text-red-600 bg-red-50 border border-red-100 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Datos generales */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h2 className="font-display text-lg text-slate-900 mb-4">Datos generales</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">N° de Factura</label>
            <input type="number" value={numero} onChange={e => setNumero(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Fecha</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Estado</label>
            <select value={estado} onChange={e => setEstado(e.target.value)} className={inputCls}>
              <option value="emitida">Emitida</option>
              <option value="pendiente">Pendiente</option>
              <option value="pagada">Pagada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Datos del cliente */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h2 className="font-display text-lg text-slate-900 mb-4">Datos del cliente</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Nombre / Empresa *</label>
            <input
              value={cliente.nombre}
              onChange={e => buscarClientes(e.target.value)}
              onFocus={() => busqCliente && setShowClienteDrop(true)}
              onBlur={() => setTimeout(() => setShowClienteDrop(false), 200)}
              placeholder="Nombre del cliente..."
              className={inputCls}
            />
            {showClienteDrop && clientesSugeridos.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                {clientesSugeridos.map((c, i) => (
                  <button key={i} onMouseDown={() => seleccionarCliente(c)}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-amber-50 text-slate-700 flex items-center gap-2">
                    <Search size={12} className="text-slate-400" /> {c.nombre}
                    {c.ciudad && <span className="text-slate-400 text-xs">— {c.ciudad}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Ciudad</label>
            <input value={cliente.ciudad} onChange={e => setCliente(p => ({ ...p, ciudad: e.target.value }))} placeholder="Ciudad..." className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">NIT / Cédula</label>
            <input value={cliente.nit} onChange={e => setCliente(p => ({ ...p, nit: e.target.value }))} placeholder="000.000.000-0" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Teléfono</label>
            <input value={cliente.telefono} onChange={e => setCliente(p => ({ ...p, telefono: e.target.value }))} placeholder="Teléfono..." className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
            <input type="email" value={cliente.email} onChange={e => setCliente(p => ({ ...p, email: e.target.value }))} placeholder="correo@cliente.com" className={inputCls} />
          </div>
        </div>
      </div>

      {/* Productos */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h2 className="font-display text-lg text-slate-900 mb-4">Productos / Servicios</h2>

        <div className="space-y-3">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-12 gap-2 px-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
            <div className="col-span-5">Descripción</div>
            <div className="col-span-2 text-center">Cantidad</div>
            <div className="col-span-2 text-right">Precio unitario</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-1"></div>
          </div>

          {productos.map((prod, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-start">
              {/* Nombre con autocompletado */}
              <div className="col-span-12 sm:col-span-5 relative">
                <input
                  value={prod.nombre}
                  onChange={e => {
                    actualizarProducto(idx, 'nombre', e.target.value)
                    setBusqProd(p => ({ ...p, [idx]: e.target.value }))
                    setShowProdDrop(p => ({ ...p, [idx]: true }))
                  }}
                  onBlur={() => setTimeout(() => setShowProdDrop(p => ({ ...p, [idx]: false })), 200)}
                  placeholder="Nombre del producto..."
                  className={inputCls}
                />
                {showProdDrop[idx] && busqProd[idx]?.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                    {productosCatalogo
                      .filter(p => p.nombre?.toLowerCase().includes((busqProd[idx] || '').toLowerCase()))
                      .slice(0, 5)
                      .map(p => (
                        <button key={p.id} onMouseDown={() => seleccionarDelCatalogo(idx, p)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-amber-50 text-slate-700 flex items-center justify-between">
                          <span>{p.nombre}</span>
                          <span className="text-amber-600 font-medium text-xs">{fmt(p.precio)}</span>
                        </button>
                      ))
                    }
                  </div>
                )}
              </div>
              <div className="col-span-4 sm:col-span-2">
                <input
                  type="number" min="1" value={prod.cantidad}
                  onChange={e => actualizarProducto(idx, 'cantidad', e.target.value)}
                  className={inputCls + ' text-center'}
                />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <input
                  type="number" min="0" value={prod.precio}
                  onChange={e => actualizarProducto(idx, 'precio', e.target.value)}
                  className={inputCls + ' text-right'}
                />
              </div>
              <div className="col-span-3 sm:col-span-2 flex items-center justify-end">
                <span className="text-sm font-semibold text-slate-800">{fmt(prod.total)}</span>
              </div>
              <div className="col-span-1 flex items-center justify-center">
                {productos.length > 1 && (
                  <button onClick={() => eliminarProducto(idx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button onClick={agregarProducto}
                className="mt-4 flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors">
          <Plus size={16} /> Agregar producto
        </button>
      </div>

      {/* Totales */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h2 className="font-display text-lg text-slate-900 mb-4">Totales y ajustes</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Descuento (%)</label>
              <input type="number" min="0" max="100" value={descuento}
                     onChange={e => setDescuento(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Impuesto / IVA (%)</label>
              <input type="number" min="0" max="100" value={impuesto}
                     onChange={e => setImpuesto(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Notas / Observaciones</label>
              <textarea value={notas} onChange={e => setNotas(e.target.value)}
                        rows={3} placeholder="Condiciones de pago, notas adicionales..."
                        className={inputCls + ' resize-none'} />
            </div>
          </div>

          {/* Resumen */}
          <div className="flex flex-col justify-end">
            <div className="rounded-xl p-5 space-y-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span className="font-medium">{fmt(subtotal)}</span>
              </div>
              {descuento > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Descuento ({descuento}%)</span>
                  <span>− {fmt(descuVal)}</span>
                </div>
              )}
              {impuesto > 0 && (
                <div className="flex justify-between text-sm text-slate-600">
                  <span>IVA / Impuesto ({impuesto}%)</span>
                  <span>{fmt(impVal)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-3 flex justify-between">
                <span className="font-display text-lg text-slate-900">Total</span>
                <span className="font-display text-2xl text-slate-900 font-bold">{fmt(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {showPreview && (
        <FacturaViewer factura={facturaData()} onClose={() => setShowPreview(false)} />
      )}
    </div>
  )
}
