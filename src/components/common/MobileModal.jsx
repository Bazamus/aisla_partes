import React, { useEffect } from 'react';

/**
 * Componente de modal optimizado para dispositivos móviles
 */
const MobileModal = ({ isOpen, onClose, title, children, fullScreen = false }) => {
  // Prevenir el scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div 
        className={`bg-white rounded-t-xl ${fullScreen ? 'w-full h-full' : 'w-full max-w-md max-h-[90vh] m-4'} 
                   flex flex-col overflow-hidden shadow-xl animate-slide-up`}
      >
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
            aria-label="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Contenido del modal */}
        <div className="flex-1 p-4 overflow-y-auto">
          {children}
        </div>
        
        {/* Indicador de arrastre para cerrar (solo en móviles) */}
        <div className="flex justify-center p-2 border-t border-gray-200">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default MobileModal;
