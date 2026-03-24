import { Fragment, useState, useMemo } from 'react'
import { Disclosure, Transition, CloseButton } from '@headlessui/react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Toaster } from 'react-hot-toast'
import MobileHeader from './MobileHeader'
import BottomNav from './layout/BottomNav'
import { ModalProvider } from '../contexts/ModalContext'
import {
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  UserIcon,
  ShieldExclamationIcon,
  DocumentChartBarIcon,
  ChartBarIcon,
  HomeIcon,
  ClipboardDocumentListIcon,
  UserCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
} from '@heroicons/react/24/solid'

// ── Grupos de navegación para el Sidebar admin ───────────────────────────
const SIDEBAR_SECTIONS = [
  {
    label: 'Principal',
    items: [
      { name: 'Dashboard',          href: '/',                    icon: HomeIcon,                  exact: true },
      { name: 'Partes Empleados',   href: '/partes-empleados',    icon: ClipboardDocumentListIcon },
      { name: 'Partes Proveedores', href: '/partes-proveedores',  icon: ClipboardDocumentListIcon },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { name: 'Empleados',  href: '/empleados',  icon: UserGroupIcon },
      { name: 'Proveedores',href: '/proveedores', icon: BriefcaseIcon },
      { name: 'Obras',      href: '/obras',       icon: BuildingOfficeIcon },
      { name: 'Precios',    href: '/precios',     icon: CurrencyDollarIcon },
      { name: 'Reportes',   href: '/reportes',    icon: ChartBarIcon },
    ],
  },
  {
    label: 'Administración',
    requiredRole: ['superadmin'],
    items: [
      { name: 'Usuarios',       href: '/usuarios',      icon: UserIcon },
      { name: 'Roles',          href: '/gestion-roles', icon: ShieldExclamationIcon },
      { name: 'Auditoría',      href: '/auditoria',     icon: DocumentChartBarIcon },
    ],
  },
]

// ── Topbar: enlaces rápidos para admin en móvil (hamburguesa) ─────────────
const ALL_ADMIN_LINKS = SIDEBAR_SECTIONS.flatMap(s => s.items)

