import React from 'react';

const NotasCardNuevo = ({ formData, setFormData, readOnly = false }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (readOnly) {
    return (
      <div className="bg-white shadow-sm rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          📝 Notas Adicionales
        </h2>
        
        {formData.notas ? (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-900 whitespace-pre-wrap">{formData.notas}</p>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No hay notas adicionales</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-xl p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        📝 Notas Adicionales
      </h2>
      
      <div>
        <label htmlFor="notas" className="block text-sm font-medium text-gray-700 mb-2">
          Añade cualquier nota o comentario adicional
        </label>
        <textarea
          id="notas"
          name="notas"
          value={formData.notas || ''}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-vertical"
          placeholder="Escribe aquí cualquier información adicional sobre el parte de trabajo..."
        />
      </div>
    </div>
  );
};

export default NotasCardNuevo;
