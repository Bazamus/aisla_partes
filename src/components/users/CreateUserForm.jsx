import React, { useState, useEffect, useCallback } from 'react';
import { getEmpleadosSinUsuario, getProveedoresSinUsuario } from '../../services/userService';
import { EyeIcon, EyeSlashIcon, UserPlusIcon, BuildingOfficeIcon, TruckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Un hook simple para debounce (retrasar la ejecución de una función)
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

const CreateUserForm = ({ onSubmit, roles = [], isLoading = false }) => {
  const [userType, setUserType] = useState('nuevo'); // 'nuevo', 'empleado', 'proveedor'
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    roleIds: [], 
  });

  const [linkTo, setLinkTo] = useState(null); // Almacena el empleado/proveedor seleccionado
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Cargar resultados de búsqueda cuando el término debounced cambia
  useEffect(() => {
    if (debouncedSearchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    const fetchEntities = async () => {
      setLoadingSearch(true);
      try {
        let results = [];
        if (userType === 'empleado') {
          results = await getEmpleadosSinUsuario(debouncedSearchTerm);
        } else if (userType === 'proveedor') {
          results = await getProveedoresSinUsuario(debouncedSearchTerm);
        }
        // La base de datos ahora hace el filtrado, simplemente mostramos los resultados.
        setSearchResults(results || []);
      } catch (error) {
        toast.error(`Error buscando ${userType}s.`);
        setSearchResults([]); // Limpiar resultados en caso de error
      } finally {
        setLoadingSearch(false);
      }
    };

    fetchEntities();
  }, [debouncedSearchTerm, userType]);

  // Resetear el estado al cambiar de tipo de usuario
  const handleUserTypeChange = (type) => {
    setUserType(type);
    setSearchTerm('');
    setSearchResults([]);
    setLinkTo(null);
    setFormData(prev => ({ ...prev, email: '' }));
  };

  const handleSelectEntity = (entity) => {
    setLinkTo(entity);
    setSearchTerm(entity.nombre); // Poner el nombre en el input
    setSearchResults([]); // Ocultar la lista
    // Si la entidad tiene un email, lo autocompletamos
    // Siempre actualizamos el email del formulario con el de la entidad,
    // usando una cadena vacía si entity.email es null o undefined.
    const newEmail = entity.email || '';
    setFormData(prev => ({ ...prev, email: newEmail }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const newRoleIds = checked
        ? [...prev.roleIds, value]
        : prev.roleIds.filter(id => id !== value);
      return { ...prev, roleIds: newRoleIds };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (formData.roleIds.length === 0) {
      toast.error('Debe seleccionar al menos un rol.');
      return;
    }
    if ((userType === 'empleado' || userType === 'proveedor') && !linkTo) {
        toast.error(`Debe seleccionar un ${userType} para vincular.`);
        return;
    }

    const submissionData = {
      email: formData.email,
      password: formData.password,
      roleIds: formData.roleIds,
      linkToType: userType !== 'nuevo' ? userType : null,
      linkToId: linkTo ? linkTo.id : null,
    };
    
    onSubmit(submissionData);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Usuario a Crear</label>
        <div className="flex space-x-2 rounded-lg bg-gray-100 p-1">
          <button type="button" onClick={() => handleUserTypeChange('nuevo')} className={`w-full p-2 text-sm font-medium rounded-md transition-colors ${userType === 'nuevo' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>
            <UserPlusIcon className="h-5 w-5 inline mr-2"/>Usuario Nuevo
          </button>
          <button type="button" onClick={() => handleUserTypeChange('empleado')} className={`w-full p-2 text-sm font-medium rounded-md transition-colors ${userType === 'empleado' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>
            <BuildingOfficeIcon className="h-5 w-5 inline mr-2"/>Vincular Empleado
          </button>
          <button type="button" onClick={() => handleUserTypeChange('proveedor')} className={`w-full p-2 text-sm font-medium rounded-md transition-colors ${userType === 'proveedor' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>
            <TruckIcon className="h-5 w-5 inline mr-2"/>Vincular Proveedor
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {userType !== 'nuevo' && (
          <div className="relative">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Buscar {userType === 'empleado' ? 'Empleado' : 'Proveedor'}
            </label>
            <input
              id="search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Escribe para buscar un ${userType}...`}
              className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
            {loadingSearch && <p className="text-xs text-gray-500 mt-1">Buscando...</p>}
            {searchResults.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-auto shadow-lg">
                {searchResults.map(item => (
                  <li key={item.id} onClick={() => handleSelectEntity(item)} className="px-4 py-2 cursor-pointer hover:bg-indigo-50">
                    {item.nombre}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email" name="email" id="email" required
            placeholder="usuario@dominio.com"
            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            value={formData.email}
            onChange={handleInputChange}
            disabled={linkTo && typeof linkTo.email === 'string'} // Deshabilitar si se autocompleta
            ref={input => {
              if (input) {
              }
            }}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
          <div className="mt-1 relative">
            <input
              type={showPassword ? "text" : "password"} name="password" id="password" required minLength={6}
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md"
              value={formData.password}
              onChange={handleInputChange}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500">
              {showPassword ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirmar contraseña</label>
          <input
            type={showPassword ? "text" : "password"} name="confirmPassword" id="confirmPassword" required
            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            value={formData.confirmPassword}
            onChange={handleInputChange}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Roles</label>
          <div className="mt-2 space-y-2">
            {roles.map(role => (
              <div key={role.id} className="flex items-center">
                <input
                  id={`role-${role.id}`}
                  name="roles"
                  type="checkbox"
                  value={role.id}
                  checked={formData.roleIds.includes(role.id.toString())}
                  onChange={handleRoleChange}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor={`role-${role.id}`} className="ml-3 block text-sm text-gray-900">
                  {role.nombre}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Creando...' : 'Crear Usuario'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateUserForm;