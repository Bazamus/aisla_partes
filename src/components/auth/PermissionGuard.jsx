import { useAuth } from '../../contexts/AuthContext';

/**
 * Componente que renderiza sus hijos solo si el usuario tiene el permiso requerido
 * @param {Object} props - Propiedades del componente
 * @param {string} props.requiredPermission - Código del permiso requerido
 * @param {React.ReactNode} props.children - Elementos a renderizar si tiene permiso
 * @param {React.ReactNode} props.fallback - Elemento a mostrar si no tiene permiso (opcional)
 */
export function PermissionGuard({ requiredPermission, children, fallback = null }) {
  const { hasPermission } = useAuth();
  
  if (!requiredPermission) {
    console.warn('PermissionGuard: No se especificó un permiso requerido');
    return children;
  }
  
  return hasPermission(requiredPermission) ? children : fallback;
}

/**
 * Componente que renderiza sus hijos solo si el usuario tiene el rol requerido
 * @param {Object} props - Propiedades del componente
 * @param {string} props.requiredRole - Nombre del rol requerido
 * @param {React.ReactNode} props.children - Elementos a renderizar si tiene el rol
 * @param {React.ReactNode} props.fallback - Elemento a mostrar si no tiene el rol (opcional)
 */
export function RoleGuard({ requiredRole, children, fallback = null }) {
  const { hasRole } = useAuth();
  
  if (!requiredRole) {
    console.warn('RoleGuard: No se especificó un rol requerido');
    return children;
  }
  
  return hasRole(requiredRole) ? children : fallback;
}

/**
 * Componente que renderiza sus hijos solo si el usuario es administrador
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Elementos a renderizar si es administrador
 * @param {React.ReactNode} props.fallback - Elemento a mostrar si no es administrador (opcional)
 */
export function AdminGuard({ children, fallback = null }) {
  const { isAdmin } = useAuth();
  
  return isAdmin() ? children : fallback;
}

/**
 * Componente que renderiza sus hijos solo si el usuario es supervisor
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Elementos a renderizar si es supervisor
 * @param {React.ReactNode} props.fallback - Elemento a mostrar si no es supervisor (opcional)
 */
export function SupervisorGuard({ children, fallback = null }) {
  const { isSupervisor, isAdmin } = useAuth();
  
  // Los administradores también pueden ver lo que ven los supervisores
  return (isSupervisor() || isAdmin()) ? children : fallback;
}
