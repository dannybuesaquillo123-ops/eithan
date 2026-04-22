import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { FileText, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate   = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      const msgs = {
        'auth/user-not-found':   'Usuario no encontrado',
        'auth/wrong-password':   'Contraseña incorrecta',
        'auth/invalid-email':    'Correo inválido',
        'auth/too-many-requests':'Demasiados intentos. Espera un momento',
        'auth/invalid-credential': 'Credenciales incorrectas',
      }
      setError(msgs[err.code] || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
      {/* Panel izquierdo - decorativo */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-16 relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full border border-amber-400" />
          <div className="absolute top-32 left-32 w-48 h-48 rounded-full border border-amber-400" />
          <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full border border-amber-400" />
          <div className="absolute -bottom-10 -right-10 w-96 h-96 rounded-full border border-slate-400" />
        </div>
        {/* Líneas decorativas */}
        <div className="absolute top-0 left-1/2 w-px h-full opacity-10"
             style={{ background: 'linear-gradient(to bottom, transparent, #f59e0b, transparent)' }} />

        <div className="relative z-10 text-center">
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <FileText size={44} className="text-slate-900" />
            </div>
          </div>
          <h1 className="text-5xl font-display text-white mb-4">FacturApp Pro</h1>
          <p className="text-slate-400 text-lg font-body max-w-sm leading-relaxed">
            Sistema de facturación profesional para hacer crecer tu negocio
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            {[['∞', 'Facturas'], ['100%', 'Gratis'], ['PWA', 'Instalable']].map(([v, l]) => (
              <div key={l} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="text-amber-400 text-2xl font-display font-bold">{v}</div>
                <div className="text-slate-400 text-sm mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel derecho - formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md">
          {/* Logo móvil */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <FileText size={24} className="text-slate-900" />
            </div>
            <span className="text-2xl font-display text-white">FacturApp Pro</span>
          </div>

          <div className="p-8 rounded-2xl"
               style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
            <h2 className="text-3xl font-display text-white mb-2">Bienvenido</h2>
            <p className="text-slate-400 mb-8">Ingresa tus credenciales para continuar</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Correo electrónico</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }}
                  placeholder="tu@empresa.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    className="w-full px-4 py-3 pr-12 rounded-xl text-white placeholder-slate-500 outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }}
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-red-400 text-sm"
                     style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold text-slate-900 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: loading ? '#94a3b8' : 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>

            <p className="text-center text-slate-500 text-xs mt-6">
              FacturApp Pro © {new Date().getFullYear()} · Todos los derechos reservados
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
