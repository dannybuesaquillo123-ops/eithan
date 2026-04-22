import { useState, useEffect } from 'react'
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { Link } from 'react-router-dom'
import { Plus, Search, Edit2, Trash2, FileText, Image, Eye } from 'lucide-react'
import FacturaViewer from '../components/FacturaViewer'

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
const fmtDate = (ts) => {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Facturas() {
  const [facturas, setFacturas] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [preview, setPreview]   = useState(null)

  useEffect(() => { loadFacturas() }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(facturas.filter(f =>
      f.numero?.toString().includes(q) ||
      f.cliente?.nombre?.toLowerCase().includes(q) ||
      f.cliente?.ciudad?.toLowerCase().includes(q)
    ))
  }, [search, facturas])

  const loadFacturas = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'facturas'), orderBy('creadoEn', 'desc')))
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setFacturas(data)
      setFiltered(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta factura?')) return
    await deleteDoc(doc(db, 'facturas', id))
    setFacturas(p => p.filter(f => f.id !== id))
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-slate-900">Facturas</h1>
          <p className="text-slate-500 mt-1">{filtered.length} factura{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/facturas/nueva"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-slate-900 text-sm hover:scale-105 transition-all"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
          <Plus size={16} /> Nueva Factura
        </Link>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por número, cliente o ciudad..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all text-sm"
        />
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-50 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <FileText size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-400 mb-4">{search ? 'No se encontraron resultados' : 'Aún no hay facturas'}</p>
            <Link to="/facturas/nueva"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-900"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <Plus size={14} /> Crear primera factura
            </Link>
          </div>
        ) : (
          <>
            {/* Header tabla */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-100 text-xs font-medium text-slate-500 uppercase tracking-wider">
              <div className="col-span-1">#</div>
              <div className="col-span-3">Cliente</div>
              <div className="col-span-2">Ciudad</div>
              <div className="col-span-2">Fecha</div>
              <div className="col-span-2 text-right">Total</div>
              <div className="col-span-1 text-center">Estado</div>
              <div className="col-span-1 text-right">Acc.</div>
            </div>

            <div className="divide-y divide-slate-50">
              {filtered.map(f => (
                <div key={f.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50 transition-colors items-center">
                  <div className="col-span-1">
                    <span className="font-mono text-xs font-bold text-amber-600">#{f.numero}</span>
                  </div>
                  <div className="col-span-5 sm:col-span-3">
                    <p className="font-medium text-slate-800 text-sm truncate">{f.cliente?.nombre || '-'}</p>
                    <p className="text-slate-400 text-xs sm:hidden">{fmtDate(f.creadoEn)}</p>
                  </div>
                  <div className="hidden sm:block col-span-2 text-sm text-slate-500 truncate">{f.cliente?.ciudad || '-'}</div>
                  <div className="hidden sm:block col-span-2 text-sm text-slate-500">{fmtDate(f.creadoEn)}</div>
                  <div className="col-span-4 sm:col-span-2 text-right">
                    <p className="font-semibold text-slate-900 text-sm">{fmt(f.total || 0)}</p>
                  </div>
                  <div className="hidden sm:flex col-span-1 justify-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      f.estado === 'pagada' ? 'bg-emerald-100 text-emerald-700' :
                      f.estado === 'pendiente' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>{f.estado || 'emitida'}</span>
                  </div>
                  <div className="col-span-3 sm:col-span-1 flex items-center justify-end gap-1">
                    <button onClick={() => setPreview(f)}
                            className="p-1.5 rounded-lg hover:bg-amber-100 text-slate-400 hover:text-amber-600 transition-colors" title="Ver">
                      <Eye size={14} />
                    </button>
                    <Link to={`/facturas/editar/${f.id}`}
                          className="p-1.5 rounded-lg hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition-colors" title="Editar">
                      <Edit2 size={14} />
                    </Link>
                    <button onClick={() => handleDelete(f.id)}
                            className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors" title="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal preview */}
      {preview && (
        <FacturaViewer factura={preview} onClose={() => setPreview(null)} />
      )}
    </div>
  )
}
