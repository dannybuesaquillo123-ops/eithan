import { useState } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, FileText, Plus, Package, Users,
  Settings, LogOut, Menu, X, ChevronRight, FileText as Logo
} from 'lucide-react'

const navItems = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard',   exact: true },
  { to: '/facturas',      icon: FileText,         label: 'Facturas' },
  { to: '/facturas/nueva',icon: Plus,             label: 'Nueva Factura' },
  { to: '/productos',     icon: Package,          label: 'Productos' },
  { to: '/clientes',      icon: Users,            label: 'Clientes' },
  { to: '/configuracion', icon: Settings,         label: 'Configuración' },
]

export default function Layout() {
  const { userData, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.to
    return location.pathname.startsWith(item.to)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-3 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
             style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
          <Logo size={20} className="text-slate-900" />
        </div>
        <div>
          <div className="text-white font-display text-lg leading-tight">FacturApp</div>
          <div className="text-amber-400 text-xs font-mono">PRO</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const active = isActive(item)
          return (
            <Link key={item.to} to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                    active
                      ? 'text-slate-900 font-medium'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  style={active ? { background: 'linear-gradient(135deg, #f59e0b, #d97706)' } : {}}>
              <item.icon size={18} className={active ? 'text-slate-900' : ''} />
              <span className="flex-1 text-sm">{item.label}</span>
              {active && <ChevronRight size={14} />}
            </Link>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-2"
             style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm text-slate-900"
               style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            {(userData?.nombre || 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{userData?.nombre || 'Usuario'}</p>
            <p className="text-slate-500 text-xs capitalize">{userData?.rol || 'vendedor'}</p>
          </div>
        </div>
        <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all text-sm">
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f1f5f9' }}>
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col h-full"
             style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
        <SidebarContent />
      </aside>

      {/* Sidebar mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 z-10 flex flex-col slide-in"
                 style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
            <button onClick={() => setMobileOpen(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar móvil */}
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 border-b"
                style={{ background: 'white', borderColor: '#e2e8f0' }}>
          <button onClick={() => setMobileOpen(true)}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <Logo size={14} className="text-slate-900" />
            </div>
            <span className="font-display text-slate-900">FacturApp Pro</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
