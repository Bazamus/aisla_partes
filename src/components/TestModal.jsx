import React from 'react';
import { useModal } from '../contexts/ModalContext';

const TestModal = ({ isOpen, onClose, title = "Modal de Prueba", children }) => {
  const { openModal, closeModal } = useModal();

  const handleOpen = () => {
    openModal();
    onClose && onClose();
  };

  const handleClose = () => {
    closeModal();
    onClose && onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
        <div className="px-6 py-4">
          {children || (
            <p className="text-gray-600">
              Este es un modal de prueba para verificar que el header móvil se oculta correctamente.
            </p>
          )}
        </div>
        <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestModal;
