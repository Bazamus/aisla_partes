/**
 * BottomNav — Barra de navegación inferior para empleados en móvil
 * Solo se muestra en pantallas < lg (1024px) y cuando el rol es "empleado"
 */
import { useNavigate, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  PlusCircleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  ClipboardDocumentListIcon as ClipboardSolid,
  UserCircleIcon as UserCircleSolid,
} from '@heroicons/react/24/solid'

const TABS = [
  {
    label:   'Inicio',
    path:    '/',
    exact:   true,
    icon:    <HomeIcon          className="h-6 w-6" aria-hidden="true" />,
    iconActive: <HomeIconSolid  className="h-6 w-6" aria-hidden="true" />,
  },
  {
    label:   'Mis Partes',
    path:    '/partes-empleados',
    icon:    <ClipboardDocumentListIcon className="h-6 w-6" aria-hidden="true" />,
    iconActive: <ClipboardSolid        className="h-6 w-6" aria-hidden="true" />,
  },
  {
    label:   'Nuevo',
    path:    '/nuevo-parte',
    isFab:   true,  // Botón central destacado
    icon:    <PlusCircleIcon className="h-7 w-7" aria-hidden="true" />,
  },
  {
    label:   'Mi Perfil',
    path:    '/perfil',
    icon:    <UserCircleIcon  className="h-6 w-6" aria-hidden="true" />,
    iconActive: <UserCircleSolid className="h-6 w-6" aria-hidden="true" />,
  },
]

const BottomNav = () => {
  const navigate  = useNavigate()
  const location  = useLocation()

  const isActive = (tab) => {
    if (tab.exact) return location.pathname === tab.path
    return location.pathname.startsWith(tab.path)
  }

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-surface-200 shadow-bottom-nav pb-safe"
      aria-label="Navegación principal"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0px)' }}
    >
      <div className="flex items-center justify-around h-16">
        {TABS.map((tab) => {
          const active = isActive(tab)

          if (tab.isFab) {
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="flex flex-col items-center justify-center w-14 h-14 -mt-5 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 rounded-2xl text-white shadow-card-elevated transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label={tab.label}
              >
                {tab.icon}
              </button>
            )
          }

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors duration-150 focus:outline-none ${
                active
                  ? 'text-primary-500'
                  : 'text-ink-muted hover:text-ink-secondary'
              }`}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
            >
              {active && tab.iconActive ? tab.iconActive : tab.icon}
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
