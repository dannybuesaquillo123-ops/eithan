import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { X, Download, Share2, Loader } from 'lucide-react'

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0)
const fmtDate = (d) => {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : (d.toDate ? d.toDate() : new Date(d))
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function FacturaViewer({ factura, onClose }) {
  const ref        = useRef(null)
  const [gen, setGen] = useState(false)

  const descargar = async () => {
    if (!ref.current) return
    setGen(true)
    try {
      const canvas = await html2canvas(ref.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })
      const url  = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `Factura-${factura.numero || '001'}.png`
      link.href = url
      link.click()
    } finally { setGen(false) }
  }

  const compartir = async () => {
    if (!ref.current) return
    setGen(true)
    try {
      const canvas = await html2canvas(ref.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      canvas.toBlob(async (blob) => {
        const file = new File([blob], `Factura-${factura.numero}.png`, { type: 'image/png' })
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({ title: `Factura #${factura.numero}`, files: [file] })
        } else {
          const url = canvas.toDataURL()
          const a   = document.createElement('a')
          a.href = url; a.download = file.name; a.click()
        }
      })
    } finally { setGen(false) }
  }

  const c = factura?.config || {}

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl my-8">
        {/* Controles */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button onClick={descargar} disabled={gen}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-slate-900 text-sm hover:scale-105 transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              {gen ? <Loader size={14} className="animate-spin" /> : <Download size={14} />}
              Descargar PNG
            </button>
            <button onClick={compartir} disabled={gen}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white text-sm border border-white/20 hover:bg-white/10 transition-all">
              <Share2 size={14} /> Compartir
            </button>
          </div>
          <button onClick={onClose}
                  className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Plantilla de factura */}
        <div ref={ref} className="factura-template bg-white rounded-2xl overflow-hidden shadow-2xl"
             style={{ fontFamily: "'DM Sans', sans-serif" }}>

          {/* Header de la empresa */}
          <div className="p-8 pb-6" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
            <div className="flex items-start justify-between">
              <div>
                {c.logo ? (
                  <img src={c.logo} alt="Logo" className="h-14 object-contain mb-3" />
                ) : (
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-3 text-2xl font-bold text-slate-900"
                       style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                    {(c.empresa || 'E')[0]}
                  </div>
                )}
                <h2 className="text-white font-bold text-xl">{c.empresa || 'Mi Empresa'}</h2>
                {c.nit && <p className="text-slate-400 text-xs mt-0.5">NIT: {c.nit}</p>}
                {c.direccion && <p className="text-slate-400 text-xs">{c.direccion}</p>}
                {c.telefono && <p className="text-slate-400 text-xs">{c.telefono}</p>}
              </div>
              <div className="text-right">
                <div className="inline-block px-4 py-1.5 rounded-lg mb-3"
                     style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  <span className="text-slate-900 text-xs font-bold uppercase tracking-widest">Factura</span>
                </div>
                <div className="text-white">
                  <p className="text-3xl font-bold font-mono">#{String(factura.numero || '001').padStart(4, '0')}</p>
                  <p className="text-slate-400 text-xs mt-1">{fmtDate(factura.fecha)}</p>
                </div>
                <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full font-medium ${
                  factura.estado === 'pagada'   ? 'bg-emerald-500/20 text-emerald-400' :
                  factura.estado === 'pendiente'? 'bg-amber-500/20 text-amber-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {(factura.estado || 'emitida').toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Datos del cliente */}
          <div className="px-8 py-6 border-b" style={{ borderColor: '#f1f5f9', background: '#fafbfc' }}>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Facturar a</p>
                <p className="font-bold text-slate-900 text-lg">{factura.cliente?.nombre || '-'}</p>
                {factura.cliente?.nit && <p className="text-slate-500 text-sm">NIT: {factura.cliente.nit}</p>}
                {factura.cliente?.ciudad && <p className="text-slate-500 text-sm">{factura.cliente.ciudad}</p>}
                {factura.cliente?.telefono && <p className="text-slate-500 text-sm">{factura.cliente.telefono}</p>}
                {factura.cliente?.email && <p className="text-slate-500 text-sm">{factura.cliente.email}</p>}
              </div>
              <div className="text-right">
                {factura.vendedor && (
                  <>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Vendedor</p>
                    <p className="text-slate-700 font-medium">{factura.vendedor}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tabla de productos */}
          <div className="px-8 py-6">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0f172a' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: '#94a3b8', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: '8px 0 0 8px' }}>Descripción</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', color: '#94a3b8', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cant.</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', color: '#94a3b8', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>P. Unit.</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', color: '#94a3b8', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: '0 8px 8px 0' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(factura.items || []).filter(p => p.nombre).map((prod, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#334155' }}>{prod.nombre}</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>{prod.cantidad}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', color: '#64748b' }}>{fmt(prod.precio)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>{fmt(prod.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="px-8 pb-6 flex justify-end">
            <div style={{ minWidth: '260px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Subtotal</span>
                <span style={{ fontSize: '13px', color: '#334155', fontWeight: '500' }}>{fmt(factura.subtotal)}</span>
              </div>
              {factura.descuento > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '13px', color: '#10b981' }}>Descuento ({factura.descuento}%)</span>
                  <span style={{ fontSize: '13px', color: '#10b981' }}>− {fmt(factura.descuentoValor)}</span>
                </div>
              )}
              {factura.impuesto > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>IVA ({factura.impuesto}%)</span>
                  <span style={{ fontSize: '13px', color: '#334155', fontWeight: '500' }}>{fmt(factura.impuestoValor)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', marginTop: '8px', borderRadius: '12px', background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
                <span style={{ fontSize: '16px', color: '#e2e8f0', fontWeight: '700' }}>TOTAL</span>
                <span style={{ fontSize: '22px', color: '#f59e0b', fontWeight: '800', fontFamily: 'DM Serif Display, serif' }}>{fmt(factura.total)}</span>
              </div>
            </div>
          </div>

          {/* Notas */}
          {factura.notas && (
            <div className="px-8 pb-6">
              <div style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Notas</p>
                <p style={{ fontSize: '13px', color: '#64748b' }}>{factura.notas}</p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ padding: '16px 32px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {c.instagram && <p style={{ fontSize: '11px', color: '#94a3b8' }}>📷 {c.instagram}</p>}
              {c.whatsapp && <p style={{ fontSize: '11px', color: '#94a3b8' }}>💬 {c.whatsapp}</p>}
            </div>
            <p style={{ fontSize: '11px', color: '#cbd5e1', textAlign: 'right' }}>
              Generado con FacturApp Pro
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
