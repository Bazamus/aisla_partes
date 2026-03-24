import React, { useState, useEffect } from 'react';

const InformacionPrincipalCardNuevo = ({ 
  formData, 
  setFormData, 
  empleado,
  obrasEmpleado,
  loadingObras,
  readOnly = false,
  trabajos = [],
  onObraChange = null
}) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleObraChange = (e) => {
    const selectedObraId = e.target.value;
    const selectedObra = obrasEmpleado.find(obra => obra.value === selectedObraId);
    
    // Si ya hay trabajos y se está intentando cambiar la obra
    if (trabajos.length > 0 && selectedObraId !== formData.id_obra && selectedObraId !== '') {
      // Llamar a la función de callback para mostrar el modal
      if (onObraChange) {
        onObraChange(selectedObraId, selectedObra?.nombreObra || '');
      }
      return; // No continuar con el cambio hasta que el usuario confirme
    }
    
    // Si no hay trabajos o es el mismo valor, proceder normalmente
    setFormData(prev => ({
      ...prev,
      id_obra: selectedObraId,
      nombre_obra: selectedObra?.nombreObra || '',
      cliente: selectedObra?.cliente || ''
    }));
  };

  // Renderizado para modo de solo lectura
  if (readOnly) {
    return (
      <div className="bg-white shadow-sm rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          📋 Información Principal
        </h2>
        
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">🏢 Obra</p>
              <p className="text-base text-gray-900">{formData.nombre_obra || 'N/A'}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">📅 Fecha</p>
              <p className="text-base text-gray-900">
                {formData.fecha ? new Date(formData.fecha).toLocaleDateString('es-ES') : 'N/A'}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">👤 Empleado</p>
              <p className="text-base text-gray-900">{formData.nombre_empleado || 'N/A'}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">🏢 Cliente</p>
              <p className="text-base text-gray-900">{formData.cliente || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Renderizado para modo de edición
  return (
    <div className="bg-white shadow-sm rounded-xl p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        📋 Información Principal
      </h2>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Primera fila: Obra y Fecha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="id_obra" className="block text-sm font-medium text-gray-700 mb-2">
              🏢 Obra *
            </label>
            <select
              id="id_obra"
              name="id_obra"
              value={formData.id_obra}
              onChange={handleObraChange}
              disabled={loadingObras}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
            >
              <option value="">
                {loadingObras ? 'Cargando obras...' : 'Selecciona una obra'}
              </option>
              {obrasEmpleado.map((obra) => (
                <option key={obra.value} value={obra.value}>
                  {obra.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-2">
              📅 Fecha *
            </label>
            <input
              type="date"
              id="fecha"
              name="fecha"
              value={formData.fecha}
              onChange={handleChange}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
        
        {/* Segunda fila: Empleado y Cliente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nombre_empleado" className="block text-sm font-medium text-gray-700 mb-2">
              👤 Empleado
            </label>
            <input
              type="text"
              id="nombre_empleado"
              name="nombre_empleado"
              value={formData.nombre_empleado}
              readOnly
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
            />
          </div>
          
          <div>
            <label htmlFor="cliente" className="block text-sm font-medium text-gray-700 mb-2">
              🏢 Cliente
            </label>
            <input
              type="text"
              id="cliente"
              name="cliente"
              value={formData.cliente}
              readOnly
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InformacionPrincipalCardNuevo;
