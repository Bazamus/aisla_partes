import React, { useState } from 'react';
import { UserPlusIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import CreateUserModal from './CreateUserModal';

const PendingUserTable = ({ 
  pendingUsers = [], 
  onCreateUser, 
  onDelete, 
  onApprove, 
  onReject, 
  roles = [], 
  isLoading = false 
}) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Manejador para abrir el modal de creación de usuario
  const handleCreateUser = (user) => {
    setSelectedUser(user);
    setShowCreateModal(true);
  };

  // Manejador para cerrar el modal
  const handleModalClose = () => {
    setShowCreateModal(false);
    setSelectedUser(null);
  };

  // Manejador para guardar la creación de usuario
  const handleUserCreate = (password, roleId) => {
    if (onCreateUser && selectedUser) {
      onCreateUser(selectedUser, password, roleId);
    }
    handleModalClose();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="flex justify-center items-center">
          <svg className="animate-spin h-5 w-5 text-blue-500 mr-3" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Cargando usuarios pendientes...
        </div>
      </div>
    );
  }

  if (!pendingUsers.length) {
    return (
      <div className="py-8 text-center bg-gray-50 rounded-lg border border-gray-200">
        <CheckCircleIcon className="h-12 w-12 mx-auto text-green-500 mb-2" />
        <p className="text-gray-600">No hay empleados o proveedores pendientes de creación de cuenta</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg shadow-md bg-white">
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
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {pendingUsers.map((user) => (
            <tr key={`${user.tipo}-${user.id}`} className="hover:bg-gray-50 transition-colors duration-150">
              <td className="px-6 py-4 text-sm text-gray-900">
                {user.email}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 truncate">
                {user.nombre}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {user.tipo.charAt(0).toUpperCase() + user.tipo.slice(1)}
              </td>
              <td className="px-6 py-4 text-sm font-medium">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleCreateUser(user)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <UserPlusIcon className="h-4 w-4 mr-1" />
                    Crear cuenta
                  </button>
                  
                  {onApprove && (
                    <button
                      onClick={() => onApprove(user.id)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Aprobar
                    </button>
                  )}
                  
                  {onReject && (
                    <button
                      onClick={() => onReject(user.id)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Rechazar
                    </button>
                  )}
                  
                  {onDelete && (
                    <button
                      onClick={() => onDelete(user.id, user.tipo)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Eliminar
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal para crear usuario */}
      {showCreateModal && selectedUser && (
        <CreateUserModal
          pendingUser={selectedUser}
          availableRoles={roles}
          onSave={handleUserCreate}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default PendingUserTable;
