import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const InformacionPrincipalCardEmpleado = ({ parteInfo }) => {
  if (!parteInfo) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 mb-6 animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const { 
    fecha,
    numero_parte,
    nombre_trabajador,
    codigo_empleado,
    cliente,
    nombre_obra,
    email_contacto
  } = parteInfo;

  const formattedDate = fecha ? format(new Date(fecha), 'PPP', { locale: es }) : 'Fecha no disponible';

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Información Principal del Parte</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
        <div>
          <span className="font-medium text-gray-600">Nº Parte:</span>
          <p className="text-gray-900">{numero_parte || 'N/A'}</p>
        </div>
        <div>
          <span className="font-medium text-gray-600">Fecha:</span>
          <p className="text-gray-900">{formattedDate}</p>
        </div>
        <div>
          <span className="font-medium text-gray-600">Trabajador:</span>
          <p className="text-gray-900">{nombre_trabajador || 'N/A'} ({codigo_empleado || 'N/A'})</p>
        </div>
        <div>
          <span className="font-medium text-gray-600">Email Contacto:</span>
          <p className="text-gray-900">{email_contacto || 'N/A'}</p>
        </div>
        <div>
          <span className="font-medium text-gray-600">Cliente:</span>
          <p className="text-gray-900">{cliente || 'N/A'}</p>
        </div>
        <div>
          <span className="font-medium text-gray-600">Obra:</span>
          <p className="text-gray-900">{nombre_obra || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default InformacionPrincipalCardEmpleado;
