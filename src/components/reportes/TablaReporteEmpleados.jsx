import { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

function TablaReporteEmpleados({ datos }) {
  const [busqueda, setBusqueda] = useState('');
  const [ordenarPor, setOrdenarPor] = useState('costo'); // 'nombre', 'partes', 'costo'
  const [ordenDesc, setOrdenDesc] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 10;

  if (!datos || datos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden mb-3 md:mb-6">
        <div className="px-3 md:px-4 lg:px-6 py-2 md:py-3 border-b border-gray-200">
          <h3 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900">
            Detalle por Empleados
          </h3>
        </div>
        <div className="p-8 text-center text-gray-500">
          No hay datos disponibles
        </div>
      </div>
    );
  }

  // Filtrar por búsqueda
  const datosFiltrados = datos.filter(emp =>
    (emp.empleado_nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (emp.empleado_codigo || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  // Ordenar
  const datosOrdenados = [...datosFiltrados].sort((a, b) => {
    let valorA, valorB;
    
    switch (ordenarPor) {
      case 'nombre':
        valorA = a.empleado_nombre || '';
        valorB = b.empleado_nombre || '';
        break;
      case 'partes':
        valorA = Number(a.total_partes) || 0;
        valorB = Number(b.total_partes) || 0;
        break;
      case 'costo':
      default:
        valorA = Number(a.costo_total) || 0;
        valorB = Number(b.costo_total) || 0;
        break;
    }
    
    if (typeof valorA === 'string') {
      return ordenDesc ? valorB.localeCompare(valorA) : valorA.localeCompare(valorB);
    }
    return ordenDesc ? valorB - valorA : valorA - valorB;
  });

  // Paginación
  const totalPaginas = Math.ceil(datosOrdenados.length / registrosPorPagina);
  const inicio = (paginaActual - 1) * registrosPorPagina;
  const fin = inicio + registrosPorPagina;
  const datosPaginados = datosOrdenados.slice(inicio, fin);

  // Calcular totales
  const totales = datosOrdenados.reduce((acc, emp) => ({
    partes: acc.partes + (Number(emp.total_partes) || 0),
    costo: acc.costo + (Number(emp.costo_total) || 0),
    materiales: acc.materiales + (Number(emp.total_materiales_cantidad) || 0),
    aprobados: acc.aprobados + (Number(emp.partes_aprobados) || 0),
    pendientes: acc.pendientes + (Number(emp.partes_pendientes) || 0),
    borrador: acc.borrador + (Number(emp.partes_borrador) || 0)
  }), { partes: 0, costo: 0, materiales: 0, aprobados: 0, pendientes: 0, borrador: 0 });

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
      {/* Header */}
      <div className="px-3 md:px-4 lg:px-6 py-2 md:py-3 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 md:gap-3">
        <h3 className="text-base md:text-lg lg:text-xl font-semibold text-gray-900">
          Detalle por Empleados
        </h3>
        <input
          type="text"
          placeholder="Buscar empleado..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* Vista Móvil: Tarjetas */}
      <div className="block lg:hidden">
        {datosPaginados.map((emp, index) => (
          <div key={index} className="p-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
            {/* Nombre y Código */}
            <div className="mb-3">
              <div className="font-semibold text-gray-900">{emp.empleado_nombre || '-'}</div>
              <div className="text-sm text-gray-500">{emp.empleado_codigo || '-'}</div>
            </div>
            
            {/* Grid de métricas */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">Total Partes</div>
                <div className="text-base font-semibold text-gray-900">{emp.total_partes || 0}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Costo Total</div>
                <div className="text-base font-bold text-blue-600">{Number(emp.costo_total || 0).toFixed(2)} €</div>
                {Number(emp.costo_servicios || 0) > 0 && (
                  <div className="text-[10px] text-orange-500 mt-0.5">
                    Serv: {Number(emp.costo_servicios).toFixed(2)}€
                  </div>
                )}
              </div>
            </div>

            {/* Estados de partes */}
            <div className="flex gap-4 text-xs">
              <div>
                <span className="text-gray-500">Aprobados: </span>
                <span className="font-semibold text-green-600">{emp.partes_aprobados || 0}</span>
              </div>
              <div>
                <span className="text-gray-500">Pendientes: </span>
                <span className="font-semibold text-orange-600">{emp.partes_pendientes || 0}</span>
              </div>
              <div>
                <span className="text-gray-500">Borrador: </span>
                <span className="font-semibold text-gray-600">{emp.partes_borrador || 0}</span>
              </div>
            </div>

            {/* Materiales */}
            <div className="mt-2 text-xs text-gray-600">
              Materiales: <span className="font-semibold">{Number(emp.total_materiales_cantidad || 0).toFixed(0)}</span>
            </div>
          </div>
        ))}

        {/* Totales móvil */}
        <div className="p-4 bg-blue-50 border-t-2 border-blue-600">
          <div className="font-bold text-gray-900 mb-2">TOTALES</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Partes: </span>
              <span className="font-bold">{totales.partes}</span>
            </div>
            <div>
              <span className="text-gray-600">Costo: </span>
              <span className="font-bold text-blue-600">{totales.costo.toFixed(2)} €</span>
            </div>
            <div>
              <span className="text-gray-600">Aprobados: </span>
              <span className="font-semibold text-green-600">{totales.aprobados}</span>
            </div>
            <div>
              <span className="text-gray-600">Pendientes: </span>
              <span className="font-semibold text-orange-600">{totales.pendientes}</span>
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
                onClick={() => handleOrdenar('nombre')}
                className="px-3 lg:px-6 py-3 text-left text-xs lg:text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-1">
                  Empleado
                  {ordenarPor === 'nombre' && (
                    ordenDesc ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronUpIcon className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleOrdenar('partes')}
                className="px-3 lg:px-6 py-3 text-left text-xs lg:text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-1">
                  Total Partes
                  {ordenarPor === 'partes' && (
                    ordenDesc ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronUpIcon className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th className="px-3 lg:px-6 py-3 text-left text-xs lg:text-sm font-medium text-gray-700 uppercase tracking-wider">
                Aprobados
              </th>
              <th className="px-3 lg:px-6 py-3 text-left text-xs lg:text-sm font-medium text-gray-700 uppercase tracking-wider">
                Pendientes
              </th>
              <th className="px-3 lg:px-6 py-3 text-left text-xs lg:text-sm font-medium text-gray-700 uppercase tracking-wider">
                Borrador
              </th>
              <th className="px-3 lg:px-6 py-3 text-left text-xs lg:text-sm font-medium text-gray-700 uppercase tracking-wider">
                Materiales
              </th>
              <th
                onClick={() => handleOrdenar('costo')}
                className="px-3 lg:px-6 py-3 text-left text-xs lg:text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center gap-1">
                  Costo Total (€)
                  {ordenarPor === 'costo' && (
                    ordenDesc ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronUpIcon className="w-4 h-4" />
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {datosPaginados.map((emp, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 lg:px-6 py-2 lg:py-4 text-xs lg:text-sm text-gray-900">
                  <div>
                    <div className="font-medium">{emp.empleado_nombre || '-'}</div>
                    <div className="text-gray-500">{emp.empleado_codigo || '-'}</div>
                  </div>
                </td>
                <td className="px-3 lg:px-6 py-2 lg:py-4 text-xs lg:text-sm text-gray-900">
                  {emp.total_partes || 0}
                </td>
                <td className="px-3 lg:px-6 py-2 lg:py-4 text-xs lg:text-sm text-green-600 font-medium">
                  {emp.partes_aprobados || 0}
                </td>
                <td className="px-3 lg:px-6 py-2 lg:py-4 text-xs lg:text-sm text-orange-600 font-medium">
                  {emp.partes_pendientes || 0}
                </td>
                <td className="px-3 lg:px-6 py-2 lg:py-4 text-xs lg:text-sm text-gray-600">
                  {emp.partes_borrador || 0}
                </td>
                <td className="px-3 lg:px-6 py-2 lg:py-4 text-xs lg:text-sm text-gray-600">
                  {Number(emp.total_materiales_cantidad || 0).toFixed(0)}
                </td>
                <td className="px-3 lg:px-6 py-2 lg:py-4 text-xs lg:text-sm text-gray-900 font-medium">
                  {Number(emp.costo_total || 0).toFixed(2)} €
                  {Number(emp.costo_servicios || 0) > 0 && (
                    <div className="text-[10px] text-orange-500 mt-0.5">
                      (Serv: {Number(emp.costo_servicios).toFixed(2)}€)
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr className="font-semibold">
              <td className="px-3 lg:px-6 py-3 text-xs lg:text-sm text-gray-900">
                TOTALES
              </td>
              <td className="px-3 lg:px-6 py-3 text-xs lg:text-sm text-gray-900">
                {totales.partes}
              </td>
              <td className="px-3 lg:px-6 py-3 text-xs lg:text-sm text-green-600">
                {totales.aprobados}
              </td>
              <td className="px-3 lg:px-6 py-3 text-xs lg:text-sm text-orange-600">
                {totales.pendientes}
              </td>
              <td className="px-3 lg:px-6 py-3 text-xs lg:text-sm text-gray-600">
                {totales.borrador}
              </td>
              <td className="px-3 lg:px-6 py-3 text-xs lg:text-sm text-gray-600">
                {totales.materiales.toFixed(0)}
              </td>
              <td className="px-3 lg:px-6 py-3 text-xs lg:text-sm text-gray-900">
                {totales.costo.toFixed(2)} €
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Paginación */}
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

export default TablaReporteEmpleados;

