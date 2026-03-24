import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import * as exportService from '../../services/exportService';
import { verificarYCorregirPermisosEmpleado } from '../../utils/permisosEmpleado';
import * as parteEmpleadoService from '../../services/parteEmpleadoService';
import {
  ArrowDownTrayIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/dateUtils';
import { formatParteNumber } from '../../utils/formatUtils';

export default function DashboardEmpleado() {
  const navigate = useNavigate();
  const { user, hasPermission, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [empleado, setEmpleado] = useState(null);
  const [obrasAsignadas, setObrasAsignadas] = useState([]);
  const [partes, setPartes] = useState([]);
  const [filteredPartes, setFilteredPartes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [error, setError] = useState(null);

  const cargarDatos = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Ejecutar la verificación y corrección de permisos.
      console.log('Verificando y corrigiendo permisos de empleado...');
      const seHicieronCambios = await verificarYCorregirPermisosEmpleado(user.id);

      // 2. Si se realizaron cambios, forzar un refresco completo de la página para asegurar que los nuevos permisos se cargan.
      if (seHicieronCambios) {
        toast.success('Permisos actualizados. Refrescando la página...');
        console.log('Se detectaron cambios en los permisos, recargando la página para aplicarlos...');
        // Usamos un pequeño delay para que el toast sea visible antes del refresco.
        setTimeout(() => window.location.reload(), 1500);
        // Detenemos la ejecución de esta función para evitar errores mientras recarga.
        return;
      }

      // 2. Cargar datos del perfil del empleado
      console.log('Cargando datos del perfil del empleado...');
      const empleadoData = await parteEmpleadoService.getEmpleadoFromUser();

      if (!empleadoData) {
        toast.error('No se pudo cargar el perfil del empleado. Verifica tu cuenta o contacta a soporte.');
        setError('No se pudo cargar el perfil del empleado.');
        setLoading(false);
        return; // Detener la carga si el empleado es esencial
      }
      setEmpleado(empleadoData);

      // 3. Cargar partes de trabajo del empleado
      console.log('Cargando partes de trabajo del empleado...');
      console.log('🔍 DEBUG: Permisos del empleado:', {
        'partes:crear': hasPermission('partes:crear'),
        'partes:leer': hasPermission('partes:leer'),
        'partes:editar': hasPermission('partes:editar'),
        'partes:eliminar': hasPermission('partes:eliminar')
      });
      const partesData = await parteEmpleadoService.getPartesByEmpleadoUserId(user.id);
      setPartes(partesData); // El servicio devuelve un array, incluso vacío

      // 4. Cargar obras asignadas
      console.log('Cargando obras asignadas para el usuario:', user.id);
      const obrasData = await parteEmpleadoService.getObrasAsignadasEmpleado(user.id);
      setObrasAsignadas(obrasData);
      console.log('✅ Obras asignadas cargadas:', obrasData.length, obrasData);

    } catch (err) {
      console.error('Error en cargarDatos:', err);
      setError(err.message);
      toast.error(err.message);
      setPartes([]);
      setObrasAsignadas([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    if (!partes) {
      setFilteredPartes([]);
      return;
    }

    const filtered = partes.filter(parte => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' ||
        (parte.numero_parte && parte.numero_parte.toString().toLowerCase().includes(lowerSearchTerm)) ||
        (parte.nombre_obra && parte.nombre_obra.toLowerCase().includes(lowerSearchTerm)) ||
        (parte.nombre_trabajador && parte.nombre_trabajador.toLowerCase().includes(lowerSearchTerm));

      const matchesEstado = estadoFilter === 'todos' || parte.estado === estadoFilter;

      let matchesDate = true;
      if (dateRange.startDate && dateRange.endDate) {
        try {
            const parteDate = new Date(parte.fecha);
            const startDate = new Date(dateRange.startDate);
            const endDate = new Date(dateRange.endDate);
            if (!isNaN(parteDate.getTime()) && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                endDate.setHours(23, 59, 59, 999);
                matchesDate = parteDate >= startDate && parteDate <= endDate;
            } else {
                matchesDate = false;
            }
        } catch(e) {
            matchesDate = false;
            console.error("Error parsing date for filtering", e);
        }
      }

      return matchesSearch && matchesEstado && matchesDate;
    });

    setFilteredPartes(filtered);
  }, [searchTerm, estadoFilter, dateRange, partes]);

  const handleDescargarPDF = async (parteResumido) => {
    if (!hasPermission('partes:leer')) {
      toast.error('No tienes permiso para descargar partes.');
      return;
    }
    if (!parteResumido || !parteResumido.id) {
      toast.error('Información del parte incompleta para generar PDF.');
      return;
    }

    const toastId = toast.loading('Generando PDF...');

    try {
      // 1. Obtener los datos completos del parte
      const parteCompleto = await parteEmpleadoService.getParteById(parteResumido.id);
      if (!parteCompleto) {
        throw new Error('No se pudieron obtener los detalles completos del parte.');
      }

      // 2. Generar el documento PDF usando la función correcta
      const doc = await exportService.generateEmpleadoPDF(parteCompleto);
      
      // 3. Guardar y descargar el archivo PDF
      const fileName = `Parte_${formatParteNumber(parteCompleto) || parteCompleto.id}.pdf`;
      doc.save(fileName);

      toast.success('PDF generado y descargado con éxito.', { id: toastId });

    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error(`Error al generar PDF: ${error.message}`, { id: toastId });
    }
  };

  const handleVerParte = (parte) => {
    navigate(`/ver-detalle/empleado/${parte.id}`);
  };

  const handleNuevoParte = () => {
    if (!hasPermission('partes:crear')) {
      toast.error('No tienes permiso para crear nuevos partes.');
      console.error('Intento de crear parte sin permiso por usuario:', user?.id);
      return;
    }
    navigate('/parte-empleado', { state: { empleadoId: empleado?.id, userId: user?.id } });
  };

  // Navegar a la página de obras asignadas
  const handleVerObrasAsignadas = () => {
    console.log('[Debug InicioEmpleado] Navegando a obras asignadas. Total obras:', obrasAsignadas.length);
    
    // Aunque no haya obras asignadas, navegamos igualmente pero mostramos un mensaje informativo
    if (obrasAsignadas.length === 0) {
              toast('No tienes obras asignadas actualmente. La página estará vacía.');
    }
    
    // Navegar a la página de obras asignadas del empleado
    navigate('/empleado/obras-asignadas', { state: { obrasData: obrasAsignadas } });
  };

    const handleDeleteParte = async (e, parte) => {
    e.stopPropagation();

    // 1. Verificar estado - Los empleados pueden eliminar sus propios partes en Borrador
    if (parte.estado !== 'Borrador') {
      toast.error('Solo se pueden eliminar partes en estado "Borrador".');
      return;
    }

    // 2. Pedir confirmación
    if (!confirm(`¿Estás seguro de que quieres eliminar el parte ${formatParteNumber(parte)}? Esta acción no se puede deshacer.`)) {
      return;
    }

    const toastId = toast.loading('Eliminando parte...');
    
    try {
      // 3. Ejecutar borrado
      await parteEmpleadoService.deleteParteEmpleado(parte.id);
      setPartes(prevPartes => prevPartes.filter(p => p.id !== parte.id));
      setFilteredPartes(prevPartes => prevPartes.filter(p => p.id !== parte.id));
      toast.success('Parte eliminado con éxito.', { id: toastId });
    } catch (error) {
      console.error('Error al eliminar el parte:', error);
      toast.error(`Error al eliminar: ${error.message || 'Error desconocido'}`, { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas de acceso rápido */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Tarjeta de Nuevo Parte */}
        <div
          onClick={hasPermission('partes:crear') ? handleNuevoParte : () => {}}
          className={`bg-white rounded-xl shadow-sm p-6 transition-shadow ${hasPermission('partes:crear') 
            ? 'cursor-pointer hover:shadow-md' 
            : 'bg-gray-100 cursor-not-allowed opacity-50'}`
          }
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg mr-4">
                <PlusIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Nuevo Parte</h3>
                <p className="text-sm text-gray-500">Crear un nuevo parte de trabajo</p>
              </div>
            </div>
            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Tarjeta de Obras Asignadas */}
        <div 
          onClick={handleVerObrasAsignadas}
          className="bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-amber-100 p-3 rounded-lg mr-4">
                <BuildingOfficeIcon className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Obras Asignadas</h3>
                <p className="text-sm text-gray-500">
                  {obrasAsignadas.length > 0 
                    ? `Ver las ${obrasAsignadas.length} obras asignadas` 
                    : "No tienes obras asignadas"}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              {obrasAsignadas.length > 0 && (
                <span className="bg-amber-100 text-amber-800 text-xs font-medium mr-2 px-2.5 py-1 rounded-full">
                  {obrasAsignadas.length}
                </span>
              )}
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Barra de filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Buscador */}
          <div className="relative flex-1">
            <input
              type="search"
              placeholder="Buscar partes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
            />
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>

          {/* Filtro de fecha */}
          <div className="flex gap-2 items-center">
            <div className="relative">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
              />
              <CalendarIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
            <span className="text-gray-500">a</span>
            <div className="relative">
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
              />
              <CalendarIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>

          {/* Filtro de estado */}
          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
          >
            <option value="todos">Todos los estados</option>
            <option value="Borrador">Borrador</option>
            <option value="Pendiente de Revisión">Pendiente de Revisión</option>
            <option value="Aprobado">Aprobado</option>
            <option value="Rechazado">Rechazado</option>
          </select>
        </div>
      </div>

      {/* Listado de partes */}
      <h2 id="partes-trabajo-section" className="text-xl font-bold text-gray-900">Mis Partes de Trabajo</h2>
      
      {filteredPartes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPartes.map((parte) => (
            <div 
              key={parte.id}
              onClick={() => handleVerParte(parte)}
              className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="p-5 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Parte #{formatParteNumber(parte)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(parte.fecha)}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    parte.estado === 'Aprobado'
                      ? 'bg-green-100 text-green-800'
                      : parte.estado === 'Pendiente de Revisión'
                      ? 'bg-yellow-100 text-yellow-800'
                      : parte.estado === 'Rechazado'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {parte.estado || 'Borrador'}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-gray-700">
                    <BuildingOfficeIcon className="w-4 h-4 mr-2 text-gray-500" />
                    <p className="text-sm truncate">{parte.nombre_obra || 'Sin obra asignada'}</p>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <UserIcon className="w-4 h-4 mr-2 text-gray-500" />
                    <p className="text-sm truncate">{parte.nombre_trabajador || 'Sin asignar'}</p>
                  </div>
                </div>

                {parte.coste_trabajos > 0 && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-500">Importe total</span>
                    <span className="text-base font-bold text-green-600">
                      €{Number(parte.coste_trabajos).toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="mt-auto pt-4">
                  {parte.estado === 'Borrador' ? (
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        disabled
                        className="inline-flex items-center justify-center px-2 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-400 bg-gray-50 cursor-not-allowed transition-all"
                        title="Descarga de PDF deshabilitada para empleados"
                      >
                        <ArrowDownTrayIcon className="w-3 h-3 mr-1" />
                        PDF
                      </button>
                      <button
                        onClick={(e) => handleDeleteParte(e, parte)}
                        disabled={parte.estado !== 'Borrador'}
                        className={`inline-flex items-center justify-center px-2 py-1.5 text-xs border rounded-lg transition-all ${
                          parte.estado === 'Borrador'
                            ? 'border-red-300 text-red-600 bg-white hover:bg-red-50'
                            : 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed'
                        }`}
                      >
                        <TrashIcon className="w-3 h-3 mr-1" />
                        Eliminar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVerParte(parte);
                        }}
                        className="inline-flex items-center justify-center px-2 py-1.5 text-xs border border-indigo-300 rounded-lg text-indigo-600 bg-white hover:bg-indigo-50 transition-all"
                      >
                        Ver Parte
                        <ChevronRightIcon className="w-3 h-3 ml-1" />
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        disabled
                        className="inline-flex items-center justify-center px-2 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-400 bg-gray-50 cursor-not-allowed transition-all"
                        title="Descarga de PDF deshabilitada para empleados"
                      >
                        <ArrowDownTrayIcon className="w-3 h-3 mr-1" />
                        PDF
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVerParte(parte);
                        }}
                        className="inline-flex items-center justify-center px-2 py-1.5 text-xs border border-transparent rounded-lg text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-all"
                      >
                        <DocumentTextIcon className="w-3 h-3 mr-1" />
                        Ver
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <p className="text-gray-500">No se encontraron partes de trabajo</p>
          <button 
            onClick={handleNuevoParte}
            disabled={!hasPermission('partes:crear')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Crear nuevo parte
          </button>
        </div>
      )}
    </div>
  );
}
