import React, { useState } from 'react';
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const CreateUserModal = ({ pendingUser, availableRoles = [], onSave, onClose }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Generar una contraseña sugerida basada en el email del usuario
  const suggestPassword = () => {
    if (pendingUser?.email) {
      // Tomar la parte antes del @ y añadir "123"
      const emailPart = pendingUser.email.split('@')[0];
      const suggestedPassword = `${emailPart}123`;
      setPassword(suggestedPassword);
      setConfirmPassword(suggestedPassword);
    }
  };

  // Validar el formulario antes de guardar
  const validateForm = () => {
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    if (!selectedRole) {
      setError('Debes seleccionar un rol para el usuario');
      return false;
    }
    setError('');
    return true;
  };

  // Manejar guardar
  const handleSave = () => {
    if (validateForm()) {
      console.log('Guardando usuario con rol:', selectedRole);
      // Pasar el rol seleccionado como array para asegurar compatibilidad
      onSave(password, selectedRole);
    }
  };

  // Alternar visibilidad de la contraseña
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Determinar el rol por defecto según el tipo de usuario
  React.useEffect(() => {
    if (pendingUser && availableRoles.length > 0) {
      // Si el usuario es un empleado, buscar un rol que contenga "empleado"
      // Si es un proveedor, buscar un rol que contenga "proveedor"
      // De lo contrario, usar el primer rol disponible
      const roleType = pendingUser.tipo;
      const matchingRole = availableRoles.find(role => 
        role.nombre && role.nombre.toLowerCase().includes(roleType)
      );
      
      if (matchingRole) {
        setSelectedRole(matchingRole.id);
        console.log('Rol coincidente establecido:', matchingRole.id);
      } else if (availableRoles[0]) {
        setSelectedRole(availableRoles[0].id);
        console.log('Primer rol disponible establecido:', availableRoles[0].id);
      }

      console.log('Valor actual de selectedRole en el useEffect:', selectedRole);

      // Sugerir contraseña al cargar
      suggestPassword();
    }
  }, [pendingUser, availableRoles]);

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay de fondo */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        {/* Centrar el modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Crear Usuario para {pendingUser?.nombre}
                </h3>
                <button 
                  onClick={onClose}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none">
                  <span className="sr-only">Cerrar</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-4">
                  Crea una cuenta de usuario para este {pendingUser?.tipo}:
                </p>
                
                {error && (
                  <div className="rounded-md bg-red-50 p-4 mb-4">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800">
                          {error}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  {/* Información del usuario */}
                  <div className="bg-gray-50 p-4 rounded-md">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Email</dt>
                        <dd className="mt-1 text-sm text-gray-900">{pendingUser?.email}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Tipo</dt>
                        <dd className="mt-1 text-sm text-gray-900 capitalize">{pendingUser?.tipo}</dd>
                      </div>
                    </dl>
                  </div>
                  
                  {/* Campo de contraseña */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Contraseña
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        id="password"
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 px-3 flex items-center"
                        onClick={togglePasswordVisibility}
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Campo de confirmación de contraseña */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirmar contraseña
                    </label>
                    <div className="mt-1">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="confirmPassword"
                        id="confirmPassword"
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {/* Selector de rol */}
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                      Rol inicial
                    </label>
                    {console.log('Valor actual de selectedRole en el render:', selectedRole)}
                    <select
                      id="role"
                      name="role"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      <option value="">Selecciona un rol</option>
                      {console.log('Roles disponibles en CreateUserModal:', availableRoles)}
                      {availableRoles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.nombre || role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Botón para generar contraseña */}
                  <div>
                    <button
                      type="button"
                      onClick={suggestPassword}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Sugerir contraseña
                    </button>
                    <span className="ml-2 text-xs text-gray-500">
                      (basada en el email: usuario123)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleSave}
            >
              Crear cuenta
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateUserModal;
