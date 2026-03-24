import React from 'react';
import ImageUploader from '../ImageUploader';

const ImagenesCardNuevo = ({ formData, handleImageUpload, readOnly = false, parteId, tempParteId }) => {
  if (readOnly) {
    return (
      <div className="bg-white shadow-sm rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          📸 Imágenes
        </h2>
        
        {formData.imagenes && formData.imagenes.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {formData.imagenes.map((imagen, index) => (
              <div key={index} className="relative group">
                <img
                  src={imagen}
                  alt={`Imagen ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg shadow-sm"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                  <button
                    onClick={() => window.open(imagen, '_blank')}
                    className="opacity-0 group-hover:opacity-100 bg-white text-gray-800 px-3 py-1 rounded-md text-sm font-medium transition-opacity duration-200"
                  >
                    Ver imagen
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No hay imágenes adjuntas</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-xl p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        📸 Imágenes
      </h2>
      
      <div className="space-y-4">
        {/* Usar parteId real o temporal para permitir subida de imágenes */}
        <ImageUploader 
          onImageUpload={handleImageUpload} 
          parteId={parteId || tempParteId} 
          isTemporary={!parteId}
        />
        
        {formData.imagenes && formData.imagenes.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {formData.imagenes.map((imagen, index) => (
              <div key={index} className="relative group">
                <img
                  src={imagen}
                  alt={`Imagen ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg shadow-sm border border-gray-200"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                  <button
                    onClick={() => window.open(imagen, '_blank')}
                    className="opacity-0 group-hover:opacity-100 bg-white text-gray-800 px-3 py-1 rounded-md text-sm font-medium transition-opacity duration-200"
                  >
                    Ver imagen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImagenesCardNuevo;
