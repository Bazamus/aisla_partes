import React from 'react';

const TrabajosCardReadOnly = ({ trabajos = [] }) => {
  // Función para calcular el total de un trabajo
  const calcularTotalTrabajo = (trabajo) => {
    return trabajo.lineas.reduce((sum, linea) => sum + linea.total, 0);
  };

  // Función para calcular el total general
  const calcularTotalGeneral = () => {
    return trabajos.reduce((sum, trabajo) => {
      return sum + calcularTotalTrabajo(trabajo);
    }, 0);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Trabajos Realizados</h2>
      
      {Array.isArray(trabajos) && trabajos.length > 0 ? (
        <div className="space-y-6">
          {trabajos.map((trabajo, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="mb-3">
                <h4 className="text-md font-medium text-gray-900">Obra: {trabajo.obra}</h4>
                {trabajo.portal && <p className="text-sm text-gray-600">Portal: {trabajo.portal}</p>}
                {trabajo.vivienda && <p className="text-sm text-gray-600">Vivienda: {trabajo.vivienda}</p>}
              </div>
              
              {/* Tabla de líneas de trabajo (Desktop) */}
              <div className="overflow-x-auto hidden md:block mt-3">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                        Cantidad
                      </th>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        P. Unitario
                      </th>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                        Dto (%)
                      </th>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {trabajo.lineas.map((linea, lineaIndex) => (
                      <tr key={lineaIndex}>
                        <td className="px-4 py-2 whitespace-pre-wrap break-words text-sm text-gray-900">
                          {linea.descripcion}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {linea.cantidad} {linea.unidad}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {linea.precio_unitario.toFixed(2)}€
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {linea.descuento}%
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {linea.total.toFixed(2)}€
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="px-4 py-2 text-right text-sm font-medium text-gray-500"></td>
                      <td className="px-4 py-2 text-left text-sm font-bold text-gray-700">Total del Trabajo:</td>
                      <td className="px-4 py-2 text-left text-sm font-bold text-gray-900">
                        {calcularTotalTrabajo(trabajo).toFixed(2)}€
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Lista de líneas de trabajo (Móvil) */}
              <div className="md:hidden mt-3 space-y-2">
                {trabajo.lineas.map((linea, lineaIndex) => (
                  <div key={lineaIndex} className="p-2 border border-gray-100 rounded">
                    <p className="font-medium text-gray-700 break-words whitespace-pre-wrap text-sm">{linea.descripcion}</p>
                    <div className="grid grid-cols-2 gap-x-2 mt-1 text-xs">
                      <p><span className="text-gray-500">Cant:</span> {linea.cantidad} {linea.unidad}</p>
                      <p><span className="text-gray-500">P.U.:</span> {linea.precio_unitario.toFixed(2)}€</p>
                      <p><span className="text-gray-500">Dto:</span> {linea.descuento}%</p>
                      <p className="font-semibold"><span className="text-gray-500">Total:</span> {linea.total.toFixed(2)}€</p>
                    </div>
                  </div>
                ))}
                {/* Total del Trabajo para Móvil (dentro de cada tarjeta de trabajo) */}
                {trabajo.lineas.length > 0 && (
                   <div className="mt-2 pt-2 border-t border-gray-200 text-right">
                      <span className="text-sm font-medium text-gray-700">Total del Trabajo: </span>
                      <span className="text-sm font-bold text-gray-900">{calcularTotalTrabajo(trabajo).toFixed(2)}€</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Total general */}
          <div className="mt-4 text-right">
            <span className="text-lg font-medium text-gray-900">Total General:</span>
            <span className="ml-2 text-lg font-bold text-gray-900">{calcularTotalGeneral().toFixed(2)}€</span>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500">
          No hay trabajos registrados.
        </div>
      )}
    </div>
  );
};

export default TrabajosCardReadOnly;
