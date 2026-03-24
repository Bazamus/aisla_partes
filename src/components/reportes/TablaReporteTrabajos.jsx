import { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

function TablaReporteTrabajos({ datos }) {
  const [busqueda, setBusqueda] = useState('');
  const [ordenarPor, setOrdenarPor] = useState('fecha'); // 'fecha', 'empleado', 'obra', 'subtotal'
  const [ordenDesc, setOrdenDesc] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 20;

  if (!datos || datos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden mb-3 md:mb-6">
        <div className="px-3 md:px-4 lg:px-6 py-2 md:py-3 border-b border-gray-200">
          <h3 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900">
            Detalle de Materiales y Servicios
          </h3>
        </div>
        <div className="p-8 text-center text-gray-500">
          No hay datos disponibles
        </div>
      </div>
    );
  }

  const datosFiltrados = datos.filter(material => {
    const termino = busqueda.toLowerCase();
    return (
      (material.empleado_nombre || '').toLowerCase().includes(termino) ||
      (material.obra_numero || '').toLowerCase().includes(termino) ||
      (material.numero_parte || '').toLowerCase().includes(termino) ||
      (material.codigo_material || '').toLowerCase().includes(termino) ||
      (material.tipo_material || '').toLowerCase().includes(termino) ||
      (material.tipo_precio || '').toLowerCase().includes(termino)
    );
  });

  const datosOrdenados = [...datosFiltrados].sort((a, b) => {
    let valorA, valorB;
    switch (ordenarPor) {
      case 'fecha':
        valorA = a.fecha || '';
        valorB = b.fecha || '';
        break;
      case 'empleado':
        valorA = a.empleado_nombre || '';
        valorB = b.empleado_nombre || '';
        break;
      case 'obra':
        valorA = a.obra_numero || '';
        valorB = b.obra_numero || '';
        break;
      case 'subtotal':
      default:
        valorA = Number(a.subtotal) || 0;
        valorB = Number(b.subtotal) || 0;
        break;
    }
    
    if (typeof valorA === 'string') {
      return ordenDesc ? valorB.localeCompare(valorA) : valorA.localeCompare(valorB);
    }
    return ordenDesc ? valorB - valorA : valorA - valorB;
  });

  const totalPaginas = Math.ceil(datosOrdenados.length / registrosPorPagina);
  const inicio = (paginaActual - 1) * registrosPorPagina;
  const fin = inicio + registrosPorPagina;
  const datosPaginados = datosOrdenados.slice(inicio, fin);

  // Calcular totales
  const totales = datosOrdenados.reduce((acc, mat) => ({
    cantidad: acc.cantidad + (Number(mat.cantidad) || 0),
    subtotal: acc.subtotal + (Number(mat.subtotal) || 0)
  }), { cantidad: 0, subtotal: 0 });

  const handleOrdenar = (columna) => {
    if (ordenarPor === columna) {
      setOrdenDesc(!ordenDesc);
    } else {
      setOrdenarPor(columna);
      setOrdenDesc(true);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-3 md:mb-6">
      <div className="px-3 md:px-4 lg:px-6 py-2 md:py-3 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 md:gap-3">
        <h3 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900">
          Detalle de Materiales y Servicios
        </h3>
        <input
          type="text"
          placeholder="Buscar material, empleado, obra..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full sm:w-80 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* Vista Móvil: Tarjetas */}
      <div className="block lg:hidden">
        {datosPaginados.map((material, index) => (
          <div key={index} className={`p-3 border-b border-gray-200 hover:bg-gray-50 transition-colors ${material.es_servicio ? 'border-l-3 border-l-orange-400 bg-orange-50/30' : ''}`}>
            {/* Header: Fecha y Número de Parte */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-xs text-gray-500">
                  {material.fecha || '-'}
                </div>
                <div className="font-semibold text-gray-900 mt-1">
                  {material.numero_parte || '-'}
                  {material.es_servicio && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-700">
                      SRV
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Subtotal</div>
                <div className={`text-base font-bold ${material.es_servicio ? 'text-orange-600' : 'text-blue-600'}`}>
                  {Number(material.subtotal || 0).toFixed(2)} €
                </div>
              </div>
            </div>

            {/* Empleado y Obra */}
            <div className="mb-3 text-sm">
              <div className="text-gray-600 mb-1">
                <span className="font-medium">Empleado:</span> {material.empleado_nombre || '-'}
              </div>
              <div className="text-gray-600">
                <span className="font-medium">Obra:</span> {material.obra_numero || '-'}
              </div>
            </div>

            {/* Material / Servicio */}
            <div className={`rounded-lg p-3 mb-3 ${material.es_servicio ? 'bg-orange-50' : 'bg-gray-50'}`}>
              <div className="font-semibold text-gray-900 mb-1">
                {material.codigo_material || '-'}
              </div>
              <div className="text-xs text-gray-600">
                {material.tipo_material || '-'}
                {!material.es_servicio && material.espesor && material.diametro && (
                  <span className="ml-2">({material.espesor}/{material.diametro})</span>
                )}
              </div>
            </div>

            {/* Cantidad y Precio */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-500">Cantidad: </span>
                <span className="font-semibold text-gray-900">{Number(material.cantidad || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-500">P. Unit.: </span>
                <span className="font-semibold text-gray-900">{Number(material.precio_unitario || 0).toFixed(2)} €</span>
              </div>
            </div>
          </div>
        ))}

        {/* Totales móvil */}
        <div className="p-4 bg-blue-50 border-t-2 border-blue-600">
          <div className="font-bold text-gray-900 mb-2">TOTALES</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Cantidad Total: </span>
              <span className="font-bold">{totales.cantidad.toFixed(2)}</span>
            </div>
            <div className="text-right">
              <span className="text-gray-600">Subtotal: </span>
              <span className="font-bold text-blue-600">{totales.subtotal.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vista Desktop: Tabla */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                onClick={() => handleOrdenar('fecha')}
                className="px-3 lg:px-4 py-3 text-left text-xs lg:text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-1">
                  Fecha
                  {ordenarPor === 'fecha' && (
                    ordenDesc ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronUpIcon className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th className="px-3 lg:px-4 py-3 text-left text-xs lg:text-sm font-medium text-gray-700 uppercase tracking-wider">
                Nº Parte
              </th>
              <th
                onClick={() => handleOrdenar('empleado')}
                className="px-3 lg:px-4 py-3 text-left text-xs lg:text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-1">
                  Empleado
                  {ordenarPor === 'empleado' && (
                    ordenDesc ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronUpIcon className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleOrdenar('obra')}
                className="px-3 lg:px-4 py-3 text-left text-xs lg:text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-1">
                  Obra
                  {ordenarPor === 'obra' && (
                    ordenDesc ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronUpIcon className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th className="px-3 lg:px-4 py-3 text-left text-xs lg:text-sm font-medium text-gray-700 uppercase tracking-wider">
                Material
              </th>
              <th className="px-3 lg:px-4 py-3 text-left text-xs lg:text-sm font-medium text-gray-700 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-3 lg:px-4 py-3 text-right text-xs lg:text-sm font-medium text-gray-700 uppercase tracking-wider">
                Cantidad
              </th>
              <th className="px-3 lg:px-4 py-3 text-right text-xs lg:text-sm font-medium text-gray-700 uppercase tracking-wider">
                P. Unit. €
              </th>
              <th
                onClick={() => handleOrdenar('subtotal')}
                className="px-3 lg:px-4 py-3 text-right text-xs lg:text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center justify-end gap-1">
                  Subtotal €
                  {ordenarPor === 'subtotal' && (
                    ordenDesc ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronUpIcon className="w-4 h-4" />
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {datosPaginados.map((material, index) => (
              <tr key={index} className={`hover:bg-gray-50 transition-colors ${material.es_servicio ? 'bg-orange-50/40' : ''}`}>
                <td className="px-3 lg:px-4 py-2 text-xs lg:text-sm text-gray-600 whitespace-nowrap">
                  {material.fecha || '-'}
                </td>
                <td className="px-3 lg:px-4 py-2 text-xs lg:text-sm text-gray-900 whitespace-nowrap">
                  {material.numero_parte || '-'}
                </td>
                <td className="px-3 lg:px-4 py-2 text-xs lg:text-sm text-gray-600">
                  {material.empleado_nombre || '-'}
                </td>
                <td className="px-3 lg:px-4 py-2 text-xs lg:text-sm text-gray-600">
                  {material.obra_numero || '-'}
                </td>
                <td className="px-3 lg:px-4 py-2 text-xs lg:text-sm text-gray-900">
                  <div>
                    <div className="font-medium">
                      {material.es_servicio && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-700 mr-1">
                          SRV
                        </span>
                      )}
                      {material.codigo_material || '-'}
                    </div>
                    {!material.es_servicio && material.espesor && material.diametro && (
                      <div className="text-xs text-gray-500">
                        {material.espesor}/{material.diametro}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-3 lg:px-4 py-2 text-xs lg:text-sm text-gray-600">
                  {material.tipo_material || '-'}
                </td>
                <td className="px-3 lg:px-4 py-2 text-xs lg:text-sm text-gray-900 text-right">
                  {Number(material.cantidad || 0).toFixed(2)}
                </td>
                <td className="px-3 lg:px-4 py-2 text-xs lg:text-sm text-gray-600 text-right">
                  {Number(material.precio_unitario || 0).toFixed(2)}
                </td>
                <td className={`px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium text-right ${material.es_servicio ? 'text-orange-700' : 'text-gray-900'}`}>
                  {Number(material.subtotal || 0).toFixed(2)} €
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr className="font-semibold">
              <td colSpan="6" className="px-3 lg:px-4 py-3 text-xs lg:text-sm text-gray-900">
                TOTALES
              </td>
              <td className="px-3 lg:px-4 py-3 text-xs lg:text-sm text-gray-900 text-right">
                {totales.cantidad.toFixed(2)}
              </td>
              <td className="px-3 lg:px-4 py-3 text-xs lg:text-sm text-gray-600 text-right">
                -
              </td>
              <td className="px-3 lg:px-4 py-3 text-xs lg:text-sm text-gray-900 text-right">
                {totales.subtotal.toFixed(2)} €
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="px-4 lg:px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3">
        <span className="text-xs sm:text-sm text-gray-700">
          Mostrando {inicio + 1} - {Math.min(fin, datosOrdenados.length)} de {datosOrdenados.length} registros
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
            disabled={paginaActual === 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <span className="px-3 py-1 text-sm text-gray-700">
            Página {paginaActual} de {totalPaginas}
          </span>
          <button
            onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
            disabled={paginaActual === totalPaginas}
            className="px-3 py-1 text-sm border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}

export default TablaReporteTrabajos;
