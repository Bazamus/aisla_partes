import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import toast from 'react-hot-toast';

const FirmaCardEmpleado = ({ firma, onUploadSignature, setFirma, readOnly = false }) => {
  const sigCanvas = useRef(null);
  const [mostrarCanvas, setMostrarCanvas] = useState(!firma);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMostrarCanvas(!firma);
  }, [firma]);

  const handleClear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
    setFirma(null);
    setMostrarCanvas(true);
  };

  const handleSave = async () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      toast.error('Por favor, dibuja una firma antes de guardar.');
      return;
    }
    
    setIsSaving(true);
    try {
      const dataURL = sigCanvas.current.toDataURL('image/png');
      // La prop onUploadSignature debe ser una función que maneje la subida y devuelva la URL
      const uploadedUrl = await onUploadSignature(dataURL); 

      if (uploadedUrl) {
        setFirma(uploadedUrl);
        setMostrarCanvas(false);
        toast.success('Firma guardada correctamente.');
      } else {
        // Si onUploadSignature no devuelve una URL, podría ser un error o una gestión local
        // Para este componente genérico, asumimos que si no hay URL, algo falló o no se requiere subida externa.
        // Si solo se quiere guardar localmente el dataURL, setFirma(dataURL) sería suficiente.
        toast.error('No se pudo obtener la URL de la firma tras la subida.');
        setMostrarCanvas(true); // Reintentar o mostrar error
      }
    } catch (error) {
      console.error('Error al guardar la firma:', error);
      toast.error(`Error al guardar la firma: ${error.message || 'Inténtalo de nuevo.'}`);
      setMostrarCanvas(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (readOnly) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Firma del Empleado</h2>
        
        {firma ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 p-4 flex justify-center items-center">
            <img 
              src={firma} 
              alt="Firma del empleado"
              className="max-h-48 object-contain"
              aria-label="Firma del empleado registrada"
            />
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">
            No se ha registrado ninguna firma para este parte.
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Registrar Firma del Empleado</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Dibuja la firma en el recuadro para validar el parte de trabajo.
        </p>
        
        {mostrarCanvas ? (
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm hover:border-indigo-500 transition-colors">
            <SignatureCanvas
              ref={sigCanvas}
              penColor='black'
              canvasProps={{
                className: 'w-full h-48 md:h-56',
                style: { touchAction: 'none' } // Mejora la experiencia en táctiles
              }}
              backgroundColor='rgb(255,255,255)'
              onBegin={() => console.log('Comenzando a firmar')}
              onEnd={() => console.log('Terminó de firmar')}
            />
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 p-2 flex justify-center items-center">
            <img 
              src={firma} 
              alt="Firma actual del empleado"
              className="max-h-48 object-contain"
            />
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap gap-3 items-center">
        <button
          type="button"
          onClick={handleClear}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          aria-label="Borrar la firma actual y dibujar una nueva"
          tabIndex="0"
        >
          {firma && !mostrarCanvas ? 'Cambiar Firma' : 'Borrar Dibujo'}
        </button>
        
        {mostrarCanvas && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
            aria-label="Guardar la firma dibujada"
            tabIndex="0"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </>
            ) : 'Guardar Firma'}
          </button>
        )}
      </div>
      {isSaving && <p className="text-xs text-indigo-500 mt-2">Procesando firma, por favor espera...</p>}
    </div>
  );
};

export default FirmaCardEmpleado;
