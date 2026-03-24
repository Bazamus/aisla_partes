import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import DesactivarModoEmergencia from '../components/DesactivarModoEmergencia';
import { PermissionGuard } from '../components/auth/PermissionGuard';

// Modo de emergencia - Usar datos simulados si hay problemas de permisos
const EMERGENCY_MODE = false;

// Datos simulados para modo de emergencia
const MOCK_ROLES = [
  { id: 1, nombre: 'superadmin', descripcion: 'Acceso completo al sistema' },
  { id: 2, nombre: 'admin', descripcion: 'Administrador con acceso limitado' },
  { id: 3, nombre: 'empleado', descripcion: 'Empleado con acceso a partes de trabajo' },
  { id: 4, nombre: 'proveedor', descripcion: 'Proveedor con acceso a sus partes' }
];

const MOCK_PERMISOS = [
  { id: 1, nombre: 'partes:leer', descripcion: 'Ver partes de trabajo', tipo: 'partes' },
  { id: 2, nombre: 'partes:crear', descripcion: 'Crear partes de trabajo', tipo: 'partes' },
  { id: 3, nombre: 'partes:editar', descripcion: 'Editar partes de trabajo', tipo: 'partes' },
  { id: 4, nombre: 'partes:eliminar', descripcion: 'Eliminar partes de trabajo', tipo: 'partes' },
  { id: 5, nombre: 'empleados:leer', descripcion: 'Ver empleados', tipo: 'empleados' },
  { id: 6, nombre: 'empleados:crear', descripcion: 'Crear empleados', tipo: 'empleados' },
  { id: 7, nombre: 'empleados:editar', descripcion: 'Editar empleados', tipo: 'empleados' },
  { id: 8, nombre: 'empleados:eliminar', descripcion: 'Eliminar empleados', tipo: 'empleados' },
  { id: 9, nombre: 'obras:leer', descripcion: 'Ver obras', tipo: 'obras' },
  { id: 10, nombre: 'obras:crear', descripcion: 'Crear obras', tipo: 'obras' },
  { id: 11, nombre: 'obras:editar', descripcion: 'Editar obras', tipo: 'obras' },
  { id: 12, nombre: 'obras:eliminar', descripcion: 'Eliminar obras', tipo: 'obras' },
  { id: 13, nombre: 'proveedores:leer', descripcion: 'Ver proveedores', tipo: 'proveedores' },
  { id: 14, nombre: 'proveedores:crear', descripcion: 'Crear proveedores', tipo: 'proveedores' },
  { id: 15, nombre: 'proveedores:editar', descripcion: 'Editar proveedores', tipo: 'proveedores' },
  { id: 16, nombre: 'proveedores:eliminar', descripcion: 'Eliminar proveedores', tipo: 'proveedores' },
  { id: 17, nombre: 'roles:administrar', descripcion: 'Administrar roles y permisos', tipo: 'sistema' },
  { id: 18, nombre: 'usuarios:ver', descripcion: 'Ver usuarios pendientes', tipo: 'sistema' }
];

const MOCK_ROLE_PERMISOS = {
  1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18], // superadmin tiene todos los permisos
  2: [1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15, 17, 18], // admin
  3: [1, 2, 3, 9], // empleado
  4: [1, 2] // proveedor
};

export default function GestionRoles() {
  return (
    <div className="container mx-auto px-4 py-8 bg-gray-100">
      <PermissionGuard
        requiredPermission="roles:administrar"
        fallback={
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  No tienes permiso para administrar roles y permisos. Esta sección está reservada para administradores del sistema.
                </p>
              </div>
            </div>
          </div>
        }
      >
        <GestionRolesContent />
        <DesactivarModoEmergencia />
      </PermissionGuard>
    </div>
  );
}

