import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/format';
import { getGrupos, getSubgrupos } from '../services/preciosProveedorService';

export default function TrabajosSelector({ onSelect, trabajosExcluidos = [] }) {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [grupos, setGrupos] = useState([]);
  const [subgrupos, setSubgrupos] = useState([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState('');
  const [subgrupoSeleccionado, setSubgrupoSeleccionado] = useState('');

  // Cargar grupos al montar el componente
  useEffect(() => {
    cargarGrupos();
  }, []);

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

  // Función para buscar trabajos
  const buscarTrabajos = async () => {
    if (!busqueda.trim() && !grupoSeleccionado && !subgrupoSeleccionado) return;
    
    setCargando(true);
    
    try {
      let query = supabase
        .from('lista_de_precios')
        .select(`
          id, 
          codigo, 
          trabajo, 
          precio,
          grupo_id,
          subgrupo_id,
          grupos:grupo_id (nombre),
          subgrupos:subgrupo_id (nombre)
        `)
        .order('trabajo');
      
      // Filtrar por texto de búsqueda
      if (busqueda.trim()) {
        query = query.or(`trabajo.ilike.%${busqueda}%,codigo.ilike.%${busqueda}%`);
      }
      
      // Filtrar por grupo si está seleccionado
      if (grupoSeleccionado) {
        query = query.eq('grupo_id', grupoSeleccionado);
      }
      
      // Filtrar por subgrupo si está seleccionado
      if (subgrupoSeleccionado) {
        query = query.eq('subgrupo_id', subgrupoSeleccionado);
      }
      
      // Excluir trabajos ya seleccionados
      if (trabajosExcluidos && trabajosExcluidos.length > 0) {
        query = query.not('id', 'in', `(${trabajosExcluidos.join(',')})`);
      }
      
      // Limitar resultados
      query = query.limit(50);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Formatear resultados para mostrar información de grupo y subgrupo
      const resultadosFormateados = data.map(trabajo => ({
        ...trabajo,
        grupo_nombre: trabajo.grupos ? trabajo.grupos.nombre : 'Sin grupo',
        subgrupo_nombre: trabajo.subgrupos ? trabajo.subgrupos.nombre : 'Sin subgrupo'
      }));
      
      setResultados(resultadosFormateados);
    } catch (error) {
      console.error('Error al buscar trabajos:', error);
    } finally {
      setCargando(false);
    }
  };

  // Buscar cuando cambia el texto, grupo o subgrupo
  useEffect(() => {
    const timer = setTimeout(() => {
      buscarTrabajos();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [busqueda, grupoSeleccionado, subgrupoSeleccionado]);

  return (
    <div className="space-y-4">
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
            placeholder="Buscar trabajo..."
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
      
      {cargando ? (
        <div className="text-center py-4">
          <p className="text-gray-500">Buscando trabajos...</p>
        </div>
      ) : resultados.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500">
            {busqueda || grupoSeleccionado || subgrupoSeleccionado
              ? 'No se encontraron trabajos con los criterios seleccionados'
              : 'Ingresa un término de búsqueda o selecciona un grupo para comenzar'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[400px] border border-gray-200 rounded-md">
          <table className="min-w-full bg-white table-fixed">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b whitespace-nowrap w-[15%]">
                  Código
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b w-[35%]">
                  Trabajo
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b whitespace-nowrap w-[15%]">
                  Grupo
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b whitespace-nowrap w-[15%]">
                  Subgrupo
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b whitespace-nowrap w-[10%]">
                  Precio
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b whitespace-nowrap w-[10%]">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {resultados.map(trabajo => (
                <tr key={trabajo.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 text-sm text-gray-900 whitespace-nowrap truncate">
                    {trabajo.codigo || '-'}
                  </td>
                  <td className="py-2 px-4 text-sm text-gray-900 break-words">
                    {trabajo.trabajo}
                  </td>
                  <td className="py-2 px-4 text-sm text-gray-900 whitespace-nowrap truncate">
                    {trabajo.grupo_nombre}
                  </td>
                  <td className="py-2 px-4 text-sm text-gray-900 whitespace-nowrap truncate">
                    {trabajo.subgrupo_nombre}
                  </td>
                  <td className="py-2 px-4 text-sm text-gray-900 whitespace-nowrap">
                    {formatCurrency(trabajo.precio)}
                  </td>
                  <td className="py-2 px-4 text-sm text-gray-900 whitespace-nowrap">
                    <button
                      onClick={() => onSelect(trabajo)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Seleccionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
