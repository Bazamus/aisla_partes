import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

/**
 * Componente para proteger rutas que requieren autenticación básica
 * Redirige a la página de login si el usuario no está autenticado
 */
const UserRoute = ({ children }) => {
  const { user, loading } = useAuth();

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

  // Si el usuario está autenticado, mostrar el contenido protegido
  return children;
};

export default UserRoute;
