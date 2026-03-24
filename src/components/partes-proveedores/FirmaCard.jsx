import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import toast from 'react-hot-toast';

const FirmaCard = ({ firma, onUploadSignature, setFirma, readOnly = false }) => {
  const sigCanvas = useRef(null);
  const [mostrarCanvas, setMostrarCanvas] = useState(!firma);
  const [isSaving, setIsSaving] = useState(false);

  // Efecto para manejar cambios en la prop firma
  useEffect(() => {
    setMostrarCanvas(!firma);
  }, [firma]);

  // Limpiar la firma
  const handleClear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
    setFirma(null);
    setMostrarCanvas(true);
  };

  // Guardar la firma
  const handleSave = async () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      toast.error('Por favor, añade una firma antes de guardar.');
      return;
    }
    
    setIsSaving(true);
    try {
      const dataURL = sigCanvas.current.toDataURL('image/png');
      const uploadedUrl = await onUploadSignature(dataURL);

      if (uploadedUrl) {
        setFirma(uploadedUrl);
        setMostrarCanvas(false);
        toast.success('Firma guardada y subida correctamente.');
        console.log('Firma subida y URL actualizada:', uploadedUrl);
      } else {
        toast.error('Error al subir la firma. La respuesta del servidor no fue válida.');
        setMostrarCanvas(true);
      }
    } catch (error) {
      console.error('Error al guardar la firma en FirmaCard:', error);
      toast.error(`Error al subir la firma: ${error.message || 'Inténtalo de nuevo.'}`);
      setMostrarCanvas(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Versión de solo lectura
  if (readOnly) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Firma</h2>
        
        {firma ? (
          <div className="border-2 border-gray-300 rounded-xl overflow-hidden bg-white p-4 flex justify-center">
            <img 
              src={firma} 
              alt="Firma del proveedor" 
              className="max-h-40"
            />
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            No hay firma registrada.
          </div>
        )}
      </div>
    );
  }
  
  // Versión de edición
  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Firma</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Firma del proveedor para validar el parte de trabajo.
        </p>
        
        {mostrarCanvas ? (
          <div className="border-2 border-gray-300 rounded-xl overflow-hidden bg-white">
            <SignatureCanvas
              ref={sigCanvas}
              penColor="black"
              canvasProps={{
                className: 'w-full h-40',
                style: { width: '100%', height: '160px' }
              }}
              backgroundColor="white"
            />
          </div>
        ) : (
          <div className="border-2 border-gray-300 rounded-xl overflow-hidden bg-white p-2">
            <img 
              src={firma} 
              alt="Firma del proveedor" 
              className="max-h-40 mx-auto"
            />
          </div>
        )}
      </div>
      
      <div className="flex space-x-4">
        <button
          type="button"
          onClick={handleClear}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          aria-label="Borrar firma"
        >
          Borrar Firma
        </button>
        
        {mostrarCanvas && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="Guardar firma"
          >
            {isSaving ? 'Guardando...' : 'Guardar Firma'}
          </button>
        )}
      </div>
    </div>
  );
};

export default FirmaCard;
