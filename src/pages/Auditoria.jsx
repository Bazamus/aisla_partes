import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { AdminRoute } from '../components/auth/RoleRoutes';
import { PermissionGuard } from '../components/auth/PermissionGuard';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Auditoria() {
  return (
    <AdminRoute>
      <PermissionGuard
        requiredPermission="auditoria:ver"
        fallback={
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    No tienes permiso para acceder al registro de auditoría. Esta sección está reservada para administradores.
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <AuditoriaContent />
      </PermissionGuard>
    </AdminRoute>
  );
}

function AuditoriaContent() {
  const { hasPermission } = useAuth();
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    accion: '',
    tabla: '',
    usuario: '',
    fechaDesde: '',
    fechaHasta: ''
  });
  const [paginacion, setPaginacion] = useState({
    pagina: 1,
    porPagina: 25,
    total: 0
  });

  // Verificar que el usuario tenga permiso para ver auditoría
  useEffect(() => {
    if (!hasPermission('auditoria:ver')) {
      return;
    }
    
    cargarRegistros();
  }, [hasPermission, paginacion.pagina, paginacion.porPagina]);

  const cargarRegistros = async () => {
    setLoading(true);
    try {
      // Construir la consulta base
      let query = supabase
        .from('auditoria')
        .select('*, usuarios:user_id(email)', { count: 'exact' })
        .order('created_at', { ascending: false });
      
      // Aplicar filtros si existen
      if (filtros.accion) {
        query = query.ilike('accion', `%${filtros.accion}%`);
      }
      
      if (filtros.tabla) {
        query = query.ilike('tabla', `%${filtros.tabla}%`);
      }
      
      if (filtros.usuario) {
        // Primero buscar el ID del usuario por email
        const { data: usuarios } = await supabase
          .from('vista_usuarios_unificada')
          .select('id')
          .ilike('email', `%${filtros.usuario}%`);
        
        if (usuarios && usuarios.length > 0) {
          const userIds = usuarios.map(u => u.id);
          query = query.in('user_id', userIds);
        } else {
          // Si no encuentra usuarios, usar un ID que no existirá
          query = query.eq('user_id', 'no-match');
        }
      }
      
      if (filtros.fechaDesde) {
        query = query.gte('created_at', filtros.fechaDesde);
      }
      
      if (filtros.fechaHasta) {
        // Añadir un día para incluir todo el día final
        const fechaHasta = new Date(filtros.fechaHasta);
        fechaHasta.setDate(fechaHasta.getDate() + 1);
        query = query.lt('created_at', fechaHasta.toISOString());
      }
      
      // Aplicar paginación
      const desde = (paginacion.pagina - 1) * paginacion.porPagina;
      query = query.range(desde, desde + paginacion.porPagina - 1);
      
      // Ejecutar la consulta
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      setRegistros(data || []);
      setPaginacion(prev => ({ ...prev, total: count || 0 }));
    } catch (error) {
      console.error('Error al cargar registros de auditoría:', error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = (e) => {
    e.preventDefault();
    setPaginacion(prev => ({ ...prev, pagina: 1 })); // Volver a la primera página
    cargarRegistros();
  };

  const limpiarFiltros = () => {
    setFiltros({
      accion: '',
      tabla: '',
      usuario: '',
      fechaDesde: '',
      fechaHasta: ''
    });
    setPaginacion(prev => ({ ...prev, pagina: 1 }));
    cargarRegistros();
  };

  const cambiarPagina = (nuevaPagina) => {
    setPaginacion(prev => ({ ...prev, pagina: nuevaPagina }));
  };

  const formatearFecha = (fecha) => {
    try {
      return format(new Date(fecha), 'dd/MM/yyyy HH:mm:ss', { locale: es });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const formatearJSON = (json) => {
    if (!json) return '-';
    
    try {
      const obj = typeof json === 'string' ? JSON.parse(json) : json;
      return Object.entries(obj).map(([key, value]) => (
        <div key={key} className="text-xs">
          <span className="font-medium">{key}:</span> {JSON.stringify(value)}
        </div>
      ));
    } catch (error) {
      return JSON.stringify(json);
    }
  };

  // Calcular el número total de páginas
  const totalPaginas = Math.ceil(paginacion.total / paginacion.porPagina);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Registro de Auditoría</h1>
      
      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-medium mb-4">Filtros</h2>
        <form onSubmit={aplicarFiltros} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Acción</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                value={filtros.accion}
                onChange={(e) => setFiltros(prev => ({ ...prev, accion: e.target.value }))}
                placeholder="login, crear, editar..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tabla</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                value={filtros.tabla}
                onChange={(e) => setFiltros(prev => ({ ...prev, tabla: e.target.value }))}
                placeholder="usuarios, partes..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                value={filtros.usuario}
                onChange={(e) => setFiltros(prev => ({ ...prev, usuario: e.target.value }))}
                placeholder="Email del usuario"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
              <input
                type="date"
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                value={filtros.fechaDesde}
                onChange={(e) => setFiltros(prev => ({ ...prev, fechaDesde: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <input
                type="date"
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                value={filtros.fechaHasta}
                onChange={(e) => setFiltros(prev => ({ ...prev, fechaHasta: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
            <button
              type="button"
              onClick={limpiarFiltros}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm"
            >
              Limpiar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
            >
              Aplicar Filtros
            </button>
          </div>
        </form>
      </div>
      
      {/* Tabla de registros */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-700">Cargando registros...</span>
          </div>
        ) : registros.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
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
                      Fecha
                    </th>
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
                      ID Registro
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detalles
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {registros.map(registro => (
                    <tr key={registro.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatearFecha(registro.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {registro.usuarios?.email || registro.user_id?.substring(0, 8) + '...' || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          registro.accion === 'login' ? 'bg-green-100 text-green-800' :
                          registro.accion === 'logout' ? 'bg-yellow-100 text-yellow-800' :
                          registro.accion.includes('crear') ? 'bg-blue-100 text-blue-800' :
                          registro.accion.includes('editar') ? 'bg-indigo-100 text-indigo-800' :
                          registro.accion.includes('eliminar') ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {registro.accion}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {registro.tabla}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {registro.registro_id?.substring(0, 8) || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatearJSON(registro.detalles)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {registro.ip_address || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista de tarjetas para móvil */}
            <div className="md:hidden">
              {/* Indicador de resultados para móvil */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  {registros.length} {registros.length === 1 ? 'registro' : 'registros'} encontrado{registros.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="space-y-4 p-4">
                {registros.map(registro => (
                  <div key={registro.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    {/* Header con fecha y acción */}
                    <div className="mb-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-sm font-medium text-gray-900">
                          {formatearFecha(registro.created_at)}
                        </h3>
                        <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                          registro.accion === 'login' ? 'bg-green-100 text-green-800' :
                          registro.accion === 'logout' ? 'bg-yellow-100 text-yellow-800' :
                          registro.accion.includes('crear') ? 'bg-blue-100 text-blue-800' :
                          registro.accion.includes('editar') ? 'bg-indigo-100 text-indigo-800' :
                          registro.accion.includes('eliminar') ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {registro.accion}
                        </span>
                      </div>
                    </div>
                    
                    {/* Información del registro */}
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Usuario:</span>
                        <span className="font-medium text-sm text-gray-900 break-words text-right">
                          {registro.usuarios?.email || registro.user_id?.substring(0, 8) + '...' || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Tabla:</span>
                        <span className="font-medium text-sm text-gray-900">{registro.tabla}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">ID Registro:</span>
                        <span className="font-medium text-sm text-gray-900">{registro.registro_id?.substring(0, 8) || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">IP:</span>
                        <span className="font-medium text-sm text-gray-900">{registro.ip_address || '-'}</span>
                      </div>
                      {registro.detalles && (
                        <div className="flex justify-between items-start">
                          <span className="text-gray-500 text-sm">Detalles:</span>
                          <div className="font-medium text-sm text-gray-900 text-right break-words max-w-[60%]">
                            {formatearJSON(registro.detalles)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Paginación */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => cambiarPagina(Math.max(1, paginacion.pagina - 1))}
                  disabled={paginacion.pagina === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    paginacion.pagina === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Anterior
                </button>
                <button
                  onClick={() => cambiarPagina(Math.min(totalPaginas, paginacion.pagina + 1))}
                  disabled={paginacion.pagina === totalPaginas}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    paginacion.pagina === totalPaginas ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{((paginacion.pagina - 1) * paginacion.porPagina) + 1}</span> a <span className="font-medium">{Math.min(paginacion.pagina * paginacion.porPagina, paginacion.total)}</span> de <span className="font-medium">{paginacion.total}</span> resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => cambiarPagina(1)}
                      disabled={paginacion.pagina === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                        paginacion.pagina === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Primera</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => cambiarPagina(Math.max(1, paginacion.pagina - 1))}
                      disabled={paginacion.pagina === 1}
                      className={`relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium ${
                        paginacion.pagina === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Anterior</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Números de página */}
                    {[...Array(Math.min(5, totalPaginas))].map((_, i) => {
                      let pageNum;
                      if (totalPaginas <= 5) {
                        pageNum = i + 1;
                      } else if (paginacion.pagina <= 3) {
                        pageNum = i + 1;
                      } else if (paginacion.pagina >= totalPaginas - 2) {
                        pageNum = totalPaginas - 4 + i;
                      } else {
                        pageNum = paginacion.pagina - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => cambiarPagina(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            paginacion.pagina === pageNum
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => cambiarPagina(Math.min(totalPaginas, paginacion.pagina + 1))}
                      disabled={paginacion.pagina === totalPaginas}
                      className={`relative inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium ${
                        paginacion.pagina === totalPaginas ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Siguiente</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => cambiarPagina(totalPaginas)}
                      disabled={paginacion.pagina === totalPaginas}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                        paginacion.pagina === totalPaginas ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Última</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
