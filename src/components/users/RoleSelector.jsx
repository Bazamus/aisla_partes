import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const RoleSelector = ({ userId, userRoles = [], availableRoles = [], onSave, onClose }) => {
  // Convertir los roles del usuario a IDs para facilitar la comprobación
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mapa de UUIDs conocidos a nombres legibles
  const roleNameMap = {
    // Roles conocidos por su UUID
    '6745763d-7dd8-4be8-b00c-78fc22e3627b': 'Administrador',
    '2bd8cf42-6cff-45fe-a254-7419713c8ae7': 'Supervisor',
    '91342db2-eef7-459e-baeb-97b6fbc3493f': 'Técnico',
    '8666a96a-626e-4e67-ab3e-04256e017379': 'Contabilidad',
    'd445190d-9220-4799-898f-9027b61f1a12': 'Ventas',
    '9dc5b751-2ea2-40a7-8147-b5ee54a10372': 'Recursos Humanos',
    'c678b6d0-63e3-4f5b-a1a1-7e497a175805': 'Gerencia',
    // Nuevos UUIDs detectados
    'f722bc1a-4dc1-4022-b93f-7c463f2895d9': 'Empleado',
    '587bef20-5e13-4123-b944-f21988bc5001': 'Proveedor'
  };

  // Inicializar los roles seleccionados al montar el componente
  useEffect(() => {
    try {
      if (userRoles && Array.isArray(userRoles)) { // Asegurarse de que es un array
        const currentRoleIds = userRoles
          .map(role => role && role.id) // Acceder a role.id de forma segura
          .filter(Boolean); // Filtrar nulls/undefineds que resulten de role sin id o role null
        setSelectedRoleIds(currentRoleIds);
      } else {
        setSelectedRoleIds([]);
      }
    } catch (err) {
      console.error('Error procesando roles de usuario:', err);
      setSelectedRoleIds([]);
    }
  }, [userRoles]);

  // Manejar cambios en la selección de roles (checkbox)
  const handleRoleToggle = (roleId) => {
    setSelectedRoleIds(prevSelected => {
      if (prevSelected.includes(roleId)) {
        return prevSelected.filter(id => id !== roleId);
      } else {
        return [...prevSelected, roleId];
      }
    });
  };

  // Función para guardar los cambios
  const handleSave = async () => {
    if (!onSave) return;
    
    setIsProcessing(true);
    setError('');
    
    try {
      await onSave(selectedRoleIds);
      setSuccess('Roles actualizados correctamente');
      
      // Cerrar automáticamente después de un breve retraso
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error guardando roles:', err);
      setError(`Error al guardar los roles: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Obtener el nombre para mostrar en la UI
  const getDisplayName = (user) => {
    if (!userId) return 'Usuario';
    
    // Intenta acortar el ID para hacerlo más legible
    const shortId = userId.substring(0, 8) + '...';
    return shortId;
  };

  return (
    // Fondo modal semi-transparente que ocupa toda la pantalla
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
                  Gestión de Roles - {getDisplayName()}
                </h3>
                <button 
                  onClick={onClose}
                  disabled={isProcessing}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none">
                  <span className="sr-only">Cerrar</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-4">
                  Selecciona los roles que deseas asignar a este usuario:
                </p>
                
                {error && (
                  <div className="rounded-md bg-red-50 p-4 mb-4">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {success && (
                  <div className="rounded-md bg-green-50 p-4 mb-4">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">{success}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                  {availableRoles.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay roles disponibles.</p>
                  ) : (
                    availableRoles.map((role) => {
                      // Obtener el ID y nombre del rol de forma segura
                      const roleId = role.id; // Asumimos que availableRoles siempre tiene 'id'
                      // Usar directamente role.nombre que viene de getRoles() y es el nombre de la BD
                      const roleName = role.nombre || `Rol ${roleId.substring(0, 8)}...`; // Fallback si nombre no existe
                      
                      return (
                        <div key={roleId} className="flex items-center">
                          <input
                            id={`role-${roleId}`}
                            name={`role-${roleId}`}
                            type="checkbox"
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            checked={selectedRoleIds.includes(roleId)}
                            onChange={() => handleRoleToggle(roleId)}
                            disabled={isProcessing}
                          />
                          <label htmlFor={`role-${roleId}`} className="ml-3 block text-sm font-medium text-gray-700">
                            {roleName}
                          </label>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm ${
                isProcessing ? 'opacity-75 cursor-not-allowed' : ''
              }`}
              onClick={handleSave}
              disabled={isProcessing || !!success}
            >
              {isProcessing ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;
