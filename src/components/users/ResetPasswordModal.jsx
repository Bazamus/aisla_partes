import React, { useState, useEffect } from 'react';
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const ResetPasswordModal = ({ userId, userEmail, onSave, onClose }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Generar una contraseña sugerida basada en el email
  const suggestPassword = () => {
    if (userEmail) {
      const emailPart = userEmail.split('@')[0];
      const suggestedPassword = `${emailPart}123`;
      setPassword(suggestedPassword);
      setConfirmPassword(suggestedPassword);
      setError('');
    }
  };

  // Validación de contraseña 
  const validatePassword = () => {
    // Validar longitud mínima
    if (!password) {
      setError('La contraseña no puede estar vacía');
      return false;
    }
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    
    // Validar coincidencia
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    
    setError('');
    return true;
  };

  // Manejador para guardar la nueva contraseña
  const handleSave = async () => {
    if (validatePassword()) {
      setIsProcessing(true);
      try {
        await onSave(password);
        setSuccess('Contraseña actualizada correctamente');
        
        // Después de un breve retraso, cerrar el modal
        setTimeout(() => {
          onClose();
        }, 1500);
      } catch (err) {
        setError(`Error al cambiar la contraseña: ${err.message || 'Error desconocido'}`);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Alternar visibilidad de la contraseña
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Sugerencia automática al abrir el modal
  useEffect(() => {
    if (userEmail) {
      suggestPassword();
    }
  }, [userEmail]);

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
                  Cambiar Contraseña - {userEmail}
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
                  Ingresa una nueva contraseña para este usuario:
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
                
                {success && (
                  <div className="rounded-md bg-green-50 p-4 mb-4">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">
                          {success}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  {/* Campo de contraseña */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Nueva contraseña
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
                        className="absolute inset-y-0 right-0 px-3 flex items-center bg-transparent text-gray-500 hover:text-gray-700 transition-colors duration-200 focus:outline-none"
                        onClick={togglePasswordVisibility}
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      La contraseña debe tener al menos 6 caracteres
                    </p>
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

                  {/* Botón para sugerir contraseña */}
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
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm ${
                isProcessing ? 'opacity-75 cursor-not-allowed' : ''
              }`}
              onClick={handleSave}
              disabled={isProcessing || !!success}
            >
              {isProcessing ? 'Procesando...' : 'Cambiar contraseña'}
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

export default ResetPasswordModal;
