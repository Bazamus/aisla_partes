import React, { useState } from 'react';
import { PencilIcon, KeyIcon, CheckCircleIcon, XCircleIcon, ShieldCheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import RoleSelector from './RoleSelector';
import ResetPasswordModal from './ResetPasswordModal';
import { PermissionGuard } from '../auth';

const UserTable = ({ users = [], onAssignRoles, onResetPassword, onDeleteUser, roles = [], isLoading = false }) => {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Manejadores para las acciones de la tabla
  const handleEditRoles = (userId) => {
    // No permitir editar los roles del usuario admin@partes.com (superadmin)
    const user = users.find(u => u.id === userId);
    if (user && user.email === 'admin@partes.com') {
      alert('No se pueden modificar los roles del administrador principal');
      return;
    }
    
    setSelectedUserId(userId);
    setShowRoleSelector(true);
  };

  const handleResetPassword = (userId) => {
    // No permitir cambiar la contraseña del usuario admin@partes.com (superadmin)
    const user = users.find(u => u.id === userId);
    if (user && user.email === 'admin@partes.com') {
      alert('No se puede cambiar la contraseña del administrador principal');
      return;
    }
    
    setSelectedUserId(userId);
    setShowPasswordModal(true);
  };

  const handleRoleSelectorClose = () => {
    setShowRoleSelector(false);
    setSelectedUserId(null);
  };

  const handlePasswordModalClose = () => {
    setShowPasswordModal(false);
    setSelectedUserId(null);
  };

  const handleRoleSave = (selectedRoles) => {
    if (onAssignRoles && selectedUserId) {
      onAssignRoles(selectedUserId, selectedRoles);
    }
    handleRoleSelectorClose();
  };

  const handlePasswordSave = (newPassword) => {
    if (onResetPassword && selectedUserId) {
      onResetPassword(selectedUserId, newPassword);
    }
    handlePasswordModalClose();
  };

  // Función para obtener el nombre del usuario
  const getUserName = (user) => {
    // Primero intentamos usar el nombre del metadata si existe
    if (user.user_metadata?.nombre) return user.user_metadata.nombre;
    // Luego checamos si está vinculado a un empleado o proveedor
    if (user.empleado) return user.empleado.nombre;
    if (user.proveedor) return user.proveedor.nombre;
    // Si no hay nombre, usamos la parte del email antes del @
    return user.email.split('@')[0];
  };

  // Función para obtener el tipo de usuario
  const getUserType = (user) => {
    // Si es el superadmin, mostrar un tipo especial
    if (user.email === 'admin@partes.com') {
      return 'Super Administrador';
    }
    
    // Primero intentamos usar el tipo del metadata si existe
    if (user.user_metadata?.tipo) {
      const tipo = user.user_metadata.tipo;
      return tipo.charAt(0).toUpperCase() + tipo.slice(1);
    }
    
    if (user.empleado) return 'Empleado';
    if (user.proveedor) return 'Proveedor';
    return 'Usuario directo';
  };

  // Función para formatear la lista de roles
  const formatRoles = (userRoles = []) => {
    // Garantizar que userRoles sea un array válido
    if (!userRoles) return 'Sin roles';
    
    // Si es un string (posiblemente un array en formato JSON), intentar parsearlo
    if (typeof userRoles === 'string') {
      try {
        userRoles = JSON.parse(userRoles);
      } catch {
        return userRoles; // Si no se puede parsear, mostrar el string original
      }
    }
    
    // Si no es un array después de los intentos anteriores, convertirlo a uno
    if (!Array.isArray(userRoles)) {
      userRoles = [userRoles].filter(Boolean); // Filtrar valores nulos/undefined
    }
    
    // Si después de todo no hay roles, devolver mensaje indicándolo
    if (!userRoles.length) return 'Sin roles';
    
    // Mapa de UUIDs conocidos a nombres legibles
    const roleNameMap = {
      // Roles conocidos por su UUID
      '6745763d-7dd8-4be8-b00c-78fc22e3627b': 'Proveedor',
      '2bd8cf42-6cff-45fe-a254-7419713c8ae7': 'Administrador',
      '91342db2-eef7-459e-baeb-97b6fbc3493f': 'Supervisor',
      '8666a96a-626e-4e67-ab3e-04256e017379': 'Empleado',
      'd445190d-9220-4799-898f-9027b61f1a12': 'Proveedor',
      'a7aad644-c408-4b27-a338-bf048887b731': 'SuperAdmin',
      'f722bc1a-4dc1-4022-b93f-7c463f2895d9': 'Empleado',
      '587bef20-5e13-4123-b944-f21988bc5001': 'Administrador'
    };
    
    try {
      // Intentar determinar la estructura de los datos de roles
      const roleValues = userRoles.map(role => {
        // Si el rol es null o undefined, omitirlo
        if (role == null) return null;
        
        // Si el rol es un string simple (posiblemente UUID o nombre directo)
        if (typeof role === 'string') {
          // Ver si es un UUID conocido
          if (roleNameMap[role]) return roleNameMap[role];
          
          // Si parece un UUID pero no está en nuestro mapa, abreviarlo
          if (role.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            return `Rol ${role.substring(0, 8)}...`;
          }
          
          // Si es un string normal, usarlo directamente
          return role;
        }
        
        // Si el rol es un objeto, intentar extraer información útil
        if (typeof role === 'object') {
          // Si tiene nombre, nombre_rol o nombre directamente
          if (role.nombre) return role.nombre;
          if (role.nombre_rol) return role.nombre_rol;
          if (role.name) return role.name;
          
          // Si tiene role como propiedad (estructura user_roles)
          if (role.role) {
            const roleId = role.role;
            if (roleNameMap[roleId]) return roleNameMap[roleId];
            if (typeof roleId === 'string' && roleId.length > 8) {
              return `Rol ${roleId.substring(0, 8)}...`;
            }
            return `Rol ${roleId}`;
          }
          
          // Si tiene rol_id como propiedad (estructura usuarios_roles)
          if (role.rol_id) {
            const roleId = role.rol_id;
            if (roleNameMap[roleId]) return roleNameMap[roleId];
            if (typeof roleId === 'string' && roleId.length > 8) {
              return `Rol ${roleId.substring(0, 8)}...`;
            }
            return `Rol ${roleId}`;
          }
          
          // Si tiene id como propiedad
          if (role.id) {
            const roleId = role.id;
            if (roleNameMap[roleId]) return roleNameMap[roleId];
            if (typeof roleId === 'string' && roleId.length > 8) {
              return `Rol ${roleId.substring(0, 8)}...`;
            }
            return `Rol ${roleId}`;
          }
          
          // Si no se puede determinar, intentar una representación en string
          try {
            return JSON.stringify(role);
          } catch {
            return 'Rol desconocido';
          }
        }
        
        // Para cualquier otro tipo de valor, convertir a string
        return String(role);
      }).filter(Boolean); // Filtrar valores nulos
      
      // Eliminar duplicados y unir con comas
      return [...new Set(roleValues)].join(', ') || 'Sin roles';
    } catch (error) {
      console.error("Error formateando roles:", error);
      return "Sin información de roles";
    }
  };

  // Función para verificar si un usuario es el superadmin
  const isSuperAdmin = (user) => {
    return user.email === 'admin@partes.com';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="flex justify-center items-center">
          <svg className="animate-spin h-5 w-5 text-blue-500 mr-3" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Cargando usuarios...
        </div>
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500">No hay usuarios registrados</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg shadow-md bg-white">
      {/* Vista de tabla para desktop */}
      <div className="hidden md:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Roles
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 text-sm text-gray-900">
                  {user.email}
                  {/* Indicador de email confirmado */}
                  {user.email_confirmed ? (
                    <CheckCircleIcon className="inline-block h-5 w-5 ml-1 text-green-500" title="Email confirmado" />
                  ) : (
                    <XCircleIcon className="inline-block h-5 w-5 ml-1 text-red-500" title="Email no confirmado" />
                  )}
                  {/* Indicador de superadmin */}
                  {isSuperAdmin(user) && (
                    <ShieldCheckIcon className="inline-block h-5 w-5 ml-1 text-blue-500" title="Super Administrador" />
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 truncate">
                  {getUserName(user)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {getUserType(user)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {isSuperAdmin(user) ? (
                    <span className="font-medium text-indigo-700">Super Administrador</span>
                  ) : (
                    formatRoles(user.roles)
                  )}
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  <div className="flex space-x-2">
                    <PermissionGuard 
                      requiredPermission="usuarios:editar_roles"
                      fallback={null}
                    >
                      <button
                        onClick={() => handleEditRoles(user.id)}
                        className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          isSuperAdmin(user) 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                        }`}
                        title={isSuperAdmin(user) ? "No se pueden modificar los roles del administrador principal" : "Editar roles"}
                        disabled={isSuperAdmin(user)}
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Roles
                      </button>
                    </PermissionGuard>
                    
                    <PermissionGuard 
                      requiredPermission="usuarios:resetear_password"
                      fallback={null}
                    >
                      <button
                        onClick={() => handleResetPassword(user.id)}
                        className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          isSuperAdmin(user) 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                        }`}
                        title={isSuperAdmin(user) ? "No se puede cambiar la contraseña del administrador principal" : "Cambiar contraseña"}
                        disabled={isSuperAdmin(user)}
                      >
                        <KeyIcon className="h-4 w-4 mr-1" />
                        Contraseña
                      </button>
                    </PermissionGuard>

                    <PermissionGuard 
                      requiredPermission="usuarios:eliminar"
                      fallback={null}
                    >
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Estás seguro de que quieres eliminar al usuario ${getUserName(user)} (${user.email})? Esta acción no se puede deshacer.`)) {
                            onDeleteUser(user.id);
                          }
                        }}
                        className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          isSuperAdmin(user) 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                        }`}
                        title={isSuperAdmin(user) ? "No se puede eliminar al administrador principal" : "Eliminar usuario"}
                        disabled={isSuperAdmin(user)}
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Eliminar
                      </button>
                    </PermissionGuard>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista de tarjetas para móvil */}
      <div className="md:hidden">
        {/* Indicador de resultados para móvil */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            {users.length} {users.length === 1 ? 'usuario' : 'usuarios'} encontrado{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="space-y-4 p-4">
          {users.map(user => (
            <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              {/* Header con email y nombre */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 break-words leading-tight">
                  {getUserName(user)}
                </h3>
                <p className="text-sm text-gray-600 mt-1 break-words">{user.email}</p>
              </div>
              
              {/* Información del usuario */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Tipo:</span>
                  <span className="font-medium text-sm text-gray-900">{getUserType(user)}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-gray-500 text-sm">Roles:</span>
                  <span className="font-medium text-sm text-gray-900 text-right break-words">
                    {isSuperAdmin(user) ? (
                      <span className="text-indigo-700">Super Administrador</span>
                    ) : (
                      formatRoles(user.roles)
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Estado:</span>
                  <span className="font-medium text-sm">
                    {user.email_confirmed ? (
                      <span className="text-green-600 flex items-center">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Confirmado
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center">
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        Pendiente
                      </span>
                    )}
                  </span>
                </div>
                {isSuperAdmin(user) && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Nivel:</span>
                    <span className="text-blue-600 flex items-center">
                      <ShieldCheckIcon className="h-4 w-4 mr-1" />
                      Super Admin
                    </span>
                  </div>
                )}
              </div>
              
              {/* Botones de acción */}
              <div className="flex flex-col space-y-2 pt-3 border-t border-gray-100">
                <PermissionGuard 
                  requiredPermission="usuarios:editar_roles"
                  fallback={null}
                >
                  <button
                    onClick={() => handleEditRoles(user.id)}
                    className={`flex items-center justify-center px-3 py-2 rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      isSuperAdmin(user) 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                    }`}
                    disabled={isSuperAdmin(user)}
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Editar Roles
                  </button>
                </PermissionGuard>
                
                <PermissionGuard 
                  requiredPermission="usuarios:resetear_password"
                  fallback={null}
                >
                  <button
                    onClick={() => handleResetPassword(user.id)}
                    className={`flex items-center justify-center px-3 py-2 rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      isSuperAdmin(user) 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                    }`}
                    disabled={isSuperAdmin(user)}
                  >
                    <KeyIcon className="h-4 w-4 mr-1" />
                    Cambiar Contraseña
                  </button>
                </PermissionGuard>

                <PermissionGuard 
                  requiredPermission="usuarios:eliminar"
                  fallback={null}
                >
                  <button
                    onClick={() => {
                      if (window.confirm(`¿Estás seguro de que quieres eliminar al usuario ${getUserName(user)} (${user.email})? Esta acción no se puede deshacer.`)) {
                        onDeleteUser(user.id);
                      }
                    }}
                    className={`flex items-center justify-center px-3 py-2 rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      isSuperAdmin(user) 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                    }`}
                    disabled={isSuperAdmin(user)}
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Eliminar Usuario
                  </button>
                </PermissionGuard>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modales (renderizados condicionalmente) */}
      {showRoleSelector && selectedUserId && (
        <RoleSelector
          userId={selectedUserId}
          userRoles={users.find(u => u.id === selectedUserId)?.roles || []} 
          availableRoles={roles}
          onSave={handleRoleSave}
          onClose={handleRoleSelectorClose}
        />
      )}

      {showPasswordModal && selectedUserId && (
        <ResetPasswordModal
          userId={selectedUserId}
          userEmail={users.find(u => u.id === selectedUserId)?.email || ''}
          onSave={handlePasswordSave}
          onClose={handlePasswordModalClose}
        />
      )}
    </div>
  );
};

export default UserTable;
