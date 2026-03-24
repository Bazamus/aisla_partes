// Exportar componentes de rutas protegidas
export { default as AdminRoute } from './routes/AdminRoute';
export { default as UserRoute } from './routes/UserRoute';

// Exportar componentes de protección de UI
export { default as PermissionGuard } from './guards/PermissionGuard';

// Re-exportar componentes existentes
export { default as TwoFactorAuth } from './TwoFactorAuth';

// Re-exportar el contexto de autenticación para facilitar el acceso
export { useAuth, ProtectedRoute } from '../../contexts/AuthContext';
