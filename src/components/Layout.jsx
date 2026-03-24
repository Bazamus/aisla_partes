import { Fragment, useState, useMemo } from 'react'
import { Disclosure, Menu, Transition, CloseButton } from '@headlessui/react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Toaster } from 'react-hot-toast';
import MobileHeader from './MobileHeader';
import { ModalProvider } from '../contexts/ModalContext';
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon, // Asegúrate que está importado
  KeyIcon,
  UserPlusIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ShieldExclamationIcon,
  DocumentChartBarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Inicio', href: '/' },
  { name: 'Partes Empleados', href: '/partes-empleados' },
  { name: 'Partes Proveedores', href: '/partes-proveedores' },
  { name: 'Empleados', href: '/empleados' },
  { name: 'Obras', href: '/obras' },
  { name: 'Precios', href: '/precios' },
  { name: 'Proveedores', href: '/proveedores' },
  { name: 'Gestión de Roles', href: '/gestion-roles' },
  { name: 'Usuarios', href: '/usuarios' }, 
  { name: 'Auditoría', href: '/auditoria' },
  { name: 'Mi Perfil', href: '/perfil' }
]

// Enlaces para el menú horizontal del SuperAdmin
const superAdminLinks = [
  { name: 'Empleados', href: '/empleados', icon: UserGroupIcon },
  { name: 'Proveedores', href: '/proveedores', icon: BriefcaseIcon },
  { name: 'Obras', href: '/obras', icon: BuildingOfficeIcon },
  { name: 'Precios', href: '/precios', icon: CurrencyDollarIcon },
  { name: 'Gestión de Roles', href: '/gestion-roles', icon: ShieldExclamationIcon },
  { name: 'Usuarios', href: '/usuarios', icon: UserIcon },
  { name: 'Auditoría', href: '/auditoria', icon: DocumentChartBarIcon },
  { name: 'Reportes', href: '/reportes', icon: ChartBarIcon }
]

