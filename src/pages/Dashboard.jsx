import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { FileText, TrendingUp, Users, Package, Plus, ArrowRight, Calendar } from 'lucide-react'

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
const fmtDate = (ts) => {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Dashboard() {
  const { userData, isAdmin } = useAuth()
  const [stats, setStats]     = useState({ total: 0, count: 0, clientes: 0, productos: 0 })
  const [recientes, setRecientes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [facSnap, cliSnap, prodSnap, recSnap] = await Promise.all([
        getDocs(collection(db, 'facturas')),
        getDocs(collection(db, 'clientes')),
        getDocs(collection(db, 'productos')),
        getDocs(query(collection(db, 'facturas'), orderBy('creadoEn', 'desc'), limit(5)))
      ])

      const facturas = facSnap.docs.map(d => d.data())
      const totalVendido = facturas.reduce((s, f) => s + (f.total || 0), 0)

      setStats({
        total: totalVendido,
        count: facturas.length,
        clientes: cliSnap.size,
        productos: prodSnap.size
      })
      setRecientes(recSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { icon: TrendingUp, label: 'Total vendido',   value: fmt(stats.total), color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { icon: FileText,   label: 'Facturas emitidas', value: stats.count,    color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { icon: Users,      label: 'Clientes',         value: stats.clientes,  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { icon: Package,    label: 'Productos',        value: stats.productos, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  ]

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-slate-900">
            Hola, {userData?.nombre?.split(' ')[0] || 'bienvenido'} 👋
          </h1>
          <p className="text-slate-500 mt-1 flex items-center gap-1.5">
            <Calendar size={14} />
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link to="/facturas/nueva"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-slate-900 text-sm transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
          <Plus size={16} />
          Nueva Factura
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(c => (
          <div key={c.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: c.bg }}>
              <c.icon size={20} style={{ color: c.color }} />
            </div>
            <div className="text-2xl font-display text-slate-900 font-bold">
              {loading ? <span className="inline-block w-20 h-7 bg-slate-100 rounded animate-pulse" /> : c.value}
            </div>
            <div className="text-slate-500 text-sm mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Facturas recientes */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
          <h2 className="font-display text-xl text-slate-900">Facturas recientes</h2>
          <Link to="/facturas" className="text-amber-500 text-sm flex items-center gap-1 hover:text-amber-600 transition-colors">
            Ver todas <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recientes.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-400">Aún no hay facturas</p>
            <Link to="/facturas/nueva" className="text-amber-500 text-sm mt-2 inline-block hover:underline">
              Crear primera factura →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recientes.map(f => (
              <Link key={f.id} to={`/facturas/editar/${f.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-amber-600 font-mono text-xs font-bold"
                     style={{ background: 'rgba(245,158,11,0.1)' }}>
                  #{f.numero}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{f.cliente?.nombre || 'Sin nombre'}</p>
                  <p className="text-slate-400 text-xs">{fmtDate(f.creadoEn)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">{fmt(f.total || 0)}</p>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                    f.estado === 'pagada' ? 'bg-emerald-100 text-emerald-700' :
                    f.estado === 'pendiente' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {f.estado || 'emitida'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
