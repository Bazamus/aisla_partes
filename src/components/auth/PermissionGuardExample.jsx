import React from 'react';
import { PermissionGuard, RoleGuard, AdminGuard, SupervisorGuard } from './PermissionGuard';
import { Button } from '../ui/Button';

/**
 * Componente de ejemplo que muestra cómo implementar el PermissionGuard
 * en diferentes escenarios de la interfaz de usuario
 */
const PermissionGuardExample = () => {
  return (
    <div className="space-y-8 p-4">
      <h2 className="text-2xl font-bold mb-4">Ejemplos de Protección por Permisos</h2>
      
      {/* Ejemplo 1: Proteger un botón con un permiso específico */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Ejemplo 1: Botón protegido por permiso</h3>
        <p className="mb-4">Este botón solo es visible para usuarios con permiso para crear partes:</p>
        
        <PermissionGuard 
          requiredPermission="partes:crear"
          fallback={<span className="text-red-500">No tienes permiso para crear partes</span>}
        >
          <Button 
            variant="primary"
            onClick={() => alert('Creando nueva parte...')}
          >
            Crear Nueva Parte
          </Button>
        </PermissionGuard>
      </div>
      
      {/* Ejemplo 2: Proteger una sección completa por rol */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Ejemplo 2: Sección protegida por rol</h3>
        <p className="mb-4">Esta sección solo es visible para administradores:</p>
        
        <AdminGuard
          fallback={<div className="text-red-500 p-4 border border-red-300 rounded">
            Acceso restringido: Solo administradores pueden ver esta sección
          </div>}
        >
          <div className="bg-blue-50 p-4 border border-blue-200 rounded">
            <h4 className="font-medium text-blue-800">Panel de Administración</h4>
            <p className="text-blue-600">Aquí puedes gestionar todos los aspectos del sistema.</p>
            <div className="mt-4 space-x-2">
              <Button variant="secondary" size="sm">Gestionar Usuarios</Button>
              <Button variant="secondary" size="sm">Configurar Sistema</Button>
              <Button variant="secondary" size="sm">Ver Auditoría</Button>
            </div>
          </div>
        </AdminGuard>
      </div>
      
      {/* Ejemplo 3: Mostrar diferentes contenidos según el rol */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Ejemplo 3: Contenido condicional por rol</h3>
        <p className="mb-4">Muestra diferentes opciones según el rol del usuario:</p>
        
        <div className="flex flex-col space-y-4">
          <RoleGuard requiredRole="Administrador">
            <div className="bg-purple-50 p-3 border border-purple-200 rounded">
              <span className="text-purple-800 font-medium">Opciones de Administrador</span>
            </div>
          </RoleGuard>
          
          <RoleGuard requiredRole="Supervisor">
            <div className="bg-green-50 p-3 border border-green-200 rounded">
              <span className="text-green-800 font-medium">Opciones de Supervisor</span>
            </div>
          </RoleGuard>
          
          <RoleGuard requiredRole="Empleado">
            <div className="bg-yellow-50 p-3 border border-yellow-200 rounded">
              <span className="text-yellow-800 font-medium">Opciones de Empleado</span>
            </div>
          </RoleGuard>
        </div>
      </div>
      
      {/* Ejemplo 4: Proteger acciones específicas con permisos */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Ejemplo 4: Acciones protegidas por permisos</h3>
        <p className="mb-4">Tabla de partes con acciones protegidas por permisos específicos:</p>
        
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">ID</th>
              <th className="py-2 px-4 border-b">Descripción</th>
              <th className="py-2 px-4 border-b">Estado</th>
              <th className="py-2 px-4 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 px-4 border-b">001</td>
              <td className="py-2 px-4 border-b">Parte de prueba</td>
              <td className="py-2 px-4 border-b">Pendiente</td>
              <td className="py-2 px-4 border-b space-x-2">
                <PermissionGuard requiredPermission="partes:editar">
                  <Button variant="secondary" size="xs">Editar</Button>
                </PermissionGuard>
                
                <PermissionGuard requiredPermission="partes:eliminar">
                  <Button variant="danger" size="xs">Eliminar</Button>
                </PermissionGuard>
                
                <PermissionGuard requiredPermission="partes:aprobar">
                  <Button variant="success" size="xs">Aprobar</Button>
                </PermissionGuard>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PermissionGuardExample;
