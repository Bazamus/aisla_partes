import { useEffect } from 'react';
import { useModal } from '../contexts/ModalContext';

export const useModalDetection = () => {
  const { openModal, closeModal } = useModal();

  useEffect(() => {
    // Función para detectar cuando se abre un modal
    const handleModalOpen = () => {
      openModal();
    };

    // Función para detectar cuando se cierra un modal
    const handleModalClose = () => {
      closeModal();
    };

    // Observar cambios en el DOM para detectar modales
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Detectar modales por clases comunes
              if (
                node.classList?.contains('fixed') &&
                node.classList?.contains('inset-0') &&
                (node.classList?.contains('bg-black') || node.classList?.contains('bg-opacity-50'))
              ) {
                handleModalOpen();
              }
            }
          });

          mutation.removedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Detectar cuando se cierra un modal
              if (
                node.classList?.contains('fixed') &&
                node.classList?.contains('inset-0') &&
                (node.classList?.contains('bg-black') || node.classList?.contains('bg-opacity-50'))
              ) {
                handleModalClose();
              }
            }
          });
        }
      });
    });

    // Configurar el observer
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Limpiar el observer al desmontar
    return () => {
      observer.disconnect();
    };
  }, [openModal, closeModal]);

  return { openModal, closeModal };
};
