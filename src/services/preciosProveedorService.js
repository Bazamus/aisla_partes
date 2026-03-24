import { supabase } from '../lib/supabase';

/**
 * Obtiene los precios personalizados para un proveedor específico
 * @param {number} proveedorId - ID del proveedor
 * @returns {Promise<Array>} - Array de precios personalizados con información del trabajo
 */
export const getPreciosProveedor = async (proveedorId) => {
  try {
    // Obtener los precios personalizados
    const { data, error } = await supabase
      .from('precios_proveedor')
      .select(`
        id,
        precio,
        codigo_trabajo,
        activo,
        fecha_actualizacion,
        trabajo_id
      `)
      .eq('proveedor_id', proveedorId)
      .eq('activo', true)
      .order('fecha_actualizacion', { ascending: false });

    if (error) throw error;
    
    // Si no hay datos, retornar array vacío
    if (!data || data.length === 0) return [];
    
    // Obtener los IDs de los trabajos para hacer una consulta separada
    const trabajosIds = data.map(precio => precio.trabajo_id);
    
    // Obtener la información de los trabajos incluyendo grupos y subgrupos
    const { data: trabajosData, error: trabajosError } = await supabase
      .from('lista_de_precios')
      .select(`
        id,
        trabajo,
        precio,
        codigo,
        grupo_id,
        subgrupo_id,
        grupos:grupo_id (id, nombre),
        subgrupos:subgrupo_id (id, nombre)
      `)
      .in('id', trabajosIds);
    
    if (trabajosError) throw trabajosError;
    
    // Crear un mapa para acceder rápidamente a los datos de los trabajos
    const trabajosMap = {};
    trabajosData.forEach(trabajo => {
      trabajosMap[trabajo.id] = {
        ...trabajo,
        grupo_nombre: trabajo.grupos ? trabajo.grupos.nombre : null,
        subgrupo_nombre: trabajo.subgrupos ? trabajo.subgrupos.nombre : null
      };
    });
    
    // Combinar los datos
    const preciosConTrabajos = data.map(precio => {
      const trabajo = trabajosMap[precio.trabajo_id] || {};
      return {
        ...precio,
        lista_de_precios: trabajo
      };
    });
    
    return preciosConTrabajos;
  } catch (error) {
    console.error('Error al obtener precios del proveedor:', error);
    throw error;
  }
};

/**
 * Actualiza o crea un precio personalizado para un proveedor y trabajo específicos
 * @param {number} proveedorId - ID del proveedor
 * @param {number} trabajoId - ID del trabajo
 * @param {number} precio - Precio personalizado
 * @param {string} codigoTrabajo - Código del trabajo
 * @returns {Promise<Object>} - Precio actualizado
 */
export const actualizarPrecioProveedor = async (proveedorId, trabajoId, precio, codigoTrabajo) => {
  try {
    // Verificar si ya existe un precio personalizado para este proveedor y trabajo
    const { data: precioExistente, error: errorConsulta } = await supabase
      .from('precios_proveedor')
      .select('id')
      .eq('proveedor_id', proveedorId)
      .eq('trabajo_id', trabajoId)
      .single();
    
    if (errorConsulta && errorConsulta.code !== 'PGRST116') {
      // Si hay un error que no sea "no se encontró ningún registro", lanzarlo
      throw errorConsulta;
    }
    
    if (precioExistente) {
      // Si ya existe, actualizarlo
      const { data, error } = await supabase
        .from('precios_proveedor')
        .update({
          precio,
          codigo_trabajo: codigoTrabajo,
          activo: true,
          fecha_actualizacion: new Date().toISOString()
        })
        .eq('id', precioExistente.id)
        .select();
      
      if (error) throw error;
      return data[0];
    } else {
      // Si no existe, crearlo
      const { data, error } = await supabase
        .from('precios_proveedor')
        .insert([
          {
            proveedor_id: proveedorId,
            trabajo_id: trabajoId,
            precio,
            codigo_trabajo: codigoTrabajo,
            activo: true,
            fecha_actualizacion: new Date().toISOString()
          }
        ])
        .select();
      
      if (error) throw error;
      return data[0];
    }
  } catch (error) {
    console.error('Error al actualizar precio del proveedor:', error);
    throw error;
  }
};

/**
 * Desactiva un precio personalizado
 * @param {number} precioId - ID del precio a desactivar
 * @returns {Promise<Object>} - Precio desactivado
 */
export const desactivarPrecioProveedor = async (precioId) => {
  try {
    const { data, error } = await supabase
      .from('precios_proveedor')
      .update({
        activo: false,
        fecha_actualizacion: new Date().toISOString()
      })
      .eq('id', precioId)
      .select();
    
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error al desactivar precio del proveedor:', error);
    throw error;
  }
};

/**
 * Obtiene todos los grupos disponibles
 * @returns {Promise<Array>} - Array de grupos
 */
export const getGrupos = async () => {
  try {
    const { data, error } = await supabase
      .from('grupos')
      .select('id, nombre')
      .eq('activo', true)
      .order('nombre');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener grupos:', error);
    throw error;
  }
};

/**
 * Obtiene los subgrupos para un grupo específico
 * @param {string} grupoId - ID del grupo
 * @returns {Promise<Array>} - Array de subgrupos
 */
export const getSubgrupos = async (grupoId) => {
  try {
    if (!grupoId) return [];
    
    const { data, error } = await supabase
      .from('subgrupos')
      .select('id, nombre')
      .eq('grupo_id', grupoId)
      .eq('activo', true)
      .order('nombre');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener subgrupos:', error);
    throw error;
  }
};

/**
 * Obtiene los precios personalizados para un proveedor específico por su código
 * @param {string} codigoProveedor - Código del proveedor
 * @returns {Promise<Array>} - Array de precios personalizados con información del trabajo
 */
export const getPreciosProveedorByCodigo = async (codigoProveedor) => {
  try {
    if (!codigoProveedor) return [];
    
    // Primero obtenemos el ID del proveedor por su código
    const { data: proveedor, error: proveedorError } = await supabase
      .from('proveedores')
      .select('id')
      .eq('codigo', codigoProveedor)
      .single();
    
    if (proveedorError) {
      console.error('Error al obtener proveedor por código:', proveedorError);
      return [];
    }
    
    if (!proveedor) return [];
    
    // Ahora obtenemos los precios personalizados usando el ID del proveedor
    return await getPreciosProveedor(proveedor.id);
  } catch (error) {
    console.error('Error al obtener precios del proveedor por código:', error);
    return [];
  }
};

/**
 * Verifica si un trabajo tiene precio personalizado para un proveedor
 * @param {string} codigoProveedor - Código del proveedor
 * @param {number} trabajoId - ID del trabajo
 * @returns {Promise<Object|null>} - Precio personalizado o null si no existe
 */
export const getPrecioPersonalizadoTrabajo = async (codigoProveedor, trabajoId) => {
  try {
    if (!codigoProveedor || !trabajoId) return null;
    
    // Obtener todos los precios personalizados del proveedor
    const preciosPersonalizados = await getPreciosProveedorByCodigo(codigoProveedor);
    
    // Buscar si existe un precio personalizado para el trabajo específico
    const precioPersonalizado = preciosPersonalizados.find(
      precio => precio.trabajo_id === trabajoId
    );
    
    return precioPersonalizado || null;
  } catch (error) {
    console.error('Error al verificar precio personalizado:', error);
    return null;
  }
};
