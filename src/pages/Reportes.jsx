import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import FiltrosReportes from '../components/reportes/FiltrosReportes';
import EstadisticasGenerales from '../components/reportes/EstadisticasGenerales';
import GraficoPartesEmpleados from '../components/reportes/GraficoPartesEmpleados';
import GraficoPartesObras from '../components/reportes/GraficoPartesObras';
import GraficoDistribucionTrabajos from '../components/reportes/GraficoDistribucionTrabajos';
import TablaReporteEmpleados from '../components/reportes/TablaReporteEmpleados';
import TablaReporteObras from '../components/reportes/TablaReporteObras';
import TablaReporteTrabajos from '../components/reportes/TablaReporteTrabajos';
import SkeletonLoader from '../components/SkeletonLoader';
import * as reportesService from '../services/reportesService';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Procesa datos raw de otros trabajos para augmentar componentes de analítica
const procesarOtrosTrabajos = (otrosTrabajosRaw) => {
  const costoPorEmpleadoCodigo = {};
  const costoPorObraNumero = {};
  let costoTotalServicios = 0;
  const detalleOtrosTrabajos = [];

  (otrosTrabajosRaw || []).forEach(item => {
    const costo = (item.cantidad || 0) * (item.precio_unitario || 0);
    const empleadoCodigo = item.partes_empleados?.empleados?.codigo;
    const obraNumero = item.partes_empleados?.obras?.numero_obra;

    costoTotalServicios += costo;

    if (empleadoCodigo) {
      costoPorEmpleadoCodigo[empleadoCodigo] = (costoPorEmpleadoCodigo[empleadoCodigo] || 0) + costo;
    }
    if (obraNumero) {
      costoPorObraNumero[obraNumero] = (costoPorObraNumero[obraNumero] || 0) + costo;
    }

    detalleOtrosTrabajos.push({
      fecha: item.partes_empleados?.fecha || '',
      numero_parte: item.partes_empleados?.numero_parte || '',
      empleado_nombre: item.partes_empleados?.empleados?.nombre || '',
      obra_numero: obraNumero || '',
      codigo_material: item.servicios?.codigo || 'SERVICIO',
      tipo_material: item.descripcion || '',
      espesor: '',
      diametro: '',
      cantidad: item.cantidad || 0,
      precio_unitario: item.precio_unitario || 0,
      subtotal: costo,
      tipo_precio: item.servicio_id ? 'Servicio' : 'Otro Trabajo',
      es_servicio: true
    });
  });

  return { costoPorEmpleadoCodigo, costoPorObraNumero, costoTotalServicios, detalleOtrosTrabajos };
};

