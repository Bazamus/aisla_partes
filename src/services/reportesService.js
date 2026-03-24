import { supabase } from '../lib/supabase';

/**
 * Servicio para consumir las funciones RPC de reportes analíticos de materiales
 */

/**
 * Obtiene el rango de fechas del mes actual (desde el día 1 hasta hoy)
 * @returns {{fechaDesde: string, fechaHasta: string}}
 */
export const obtenerRangoMesActual = () => {
  const ahora = new Date();
  const primerDia = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const ultimoDia = ahora;
  
  return {
    fechaDesde: primerDia.toISOString().split('T')[0],
    fechaHasta: ultimoDia.toISOString().split('T')[0]
  };
};

/**
 * Obtiene estadísticas generales del período seleccionado
 */
export const getEstadisticasGenerales = async (fechaDesde, fechaHasta, empleadoId = null, obraId = null) => {
  try {
    const { data, error } = await supabase.rpc('obtener_estadisticas_generales', {
      p_fecha_desde: fechaDesde || null,
      p_fecha_hasta: fechaHasta || null,
      p_empleado_id: empleadoId,
      p_obra_id: obraId
    });
    
    if (error) {
      console.error('Error al obtener estadísticas generales:', error);
      throw error;
    }
    
    return data && data.length > 0 ? data[0] : {
      total_partes: 0,
      total_empleados_activos: 0,
      total_obras_activas: 0,
      total_materiales_cantidad: 0,
      costo_total_materiales: 0,
      promedio_costo_por_parte: 0
    };
  } catch (error) {
    console.error('Error en getEstadisticasGenerales:', error);
    throw error;
  }
};

/**
 * Obtiene resumen de partes y costos por empleado
 */
