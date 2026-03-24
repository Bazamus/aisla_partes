import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  CalendarIcon,
  UserIcon,
  ClockIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  FunnelIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

export default function AuditoriaDetallada() {
  const { isAdmin } = useAuth();
  const [registros, setRegistros] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    usuario: '',
    accion: '',
    tabla: '',
    fechaDesde: '',
    fechaHasta: new Date().toISOString().split('T')[0]
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [paginacion, setPaginacion] = useState({
    pagina: 1,
    totalPaginas: 1,
    total: 0,
    limite: 20
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar datos de auditoría
  useEffect(() => {
    cargarDatos();
  }, [paginacion.pagina, filtros]);

  const cargarDatos = async () => {
    if (!isAdmin) {
      toast.error('No tienes permisos para ver el registro de auditoría');
      return;
    }
    
    try {
      setLoading(true);
      
      // Calcular el offset para la paginación
      const offset = (paginacion.pagina - 1) * paginacion.limite;
      
      // Construir la consulta base
      let query = supabase
        .from('auditoria')
        .select(`
          id,
          accion,
          tabla,
          registro_id,
          user_id,
          detalles,
          created_at
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + paginacion.limite - 1);
      
      // Aplicar filtros si existen
      if (filtros.usuario) {
        query = query.eq('user_id', filtros.usuario);
      }
      
      if (filtros.accion) {
        query = query.eq('accion', filtros.accion);
      }
      
      if (filtros.tabla) {
        query = query.eq('tabla', filtros.tabla);
      }
      
      if (filtros.fechaDesde) {
        const fechaInicio = new Date(filtros.fechaDesde);
        fechaInicio.setHours(0, 0, 0, 0);
        query = query.gte('created_at', fechaInicio.toISOString());
      }
      
      if (filtros.fechaHasta) {
        // Ajustar la fecha hasta el final del día
        const fechaHasta = new Date(filtros.fechaHasta);
        fechaHasta.setHours(23, 59, 59, 999);
        query = query.lte('created_at', fechaHasta.toISOString());
      }
      
      // Ejecutar la consulta
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      setRegistros(data || []);
      setPaginacion(prev => ({
        ...prev,
        total: count || 0,
        totalPaginas: Math.ceil((count || 0) / paginacion.limite)
      }));
      
      // Cargar lista de usuarios para filtros si es la primera carga
      if (usuarios.length === 0) {
        cargarUsuarios();
      }
    } catch (error) {
      console.error('Error al cargar datos de auditoría:', error);
      toast.error('Error al cargar los registros de auditoría');
    } finally {
      setLoading(false);
    }
  };

  // Cargar usuarios para el filtro
  const cargarUsuarios = async () => {
    try {
      const { data: usuariosData, error } = await supabase
        .from('users')
        .select('id, email')
        .order('email');
        
      if (error) throw error;
      
      // Eliminar duplicados (un usuario puede tener varios roles)
      const usuariosUnicos = Array.from(
        new Map(usuariosData.map(item => [item.id, item])).values()
      );
      
      setUsuarios(usuariosUnicos);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  // Aplicar filtros
  const aplicarFiltros = (e) => {
    e.preventDefault();
    setPaginacion(prev => ({ ...prev, pagina: 1 })); // Volver a la primera página al filtrar
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      usuario: '',
      accion: '',
      tabla: '',
      fechaDesde: '',
      fechaHasta: new Date().toISOString().split('T')[0]
    });
    setPaginacion(prev => ({ ...prev, pagina: 1 }));
  };

  // Cambiar página
  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina < 1 || nuevaPagina > paginacion.totalPaginas) return;
    setPaginacion(prev => ({ ...prev, pagina: nuevaPagina }));
  };

  // Formatear fecha
  const formatearFecha = (fechaStr) => {
    try {
      const fecha = new Date(fechaStr);
      return format(fecha, "d 'de' MMMM 'de' yyyy, HH:mm:ss", { locale: es });
    } catch (error) {
      return fechaStr;
    }
  };

  // Obtener descripción de la acción
  const getDescripcionAccion = (accion) => {
    switch (accion) {
      case 'login':
        return 'Inicio de sesión';
      case 'logout':
        return 'Cierre de sesión';
      case 'actualizar_perfil':
        return 'Actualización de perfil';
      case 'cambiar_contraseña':
        return 'Cambio de contraseña';
      case 'crear':
        return 'Creación de registro';
      case 'editar':
        return 'Edición de registro';
      case 'eliminar':
        return 'Eliminación de registro';
      case 'asignar_rol':
        return 'Asignación de rol';
      case 'revocar_rol':
        return 'Revocación de rol';
      default:
        return accion;
    }
  };

  // Obtener color según la acción
  const getColorByAccion = (accion) => {
    switch (accion) {
      case 'login':
        return 'bg-green-100 text-green-800';
      case 'logout':
        return 'bg-yellow-100 text-yellow-800';
      case 'actualizar_perfil':
      case 'cambiar_contraseña':
        return 'bg-blue-100 text-blue-800';
      case 'crear':
        return 'bg-indigo-100 text-indigo-800';
      case 'editar':
        return 'bg-purple-100 text-purple-800';
      case 'eliminar':
        return 'bg-red-100 text-red-800';
      case 'asignar_rol':
      case 'revocar_rol':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Acceso Denegado</h2>
        <p className="text-gray-600">No tienes permisos para ver el registro de auditoría.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {/* Cabecera */}
      <div className="bg-gray-50 px-4 md:px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 flex items-center">
            <DocumentTextIcon className="h-5 w-5 md:h-6 md:w-6 mr-2 text-indigo-600" />
            Registro Detallado de Auditoría
          </h2>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors flex items-center text-sm"
            >
              <FunnelIcon className="h-4 w-4 mr-1" />
              {mostrarFiltros ? 'Ocultar filtros' : 'Mostrar filtros'}
            </button>
            
            <button
              onClick={cargarDatos}
              className="p-2 text-gray-500 hover:text-indigo-600 transition-colors"
              title="Recargar datos"
            >
              <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Panel de filtros */}
      {mostrarFiltros && (
        <div className="bg-gray-50 px-4 md:px-6 py-4 border-b border-gray-200">
          <form onSubmit={aplicarFiltros} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Filtro por usuario */}
              <div>
                <label htmlFor="usuario" className="block text-sm font-medium text-gray-700 mb-1">
                  Usuario
                </label>
                <select
                  id="usuario"
                  value={filtros.usuario}
                  onChange={(e) => setFiltros({ ...filtros, usuario: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  <option value="">Todos los usuarios</option>
                  {usuarios.map((usuario) => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.email}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Filtro por acción */}
              <div>
                <label htmlFor="accion" className="block text-sm font-medium text-gray-700 mb-1">
                  Acción
                </label>
                <select
                  id="accion"
                  value={filtros.accion}
                  onChange={(e) => setFiltros({ ...filtros, accion: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  <option value="">Todas las acciones</option>
                  <option value="login">Inicio de sesión</option>
                  <option value="logout">Cierre de sesión</option>
                  <option value="crear">Creación</option>
                  <option value="editar">Edición</option>
                  <option value="eliminar">Eliminación</option>
                  <option value="asignar_rol">Asignación de rol</option>
                  <option value="revocar_rol">Revocación de rol</option>
                </select>
              </div>
              
              {/* Filtro por tabla */}
              <div>
                <label htmlFor="tabla" className="block text-sm font-medium text-gray-700 mb-1">
                  Tabla
                </label>
                <select
                  id="tabla"
                  value={filtros.tabla}
                  onChange={(e) => setFiltros({ ...filtros, tabla: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                  <option value="">Todas las tablas</option>
                  <option value="usuarios">Usuarios</option>
                  <option value="partes">Partes</option>
                  <option value="empleados">Empleados</option>
                  <option value="obras">Obras</option>
                  <option value="roles">Roles</option>
                </select>
              </div>
              
              {/* Filtro por fecha desde */}
              <div>
                <label htmlFor="fechaDesde" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha desde
                </label>
                <input
                  type="date"
                  id="fechaDesde"
                  value={filtros.fechaDesde}
                  onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
              
              {/* Filtro por fecha hasta */}
              <div>
                <label htmlFor="fechaHasta" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha hasta
                </label>
                <input
                  type="date"
                  id="fechaHasta"
                  value={filtros.fechaHasta}
                  onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                type="button"
                onClick={limpiarFiltros}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors flex items-center justify-center text-sm"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Limpiar
              </button>
              
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center text-sm"
              >
                <MagnifyingGlassIcon className="h-4 w-4 mr-1" />
                Aplicar filtros
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Contenido de registros */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : registros.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          No se encontraron registros de auditoría
        </div>
      ) : (
        <>
          {/* Vista de tabla para desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acción
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tabla
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha y Hora
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detalles
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {registros.map((registro) => (
                  <tr key={registro.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">
                          {registro.user_id ? `Usuario ID: ${registro.user_id.substring(0, 8)}...` : 'Usuario desconocido'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getColorByAccion(registro.accion)}`}>
                        {getDescripcionAccion(registro.accion)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{registro.tabla || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {formatearFecha(registro.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {registro.detalles && Object.keys(registro.detalles).length > 0 ? (
                        <details className="text-sm text-gray-500">
                          <summary className="cursor-pointer text-indigo-600 hover:text-indigo-800">
                            Ver detalles
                          </summary>
                          <div className="mt-2 p-2 bg-gray-50 rounded-md overflow-x-auto">
                            <pre className="text-xs">
                              {JSON.stringify(registro.detalles, null, 2)}
                            </pre>
                          </div>
                        </details>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista de tarjetas para móvil */}
          <div className="md:hidden">
            {/* Indicador de resultados para móvil */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg mx-4 mt-4">
              <p className="text-sm text-gray-600">
                {registros.length} {registros.length === 1 ? 'registro' : 'registros'} encontrado{registros.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="space-y-4 p-4">
              {registros.map((registro) => (
                <div key={registro.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  {/* Header con fecha y acción */}
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm font-medium text-gray-900 flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {formatearFecha(registro.created_at)}
                      </h3>
                      <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${getColorByAccion(registro.accion)}`}>
                        {getDescripcionAccion(registro.accion)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Información del registro */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm">Usuario:</span>
                      <span className="font-medium text-sm text-gray-900 break-words text-right flex items-center">
                        <UserIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {registro.user_id ? `ID: ${registro.user_id.substring(0, 8)}...` : 'Usuario desconocido'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm">Tabla:</span>
                      <span className="font-medium text-sm text-gray-900">{registro.tabla || '-'}</span>
                    </div>
                    {registro.detalles && Object.keys(registro.detalles).length > 0 && (
                      <div className="flex justify-between items-start">
                        <span className="text-gray-500 text-sm">Detalles:</span>
                        <div className="font-medium text-sm text-gray-900 text-right break-words max-w-[60%]">
                          <details className="text-sm text-gray-500">
                            <summary className="cursor-pointer text-indigo-600 hover:text-indigo-800">
                              Ver detalles
                            </summary>
                            <div className="mt-2 p-2 bg-gray-50 rounded-md overflow-x-auto">
                              <pre className="text-xs">
                                {JSON.stringify(registro.detalles, null, 2)}
                              </pre>
                            </div>
                          </details>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      
      {/* Paginación */}
      {!loading && registros.length > 0 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => cambiarPagina(paginacion.pagina - 1)}
              disabled={paginacion.pagina === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                paginacion.pagina === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Anterior
            </button>
            <button
              onClick={() => cambiarPagina(paginacion.pagina + 1)}
              disabled={paginacion.pagina === paginacion.totalPaginas}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                paginacion.pagina === paginacion.totalPaginas ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{(paginacion.pagina - 1) * paginacion.limite + 1}</span> a{' '}
                <span className="font-medium">
                  {Math.min(paginacion.pagina * paginacion.limite, paginacion.total)}
                </span>{' '}
                de <span className="font-medium">{paginacion.total}</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => cambiarPagina(paginacion.pagina - 1)}
                  disabled={paginacion.pagina === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Anterior</span>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                
                {/* Páginas */}
                {Array.from({ length: Math.min(5, paginacion.totalPaginas) }, (_, i) => {
                  let pageNumber;
                  if (paginacion.totalPaginas <= 5) {
                    pageNumber = i + 1;
                  } else if (paginacion.pagina <= 3) {
                    pageNumber = i + 1;
                  } else if (paginacion.pagina >= paginacion.totalPaginas - 2) {
                    pageNumber = paginacion.totalPaginas - 4 + i;
                  } else {
                    pageNumber = paginacion.pagina - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => cambiarPagina(pageNumber)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        paginacion.pagina === pageNumber
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => cambiarPagina(paginacion.pagina + 1)}
                  disabled={paginacion.pagina === paginacion.totalPaginas}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Siguiente</span>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
