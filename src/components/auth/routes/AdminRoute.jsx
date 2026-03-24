import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

/**
 * Componente para proteger rutas que solo los administradores pueden acceder
 * Redirige a la página de acceso denegado si el usuario no es administrador
 */
const AdminRoute = ({ children }) => {
  const { user, loading, hasRole, isAdmin } = useAuth();

  // Mostrar indicador de carga mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirigir a login si no hay usuario autenticado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar si el usuario es administrador
  // Usamos isAdmin() o hasRole('admin') según lo que esté disponible
  const userIsAdmin = isAdmin ? isAdmin() : hasRole('admin');
  
  // También permitir acceso a superadmin
  const isSuperAdmin = hasRole('superadmin');

  // Redirigir a página de acceso denegado si no es admin ni superadmin
  if (!userIsAdmin && !isSuperAdmin) {
    return <Navigate to="/acceso-denegado" replace />;
  }

  // Si pasa todas las verificaciones, mostrar el contenido protegido
  return children;
};

export default AdminRoute;
