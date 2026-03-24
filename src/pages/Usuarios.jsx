import React, { useState, useEffect } from 'react';
// Importar servicios necesarios
import { 
  getUsersWithDetails, 
  getRoles, 
  createUser, 
  updateUserRoles, 
  resetUserPassword,
  deleteUser
} from '../services/userService';

// Importar componentes 
import UserTable from '../components/users/UserTable';
import CreateUserForm from '../components/users/CreateUserForm';
import { PermissionGuard } from '../components/auth';
import toast from 'react-hot-toast';

function Usuarios({ initialTab = 'activos' }) {
  // Estado para la pestaña activa
  const [activeTab, setActiveTab] = useState(initialTab);

  // Estados para almacenar datos
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados para la búsqueda y filtrado de usuarios activos
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  // Función para cargar los usuarios activos
  const loadActiveUsers = async () => {
    try {
      console.log("Iniciando carga de usuarios activos...");
      const activeUsers = await getUsersWithDetails();
      console.log("Usuarios activos cargados:", activeUsers.length);
      setUsers(activeUsers);
      return activeUsers;
    } catch (err) {
      console.error("Error cargando usuarios activos:", err);
      toast.error("Error al cargar usuarios activos");
      return [];
    }
  };

  // Función para cargar los roles disponibles
  const loadRoles = async () => {
    try {
      console.log("Iniciando carga de roles...");
      const availableRoles = await getRoles();
      console.log("Roles cargados:", availableRoles.length);
      setRoles(availableRoles);
      return availableRoles;
    } catch (err) {
      console.error("Error cargando roles:", err);
      toast.error("Error al cargar roles");
      return [];
    }
  };

  // useEffect para cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      console.log("Iniciando carga de datos para la página Usuarios...");
      setLoading(true);
      setError(null);
      try {
        // Cargamos todos los datos necesarios
        await Promise.all([loadActiveUsers(), loadRoles()]);
        console.log("Carga de datos inicial completa.");
      } catch (err) {
        // Los errores específicos ya se manejan en las funciones de carga
        setError('Ocurrió un error durante la carga de datos.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // useEffect para filtrar usuarios activos
  useEffect(() => {
    let result = users;

    // 1. Filtrar por término de búsqueda (nombre o email)
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      result = result.filter(user =>
        (user.nombre_completo && user.nombre_completo.toLowerCase().includes(lowercasedTerm)) ||
        (user.email && user.email.toLowerCase().includes(lowercasedTerm))
      );
    }

    // 2. Filtrar por rol
    if (selectedRole) {
      result = result.filter(user => 
        user.roles && user.roles.some(role => role.id === selectedRole)
      );
    }

    setFilteredUsers(result);
  }, [searchTerm, selectedRole, users]);

  // MANEJADORES DE ACCIONES
  
  // 1. Crear nuevo usuario directo
  const handleCreateNewUser = async (formData) => {
    // Esta función será modificada para usar la Edge Function
    try {
      setLoading(true);
      // La nueva función createUser se conectará a la Edge Function
      const newUser = await createUser(formData); 
      toast.success(`Usuario ${newUser.email} creado con éxito.`);
      
      // Recargar la lista de usuarios activos para mostrar el nuevo
      await loadActiveUsers();
      
      // Opcional: cambiar a la pestaña de activos después de crear
      setActiveTab('activos');

    } catch (error) {
      console.error('Error al crear nuevo usuario:', error);
      toast.error(error.message || 'Error al crear el usuario.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Asignar roles a usuario
  const handleAssignRoles = async (userId, selectedRoles) => {
    try {
      setLoading(true);
      await updateUserRoles(userId, selectedRoles);
      toast.success('Roles actualizados correctamente.');
      
      // Recargar la lista para reflejar los cambios
      await loadActiveUsers();

    } catch (error) {
      console.error('Error al asignar roles:', error);
      toast.error(error.message || 'Error al actualizar los roles.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Resetear contraseña
  const handleResetPassword = async (userId, newPassword) => {
    try {
      setLoading(true);
      await resetUserPassword(userId, newPassword);
      toast.success('Contraseña actualizada.');
    } catch (error) {
      console.error('Error al resetear la contraseña:', error);
      toast.error('Error al resetear la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Eliminar usuario
  const handleDeleteUser = async (userId) => {
    try {
      setLoading(true);
      const result = await deleteUser(userId);
      toast.success(result.message || 'Usuario eliminado con éxito.');
      // Recargar la lista de usuarios para reflejar la eliminación
      await loadActiveUsers();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      toast.error(error.message || 'Error al eliminar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Gestión de Usuarios</h1>

      {/* Navegación de Pestañas */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 md:space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('activos')}
              className={`${ 
                activeTab === 'activos'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-3 md:py-4 px-1 border-b-2 font-medium text-sm md:text-base flex-1 md:flex-none`}
            >
              Usuarios Activos
            </button>
            
            <PermissionGuard requiredPermission="crear_usuario">
              <button
                onClick={() => setActiveTab('crear')}
                className={`${ 
                  activeTab === 'crear'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-3 md:py-4 px-1 border-b-2 font-medium text-sm md:text-base flex-1 md:flex-none`}
              >
                Crear Nuevo Usuario
              </button>
            </PermissionGuard>

          </nav>
        </div>
      </div>

      {/* Contenido de las Pestañas */}
      {activeTab === 'activos' && (
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 space-y-4 md:space-y-0">
            <h2 className="text-xl font-medium text-gray-800">Usuarios Activos</h2>
            {/* Controles de Filtro y Búsqueda */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="">Todos los roles</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <UserTable 
            users={filteredUsers} 
            roles={roles}
            onAssignRoles={handleAssignRoles} 
            onResetPassword={handleResetPassword}
            onDeleteUser={handleDeleteUser}
            isLoading={loading} 
          />
        </div>
      )}

      {activeTab === 'crear' && (
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h2 className="text-xl font-medium mb-4 text-gray-800">Crear Nuevo Usuario</h2>
          <CreateUserForm 
            onSubmit={handleCreateNewUser}
            roles={roles}
            isLoading={loading}
          />
        </div>
      )}
    </div>
  );
}

export default Usuarios;