export default function Layout() {
  const location = useLocation()
  const navigate  = useNavigate()
  const { user, logout, hasRole, loading } = useAuth()

  const [isLoggingOut,    setIsLoggingOut]    = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen,   setMobileMenuOpen]   = useState(false)

  const isAdmin     = !loading && hasRole && (hasRole('superadmin') || hasRole('administrador') || hasRole('supervisor'))
  const isEmpleado  = !loading && hasRole && hasRole('empleado')  && !isAdmin
  const isProveedor = !loading && hasRole && hasRole('proveedor') && !isAdmin

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
    } catch (err) {
      console.error('Error al cerrar sesión:', err)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const isLinkActive = (href, exact = false) => {
    if (exact) return location.pathname === href
    return location.pathname.startsWith(href)
  }

  // ── Topbar: qué secciones mostrar según rol ───────────────────────────
  const topbarLinks = useMemo(() => {
    if (isAdmin) return [{ name: 'Inicio', href: '/', exact: true }, { name: 'Mi Perfil', href: '/perfil' }]
    return [{ name: 'Inicio', href: '/', exact: true }, { name: 'Mi Perfil', href: '/perfil' }]
  }, [isAdmin])

  return (
    <ModalProvider>
      <div className="min-h-screen bg-surface-50 flex flex-col pt-14">

        {/* ── TOPBAR ──────────────────────────────────────────────────── */}
        <header className="fixed top-0 left-0 right-0 z-30 h-14 bg-primary-600 shadow-nav">
          <div className="h-full flex items-center justify-between px-4 lg:px-6">

            {/* Logo */}
            <div className="flex items-center gap-3">
              {/* En desktop para admin, mostrar/ocultar sidebar */}
              {isAdmin && (
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-primary-200 hover:text-white hover:bg-primary-500 transition-colors"
                  aria-label={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
                >
                  {sidebarCollapsed
                    ? <ChevronRightIcon className="h-5 w-5" />
                    : <ChevronLeftIcon  className="h-5 w-5" />
                  }
                </button>
              )}
              <Link to="/" className="flex items-center gap-2 group" aria-label="Ir al inicio">
                <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <span className="text-white font-bold text-xs">AP</span>
                </div>
                <span className="text-white font-bold text-base tracking-tight hidden sm:inline">Aisla Partes</span>
              </Link>
            </div>

            {/* Links topbar (desktop) */}
            <nav className="hidden sm:flex items-center gap-1" aria-label="Navegación superior">
              {topbarLinks.map(item => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isLinkActive(item.href, item.exact)
                      ? 'bg-primary-700 text-white'
                      : 'text-primary-100 hover:text-white hover:bg-primary-500'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Usuario + logout (desktop) */}
            <div className="hidden sm:flex items-center gap-3">
              {user && (
                <>
                  <span className="text-primary-100 text-sm truncate max-w-[180px]" title={user.email}>
                    {user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium transition-colors disabled:opacity-50"
                    aria-label="Cerrar sesión"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" aria-hidden="true" />
                    {isLoggingOut ? 'Saliendo…' : 'Cerrar sesión'}
                  </button>
                </>
              )}
            </div>

            {/* Hamburguesa móvil */}
            <button
              className="sm:hidden p-2 rounded-lg text-white hover:bg-primary-500 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Abrir menú"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen
                ? <XMarkIcon  className="h-6 w-6" aria-hidden="true" />
                : <Bars3Icon  className="h-6 w-6" aria-hidden="true" />
              }
            </button>
          </div>

          {/* Menú móvil desplegable */}
          {mobileMenuOpen && (
            <div
              className="sm:hidden absolute top-14 inset-x-0 bg-white shadow-card-elevated border-b border-surface-200 z-40 animate-slide-up"
              role="dialog"
              aria-label="Menú de navegación"
            >
              <div className="py-2 divide-y divide-surface-200">
                {/* Links generales */}
                <div className="py-1 px-2">
                  {topbarLinks.map(item => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium ${
                        isLinkActive(item.href, item.exact)
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-ink-secondary hover:bg-surface-100'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>

                {/* Links de admin en móvil */}
                {isAdmin && (
                  <div className="py-1 px-2">
                    {ALL_ADMIN_LINKS.map(item => (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                          isLinkActive(item.href, item.exact)
                            ? 'bg-primary-50 text-primary-700 font-medium'
                            : 'text-ink-secondary hover:bg-surface-100'
                        }`}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0 text-ink-muted" aria-hidden="true" />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Cerrar sesión */}
                {user && (
                  <div className="py-1 px-2">
                    <button
                      onClick={() => { setMobileMenuOpen(false); handleLogout() }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
                      {isLoggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </header>

        {/* ── CUERPO: Sidebar + Contenido ─────────────────────────────── */}
        <div className="flex flex-1 min-h-0">

          {/* ── SIDEBAR (solo admin, solo desktop lg+) ──────────────── */}
          {isAdmin && (
            <aside
              className={`hidden lg:flex flex-col flex-shrink-0 bg-white border-r border-surface-200 transition-all duration-300 ${
                sidebarCollapsed ? 'w-16' : 'w-60'
              }`}
              aria-label="Menú lateral"
            >
              {/* Perfil usuario */}
              {!sidebarCollapsed && (
                <div className="px-4 py-4 border-b border-surface-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <UserCircleIcon className="h-6 w-6 text-primary-600" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-ink-primary truncate">{user?.email}</p>
                      <p className="text-xs text-ink-muted capitalize">
                        {hasRole('superadmin') ? 'Super Admin' : hasRole('administrador') ? 'Administrador' : 'Supervisor'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navegación */}
              <nav className="flex-1 overflow-y-auto py-4 space-y-6 scrollbar-hide" aria-label="Navegación principal">
                {SIDEBAR_SECTIONS.map((section) => {
                  // Ocultar sección si requiere rol específico
                  if (section.requiredRole && !section.requiredRole.some(r => hasRole(r))) return null
                  return (
                    <div key={section.label}>
                      {!sidebarCollapsed && (
                        <p className="px-4 mb-1.5 text-xs font-semibold text-ink-muted uppercase tracking-wider">
                          {section.label}
                        </p>
                      )}
                      <div className="space-y-0.5 px-2">
                        {section.items.map(item => {
                          const active = isLinkActive(item.href, item.exact)
                          return (
                            <Link
                              key={item.href}
                              to={item.href}
                              title={sidebarCollapsed ? item.name : undefined}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group ${
                                active
                                  ? 'bg-primary-50 text-primary-700'
                                  : 'text-ink-secondary hover:bg-surface-100 hover:text-ink-primary'
                              }`}
                              aria-current={active ? 'page' : undefined}
                            >
                              {/* Indicador activo */}
                              {active && (
                                <span className="absolute left-0 w-1 h-6 bg-primary-500 rounded-r-full" aria-hidden="true" />
                              )}
                              <item.icon
                                className={`h-5 w-5 flex-shrink-0 ${active ? 'text-primary-500' : 'text-ink-muted group-hover:text-ink-secondary'}`}
                                aria-hidden="true"
                              />
                              {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </nav>

              {/* Logout en sidebar */}
              <div className="border-t border-surface-200 p-2">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-ink-muted hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  title={sidebarCollapsed ? 'Cerrar sesión' : undefined}
                  aria-label="Cerrar sesión"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  {!sidebarCollapsed && (isLoggingOut ? 'Cerrando sesión…' : 'Cerrar sesión')}
                </button>
              </div>
            </aside>
          )}

          {/* ── CONTENIDO PRINCIPAL ──────────────────────────────────── */}
          <main className={`flex-1 min-w-0 overflow-auto ${(isEmpleado || isProveedor) ? 'pb-bottom-nav' : ''}`}>
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-6">
              <Outlet />
            </div>
          </main>
        </div>

        {/* ── BOTTOM NAV (solo empleados/proveedores, solo móvil) ──── */}
        {(isEmpleado || isProveedor) && <BottomNav />}

        {/* MobileHeader (detalle pages) */}
        <MobileHeader />
      </div>
    </ModalProvider>
  )
}