function Reportes() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    fechaDesde: null,
    fechaHasta: null,
    empleadoId: null,
    obraId: null
  });
  const [datosReporte, setDatosReporte] = useState({
    estadisticasGenerales: null,
    empleados: [],
    obras: [],
    materiales: [],
    distribucion: [],
    servicios: [],
    costoTotalServicios: 0
  });

  // Inicializar sin filtros para mostrar TODOS los datos
  useEffect(() => {
    const { fechaDesde, fechaHasta } = reportesService.obtenerRangoMesActual();
    setFiltros(prev => ({ ...prev, fechaDesde, fechaHasta }));
    // Cargar sin filtros de fecha para mostrar todos los datos
    cargarDatos(null, null, null, null);
  }, []);

  const cargarDatos = async (fechaDesde, fechaHasta, empleadoId = null, obraId = null) => {
    setLoading(true);
    try {
      console.log('[Reportes] Cargando datos:', { fechaDesde, fechaHasta, empleadoId, obraId });

      // Cargar todos los datos en paralelo
      const [estadisticas, empleados, obras, materiales, distribucion, servicios, otrosTrabajosRaw] = await Promise.all([
        reportesService.getEstadisticasGenerales(fechaDesde, fechaHasta, empleadoId, obraId),
        reportesService.getResumenPorEmpleado(fechaDesde, fechaHasta, empleadoId),
        reportesService.getResumenPorObra(fechaDesde, fechaHasta, obraId, empleadoId),
        reportesService.getDetalleMateriales(fechaDesde, fechaHasta, empleadoId, obraId),
        reportesService.getDistribucionTipoMaterial(fechaDesde, fechaHasta, empleadoId, obraId),
        reportesService.getResumenServicios(fechaDesde, fechaHasta, empleadoId, obraId),
        reportesService.getOtrosTrabajosDetalle(fechaDesde, fechaHasta, empleadoId, obraId)
      ]);

      // Procesar datos de otros trabajos para augmentar componentes
      const { costoPorEmpleadoCodigo, costoPorObraNumero, costoTotalServicios, detalleOtrosTrabajos } =
        procesarOtrosTrabajos(otrosTrabajosRaw);

      // Augmentar empleados con costos de servicios
      const empleadosAug = (empleados || []).map(emp => {
        const costoServ = costoPorEmpleadoCodigo[emp.empleado_codigo] || 0;
        return {
          ...emp,
          costo_materiales: Number(emp.costo_total) || 0,
          costo_servicios: costoServ,
          costo_total: (Number(emp.costo_total) || 0) + costoServ
        };
      });

      // Augmentar obras con costos de servicios
      const obrasAug = (obras || []).map(obra => {
        const costoServ = costoPorObraNumero[obra.obra_numero] || 0;
        return {
          ...obra,
          costo_materiales: Number(obra.costo_total) || 0,
          costo_servicios: costoServ,
          costo_total: (Number(obra.costo_total) || 0) + costoServ
        };
      });

      // Augmentar distribución con categoría "Servicios"
      const distribucionAug = [
        ...(distribucion || []),
        ...(costoTotalServicios > 0 ? [{
          tipo_material: 'Servicios',
          costo_total: costoTotalServicios,
          total_cantidad: otrosTrabajosRaw.length
        }] : [])
      ];

      // Combinar materiales + detalle otros trabajos
      const materialesCombinados = [
        ...(materiales || []),
        ...detalleOtrosTrabajos
      ];

      setDatosReporte({
        estadisticasGenerales: estadisticas,
        empleados: empleadosAug,
        obras: obrasAug,
        materiales: materialesCombinados,
        distribucion: distribucionAug,
        servicios: servicios || [],
        costoTotalServicios
      });

      toast.success('Reportes cargados correctamente');
    } catch (error) {
      console.error('Error al cargar datos de reportes:', error);
      toast.error('Error al cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  const handleAplicarFiltros = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
    cargarDatos(
      nuevosFiltros.fechaDesde,
      nuevosFiltros.fechaHasta,
      nuevosFiltros.empleadoId,
      nuevosFiltros.obraId
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Oculto en móvil, visible en desktop */}
      <div className="hidden md:block bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <ChartBarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Reportes de Materiales
            </h1>
          </div>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Análisis de partes de trabajo, materiales instalados y costos por empleado y obra
          </p>
        </div>
      </div>

      {/* Contenido - Padding reducido en móvil */}
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2 md:py-6 lg:py-8">
        {/* Filtros */}
        <FiltrosReportes
          filtros={filtros}
          onAplicarFiltros={handleAplicarFiltros}
          datosReporte={datosReporte}
        />

        {loading ? (
          <SkeletonLoader />
        ) : (
          <div className="space-y-3 md:space-y-6 lg:space-y-8">
            {/* Estadísticas Generales */}
            <EstadisticasGenerales datos={datosReporte.estadisticasGenerales} costoServicios={datosReporte.costoTotalServicios} />

            {/* Grid de gráficos - 2 columnas en desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
              <GraficoPartesEmpleados datos={datosReporte.empleados} />
              <GraficoPartesObras datos={datosReporte.obras} />
            </div>

            {/* Gráfico de distribución */}
            <GraficoDistribucionTrabajos datos={datosReporte.distribucion} />

            {/* Tablas detalladas */}
            <div className="space-y-3 md:space-y-6">
              <TablaReporteEmpleados datos={datosReporte.empleados} />
              <TablaReporteObras datos={datosReporte.obras} />
              <TablaReporteTrabajos datos={datosReporte.materiales} />

              {/* Tabla de Servicios / Otros Trabajos */}
              {datosReporte.servicios.length > 0 && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-4 py-4 sm:px-6 border-b border-gray-200 bg-orange-50">
                    <h3 className="text-lg font-semibold text-orange-800 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Servicios y Otros Trabajos
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripcion</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Registros</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cantidad Total</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Coste Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {datosReporte.servicios.map((srv, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">
                              {srv.codigo ? (
                                <span className="font-mono font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                                  {srv.codigo}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs italic">Libre</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800">{srv.descripcion}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-600">{srv.num_registros}</td>
                            <td className="px-4 py-3 text-sm text-center text-gray-600">
                              {srv.total_cantidad} {srv.unidad}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                              {srv.total_costo.toFixed(2)} €
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-orange-50 font-semibold">
                          <td colSpan="4" className="px-4 py-3 text-sm text-right text-orange-800">
                            Total Servicios:
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-orange-800">
                            {datosReporte.servicios.reduce((s, srv) => s + srv.total_costo, 0).toFixed(2)} €
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reportes;
