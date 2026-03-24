import { supabase } from '../lib/supabase';

// Obtener todos los partes de empleados
export const getPartes = async () => {
  console.log('ENTERING: parteService.getPartes');
  try {
    console.log('Servicio: Obteniendo partes de empleados...');
    const { data, error } = await supabase
      .from('partes')
      .select('*')
      .order('fecha', { ascending: false });
    
    if (error) {
      console.error('Error en getPartes:', error);
      throw error;
    }
    
    console.log('Servicio: Partes de empleados obtenidos:', data?.length || 0);
    return data;
  } catch (error) {
    console.error('Error en getPartes:', error);
    throw error;
  }
};

// Obtener un parte por ID
export const getParteById = async (id) => {
  try {
    console.log('Obteniendo parte con ID:', id);
    
    // Importar el cliente admin para saltarse RLS
    const { supabaseAdmin } = await import('../lib/supabase');
    console.log('Cliente admin cargado para obtener parte por ID:', !!supabaseAdmin);
    
    // Obtener el parte con todos sus campos
    const { data, error } = await supabaseAdmin
      .from('partes')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error('Error al obtener parte:', error);
      throw error;
    }
    
    if (!data) {
      console.warn(`No se encontró parte con ID: ${id}`);
      return null;
    }
    
    console.log('Parte obtenido:', data);
    
    // Si el parte no tiene imágenes, inicializamos como array vacío
    if (!data.imagenes) {
      data.imagenes = [];
    }
    
    return data;
  } catch (error) {
    console.error('Error en getParteById:', error);
    throw error;
  }
};

// Eliminar un parte y todos sus trabajos asociados
export const deleteParte = async (id) => {
  try {
    console.log('🗑️ Eliminando parte con ID:', id);
    
    // Usar función RPC que maneja eliminación en cascada
    const { data, error } = await supabase
      .rpc('eliminar_parte_cascada', { p_parte_id: id });
    
    if (error) {
      console.error('Error en RPC eliminar_parte_cascada:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('No se pudo eliminar el parte. Verifique que el parte existe.');
    }
    
    console.log('✅ Parte eliminado exitosamente:', id);
    return true;
  } catch (error) {
    console.error('Error en deleteParte:', error);
    throw error;
  }
};
