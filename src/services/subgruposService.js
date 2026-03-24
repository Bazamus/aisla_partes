import { supabase } from '../lib/supabase';

// Obtener todos los subgrupos
export const getAllSubgrupos = async () => {
  try {
    console.log('Servicio: Obteniendo todos los subgrupos...');
    // Consulta a la tabla lista_de_precios para obtener subgrupos únicos
    const { data, error } = await supabase
      .from('lista_de_precios')
      .select('subgrupo_id, subgrupo, grupo_id, grupo_principal')
      .not('subgrupo_id', 'is', null)
      .order('grupo_principal, subgrupo');
    
    if (error) {
      console.error('Error en getAllSubgrupos:', error);
      throw error;
    }
    
    // Eliminar duplicados y transformar al formato esperado
    const subgruposUnicos = [];
    const subgruposIds = new Set();
    
    data.forEach(item => {
      if (item.subgrupo_id && !subgruposIds.has(item.subgrupo_id)) {
        subgruposIds.add(item.subgrupo_id);
        subgruposUnicos.push({
          id: item.subgrupo_id,
          nombre: item.subgrupo || 'Subgrupo sin nombre',
          grupo_id: item.grupo_id,
          grupo_nombre: item.grupo_principal
        });
      }
    });
    
    console.log('Servicio: Subgrupos obtenidos:', subgruposUnicos.length);
    return subgruposUnicos;
  } catch (error) {
    console.error('Error en getAllSubgrupos:', error);
    return [];
  }
};

// Obtener subgrupos por grupo_id
export const getSubgruposByGrupo = async (grupoId) => {
  try {
    console.log('Servicio: Obteniendo subgrupos para grupo:', grupoId);
    // Consulta a la tabla lista_de_precios para obtener subgrupos únicos de un grupo
    const { data, error } = await supabase
      .from('lista_de_precios')
      .select('subgrupo_id, subgrupo')
      .eq('grupo_id', grupoId)
      .not('subgrupo_id', 'is', null)
      .order('subgrupo');
    
    if (error) {
      console.error('Error en getSubgruposByGrupo:', error);
      throw error;
    }
    
    // Eliminar duplicados y transformar al formato esperado
    const subgruposUnicos = [];
    const subgruposIds = new Set();
    
    data.forEach(item => {
      if (item.subgrupo_id && !subgruposIds.has(item.subgrupo_id)) {
        subgruposIds.add(item.subgrupo_id);
        subgruposUnicos.push({
          id: item.subgrupo_id,
          nombre: item.subgrupo || 'Subgrupo sin nombre',
          grupo_id: grupoId
        });
      }
    });
    
    console.log('Servicio: Subgrupos obtenidos:', subgruposUnicos.length);
    return subgruposUnicos;
  } catch (error) {
    console.error('Error en getSubgruposByGrupo:', error);
    return [];
  }
};

// Obtener un subgrupo por ID
export const getSubgrupoById = async (subgrupoId) => {
  try {
    console.log('Servicio: Obteniendo subgrupo por ID:', subgrupoId);
    
    const { data, error } = await supabase
      .from('lista_de_precios')
      .select('subgrupo_id, subgrupo, grupo_id, grupo_principal')
      .eq('subgrupo_id', subgrupoId)
      .limit(1);
    
    if (error) {
      console.error('Error en getSubgrupoById:', error);
      throw error;
    }
    
    if (data && data.length > 0) {
      const item = data[0];
      return {
        id: item.subgrupo_id,
        nombre: item.subgrupo || 'Subgrupo sin nombre',
        grupo_id: item.grupo_id,
        grupo_nombre: item.grupo_principal
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error en getSubgrupoById:', error);
    return null;
  }
};

// Crear un nuevo subgrupo (placeholder - requiere tabla subgrupos)
export const createSubgrupo = async (nombre, grupoId) => {
  try {
    console.error('No se puede crear un subgrupo: la tabla subgrupos no existe');
    throw new Error('No se puede crear un subgrupo: la tabla subgrupos no existe');
  } catch (error) {
    console.error('Error en createSubgrupo:', error);
    throw error;
  }
};

// Actualizar un subgrupo (placeholder - requiere tabla subgrupos)
export const updateSubgrupo = async (subgrupoId, nombre) => {
  try {
    console.error('No se puede actualizar un subgrupo: la tabla subgrupos no existe');
    throw new Error('No se puede actualizar un subgrupo: la tabla subgrupos no existe');
  } catch (error) {
    console.error('Error en updateSubgrupo:', error);
    throw error;
  }
};

// Eliminar un subgrupo (placeholder - requiere tabla subgrupos)
export const deleteSubgrupo = async (subgrupoId) => {
  try {
    console.error('No se puede eliminar un subgrupo: la tabla subgrupos no existe');
    throw new Error('No se puede eliminar un subgrupo: la tabla subgrupos no existe');
  } catch (error) {
    console.error('Error en deleteSubgrupo:', error);
    throw error;
  }
};

export const subgruposService = {
  getAllSubgrupos,
  getSubgruposByGrupo,
  getSubgrupoById,
  createSubgrupo,
  updateSubgrupo,
  deleteSubgrupo
};
