import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import TrabajosSelector from './TrabajosSelector';
import { getPreciosProveedor, actualizarPrecioProveedor, desactivarPrecioProveedor, getGrupos, getSubgrupos } from '../services/preciosProveedorService';

export default function TablaPreciosProveedor({ proveedorId, nombreProveedor }) {
  const [precios, setPrecios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mostrarSelector, setMostrarSelector] = useState(false);
  const [editandoPrecio, setEditandoPrecio] = useState(null);
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [grupoSeleccionado, setGrupoSeleccionado] = useState('');
  const [subgrupoSeleccionado, setSubgrupoSeleccionado] = useState('');
  const [grupos, setGrupos] = useState([]);
  const [subgrupos, setSubgrupos] = useState([]);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Cargar precios del proveedor
  const cargarPrecios = async () => {
    if (!proveedorId) return;
    
    setCargando(true);
    try {
      const data = await getPreciosProveedor(proveedorId);
      setPrecios(data);
    } catch (error) {
      console.error('Error al cargar precios del proveedor:', error);
      toast.error('Error al cargar los precios personalizados');
    } finally {
      setCargando(false);
    }
  };

  // Cargar precios al montar el componente o cambiar el proveedorId
  useEffect(() => {
    cargarPrecios();
  }, [proveedorId]);

  // Cargar grupos cuando se abre el filtro
  useEffect(() => {
    if (mostrarFiltros) {
      cargarGrupos();
    }
  }, [mostrarFiltros]);

  // Cargar subgrupos cuando se selecciona un grupo
  useEffect(() => {
    if (grupoSeleccionado) {
      cargarSubgrupos(grupoSeleccionado);
    } else {
      setSubgrupos([]);
      setSubgrupoSeleccionado('');
    }
  }, [grupoSeleccionado]);

  // Cargar grupos disponibles
  const cargarGrupos = async () => {
    try {
      const data = await getGrupos();
      setGrupos(data);
    } catch (error) {
      console.error('Error al cargar grupos:', error);
    }
  };

  // Cargar subgrupos según el grupo seleccionado
  const cargarSubgrupos = async (grupoId) => {
    try {
      const data = await getSubgrupos(grupoId);
      setSubgrupos(data);
    } catch (error) {
      console.error('Error al cargar subgrupos:', error);
    }
  };

  // Manejar la selección de un trabajo
  const handleTrabajosSeleccionado = async (trabajo) => {
    try {
      // Obtener el precio actual del trabajo
      const precioActual = trabajo.precio;
      
      // Crear un nuevo precio personalizado con el mismo valor que el precio general
      await actualizarPrecioProveedor(
        proveedorId,
        trabajo.id,
        precioActual,
        trabajo.codigo
      );
      
      toast.success(`Trabajo "${trabajo.trabajo}" añadido a los precios personalizados`);
      
      // Recargar la lista de precios
      await cargarPrecios();
      
      // Ocultar el selector
      setMostrarSelector(false);
    } catch (error) {
      console.error('Error al añadir precio personalizado:', error);
      toast.error('Error al añadir el precio personalizado');
    }
  };

  // Manejar la actualización de un precio
  const handleActualizarPrecio = async () => {
    if (!editandoPrecio || !nuevoPrecio) return;
    
    try {
      await actualizarPrecioProveedor(
        proveedorId,
        editandoPrecio.trabajo_id,
        nuevoPrecio,
        editandoPrecio.codigo_trabajo
      );
      
      toast.success('Precio actualizado correctamente');
      
      // Recargar la lista de precios
      await cargarPrecios();
      
      // Limpiar estado de edición
      setEditandoPrecio(null);
      setNuevoPrecio('');
    } catch (error) {
      console.error('Error al actualizar precio:', error);
      toast.error('Error al actualizar el precio');
    }
  };

  // Manejar la eliminación de un precio
  const handleEliminarPrecio = async (precio) => {
    if (!confirm(`¿Estás seguro de eliminar el precio personalizado para "${precio.lista_de_precios.trabajo}"?`)) {
      return;
    }
    
    try {
      await desactivarPrecioProveedor(precio.id);
      
      toast.success('Precio eliminado correctamente');
      
      // Recargar la lista de precios
      await cargarPrecios();
    } catch (error) {
      console.error('Error al eliminar precio:', error);
      toast.error('Error al eliminar el precio');
    }
  };

  // Filtrar precios según la búsqueda y filtros seleccionados
  const preciosFiltrados = precios.filter(precio => {
    const trabajo = precio.lista_de_precios;
    
    // Filtrar por texto de búsqueda
    const coincideTexto = !busqueda || 
      (trabajo.trabajo && trabajo.trabajo.toLowerCase().includes(busqueda.toLowerCase())) ||
      (trabajo.codigo && trabajo.codigo.toLowerCase().includes(busqueda.toLowerCase()));
    
    // Filtrar por grupo
    const coincideGrupo = !grupoSeleccionado || trabajo.grupo_id === grupoSeleccionado;
    
    // Filtrar por subgrupo
    const coincideSubgrupo = !subgrupoSeleccionado || trabajo.subgrupo_id === subgrupoSeleccionado;
    
    return coincideTexto && coincideGrupo && coincideSubgrupo;
  });

  // Calcular el diferencial en porcentaje entre precio general y personalizado
  const calcularDiferencial = (precioGeneral, precioPersonalizado) => {
    if (!precioGeneral || !precioPersonalizado) return 0;
    
    const diferencia = precioPersonalizado - precioGeneral;
    const porcentaje = (diferencia / precioGeneral) * 100;
    
    return porcentaje;
  };

  // Obtener IDs de trabajos ya seleccionados
  const trabajosSeleccionadosIds = precios.map(p => p.trabajo_id);

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
        <h2 className="text-xl font-semibold text-gray-800">
          Precios personalizados para {nombreProveedor}
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
          >
            {mostrarFiltros ? 'Ocultar filtros' : 'Mostrar filtros'}
          </button>
          
          <button
            onClick={() => setMostrarSelector(true)}
            className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          >
            Añadir trabajo
          </button>
        </div>
      </div>
      
      {/* Filtros */}
      {mostrarFiltros && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="busqueda" className="block text-sm font-medium text-gray-700 mb-1">
                Buscar por nombre o código
              </label>
              <input
                type="text"
                id="busqueda"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="grupo" className="block text-sm font-medium text-gray-700 mb-1">
                Filtrar por grupo
              </label>
              <select
                id="grupo"
                value={grupoSeleccionado}
                onChange={(e) => setGrupoSeleccionado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Todos los grupos</option>
                {grupos.map(grupo => (
                  <option key={grupo.id} value={grupo.id}>
                    {grupo.nombre}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="subgrupo" className="block text-sm font-medium text-gray-700 mb-1">
                Filtrar por subgrupo
              </label>
              <select
                id="subgrupo"
                value={subgrupoSeleccionado}
                onChange={(e) => setSubgrupoSeleccionado(e.target.value)}
                disabled={!grupoSeleccionado}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="">Todos los subgrupos</option>
                {subgrupos.map(subgrupo => (
                  <option key={subgrupo.id} value={subgrupo.id}>
                    {subgrupo.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabla de precios */}
      <div className="overflow-x-auto">
        {/* Vista de tabla para desktop */}
        <div className="hidden md:block">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Código
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Trabajo
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Grupo
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Subgrupo
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Precio general
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Precio acordado
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Diferencial
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cargando ? (
                <tr>
                  <td colSpan="8" className="py-4 px-4 text-center text-gray-500">
                    Cargando precios...
                  </td>
                </tr>
              ) : preciosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-4 px-4 text-center text-gray-500">
                    No hay precios personalizados{busqueda ? ' que coincidan con la búsqueda' : ''}
                  </td>
                </tr>
              ) : (
                preciosFiltrados.map(precio => {
                  const diferencial = calcularDiferencial(precio.lista_de_precios.precio, precio.precio);
                  const diferencialClase = diferencial > 0 
                    ? 'text-red-600' 
                    : diferencial < 0 
                      ? 'text-green-600' 
                      : 'text-gray-600';
                  
                  return (
                    <tr key={precio.id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 text-sm text-gray-900">
                        {precio.lista_de_precios.codigo || '-'}
                      </td>
                      <td className="py-2 px-4 text-sm text-gray-900">
                        {precio.lista_de_precios.trabajo}
                      </td>
                      <td className="py-2 px-4 text-sm text-gray-900">
                        {precio.lista_de_precios.grupo_nombre || '-'}
                      </td>
                      <td className="py-2 px-4 text-sm text-gray-900">
                        {precio.lista_de_precios.subgrupo_nombre || '-'}
                      </td>
                      <td className="py-2 px-4 text-sm text-gray-900">
                        {precio.lista_de_precios.precio.toFixed(2)} €
                      </td>
                      <td className="py-2 px-4 text-sm text-gray-900">
                        {editandoPrecio?.id === precio.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={nuevoPrecio}
                              onChange={(e) => setNuevoPrecio(e.target.value)}
                              className="w-24 px-2 py-1 border border-gray-300 rounded"
                              step="0.01"
                              min="0"
                            />
                            <button
                              onClick={handleActualizarPrecio}
                              className="p-1 text-green-600 hover:text-green-800"
                              title="Guardar"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                setEditandoPrecio(null);
                                setNuevoPrecio('');
                              }}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Cancelar"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <span>{precio.precio.toFixed(2)} €</span>
                        )}
                      </td>
                      <td className={`py-2 px-4 text-sm font-medium ${diferencialClase}`}>
                        {diferencial.toFixed(2)}%
                        {diferencial > 0 && ' ↑'}
                        {diferencial < 0 && ' ↓'}
                      </td>
                      <td className="py-2 px-4 text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          {editandoPrecio?.id !== precio.id && (
                            <button
                              onClick={() => {
                                setEditandoPrecio(precio);
                                setNuevoPrecio(precio.precio);
                              }}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Editar"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleEliminarPrecio(precio)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Eliminar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Vista de tarjetas para móvil */}
        <div className="md:hidden">
          {cargando ? (
            <div className="text-center py-8 text-gray-500">
              Cargando precios...
            </div>
          ) : preciosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay precios personalizados{busqueda ? ' que coincidan con la búsqueda' : ''}
            </div>
          ) : (
            <div className="space-y-4">
              {preciosFiltrados.map(precio => {
                const diferencial = calcularDiferencial(precio.lista_de_precios.precio, precio.precio);
                const diferencialClase = diferencial > 0 
                  ? 'text-red-600' 
                  : diferencial < 0 
                    ? 'text-green-600' 
                    : 'text-gray-600';
                
                return (
                  <div key={precio.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    {/* Header con código y trabajo */}
                    <div className="mb-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 break-words leading-tight">
                            {precio.lista_de_precios.trabajo}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">Código: {precio.lista_de_precios.codigo || '-'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Información del precio */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-xs">Grupo:</span>
                        <span className="font-medium text-xs">{precio.lista_de_precios.grupo_nombre || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-xs">Subgrupo:</span>
                        <span className="font-medium text-xs">{precio.lista_de_precios.subgrupo_nombre || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-xs">Precio General:</span>
                        <span className="font-medium text-xs">{precio.lista_de_precios.precio.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-xs">Precio Acordado:</span>
                        <span className="font-medium text-xs">
                          {editandoPrecio?.id === precio.id ? (
                            <div className="flex items-center space-x-1">
                              <input
                                type="number"
                                value={nuevoPrecio}
                                onChange={(e) => setNuevoPrecio(e.target.value)}
                                className="w-16 px-1 py-0.5 border border-gray-300 rounded text-xs"
                                step="0.01"
                                min="0"
                              />
                              <button
                                onClick={handleActualizarPrecio}
                                className="p-0.5 text-green-600 hover:text-green-800"
                                title="Guardar"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  setEditandoPrecio(null);
                                  setNuevoPrecio('');
                                }}
                                className="p-0.5 text-red-600 hover:text-red-800"
                                title="Cancelar"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            `${precio.precio.toFixed(2)} €`
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-xs">Diferencial:</span>
                        <span className={`font-medium text-xs ${diferencialClase}`}>
                          {diferencial.toFixed(2)}%
                          {diferencial > 0 && ' ↑'}
                          {diferencial < 0 && ' ↓'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="flex space-x-2 pt-3 border-t border-gray-100">
                      {editandoPrecio?.id !== precio.id && (
                        <button
                          onClick={() => {
                            setEditandoPrecio(precio);
                            setNuevoPrecio(precio.precio);
                          }}
                          className="flex-1 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-2 py-1.5 rounded-md shadow-sm transition-colors text-xs"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                          Editar
                        </button>
                      )}
                      <button
                        onClick={() => handleEliminarPrecio(precio)}
                        className="flex-1 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white px-2 py-1.5 rounded-md shadow-sm transition-colors text-xs"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Selector de trabajos */}
      {mostrarSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Seleccionar trabajo
              </h3>
              <button
                onClick={() => setMostrarSelector(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <TrabajosSelector
              onSelect={handleTrabajosSeleccionado}
              trabajosExcluidos={trabajosSeleccionadosIds}
            />
          </div>
        </div>
      )}
    </div>
  );
}
