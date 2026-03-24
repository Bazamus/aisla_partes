import React from 'react';

// Importar el componente base
import TrabajosCardEmpleado from './TrabajosCardEmpleado';

/**
 * Componente simplificado para gestión de trabajos de empleado
 * Actualmente delega toda la funcionalidad al componente base
 */
const TrabajosCardEmpleadoAvanzado = ({ 
  parteId, 
  onTiempoChange,
  formData,
  adminMode,
  selectedEmployeeId,
  empleado,
  onParteCreado,
  readonly = false 
}) => {
  // Función para validar UUID
  const isValidUUID = (str) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Debug logs
  console.log('=== TrabajosCardEmpleadoAvanzado Debug ===');
  console.log('parteId recibido:', parteId);
  console.log('Tipo de parteId:', typeof parteId);
  console.log('Es UUID válido:', isValidUUID(parteId));
  console.log('readonly:', readonly);
  console.log('=========================================');

  // Si no hay parteId válido, mostrar mensaje
  if (!parteId || !isValidUUID(parteId)) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Esperando parte válido
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>El ID del parte no es válido: {JSON.stringify(parteId)}</p>
              <p>Guarda el parte primero para poder añadir trabajos.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Componente base de trabajos */}
      <TrabajosCardEmpleado
        parteId={parteId}
        readOnly={readonly}
        onTiempoChange={onTiempoChange}
        formData={formData}
        adminMode={adminMode}
        selectedEmployeeId={selectedEmployeeId}
        empleado={empleado}
        onParteCreado={onParteCreado}
      />
    </div>
  );
};

export default TrabajosCardEmpleadoAvanzado;
