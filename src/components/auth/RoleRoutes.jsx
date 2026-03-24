import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Componente para rutas que requieren rol de administrador
 */
export function AdminRoute({ children }) {
  const { user, loading, hasRole } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-700">Cargando...</span>
      </div>
    );
  }
  
  if (!user || !(hasRole('administrador') || hasRole('superadmin'))) {
    return <Navigate to="/acceso-denegado" />;
  }
  
  return children;
}

/**
 * Componente para rutas que requieren rol de supervisor
 */
export function SupervisorRoute({ children }) {
  const { user, loading, hasRole } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-700">Cargando...</span>
      </div>
    );
  }
  
  // Permitir acceso a administradores, supervisores y superadmin
  if (!user || !(hasRole('supervisor') || hasRole('administrador') || hasRole('superadmin'))) {
    return <Navigate to="/acceso-denegado" />;
  }
  
  return children;
}

/**
 * Componente para rutas que requieren rol de empleado
 */
export function EmpleadoRoute({ children }) {
  const { user, loading, hasRole } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-700">Cargando...</span>
      </div>
    );
  }
  
  // Permitir acceso a empleados, supervisores, administradores y superadmin
  if (!user || !(hasRole('empleado') || hasRole('supervisor') || hasRole('administrador') || hasRole('superadmin'))) {
    return <Navigate to="/acceso-denegado" />;
  }
  
  return children;
}

/**
 * Componente para rutas que requieren rol de proveedor
 */
export function ProveedorRoute({ children }) {
  const { user, loading, hasRole } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-700">Cargando...</span>
      </div>
    );
  }
  
  // Permitir acceso a proveedores, administradores y superadmin
  if (!user || !(hasRole('proveedor') || hasRole('administrador') || hasRole('superadmin'))) {
    return <Navigate to="/acceso-denegado" />;
  }
  
  return children;
}
