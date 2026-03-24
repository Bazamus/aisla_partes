import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';

/**
 * Componente para proteger elementos de la interfaz de usuario según permisos específicos
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string|string[]} props.requiredPermission - Permiso o lista de permisos requeridos
 * @param {string|string[]} props.requiredRole - Rol o lista de roles requeridos
 * @param {React.ReactNode} props.children - Elementos a mostrar si el usuario tiene los permisos
 * @param {React.ReactNode} props.fallback - Elemento a mostrar si el usuario no tiene los permisos (opcional)
 * @param {boolean} props.anyPermission - Si es true, el usuario necesita al menos uno de los permisos (por defecto: false, necesita todos)
 * @param {boolean} props.anyRole - Si es true, el usuario necesita al menos uno de los roles (por defecto: false, necesita todos)
 */
const PermissionGuard = ({
  requiredPermission,
  requiredRole,
  children,
  fallback = null,
  anyPermission = false,
  anyRole = false
}) => {
  const { hasPermission, hasRole } = useAuth();

  // Convertir a array si es un string
  const permissions = Array.isArray(requiredPermission) 
    ? requiredPermission 
    : requiredPermission ? [requiredPermission] : [];
  
  const roles = Array.isArray(requiredRole) 
    ? requiredRole 
    : requiredRole ? [requiredRole] : [];

  // Verificar permisos
  let hasRequiredPermissions = true;
  if (permissions.length > 0) {
    if (anyPermission) {
      // El usuario necesita al menos uno de los permisos
      hasRequiredPermissions = permissions.some(permission => hasPermission(permission));
    } else {
      // El usuario necesita todos los permisos
      hasRequiredPermissions = permissions.every(permission => hasPermission(permission));
    }
  }

  // Verificar roles
  let hasRequiredRoles = true;
  if (roles.length > 0) {
    if (anyRole) {
      // El usuario necesita al menos uno de los roles
      hasRequiredRoles = roles.some(role => hasRole(role));
    } else {
      // El usuario necesita todos los roles
      hasRequiredRoles = roles.every(role => hasRole(role));
    }
  }

  // Mostrar el contenido solo si el usuario tiene los permisos y roles requeridos
  if (hasRequiredPermissions && hasRequiredRoles) {
    return children;
  }

  // Si no tiene los permisos, mostrar el fallback o null
  return fallback;
};

export default PermissionGuard;
