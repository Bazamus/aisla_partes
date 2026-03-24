import { supabase } from '../lib/supabase';

// Obtener todos los trabajos
export const getTrabajos = async () => {
  try {
    console.log('Servicio: Obteniendo trabajos...');
    const { data, error } = await supabase
      .from('trabajos')
      .select('*')
      .order('descripcion');
    
    if (error) {
      console.error('Error en getTrabajos:', error);
      throw error;
    }
    
    console.log('Servicio: Trabajos obtenidos:', data?.length || 0);
    return data;
  } catch (error) {
    console.error('Error en getTrabajos:', error);
    throw error;
  }
};

// Buscar trabajos por texto en la tabla lista_de_precios
export const buscarTrabajosPorTexto = async (texto) => {
  try {
    console.log('Servicio: Buscando trabajos con texto en lista_de_precios:', texto);
    const { data, error } = await supabase
      .from('lista_de_precios')
      .select('*')
      .ilike('trabajo', `%${texto}%`)
      .order('trabajo')
      .limit(50);
    
    if (error) {
      console.error('Error en buscarTrabajosPorTexto:', error);
      throw error;
    }
    
    // Mapear los campos de lista_de_precios a los campos esperados por el componente
    const trabajosMapeados = data.map(item => ({
      id: item.id,
      descripcion: item.trabajo,
      precio_venta: item.precio,
      codigo: item.codigo || '',
      grupo_principal: item.grupo_principal,
      subgrupo: item.subgrupo
    }));
    
    console.log('Servicio: Trabajos encontrados en lista_de_precios:', trabajosMapeados.length || 0);
    return trabajosMapeados;
  } catch (error) {
    console.error('Error en buscarTrabajosPorTexto:', error);
    throw error;
  }
};

// Alias para mantener compatibilidad
export const searchTrabajos = buscarTrabajosPorTexto;

// Obtener trabajos por subgrupo ID
export const getTrabajosBySubgrupoId = async (subgrupoId) => {
  try {
    console.log('Servicio: Obteniendo trabajos para subgrupo:', subgrupoId);
    const { data, error } = await supabase
      .from('lista_de_precios')
      .select('*')
      .eq('subgrupo_id', subgrupoId)
      .order('trabajo');
    
    if (error) {
      console.error('Error en getTrabajosBySubgrupoId:', error);
      throw error;
    }
    
    // Mapear los campos de lista_de_precios a los campos esperados por el componente
    const trabajosMapeados = data?.map(item => ({
      id: item.trabajo_id || item.id,
      descripcion: item.trabajo,
      precio_venta: item.precio,
      codigo: item.codigo || '',
      grupo_principal: item.grupo_principal,
      subgrupo: item.subgrupo,
      unidad: item.unidad
    })) || [];
    
    console.log('Servicio: Trabajos obtenidos para subgrupo:', trabajosMapeados.length);
    return trabajosMapeados;
  } catch (error) {
    console.error('Error en getTrabajosBySubgrupoId:', error);
    throw error;
  }
};

// Obtener un trabajo por ID
export const getTrabajoById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('trabajos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error en getTrabajoById:', error);
    throw error;
  }
};

// Crear un nuevo trabajo
export const createTrabajo = async (trabajoData) => {
  try {
    const { data, error } = await supabase
      .from('trabajos')
      .insert(trabajoData)
      .select();
    
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error al crear trabajo:', error);
    throw error;
  }
};

// Actualizar un trabajo existente
export const updateTrabajo = async (id, trabajoData) => {
  try {
    const { data, error } = await supabase
      .from('trabajos')
      .update(trabajoData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error al actualizar trabajo:', error);
    throw error;
  }
};

// Eliminar un trabajo
export const deleteTrabajo = async (id) => {
  try {
    const { error } = await supabase
      .from('trabajos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error al eliminar trabajo:', error);
    throw error;
  }
};