// Enlaces para el menú horizontal del Administrador
const adminLinks = [
  { name: 'Empleados', href: '/empleados', icon: UserGroupIcon },
  { name: 'Proveedores', href: '/proveedores', icon: BriefcaseIcon },
  { name: 'Obras', href: '/obras', icon: BuildingOfficeIcon },
  { name: 'Precios', href: '/precios', icon: CurrencyDollarIcon },
  { name: 'Reportes', href: '/reportes', icon: ChartBarIcon }
];

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, hasPermission, hasRole, loading } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const filteredNavigation = useMemo(() => {
    if (loading) {
      return navigation.filter(item =>
        item.href === '/' || item.href === '/perfil'
      );
    }

    if (!user) {
      return [];
    }

    // Para proveedor o empleado, solo Inicio y Mi Perfil en el header
    if (hasRole && (hasRole('proveedor') || hasRole('empleado'))) {
      return navigation.filter(item => 
        item.href === '/' || item.href === '/perfil'
      );
    }

    // Para superadmin y administrador, el header principal solo tendrá Inicio y Mi Perfil
    if (hasRole && (hasRole('superadmin') || hasRole('administrador'))) {
      return navigation.filter(item =>
        item.href === '/' || item.href === '/perfil'
      );
    }
    
    // Lógica original para otros usuarios (si los hubiera) o como fallback.
    return navigation.filter(item => {
      if (item.href === '/' || item.href === '/perfil') {
        return true;
      }
      if (typeof hasPermission !== 'function') {
        return false;
      }
      try {
        switch (item.href) {
          case '/partes-empleados':
          case '/partes-proveedores':
            return hasPermission('partes:leer');
          case '/empleados':
            return hasPermission('empleados:leer');
          case '/obras':
            return hasPermission('obras:leer');
          case '/precios':
            return hasPermission('precios:leer');
          case '/proveedores':
            return hasPermission('proveedores:leer');
          case '/gestion-roles':
            return hasPermission('roles:administrar');
          case '/auditoria':
            return hasPermission('auditoria:ver');
          case '/usuarios': 
            return hasPermission('usuarios:gestionar');
          default:
            return false;
        }
      } catch (error) {
        console.error('Error al verificar permisos para navegación:', error);
        return false;
      }
    });
  }, [user, hasPermission, hasRole, loading])

  return (
    <ModalProvider>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Toaster /> 
        {/* Barra de navegación superior */}
        <nav className="shadow-md" style={{backgroundColor: '#0d9488'}}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex header-content">
              <div className="flex flex-shrink-0 items-center">
                <Link to="/" className="text-white font-bold text-xl hover:text-indigo-200">
                  Aisla Partes
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {filteredNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      location.pathname === item.href
                        ? 'border-b-2 border-white text-white'
                        : 'text-indigo-200 hover:text-white'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Botones de usuario */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center header-user-buttons">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-white text-sm">{user.email}</span>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="rounded-md bg-indigo-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 flex items-center"
                  >
                    {isLoggingOut ? (
                      <span>Cerrando sesión...</span>
                    ) : (
                      <>
                        <ArrowRightOnRectangleIcon className="h-5 w-5 mr-1" />
                        Cerrar sesión
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="rounded-md bg-indigo-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                >
                  Iniciar sesión
                </Link>
              )}
            </div>

            {/* Menú móvil */}
            <div className="flex items-center sm:hidden mobile-menu-button">
              <Disclosure as="div" className="relative">
                {({ open, close }) => (
                  <>
                    <Disclosure.Button
                      className="inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-indigo-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    >
                      <span className="sr-only">Abrir menú principal</span>
                      {open ? (
                        <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                      ) : (
                        <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                      )}
                    </Disclosure.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Disclosure.Panel className="absolute right-0 z-10 mt-2 w-64 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        {/* Enlaces para el menú móvil */} 
                        {/* Primero los enlaces principales del header */} 
                        {filteredNavigation.map((item) => (
                          <div key={`mobile-header-${item.name}`}>
                            <CloseButton
                              as={Link}
                              to={item.href}
                              className={`block w-full text-left px-4 py-2 text-sm cursor-pointer ${location.pathname === item.href ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                              {item.name}
                            </CloseButton>
                          </div>
                        ))}
                        
                        {/* Separador si hay menú horizontal */} 
                        {(hasRole && (hasRole('superadmin') || hasRole('administrador'))) && <hr className="my-1"/>}

                        {/* Luego los enlaces del menú horizontal específico del rol */} 
                        {(hasRole && (hasRole('superadmin') || hasRole('administrador'))) && 
                          (hasRole('superadmin') ? superAdminLinks : adminLinks).map((item) => (
                            <div key={`mobile-horizontal-${item.name}`}>
                              <CloseButton
                                as={Link}
                                to={item.href}
                                className={`flex w-full text-left items-center px-4 py-2 text-sm cursor-pointer ${location.pathname.startsWith(item.href) && item.href !== '/' || location.pathname === item.href ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
                              >
                                {item.icon && <item.icon className="mr-3 h-5 w-5 text-gray-500" aria-hidden="true" />} 
                                {item.name}
                              </CloseButton>
                            </div>
                        ))}

                        {/* Para empleados, mostrar sus opciones específicas */}
                        {(hasRole && hasRole('empleado') && !hasRole('proveedor')) && (
                          <>
                            <hr className="my-1"/>
                            <div>
                              <CloseButton
                                as={Link}
                                to="/partes-empleados"
                                className={`flex w-full text-left items-center px-4 py-2 text-sm cursor-pointer ${location.pathname === '/partes-empleados' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
                              >
                                <ClipboardDocumentListIcon className="mr-3 h-5 w-5 text-gray-500" />
                                Mis Partes
                              </CloseButton>
                            </div>
                          </>
                        )}
                        
                        {/* Para proveedores, mostrar sus opciones específicas */}
                        {(hasRole && hasRole('proveedor')) && (
                          <>
                            <hr className="my-1"/>
                            <div>
                              <CloseButton
                                as={Link}
                                to="/partes-proveedores"
                                className={`flex w-full text-left items-center px-4 py-2 text-sm cursor-pointer ${location.pathname === '/partes-proveedores' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
                              >
                                <ClipboardDocumentListIcon className="mr-3 h-5 w-5 text-gray-500" />
                                Mis Partes
                              </CloseButton>
                            </div>
                          </>
                        )}

                        {/* Separador antes de Cerrar Sesión */} 
                        {user && <hr className="my-1"/>}

                        {/* Botón de cerrar sesión */} 
                        {user && (
                          <div>
                            <CloseButton
                              as="button"
                              onClick={handleLogout}
                              disabled={isLoggingOut}
                              className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-500" />
                              {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
                            </CloseButton>
                          </div>
                        )}
                      </Disclosure.Panel>
                    </Transition>
                  </>
                )}
              </Disclosure>
            </div>
          </div>
        </div>
      </nav>

      {/* Menú hamburguesa flotante para móvil */}
      <div className="fixed top-4 right-4 z-50 mobile-floating-menu">
        <Disclosure as="div" className="relative">
          {({ open, close }) => (
            <>
              <Disclosure.Button
                className="inline-flex items-center justify-center rounded-md p-3 bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white shadow-lg"
              >
                <span className="sr-only">Abrir menú principal</span>
                {open ? (
                  <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                )}
              </Disclosure.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Disclosure.Panel className="absolute right-0 z-10 mt-2 w-64 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  {/* Enlaces para el menú móvil */} 
                  {/* Primero los enlaces principales del header */} 
                  {filteredNavigation.map((item) => (
                    <div key={`mobile-floating-header-${item.name}`}>
                      <CloseButton
                        as={Link}
                        to={item.href}
                        className={`block w-full text-left px-4 py-2 text-sm cursor-pointer ${location.pathname === item.href ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        {item.name}
                      </CloseButton>
                    </div>
                  ))}
                  
                  {/* Separador si hay menú horizontal */} 
                  {(hasRole && (hasRole('superadmin') || hasRole('administrador'))) && <hr className="my-1"/>}

                  {/* Luego los enlaces del menú horizontal específico del rol */} 
                  {(hasRole && (hasRole('superadmin') || hasRole('administrador'))) && 
                    (hasRole('superadmin') ? superAdminLinks : adminLinks).map((item) => (
                      <div key={`mobile-floating-horizontal-${item.name}`}>
                        <CloseButton
                          as={Link}
                          to={item.href}
                          className={`flex w-full text-left items-center px-4 py-2 text-sm cursor-pointer ${location.pathname.startsWith(item.href) && item.href !== '/' || location.pathname === item.href ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          {item.icon && <item.icon className="mr-3 h-5 w-5 text-gray-500" aria-hidden="true" />} 
                          {item.name}
                        </CloseButton>
                      </div>
                  ))}

                  {/* Para empleados, mostrar sus opciones específicas */}
                  {(hasRole && hasRole('empleado') && !hasRole('proveedor')) && (
                    <>
                      <hr className="my-1"/>
                      <div>
                        <CloseButton
                          as={Link}
                          to="/partes-empleados"
                          className={`flex w-full text-left items-center px-4 py-2 text-sm cursor-pointer ${location.pathname === '/partes-empleados' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          <ClipboardDocumentListIcon className="mr-3 h-5 w-5 text-gray-500" />
                          Mis Partes
                        </CloseButton>
                      </div>
                    </>
                  )}
                  
                  {/* Para proveedores, mostrar sus opciones específicas */}
                  {(hasRole && hasRole('proveedor')) && (
                    <>
                      <hr className="my-1"/>
                      <div>
                        <CloseButton
                          as={Link}
                          to="/partes-proveedores"
                          className={`flex w-full text-left items-center px-4 py-2 text-sm cursor-pointer ${location.pathname === '/partes-proveedores' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          <ClipboardDocumentListIcon className="mr-3 h-5 w-5 text-gray-500" />
                          Mis Partes
                        </CloseButton>
                      </div>
                    </>
                  )}

                  {/* Separador antes de Cerrar Sesión */} 
                  {user && <hr className="my-1"/>}

                  {/* Botón de cerrar sesión */} 
                  {user && (
                    <div>
                      <CloseButton
                        as="button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-500" />
                        {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
                      </CloseButton>
                    </div>
                  )}
                </Disclosure.Panel>
              </Transition>
            </>
          )}
        </Disclosure>
      </div>

      {/* Menú Horizontal de Funciones */} 
      {(hasRole && (hasRole('superadmin') || hasRole('administrador'))) && (
        <div className="bg-white shadow-sm horizontal-menu">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 py-3">
              {(hasRole('superadmin') ? superAdminLinks : adminLinks).map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-2 py-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium ${ 
                    location.pathname.startsWith(item.href) && item.href !== '/' || location.pathname === item.href 
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.icon && <item.icon className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" aria-hidden="true" />} 
                  <span className="truncate">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header móvil mejorado */}
      <MobileHeader />

      <main className="flex-grow">
        {/* OUTLET UNIFICADO - Funciona en todos los viewports */}
        <div className="mx-auto max-w-7xl py-2 md:py-6 px-2 md:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
    </ModalProvider>
  )
}