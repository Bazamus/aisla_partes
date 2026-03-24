import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as parteProveedorService from '../services/parteProveedorService';
import VerificacionTablas from '../components/partes-proveedores/VerificacionTablas';
import * as importExportService from '../services/importExportService';
import toast from 'react-hot-toast';
import { PermissionGuard } from '../components/auth/PermissionGuard';
import { useAuth } from '../contexts/AuthContext';

const PartesProveedoresListPage = () => {
  console.log('Renderizando PartesProveedoresListPage');
  
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [partes, setPartes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [exportando, setExportando] = useState(false);

  // Cargar partes de proveedores
  useEffect(() => {
    console.log('useEffect en PartesProveedoresListPage');
    
    const cargarPartes = async () => {
      try {
        console.log('Intentando cargar partes de proveedores...');
        const data = await parteProveedorService.getPartesProveedores();
        console.log('Partes de proveedores cargados:', data);
        setPartes(data || []);
      } catch (err) {
        console.error('Error al cargar partes de proveedores:', err);
        setError('Error al cargar los partes de proveedores. Inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    };
    
    cargarPartes();
  }, []);

  // Eliminar un parte
  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este parte? Esta acción no se puede deshacer.')) {
      return;
    }
    
    setDeleting(id);
    
    try {
      await parteProveedorService.deleteParteProveedor(id);
      setPartes(partes.filter(parte => parte.id !== id));
    } catch (err) {
      console.error('Error al eliminar parte de proveedor:', err);
      setError('Error al eliminar el parte. Inténtalo de nuevo.');
    } finally {
      setDeleting(null);
    }
  };

  // Formatear fecha
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES');
  };

  // Función para manejar clic en fila
  const handleRowClick = (parteId) => {
    navigate(`/parte-proveedor/ver/${parteId}`);
  };

  // Función para prevenir propagación de eventos en botones
  const handleButtonClick = (e) => {
    e.stopPropagation();
  };

  // Exportar todos los partes de proveedores a Excel
  const handleExportarPartes = async () => {
    if (partes.length === 0) {
      toast.error('No hay partes para exportar');
      return;
    }

    setExportando(true);
    
    try {
      // Obtener los datos completos de todos los partes
      const partesCompletos = await Promise.all(
        partes.map(parte => parteProveedorService.getParteProveedorById(parte.id))
      );
      
      // Filtrar cualquier parte que no se haya podido obtener
      const partesValidos = partesCompletos.filter(parte => parte !== null);
      
      if (partesValidos.length === 0) {
        toast.error('No se pudieron obtener los datos de los partes');
        return;
      }
      
      // Exportar los partes a Excel
      await importExportService.exportarPartesProveedores(partesValidos);
      
    } catch (err) {
      console.error('Error al exportar partes de proveedores:', err);
      toast.error('Error al exportar los partes. Inténtalo de nuevo.');
    } finally {
      setExportando(false);
    }
  };

  console.log('Renderizando contenido de PartesProveedoresListPage, loading:', loading, 'partes:', partes.length);

  return (
    // Se eliminó container mx-auto px-4 py-8 para que Layout.jsx controle el contenedor
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-0">Partes de Proveedores</h1>
        
        <div className="grid grid-cols-2 md:flex md:space-x-3 gap-2 w-full md:w-auto">
          <PermissionGuard
            requiredPermission="partes:exportar"
            fallback={
              <button
                disabled={true}
                className="inline-flex items-center justify-center px-3 md:px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-400 cursor-not-allowed opacity-50"
                aria-label="No tienes permiso para exportar partes"
              >
                <svg className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                <span className="hidden sm:inline">Exportar Partes</span>
                <span className="sm:hidden">Exportar</span>
              </button>
            }
          >
            <button
              onClick={handleExportarPartes}
              disabled={exportando || partes.length === 0}
              className="inline-flex items-center justify-center px-3 md:px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Exportar partes de proveedores a Excel"
            >
              <svg className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              {exportando ? (
                <span className="hidden sm:inline">Exportando...</span>
              ) : (
                <>
                  <span className="hidden sm:inline">Exportar Partes</span>
                  <span className="sm:hidden">Exportar</span>
                </>
              )}
            </button>
          </PermissionGuard>
          
          <PermissionGuard
            requiredPermission="partes:crear"
            fallback={
              <button
                disabled={true}
                className="inline-flex items-center justify-center px-3 md:px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-400 cursor-not-allowed opacity-50"
                aria-label="No tienes permiso para crear nuevos partes"
              >
                <svg className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">Nuevo Parte</span>
                <span className="sm:hidden">Nuevo</span>
              </button>
            }
          >
            <Link
              to="/parte-proveedor/nuevo"
              className="inline-flex items-center justify-center px-3 md:px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              aria-label="Crear nuevo parte de proveedor"
            >
              <svg className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Nuevo Parte</span>
              <span className="sm:hidden">Nuevo</span>
            </Link>
          </PermissionGuard>
        </div>
      </div>
      
      {/* Componente de verificación de tablas */}
      <VerificacionTablas />
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent"></div>
          <span className="ml-3 text-gray-700">Cargando partes de proveedores...</span>
        </div>
      ) : partes.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500 mb-4">No hay partes de proveedores registrados.</p>
          <Link
            to="/parte-proveedor/nuevo"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Crear primer parte
          </Link>
        </div>
      ) : (
        <>
          {/* Vista de tabla para desktop */}
          <div className="hidden md:block bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {partes.map((parte) => (
                <li key={parte.id}>
                  <div 
                    className="px-4 py-4 sm:px-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleRowClick(parte.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {parte.empresa || 'Proveedor sin nombre'}
                        </p>
                        <p className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {formatearFecha(parte.fecha)}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <PermissionGuard
                          requiredPermission="partes:editar"
                          fallback={
                            <span className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-gray-500 bg-gray-100 cursor-not-allowed">
                              Editar
                            </span>
                          }
                        >
                          <Link
                            to={`/parte-proveedor/editar/${parte.id}`}
                            onClick={handleButtonClick}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Editar
                          </Link>
                        </PermissionGuard>
                        
                        <PermissionGuard
                          requiredPermission="partes:eliminar"
                          fallback={
                            <span className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-gray-500 bg-gray-100 cursor-not-allowed">
                              Eliminar
                            </span>
                          }
                        >
                          <button
                            onClick={(e) => {
                              handleButtonClick(e);
                              handleDelete(parte.id);
                            }}
                            disabled={deleting === parte.id}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            {deleting === parte.id ? 'Eliminando...' : 'Eliminar'}
                          </button>
                        </PermissionGuard>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {parte.descripcion || 'Sin descripción'}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p className="flex items-center mr-4">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" clipRule="evenodd" />
                          </svg>
                          <span className={`font-medium ${
                            parte.estado === 'Aprobado' 
                              ? 'text-green-700' 
                              : parte.estado === 'Pendiente de Revisión' 
                              ? 'text-yellow-700' 
                              : parte.estado === 'Rechazado'
                              ? 'text-red-700'
                              : 'text-blue-700'
                          }`}>
                            {parte.estado || 'Borrador'}
                          </span>
                          {parte.estado === 'Borrador' && 
                            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">Edición</span>
                          }
                          {parte.estado === 'Pendiente de Revisión' && 
                            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">En Revisión</span>
                          }
                          {parte.estado === 'Aprobado' && 
                            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-green-100 text-green-800">Validado</span>
                          }
                          {parte.estado === 'Rechazado' && 
                            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-red-100 text-red-800">Corrección</span>
                          }
                        </p>
                        <p>
                          Total: {parte.coste_total ? `${parte.coste_total.toFixed(2)}€` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Vista de tarjetas para móvil */}
          <div className="md:hidden">
            {/* Indicador de resultados para móvil */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                {partes.length} {partes.length === 1 ? 'parte' : 'partes'} encontrado{partes.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="space-y-4">
              {partes.map((parte) => (
                <div 
                  key={parte.id} 
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleRowClick(parte.id)}
                >
                  {/* Header con empresa y fecha */}
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-indigo-600 break-words leading-tight">
                        {parte.empresa || 'Proveedor sin nombre'}
                      </h3>
                      <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800 ml-2 flex-shrink-0">
                        {formatearFecha(parte.fecha)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Información del parte */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-start">
                      <span className="text-gray-500 text-sm">Descripción:</span>
                      <span className="font-medium text-sm text-gray-900 break-words text-right">
                        {parte.descripcion || 'Sin descripción'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm flex items-center">
                        <svg className="mr-1 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" clipRule="evenodd" />
                        </svg>
                        Estado:
                      </span>
                      <div className="text-right">
                        <span className={`font-medium text-sm ${
                          parte.estado === 'Aprobado' 
                            ? 'text-green-700' 
                            : parte.estado === 'Pendiente de Revisión' 
                            ? 'text-yellow-700' 
                            : parte.estado === 'Rechazado'
                            ? 'text-red-700'
                            : 'text-blue-700'
                        }`}>
                          {parte.estado || 'Borrador'}
                        </span>
                        {parte.estado === 'Borrador' && 
                          <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">Edición</span>
                        }
                        {parte.estado === 'Pendiente de Revisión' && 
                          <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">En Revisión</span>
                        }
                        {parte.estado === 'Aprobado' && 
                          <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-green-100 text-green-800">Validado</span>
                        }
                        {parte.estado === 'Rechazado' && 
                          <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-red-100 text-red-800">Corrección</span>
                        }
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm">Total:</span>
                      <span className="font-semibold text-lg text-green-600">
                        {parte.coste_total ? `${parte.coste_total.toFixed(2)}€` : 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Botones de acción */}
                  <div className="flex space-x-2 pt-3 border-t border-gray-100">
                    <PermissionGuard
                      requiredPermission="partes:editar"
                      fallback={
                        <span className="flex-1 flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded text-gray-500 bg-gray-100 cursor-not-allowed">
                          Editar
                        </span>
                      }
                    >
                      <Link
                        to={`/parte-proveedor/editar/${parte.id}`}
                        onClick={handleButtonClick}
                        className="flex-1 flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Editar
                      </Link>
                    </PermissionGuard>
                    
                    <PermissionGuard
                      requiredPermission="partes:eliminar"
                      fallback={
                        <span className="flex-1 flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded text-gray-500 bg-gray-100 cursor-not-allowed">
                          Eliminar
                        </span>
                      }
                    >
                      <button
                        onClick={(e) => {
                          handleButtonClick(e);
                          handleDelete(parte.id);
                        }}
                        disabled={deleting === parte.id}
                        className="flex-1 flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        {deleting === parte.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </PermissionGuard>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PartesProveedoresListPage;
