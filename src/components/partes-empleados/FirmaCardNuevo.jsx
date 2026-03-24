import React from 'react';
import SignaturePad from '../SignaturePad';

const FirmaCardNuevo = ({ formData, handleSignatureSave, readOnly = false }) => {
  if (readOnly) {
    return (
      <div className="bg-white shadow-sm rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          ✍️ Firma
        </h2>
        
        {formData.firma ? (
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <img
              src={formData.firma}
              alt="Firma del empleado"
              className="max-w-full h-32 mx-auto border border-gray-200 rounded"
            />
            <p className="text-sm text-gray-600 mt-2">Firma registrada</p>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No hay firma registrada</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-xl p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        ✍️ Firma
      </h2>
      
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Firma digital requerida para completar el parte de trabajo
        </p>
        
        <SignaturePad onSave={handleSignatureSave} />
        
        {formData.firma && (
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <img
              src={formData.firma}
              alt="Firma del empleado"
              className="max-w-full h-32 mx-auto border border-green-200 rounded"
            />
            <p className="text-sm text-green-700 mt-2 flex items-center justify-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Firma registrada correctamente
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FirmaCardNuevo;
