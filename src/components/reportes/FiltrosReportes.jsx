import { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon, ArrowDownTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import * as reportesService from '../../services/reportesService';
import * as exportacionService from '../../services/exportacionReportesService';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

function FiltrosReportes({ filtros, onAplicarFiltros, datosReporte }) {
  const { user } = useAuth();
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [fechaDesde, setFechaDesde] = useState(filtros.fechaDesde || '');
  const [fechaHasta, setFechaHasta] = useState(filtros.fechaHasta || '');
  const [empleadoId, setEmpleadoId] = useState(filtros.empleadoId || '');
  const [obraId, setObraId] = useState(filtros.obraId || '');
  
  const [empleados, setEmpleados] = useState([]);
  const [obras, setObras] = useState([]);
  const [loadingExport, setLoadingExport] = useState(false);

  // Cargar empleados cuando cambia la obra seleccionada
  useEffect(() => {
    const cargarEmpleados = async () => {
      try {
        const obraIdNum = obraId ? parseInt(obraId) : null;
        const empleadosData = await reportesService.getEmpleadosParaFiltro(obraIdNum);
        setEmpleados(empleadosData);
        
        // Si hay una obra seleccionada y el empleado actual no está en la lista, limpiarlo
        if (obraId && empleadoId) {
          const empleadoExiste = empleadosData.some(e => e.id === parseInt(empleadoId));
          if (!empleadoExiste) {
            setEmpleadoId('');
          }
        }
      } catch (error) {
        console.error('Error al cargar empleados:', error);
      }
    };
    cargarEmpleados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obraId]); // Se ejecuta cuando cambia la obra

  // Cargar obras cuando cambia el empleado seleccionado
  useEffect(() => {
    const cargarObras = async () => {
      try {
        const empleadoIdNum = empleadoId ? parseInt(empleadoId) : null;
        const obrasData = await reportesService.getObrasParaFiltro(empleadoIdNum);
        setObras(obrasData);
        
        // Si hay un empleado seleccionado y la obra actual no está en la lista, limpiarla
        if (empleadoId && obraId) {
          const obraExiste = obrasData.some(o => o.id === parseInt(obraId));
          if (!obraExiste) {
            setObraId('');
          }
        }
      } catch (error) {
        console.error('Error al cargar obras:', error);
      }
    };
    cargarObras();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empleadoId]); // Se ejecuta cuando cambia el empleado

  // Aplicar filtros automáticamente cuando cambian los valores
  useEffect(() => {
    handleAplicarFiltros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaDesde, fechaHasta, empleadoId, obraId]);

  const handleAplicarFiltros = () => {
    onAplicarFiltros({
      fechaDesde: fechaDesde || null,
      fechaHasta: fechaHasta || null,
      empleadoId: empleadoId || null,
      obraId: obraId || null
    });
  };

  const handleLimpiarFiltros = () => {
    setFechaDesde('');
    setFechaHasta('');
    setEmpleadoId('');
    setObraId('');
    onAplicarFiltros({
      fechaDesde: null,
      fechaHasta: null,
      empleadoId: null,
      obraId: null
    });
  };

  const handleExportarExcel = async () => {
    setLoadingExport(true);
    try {
      await exportacionService.exportarReporteExcel(
        datosReporte.estadisticasGenerales,
        datosReporte.empleados,
        datosReporte.obras,
        datosReporte.materiales,
        { fechaDesde, fechaHasta },
        datosReporte.servicios || []
      );
      toast.success('Reporte exportado a Excel correctamente');
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      toast.error('Error al exportar el reporte a Excel');
    } finally {
      setLoadingExport(false);
    }
  };

  const handleExportarPDF = async () => {
    setLoadingExport(true);
    try {
      await exportacionService.exportarReportePDF(
        datosReporte.estadisticasGenerales,
        datosReporte.empleados,
        datosReporte.obras,
        { fechaDesde, fechaHasta },
        user?.email || 'Usuario',
        datosReporte.servicios || []
      );
      toast.success('Reporte exportado a PDF correctamente');
    } catch (error) {
      console.error('Error al exportar a PDF:', error);
      toast.error('Error al exportar el reporte a PDF');
    } finally {
      setLoadingExport(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-3 md:p-4 lg:p-6 mb-3 md:mb-6">
      {/* Móvil: Botón acordeón */}
      <div className="lg:hidden">
        <button
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <span className="text-sm font-medium text-gray-900">Filtros</span>
          {mostrarFiltros ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {mostrarFiltros && (
          <div className="mt-4 space-y-3">
            {/* Fecha Desde */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Desde
              </label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Fecha Hasta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Empleado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Empleado
              </label>
              <select
                value={empleadoId}
                onChange={(e) => setEmpleadoId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Todos los empleados</option>
                {empleados.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.codigo} - {emp.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Obra */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Obra
              </label>
              <select
                value={obraId}
                onChange={(e) => setObraId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Todas las obras</option>
                {obras.map(obra => (
                  <option key={obra.id} value={obra.id}>
                    {obra.numero_obra} - {obra.nombre_obra}
                  </option>
                ))}
              </select>
            </div>

            {/* Botón Limpiar */}
            <button
              onClick={handleLimpiarFiltros}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              Limpiar Filtros
            </button>
          </div>
        )}
      </div>

      {/* Desktop: Grid horizontal */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-4">
        {/* Fecha Desde */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha Desde
          </label>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {/* Fecha Hasta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha Hasta
          </label>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {/* Empleado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Empleado
          </label>
          <select
            value={empleadoId}
            onChange={(e) => setEmpleadoId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Todos</option>
            {empleados.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.codigo} - {emp.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Obra */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Obra
          </label>
          <select
            value={obraId}
            onChange={(e) => setObraId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Todas</option>
            {obras.map(obra => (
              <option key={obra.id} value={obra.id}>
                {obra.numero_obra} - {obra.nombre_obra}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Botones de acción (Desktop y móvil fuera del acordeón) */}
      <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3 hidden lg:flex">
        <button
          onClick={handleLimpiarFiltros}
          className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
        >
          Limpiar Filtros
        </button>
        
        <button
          onClick={handleExportarExcel}
          disabled={loadingExport}
          className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Exportar Excel</span>
          <span className="sm:hidden">Excel</span>
        </button>
        
        <button
          onClick={handleExportarPDF}
          disabled={loadingExport}
          className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <DocumentTextIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Exportar PDF</span>
          <span className="sm:hidden">PDF</span>
        </button>
      </div>

      {/* Botones de exportación para móvil (fuera del acordeón) */}
      <div className="mt-4 flex flex-col gap-2 lg:hidden">
        <button
          onClick={handleExportarExcel}
          disabled={loadingExport}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          <span>Exportar Excel</span>
        </button>
        
        <button
          onClick={handleExportarPDF}
          disabled={loadingExport}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <DocumentTextIcon className="w-5 h-5" />
          <span>Exportar PDF</span>
        </button>
      </div>
    </div>
  );
}

export default FiltrosReportes;

