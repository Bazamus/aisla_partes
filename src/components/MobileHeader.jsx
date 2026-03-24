import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import {
  ArrowLeftIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  KeyIcon,
  UserPlusIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ShieldExclamationIcon,
  DocumentChartBarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

// Mapeo de rutas a títulos
const PAGE_TITLES = {
  '/': 'Inicio',
  '/partes-empleados': 'Partes Empleados',
  '/partes-proveedores': 'Partes Proveedores',
  '/empleados': 'Gestión de Empleados',
  '/proveedores': 'Gestión de Proveedores',
  '/obras': 'Obras Asignadas',
  '/precios': 'Gestión de Precios',
  '/gestion-roles': 'Gestión de Roles',
  '/usuarios': 'Gestión de Usuarios',
  '/auditoria': 'Registro de Auditoría',
  '/reportes': 'Reportes de Materiales',
  '/perfil': 'Mi Perfil',
  '/nuevo-parte': 'Nuevo Parte',
  '/parte-proveedor/nuevo': 'Nuevo Parte Proveedor'
};

// Páginas que NO deben mostrar el botón de retroceso (páginas principales)
const MAIN_PAGES = ['/', '/partes-empleados', '/partes-proveedores'];

const MobileHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasRole, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { isModalOpen } = useModal();

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Función para obtener el título de la página actual
  const getCurrentPageTitle = () => {
    const path = location.pathname;
    
    // Buscar coincidencia exacta primero
    if (PAGE_TITLES[path]) {
      return PAGE_TITLES[path];
    }
    
    // Buscar coincidencias parciales para rutas dinámicas
    if (path.includes('/editar-parte/')) return 'Editar Parte';
    if (path.includes('/parte-proveedor/')) return 'Parte Proveedor';
    if (path.includes('/obras-asignadas')) return 'Obras Asignadas';
    
    // Título por defecto
    return 'Aisla Partes';
  };

  // Función para determinar si mostrar el botón de retroceso
  const shouldShowBackButton = () => {
    return !MAIN_PAGES.includes(location.pathname);
  };

  // Función para manejar el retroceso
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  // Función para cerrar sesión
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Navegar y cerrar menú
  const navigateAndClose = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  // Enlaces del menú según el rol
  const getMenuLinks = () => {
    const links = [
      { name: 'Inicio', href: '/', icon: DocumentChartBarIcon }
    ];

    if (hasRole('superadmin')) {
      links.push(
        { name: 'Empleados', href: '/empleados', icon: UserGroupIcon },
        { name: 'Proveedores', href: '/proveedores', icon: BriefcaseIcon },
        { name: 'Obras', href: '/obras', icon: BuildingOfficeIcon },
        { name: 'Precios', href: '/precios', icon: CurrencyDollarIcon },
        { name: 'Gestión de Roles', href: '/gestion-roles', icon: ShieldExclamationIcon },
        { name: 'Usuarios', href: '/usuarios', icon: UserIcon },
        { name: 'Auditoría', href: '/auditoria', icon: DocumentChartBarIcon },
        { name: 'Reportes', href: '/reportes', icon: ChartBarIcon }
      );
    } else if (hasRole('administrador')) {
      links.push(
        { name: 'Empleados', href: '/empleados', icon: UserGroupIcon },
        { name: 'Proveedores', href: '/proveedores', icon: BriefcaseIcon },
        { name: 'Obras', href: '/obras', icon: BuildingOfficeIcon },
        { name: 'Precios', href: '/precios', icon: CurrencyDollarIcon },
        { name: 'Reportes', href: '/reportes', icon: ChartBarIcon }
      );
    } else if (hasRole('supervisor')) {
      links.push(
        { name: 'Partes Empleados', href: '/partes-empleados', icon: ClipboardDocumentListIcon },
        { name: 'Partes Proveedores', href: '/partes-proveedores', icon: ClipboardDocumentListIcon }
      );
    } else if (hasRole('empleado')) {
      links.push(
        { name: 'Mis Partes', href: '/partes-empleados', icon: ClipboardDocumentListIcon },
        { name: 'Obras Asignadas', href: '/empleado/obras-asignadas', icon: BuildingOfficeIcon }
      );
    } else if (hasRole('proveedor')) {
      links.push(
        { name: 'Mis Partes', href: '/partes-proveedores', icon: ClipboardDocumentListIcon }
      );
    }

    return links;
  };

  // Solo mostrar en páginas de detalle que necesitan botón "Atrás"
  // En páginas principales el topbar de Layout.jsx ya cubre la navegación
  if (!shouldShowBackButton()) return null;

  return (
    <>
      {/* Header móvil fijo - oculto cuando hay modal abierto */}
      <div className={`mobile-header-improved block md:hidden ${isModalOpen ? 'mobile-header-hidden' : ''}`}>
        {/* Botón de retroceso (condicional) */}
        <div className="flex items-center">
          {shouldShowBackButton() ? (
            <button
              onClick={handleBack}
              className="mobile-back-button"
              aria-label="Volver atrás"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-11"></div> // Espaciador para mantener centrado el título
          )}
        </div>

        {/* Título de la página */}
        <h1 className="mobile-page-title">
          {getCurrentPageTitle()}
        </h1>

        {/* Botón hamburguesa */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="mobile-hamburger-improved"
          aria-label="Abrir menú"
        >
          {menuOpen ? (
            <XMarkIcon className="w-5 h-5" />
          ) : (
            <Bars3Icon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Overlay para cerrar el menú - oculto cuando hay modal */}
      <div 
        className={`mobile-menu-overlay block md:hidden ${menuOpen && !isModalOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Panel del menú lateral - oculto cuando hay modal */}
      <div className={`mobile-menu-panel-improved block md:hidden ${menuOpen && !isModalOpen ? 'open' : ''}`}>
        <div className="p-4">
          {/* Info del usuario */}
          <div className="border-b border-gray-200 pb-4 mb-4">
            <div className="flex items-center">
              <UserIcon className="w-8 h-8 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {user?.email || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500">
                  {hasRole('superadmin') ? 'Super Administrador' :
                   hasRole('administrador') ? 'Administrador' :
                   hasRole('supervisor') ? 'Supervisor' :
                   hasRole('empleado') ? 'Empleado' :
                   hasRole('proveedor') ? 'Proveedor' : 'Usuario'}
                </p>
              </div>
            </div>
          </div>

          {/* Enlaces del menú */}
          <nav className="space-y-1">
            {getMenuLinks().map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href;
              
              return (
                <button
                  key={link.href}
                  onClick={() => navigateAndClose(link.href)}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {link.name}
                </button>
              );
            })}
          </nav>

          {/* Botón de cerrar sesión */}
          <div className="border-t border-gray-200 pt-4 mt-6">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
              {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileHeader;
