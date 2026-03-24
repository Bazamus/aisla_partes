import React from 'react';

const EstadoParteCardEmpleado = ({ parteInfo }) => {
  if (!parteInfo) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 mb-6 animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const { estado, notas } = parteInfo;

  const getEstadoClass = (estadoActual) => {
    switch (estadoActual?.toLowerCase()) {
      case 'completado':
      case 'finalizado':
      case 'aprobado':
        return 'bg-green-100 text-green-800';
      case 'pendiente de revisión':
      case 'en progreso':
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'rechazado':
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Estado del Parte</h2>
      <div className="mb-4">
        <span className="font-medium text-gray-600">Estado:</span>
        <p 
          className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ml-2 ${getEstadoClass(estado)}`}
          aria-label={`Estado del parte: ${estado || 'No especificado'}`}
        >
          {estado || 'No especificado'}
        </p>
      </div>
      {notas && (
        <div>
          <h3 className="font-medium text-gray-600 mb-1">Notas Adicionales:</h3>
          <p className="text-gray-900 whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded-md">{notas}</p>
        </div>
      )}
      {!notas && (
         <div>
          <h3 className="font-medium text-gray-600 mb-1">Notas Adicionales:</h3>
          <p className="text-gray-500 italic text-sm">No hay notas adicionales.</p>
        </div>
      )}
    </div>
  );
};

export default EstadoParteCardEmpleado;
