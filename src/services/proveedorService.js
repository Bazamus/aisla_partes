import { supabase } from '../lib/supabase';

// Obtener todos los proveedores
export const getProveedores = async () => {
  try {
    console.log('Servicio: Obteniendo proveedores...');
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .order('empresa');
    
    if (error) {
      console.error('Error en getProveedores:', error);
      throw error;
    }
    
    console.log('Servicio: Proveedores obtenidos:', data?.length || 0);
    return data;
  } catch (error) {
    console.error('Error en getProveedores:', error);
    throw error;
  }
};

// Obtener un proveedor por código
export const getProveedorByCodigo = async (codigo) => {
  try {
    console.log('Servicio: Buscando proveedor con código:', codigo);
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .eq('codigo', codigo)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error en getProveedorByCodigo:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error en getProveedorByCodigo:', error);
    throw error;
  }
};

// Obtener las obras asignadas a un proveedor
export const getObrasAsignadasProveedor = async (codigoProveedor) => {
  try {
    console.log('Servicio: Obteniendo obras asignadas al proveedor:', codigoProveedor);
    
    // Primero obtenemos el ID del proveedor
    const proveedor = await getProveedorByCodigo(codigoProveedor);
    
    if (!proveedor) {
      console.log('Proveedor no encontrado con código:', codigoProveedor);
      return [];
    }
    
    // Luego obtenemos las obras asignadas
    const { data, error } = await supabase
      .from('proveedores_obras')
      .select(`
        obras (
          id,
          nombre_obra,
          numero_obra,
          cliente
        )
      `)
      .eq('proveedor_id', proveedor.id);
    
    if (error) {
      console.error('Error en getObrasAsignadasProveedor:', error);
      throw error;
    }
    
    // Transformamos los datos para obtener solo las obras
    const obras = data.map(item => item.obras).filter(Boolean);
    
    console.log('Servicio: Obras asignadas obtenidas:', obras.length);
    return obras;
  } catch (error) {
    console.error('Error en getObrasAsignadasProveedor:', error);
    // Si hay un error, devolvemos un array vacío para evitar errores en la UI
    return [];
  }
};

// Crear un nuevo proveedor
export const createProveedor = async (proveedorData) => {
  try {
    const { data, error } = await supabase
      .from('proveedores')
      .insert([proveedorData])
      .select();
    
    if (error) throw error;
    
    return data[0];
  } catch (error) {
    console.error('Error en createProveedor:', error);
    throw error;
  }
};

// Actualizar un proveedor existente
export const updateProveedor = async (id, proveedorData) => {
  try {
    const { data, error } = await supabase
      .from('proveedores')
      .update(proveedorData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    return data[0];
  } catch (error) {
    console.error('Error en updateProveedor:', error);
    throw error;
  }
};

// Eliminar un proveedor
export const deleteProveedor = async (id) => {
  try {
    const { error } = await supabase
      .from('proveedores')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error en deleteProveedor:', error);
    throw error;
  }
};