export const getResumenPorEmpleado = async (fechaDesde, fechaHasta, empleadoId = null) => {
  try {
    const { data, error } = await supabase.rpc('obtener_resumen_por_empleado', {
      p_fecha_desde: fechaDesde,
      p_fecha_hasta: fechaHasta,
      p_empleado_id: empleadoId
    });
    
    if (error) {
      console.error('Error al obtener resumen por empleado:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error en getResumenPorEmpleado:', error);
    throw error;
  }
};

/**
 * Obtiene resumen de partes y costos por obra
 */
export const getResumenPorObra = async (fechaDesde, fechaHasta, obraId = null, empleadoId = null) => {
  try {
    const { data, error } = await supabase.rpc('obtener_resumen_por_obra', {
      p_fecha_desde: fechaDesde,
      p_fecha_hasta: fechaHasta,
      p_obra_id: obraId,
      p_empleado_id: empleadoId
    });
    
    if (error) {
      console.error('Error al obtener resumen por obra:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error en getResumenPorObra:', error);
    throw error;
  }
};

/**
 * Obtiene detalle completo de materiales instalados
 */
export const getDetalleMateriales = async (fechaDesde, fechaHasta, empleadoId = null, obraId = null) => {
  try {
    const { data, error } = await supabase.rpc('obtener_detalle_materiales', {
      p_fecha_desde: fechaDesde,
      p_fecha_hasta: fechaHasta,
      p_empleado_id: empleadoId,
      p_obra_id: obraId
    });
    
    if (error) {
      console.error('Error al obtener detalle de materiales:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error en getDetalleMateriales:', error);
    throw error;
  }
};

/**
 * Obtiene distribución de costos por tipo de material
 */
export const getDistribucionTipoMaterial = async (fechaDesde, fechaHasta, empleadoId = null, obraId = null) => {
  try {
    const { data, error } = await supabase.rpc('obtener_distribucion_tipo_material', {
      p_fecha_desde: fechaDesde,
      p_fecha_hasta: fechaHasta,
      p_empleado_id: empleadoId,
      p_obra_id: obraId
    });
    
    if (error) {
      console.error('Error al obtener distribución por tipo:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error en getDistribucionTipoMaterial:', error);
    throw error;
  }
};

/**
 * Obtiene lista de partes con totales (para exportación)
 */
export const getListaPartes = async (fechaDesde, fechaHasta, empleadoId = null, obraId = null) => {
  try {
    const { data, error } = await supabase.rpc('obtener_lista_partes', {
      p_fecha_desde: fechaDesde,
      p_fecha_hasta: fechaHasta,
      p_empleado_id: empleadoId,
      p_obra_id: obraId
    });
    
    if (error) {
      console.error('Error al obtener lista de partes:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error en getListaPartes:', error);
    throw error;
  }
};

/**
 * Obtiene resumen de servicios/otros trabajos utilizados en el período
 */
export const getResumenServicios = async (fechaDesde, fechaHasta, empleadoId = null, obraId = null) => {
  try {
    let query = supabase
      .from('partes_empleados_otros_trabajos')
      .select(`
        descripcion,
        cantidad,
        unidad,
        precio_unitario,
        servicio_id,
        servicios(codigo, descripcion),
        partes_empleados!inner(id, fecha, empleado_id, id_obra)
      `)
      .order('created_at', { ascending: false });

    if (fechaDesde) {
      query = query.gte('partes_empleados.fecha', fechaDesde);
    }
    if (fechaHasta) {
      query = query.lte('partes_empleados.fecha', fechaHasta);
    }
    if (empleadoId) {
      query = query.eq('partes_empleados.empleado_id', empleadoId);
    }
    if (obraId) {
      query = query.eq('partes_empleados.id_obra', obraId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al obtener resumen de servicios:', error);
      throw error;
    }

    // Agrupar por servicio_id o descripcion
    const agrupado = {};
    (data || []).forEach(item => {
      const key = item.servicio_id || item.descripcion;
      if (!agrupado[key]) {
        agrupado[key] = {
          codigo: item.servicios?.codigo || null,
          descripcion: item.servicios?.descripcion || item.descripcion,
          unidad: item.unidad,
          total_cantidad: 0,
          total_costo: 0,
          num_registros: 0,
          es_servicio: !!item.servicio_id
        };
      }
      agrupado[key].total_cantidad += (item.cantidad || 0);
      agrupado[key].total_costo += ((item.cantidad || 0) * (item.precio_unitario || 0));
      agrupado[key].num_registros += 1;
    });

    return Object.values(agrupado).sort((a, b) => b.total_costo - a.total_costo);
  } catch (error) {
    console.error('Error en getResumenServicios:', error);
    return [];
  }
};

/**
 * Obtiene detalle raw de otros trabajos con info de empleado y obra
 * para augmentar los componentes de analítica
 */
export const getOtrosTrabajosDetalle = async (fechaDesde, fechaHasta, empleadoId = null, obraId = null) => {
  try {
    let query = supabase
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
        servicios(codigo, descripcion),
        partes_empleados!inner(
          id, fecha, numero_parte, empleado_id, id_obra,
          empleados(nombre, codigo),
          obras(numero_obra, nombre)
        )
      `)
      .order('created_at', { ascending: false });

    if (fechaDesde) {
      query = query.gte('partes_empleados.fecha', fechaDesde);
    }
    if (fechaHasta) {
      query = query.lte('partes_empleados.fecha', fechaHasta);
    }
    if (empleadoId) {
      query = query.eq('partes_empleados.empleado_id', empleadoId);
    }
    if (obraId) {
      query = query.eq('partes_empleados.id_obra', obraId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al obtener detalle de otros trabajos:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error en getOtrosTrabajosDetalle:', error);
    return [];
  }
};

/**
 * Obtiene lista de empleados para el filtro (solo empleados con partes)
 * Si se proporciona obraId, filtra solo los empleados que tienen partes en esa obra
 */
export const getEmpleadosParaFiltro = async (obraId = null) => {
  try {
    const { data, error } = await supabase.rpc('obtener_empleados_con_partes', {
      p_obra_id: obraId
    });
    
    if (error) {
      console.error('Error al obtener empleados:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error en getEmpleadosParaFiltro:', error);
    throw error;
  }
};

/**
 * Obtiene lista de obras para el filtro (solo obras con partes)
 * Si se proporciona empleadoId, filtra solo las obras donde ese empleado tiene partes
 */
export const getObrasParaFiltro = async (empleadoId = null) => {
  try {
    const { data, error } = await supabase.rpc('obtener_obras_con_partes', {
      p_empleado_id: empleadoId
    });
    
    if (error) {
      console.error('Error al obtener obras:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error en getObrasParaFiltro:', error);
    throw error;
  }
};