function GestionRolesContent() {
  const { user } = useAuth();
  
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermisos, setRolePermisos] = useState([]);
  const [loading, setLoading] = useState({
    roles: false,
    permisos: false,
    rolePermisos: false,
    asignarPermiso: false,
    eliminarPermiso: false
  });

  // Cargar roles y permisos al montar el componente
  useEffect(() => {
    loadRoles();
    loadPermisos();
  }, []);

  // Cargar los permisos del rol seleccionado
  useEffect(() => {
    if (selectedRole) {
      loadRolePermisos(selectedRole.id);
    } else {
      setRolePermisos([]);
    }
  }, [selectedRole]);

  // Función para cargar roles
  const loadRoles = async () => {
    try {
      setLoading(prev => ({ ...prev, roles: true }));
      
      // En modo de emergencia, usar datos simulados
      if (EMERGENCY_MODE) {
        setRoles(MOCK_ROLES);
        setLoading(prev => ({ ...prev, roles: false }));
        return;
      }
      
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('nombre');
        
      if (error) throw error;
      
      // Eliminar duplicados basados en el nombre del rol (ignorando mayúsculas/minúsculas)
      const uniqueRoles = [];
      const roleNames = new Set();
      
      // Primera pasada: mantener solo los roles con nombres únicos (ignorando case)
      data.forEach(role => {
        const lowerCaseName = role.nombre.toLowerCase();
        if (!roleNames.has(lowerCaseName)) {
          roleNames.add(lowerCaseName);
          uniqueRoles.push(role);
        }
      });
      
      // Ordenar roles por nombre
      uniqueRoles.sort((a, b) => a.nombre.localeCompare(b.nombre));
      
      console.log('Roles únicos cargados:', uniqueRoles);
      setRoles(uniqueRoles || []);
    } catch (error) {
      console.error('Error al cargar roles:', error);
      toast.error('Error al cargar roles');
      
      // En caso de error, usar datos simulados
      if (EMERGENCY_MODE) {
        setRoles(MOCK_ROLES);
      }
    } finally {
      setLoading(prev => ({ ...prev, roles: false }));
    }
  };

  // Función para cargar permisos
  const loadPermisos = async () => {
    try {
      setLoading(prev => ({ ...prev, permisos: true }));
      
      const { data, error } = await supabase
        .from('permisos')
        .select('*')
        .order('nombre');
        
      if (error) {
        console.error('Error al cargar permisos:', error);
        toast.error('Error al cargar permisos');
        
        // En caso de error, usar datos simulados
        setPermisos(MOCK_PERMISOS);
        return;
      }
      
      console.log('Datos de permisos obtenidos en GestionRoles:', JSON.stringify(data, null, 2));
      
      // Transformar los datos al formato esperado
      const formattedPermisos = data?.map(p => {
        console.log('Permiso individual en GestionRoles:', JSON.stringify(p, null, 2));
        return {
          id: p.id,
          nombre: p.nombre || `permiso-${p.id}`,
          descripcion: p.descripcion || '',
          tipo: p.tipo || 'general'
        };
      }) || [];
      
      console.log('Permisos procesados en GestionRoles:', formattedPermisos);
      
      setPermisos(formattedPermisos);
    } catch (error) {
      console.error('Error al cargar permisos:', error);
      toast.error('Error al cargar permisos');
      
      // En caso de error, usar datos simulados
      setPermisos(MOCK_PERMISOS);
    } finally {
      setLoading(prev => ({ ...prev, permisos: false }));
    }
  };

  // Función para cargar permisos de un rol específico
  const loadRolePermisos = async (roleId) => {
    if (!roleId) return;
    
    try {
      setLoading(prev => ({ ...prev, rolePermisos: true }));
      
      const { data, error } = await supabase
        .from('roles_permisos')
        .select(`
          permiso_id, 
          permisos!inner(
            id, 
            nombre, 
            descripcion,
            tipo
          )
        `)
        .eq('rol_id', roleId);
      
      if (error) {
        console.error('Error al cargar permisos del rol:', error);
        toast.error('Error al cargar permisos del rol');
        
        // En caso de error, usar datos simulados
        const mockRolePermisos = MOCK_ROLE_PERMISOS[roleId] || [];
        const permisosDelRol = MOCK_PERMISOS.filter(permiso => 
          mockRolePermisos.includes(permiso.id)
        );
        
        setRolePermisos(permisosDelRol);
        return;
      }
      
      console.log('Permisos del rol obtenidos:', data);
      
      // Transformar los datos al formato esperado
      const formattedPermisos = data
        ?.filter(p => p.permisos)
        .map(p => {
          console.log('Permiso individual en GestionRoles:', p.permisos);
          return {
            id: p.permisos.id,
            nombre: p.permisos.nombre || `permiso-${p.permiso_id}`,
            descripcion: p.permisos.descripcion || '',
            tipo: p.permisos.tipo || 'general'
          };
        }) || [];
      
      setRolePermisos(formattedPermisos);
    } catch (error) {
      console.error('Error al cargar permisos del rol:', error);
      toast.error('Error al cargar permisos del rol');
      
      // En caso de error, usar datos simulados
      const mockRolePermisos = MOCK_ROLE_PERMISOS[roleId] || [];
      const permisosDelRol = MOCK_PERMISOS.filter(permiso => 
        mockRolePermisos.includes(permiso.id)
      );
      
      setRolePermisos(permisosDelRol);
    } finally {
      setLoading(prev => ({ ...prev, rolePermisos: false }));
    }
  };

  // Función para asignar un permiso a un rol
  const handleAssignPermission = async (roleId, permissionId) => {
    setLoading(prev => ({ ...prev, asignarPermiso: true }));
    try {
      // Verificar si ya existe la asignación
      const { data: existingAssignment, error: checkError } = await supabase
        .from('roles_permisos')
        .select('*')
        .eq('rol_id', roleId)
        .eq('permiso_id', permissionId);
      
      if (checkError) {
        console.error('Error al verificar asignación existente:', checkError);
        toast.error(`Error al verificar asignación: ${checkError.message}`);
        return;
      }
      
      if (existingAssignment && existingAssignment.length > 0) {
        toast('El permiso ya está asignado a este rol');
        return;
      }
      
      // Insertar la nueva asignación
      const { error } = await supabase
        .from('roles_permisos')
        .insert({
          rol_id: roleId,
          permiso_id: permissionId
        });
      
      if (error) {
        console.error('Error al asignar permiso:', error);
        
        // Verificar si es un error de permisos o de restricción única
        if (error.code === '42501') { // Error de permisos en PostgreSQL
          toast.error('No tienes permisos suficientes para asignar permisos a roles');
        } else if (error.code === '23505') { // Error de duplicado
          toast('El permiso ya está asignado a este rol');
        } else {
          toast.error(`Error al asignar permiso: ${error.message}`);
        }
        return;
      }
      
      // Registrar acción en auditoría (de forma no bloqueante)
      supabase.from('auditoria').insert({
        accion: 'Asignación de permiso',
        detalles: JSON.stringify({
          permiso_id: permissionId,
          rol_id: roleId,
          timestamp: new Date().toISOString()
        }),
        tabla: 'roles_permisos',
        registro_id: roleId,
        user_id: user?.id
      }).then(({ error: auditError }) => {
        if (auditError) {
          console.error('Error al registrar acción:', auditError);
        }
      });
      
      toast.success('Permiso asignado correctamente');
      
      // Recargar permisos del rol
      await loadRolePermisos(roleId);
    } catch (error) {
      console.error('Error al asignar permiso:', error);
      toast.error('Error al asignar permiso');
    } finally {
      setLoading(prev => ({ ...prev, asignarPermiso: false }));
    }
  };

  // Función para eliminar un permiso de un rol
  const handleRemovePermission = async (roleId, permissionId) => {
    setLoading(prev => ({ ...prev, eliminarPermiso: true }));
    try {
      // Eliminar la asignación
      const { error } = await supabase
        .from('roles_permisos')
        .delete()
        .eq('rol_id', roleId)
        .eq('permiso_id', permissionId);
      
      if (error) {
        console.error('Error al eliminar permiso:', error);
        
        // Verificar si es un error de permisos
        if (error.code === '42501') { // Error de permisos en PostgreSQL
          toast.error('No tienes permisos suficientes para eliminar permisos de roles');
        } else {
          toast.error(`Error al eliminar permiso: ${error.message}`);
        }
        return;
      }
      
      // Registrar acción en auditoría (de forma no bloqueante)
      supabase.from('auditoria').insert({
        accion: 'Eliminación de permiso',
        detalles: JSON.stringify({
          permiso_id: permissionId,
          rol_id: roleId,
          timestamp: new Date().toISOString()
        }),
        tabla: 'roles_permisos',
        registro_id: roleId,
        user_id: user?.id
      }).then(({ error: auditError }) => {
        if (auditError) {
          console.error('Error al registrar acción:', auditError);
        }
      });
      
      toast.success('Permiso eliminado correctamente');
      
      // Recargar permisos del rol
      await loadRolePermisos(roleId);
    } catch (error) {
      console.error('Error al eliminar permiso:', error);
      toast.error('Error al eliminar permiso');
    } finally {
      setLoading(prev => ({ ...prev, eliminarPermiso: false }));
    }
  };

  // Agrupar permisos por categoría
  const permisosAgrupados = permisos.reduce((grupos, permiso) => {
    const tipo = permiso.tipo || 'general';
    if (!grupos[tipo]) {
      grupos[tipo] = [];
    }
    grupos[tipo].push(permiso);
    return grupos;
  }, {});

  // Verificar si un permiso está asignado al rol
  const hasPermission = (permissionId) => {
    return rolePermisos.some(p => p.id === permissionId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary-700">Gestión de Roles y Permisos</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Lista de roles */}
        <div className="md:col-span-1 bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-medium mb-4 text-primary-600">Roles</h2>
          {loading.roles ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <ul className="space-y-2">
              {roles.map(role => (
                <li key={role.id}>
                  <button
                    onClick={() => setSelectedRole(role)}
                    className={`w-full text-left px-3 py-2 rounded-md ${
                      selectedRole?.id === role.id
                        ? 'bg-primary-50 text-primary-700'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    {role.nombre}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Permisos del rol seleccionado */}
        <div className="md:col-span-3 bg-white p-4 rounded-lg shadow-md">
          {selectedRole ? (
            <>
              <h2 className="text-lg font-medium mb-2">Permisos para: {selectedRole.nombre}</h2>
              <p className="text-gray-600 mb-4">{selectedRole.descripcion}</p>
              
              {loading.rolePermisos || loading.permisos ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(permisosAgrupados).map(([categoria, permisosList]) => (
                    <div key={categoria} className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 p-3 font-medium border-b">
                        {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                      </div>
                      <div className="p-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {permisosList.map(permiso => (
                            <div key={permiso.id} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`permiso-${permiso.id}`}
                                checked={hasPermission(permiso.id)}
                                onChange={() => {
                                  if (hasPermission(permiso.id)) {
                                    handleRemovePermission(selectedRole.id, permiso.id);
                                  } else {
                                    handleAssignPermission(selectedRole.id, permiso.id);
                                  }
                                }}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`permiso-${permiso.id}`} className="ml-2 block text-sm text-gray-700">
                                {permiso.nombre}
                                <span className="text-xs text-gray-500 block">{permiso.descripcion}</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Selecciona un rol para ver y editar sus permisos
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
