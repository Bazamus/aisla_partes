import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const TrabajosDetalleCardEmpleado = ({ parteInfo }) => {
  const [articulos, setArticulos] = useState([]);
  const [otrosTrabajos, setOtrosTrabajos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [costoTotal, setCostoTotal] = useState(0);

  // Función para convertir horas decimales a formato legible
  const formatTiempo = (horas) => {
    if (!horas || horas === 0) return '0h';
    const horasEnteras = Math.floor(horas);
    const minutos = Math.round((horas - horasEnteras) * 60);
    
    if (minutos === 0) {
      return `${horasEnteras}h`;
    }
    return `${horasEnteras}h ${minutos}m`;
  };

  // Cargar trabajos del parte
  useEffect(() => {
    if (parteInfo?.id) {
      cargarTrabajosDelParte();
    } else {
      setLoading(false);
    }
  }, [parteInfo?.id]);

  const cargarTrabajosDelParte = async () => {
    if (!parteInfo?.id) return;
    
    setLoading(true);
    try {
      // Cargar artículos y otros trabajos en paralelo
      const [articulosResponse, otrosTrabajosResponse] = await Promise.all([
        // Obtener artículos con información de precios
        supabase
          .from('partes_empleados_articulos')
          .select(`
            id,
            articulo_id,
            tipo_precio,
            cantidad,
            precio_unitario,
            subtotal,
            created_at,
            articulos_precios (
              codigo,
              tipo,
              espesor,
              diametro,
              pulgada,
              unidad
            )
          `)
          .eq('parte_id', parteInfo.id)
          .order('created_at', { ascending: true }),
        
        // Obtener otros trabajos (con info de servicio si aplica)
        supabase
          .from('partes_empleados_otros_trabajos')
          .select(`
            id,
            descripcion,
            cantidad,
            unidad,
            precio_unitario,
            subtotal,
            servicio_id,
            created_at,
            servicios(codigo)
          `)
          .eq('parte_id', parteInfo.id)
          .order('created_at', { ascending: true })
      ]);

      if (articulosResponse.error) {
        console.error('Error al cargar artículos:', articulosResponse.error);
        toast.error('Error al cargar materiales del parte');
        setArticulos([]);
      } else {
        setArticulos(articulosResponse.data || []);
      }

      if (otrosTrabajosResponse.error) {
        console.error('Error al cargar otros trabajos:', otrosTrabajosResponse.error);
        toast.error('Error al cargar otros trabajos del parte');
        setOtrosTrabajos([]);
      } else {
        setOtrosTrabajos(otrosTrabajosResponse.data || []);
      }
      
      // Calcular costo total
      const totalArticulos = (articulosResponse.data || []).reduce((sum, art) => sum + (art.subtotal || 0), 0);
      const totalOtrosTrabajos = (otrosTrabajosResponse.data || []).reduce((sum, trabajo) => sum + (trabajo.subtotal || 0), 0);
      setCostoTotal(totalArticulos + totalOtrosTrabajos);
      
    } catch (error) {
      console.error('Error al cargar trabajos:', error);
      toast.error('Error al cargar trabajos del parte');
      setArticulos([]);
      setOtrosTrabajos([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 mb-6 animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center">
        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        ✅ Trabajos Realizados
      </h2>
      
      {(articulos.length > 0 || otrosTrabajos.length > 0) ? (
        <div className="space-y-6">
          
          {/* Sección de Materiales */}
          {articulos.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                Materiales Utilizados
              </h3>
              <div className="space-y-3">
                {articulos.map((articulo, index) => (
                  <div key={articulo.id || index} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="font-mono text-sm font-semibold text-blue-600 mb-1">
                          {articulo.articulos_precios?.codigo}
                        </div>
                        <h4 className="font-medium text-gray-900">
                          {articulo.articulos_precios?.tipo}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Espesor: {articulo.articulos_precios?.espesor} - 
                          Diámetro: {articulo.articulos_precios?.diametro}
                          {articulo.articulos_precios?.pulgada && ` (${articulo.articulos_precios.pulgada})`}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {articulo.cantidad} {articulo.articulos_precios?.unidad}
                        </div>
                        <div className="text-sm text-gray-600">
                          €{articulo.precio_unitario?.toFixed(2)} / {articulo.articulos_precios?.unidad}
                        </div>
                        <div className="text-lg font-semibold text-blue-600">
                          €{articulo.subtotal?.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <span className={`inline-block px-2 py-1 text-xs rounded ${
                        articulo.tipo_precio === 'aislamiento' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {articulo.tipo_precio === 'aislamiento' ? 'Precio Aislamiento' : 'Precio Aluminio'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Sección de Otros Trabajos */}
          {otrosTrabajos.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center mr-2">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                Otros Trabajos
              </h3>
              <div className="space-y-3">
                {otrosTrabajos.map((trabajo, index) => (
                  <div key={trabajo.id || index} className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        {trabajo.servicio_id && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-orange-100 text-orange-700 mb-1 mr-2">
                            {trabajo.servicios?.codigo || 'SER'}
                          </span>
                        )}
                        <h4 className="font-medium text-gray-900">{trabajo.descripcion}</h4>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {trabajo.cantidad} {trabajo.unidad}
                        </div>
                        <div className="text-sm text-gray-600">
                          €{trabajo.precio_unitario?.toFixed(2)} / {trabajo.unidad}
                        </div>
                        <div className="text-lg font-semibold text-purple-600">
                          €{trabajo.subtotal?.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Resumen total */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-900">
                Total de trabajos: {articulos.length + otrosTrabajos.length}
                {articulos.length > 0 && ` (${articulos.length} materiales`}
                {otrosTrabajos.length > 0 && `, ${otrosTrabajos.length} otros trabajos)`}
              </span>
              <span className="text-xl font-bold text-green-600">
                Total: €{costoTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500">No hay trabajos registrados en este parte</p>
        </div>
      )}
    </div>
  );
};

export default TrabajosDetalleCardEmpleado;
