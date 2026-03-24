import { supabase } from '../lib/supabase';

// Obtener todos los grupos activos
export const getGrupos = async () => {
  try {
    console.log('Servicio: Obteniendo grupos...');
    // Consulta a la tabla lista_de_precios para obtener grupos únicos
    const { data, error } = await supabase
      .from('lista_de_precios')
      .select('grupo_id, grupo_principal')
      .not('grupo_id', 'is', null)
      .order('grupo_principal');
    
    if (error) {
      console.error('Error en getGrupos:', error);
      throw error;
    }
    
    // Eliminar duplicados y transformar al formato esperado
    const gruposUnicos = [];
    const gruposIds = new Set();
    
    data.forEach(item => {
      if (item.grupo_id && !gruposIds.has(item.grupo_id)) {
        gruposIds.add(item.grupo_id);
        gruposUnicos.push({
          id: item.grupo_id,
          nombre: item.grupo_principal || 'Grupo sin nombre'
        });
      }
    });
    
    console.log('Servicio: Grupos obtenidos:', gruposUnicos.length);
    return gruposUnicos;
  } catch (error) {
    console.error('Error en getGrupos:', error);
    return [];
  }
};

// Obtener subgrupos por grupo_id
export const getSubgruposByGrupoId = async (grupoId) => {
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
      console.error('Error en getSubgruposByGrupoId:', error);
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
    console.error('Error en getSubgruposByGrupoId:', error);
    return [];
  }
};

// Obtener trabajos por grupo_id y subgrupo_id
export const getTrabajosByGrupoAndSubgrupo = async (grupoId, subgrupoId) => {
  try {
    console.log('Servicio: Obteniendo trabajos para grupo:', grupoId, 'y subgrupo:', subgrupoId);
    
    // Construir la consulta base
    let query = supabase
      .from('lista_de_precios')
      .select('id, trabajo, precio, unidad, codigo, grupo_id, subgrupo_id')
      .eq('grupo_id', grupoId);
    
    // Si se proporciona un subgrupo, filtrar por él
    if (subgrupoId) {
      query = query.eq('subgrupo_id', subgrupoId);
    }
    
    // Ejecutar la consulta
    const { data, error } = await query.order('trabajo');
    
    if (error) {
      console.error('Error en getTrabajosByGrupoAndSubgrupo:', error);
      throw error;
    }
    
    // Transformar los datos para que tengan la estructura esperada por el componente
    const trabajos = data.map(item => ({
      id: item.id,
      descripcion: item.trabajo,
      precio_venta: item.precio || 0,
      precio_coste: 0, // No tenemos este dato en lista_de_precios
      unidad: item.unidad || 'ud',
      codigo: item.codigo || '',
      lista_precio_id: item.id
    }));
    
    console.log('Servicio: Trabajos obtenidos:', trabajos.length);
    return trabajos;
  } catch (error) {
    console.error('Error en getTrabajosByGrupoAndSubgrupo:', error);
    return [];
  }
};

// Crear un nuevo grupo
export const createGrupo = async (nombre) => {
  try {
    // Esta función no se puede implementar sin la tabla grupos
    console.error('No se puede crear un grupo: la tabla grupos no existe');
    throw new Error('No se puede crear un grupo: la tabla grupos no existe');
  } catch (error) {
    console.error('Error en createGrupo:', error);
    throw error;
  }
};

// Crear un nuevo subgrupo
export const createSubgrupo = async (nombre, grupoId) => {
  try {
    // Esta función no se puede implementar sin la tabla subgrupos
    console.error('No se puede crear un subgrupo: la tabla subgrupos no existe');
    throw new Error('No se puede crear un subgrupo: la tabla subgrupos no existe');
  } catch (error) {
    console.error('Error en createSubgrupo:', error);
    throw error;
  }
};

// Actualizar grupo_id y subgrupo_id de un trabajo
export const updateTrabajoGrupoSubgrupo = async (trabajoId, grupoId, subgrupoId) => {
  try {
    const { data, error } = await supabase
      .from('lista_de_precios')
      .update({ grupo_id: grupoId, subgrupo_id: subgrupoId })
      .eq('id', trabajoId)
      .select();
    
    if (error) throw error;
    
    return data[0];
  } catch (error) {
    console.error('Error en updateTrabajoGrupoSubgrupo:', error);
    throw error;
  }
};

// Alias para getAllGrupos (compatibilidad)
export const getAllGrupos = getGrupos;

// Exportar el servicio completo
export const gruposService = {
  getGrupos,
  getAllGrupos,
  getSubgruposByGrupoId,
  getTrabajosByGrupoAndSubgrupo,
  createGrupo,
  createSubgrupo,
  updateTrabajoGrupoSubgrupo
};
