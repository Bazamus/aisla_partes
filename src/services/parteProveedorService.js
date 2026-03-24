import { supabase, getCurrentUser } from '../lib/supabase';

// Obtener el proveedor_id del usuario autenticado
async function getProveedorIdFromUser() {
  try {
    // SISTEMA AUTH PERSONALIZADO - obtener usuario actual
    const user = getCurrentUser();
    if (!user) {
      console.error('No hay usuario autenticado para buscar proveedor.');
      return null;
    }

    console.log('✅ [getProveedorIdFromUser] Usuario obtenido:', user);
    
    // Eliminar .single() para obtener un array
    const { data: proveedores, error } = await supabase
      .from('proveedores')
      .select('id')
      .eq('user_id', user.id); // Sin .single()
      
    if (error) {
      console.error(`Error al obtener proveedor por user_id (${user.id}):`, error.message);
      return null;
    }
    
    if (!proveedores || proveedores.length === 0) {
      // Es importante usar console.warn o console.info para situaciones esperadas, no errores.
      console.info(`No se encontró ningún proveedor asociado al user_id: ${user.id}`);
      return null;
    }

    if (proveedores.length > 1) {
      // Esto indica un posible problema de integridad de datos si user_id debería ser único
      console.warn(`Múltiples proveedores (${proveedores.length}) encontrados para el user_id: ${user.id}. Se usará el primero. IDs: ${proveedores.map(p => p.id).join(', ')}`);
      console.log('Proveedor ID obtenido (múltiples encontrados, usando el primero):', proveedores[0].id);
      return proveedores[0].id; 
    }
    
    // Exactamente un proveedor encontrado
    console.log('Proveedor ID obtenido:', proveedores[0].id);
    return proveedores[0].id;
  } catch (catchError) { // Renombrar variable para evitar conflicto con 'error' de la desestructuración
    console.error('Excepción en getProveedorIdFromUser:', catchError.message);
    return null;
  }
}

// Obtener todos los partes de proveedores
export const getPartesProveedores = async () => {
  console.log('ENTERING: parteProveedorService.getPartesProveedores');
  try {
    console.log('Servicio: Obteniendo partes de proveedores...');
    
    // Primero obtener los datos básicos
    const { data, error } = await supabase
      .from('partes_proveedores')
      .select('*')
      .order('fecha', { ascending: false });
    
    if (error) {
      console.error('Error en getPartesProveedores:', error);
      throw error;
    }
    
    console.log('Servicio: Partes de proveedores obtenidos:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('Servicio: Ejemplo de parte de proveedor (datos básicos):', {
        id: data[0].id,
        numero_parte: data[0].numero_parte,
        razon_social: data[0].razon_social,
        obra_id: data[0].obra_id,
        proveedor_id: data[0].proveedor_id,
        trabajos: data[0].trabajos
      });
    }
    
    // Ahora obtener las relaciones por separado si es necesario
    if (data && data.length > 0) {
      // Obtener obras únicas
      const obrasIds = [...new Set(data.filter(p => p.obra_id).map(p => p.obra_id))];
      const { data: obras, error: errorObras } = await supabase
        .from('obras')
        .select('id, nombre_obra, numero_obra, cliente')
        .in('id', obrasIds);
      
      // Obtener proveedores únicos
      const proveedoresIds = [...new Set(data.filter(p => p.proveedor_id).map(p => p.proveedor_id))];
      const { data: proveedores, error: errorProveedores } = await supabase
        .from('proveedores')
        .select('id, razon_social, codigo, email')
        .in('id', proveedoresIds);
      
      // Combinar los datos
      const dataWithRelations = data.map(parte => ({
        ...parte,
        obra: obras?.find(o => o.id === parte.obra_id),
        proveedor: proveedores?.find(p => p.id === parte.proveedor_id)
      }));
      
      console.log('Servicio: Datos con relaciones:', dataWithRelations.length);
      if (dataWithRelations.length > 0) {
        console.log('Servicio: Ejemplo de parte con relaciones:', {
          id: dataWithRelations[0].id,
          numero_parte: dataWithRelations[0].numero_parte,
          obra: dataWithRelations[0].obra,
          proveedor: dataWithRelations[0].proveedor
        });
      }
      
      return dataWithRelations;
    }
    
    return data;
  } catch (error) {
    console.error('Error en getPartesProveedores:', error);
    throw error;
  }
};

// Obtener un parte de proveedor por ID
export const getParteProveedorById = async (id) => {
  try {
    console.log('Obteniendo parte de proveedor con ID:', id);
    
    const { data, error } = await supabase
      .from('partes_proveedores')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error('Error al obtener parte de proveedor:', error);
      throw error;
    }
    
    if (!data) {
      console.warn(`No se encontró parte de proveedor con ID: ${id}`);
      return null;
    }
    
    console.log('Parte de proveedor obtenido:', data);
    return data;
  } catch (error) {
    console.error('Error en getParteProveedorById:', error);
    throw error;
  }
};

// Crear un nuevo parte de proveedor
export const createParteProveedor = async (parteData) => {
  try {
    // Si el parteData ya incluye proveedor_id (caso SuperAdmin), usarlo directamente
    // Si no, obtener el proveedor_id del usuario autenticado (caso proveedor normal)
    let proveedor_id = parteData.proveedor_id;
    
    if (!proveedor_id) {
      proveedor_id = await getProveedorIdFromUser();
      if (!proveedor_id) {
        throw new Error('No se pudo obtener el ID del proveedor. Verifica que estés autenticado y que tu cuenta esté asociada a un proveedor.');
      }
    }
    
    // Añadir el proveedor_id a los datos del parte
    const datosCompletos = {
      ...parteData,
      proveedor_id
    };
    
    console.log('Creando parte de proveedor con datos:', datosCompletos);
    
    const { data, error } = await supabase
      .from('partes_proveedores')
      .insert([datosCompletos])
      .select();
    
    if (error) {
      console.error('Error al insertar parte de proveedor:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.error('No se recibieron datos después de insertar el parte de proveedor');
      throw new Error('No se recibieron datos después de insertar');
    }
    
    console.log('Parte de proveedor creado con éxito:', data[0]);
    return data[0];
  } catch (error) {
    console.error('Error en createParteProveedor:', error);
    throw error;
  }
};

// Actualizar un parte de proveedor existente
export const updateParteProveedor = async (id, parteData) => {
  try {
    // El proveedor_id ya debería estar en parteData y ser el correcto del parte que se está editando.
    // No es necesario obtenerlo del usuario actual si es un admin quien edita.
    // La validación de si un proveedor puede editar solo su propio parte se haría en la UI o con RLS.
    
    console.log('Actualizando parte de proveedor ID:', id, 'con datos:', parteData);
    
    const { data, error } = await supabase
      .from('partes_proveedores')
      .update(parteData) // Usar parteData directamente, asumiendo que contiene el proveedor_id correcto.
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error al actualizar parte de proveedor:', error);
      throw error;
    }
    
    // Si no hay datos o el array está vacío, intentamos obtener el parte actualizado
    if (!data || data.length === 0) {
      console.warn('No se recibieron datos después de actualizar, intentando obtener el parte actualizado');
      
      const { data: parteActualizado, error: errorConsulta } = await supabase
        .from('partes_proveedores')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (errorConsulta) {
        console.error('Error al obtener parte actualizado:', errorConsulta);
        throw errorConsulta;
      }
      
      if (!parteActualizado) {
        console.error('No se pudo encontrar el parte actualizado con ID:', id);
        throw new Error('No se pudo encontrar el parte después de actualizar');
      }
      
      console.log('Parte de proveedor actualizado obtenido:', parteActualizado);
      return parteActualizado;
    }
    
    console.log('Parte de proveedor actualizado con éxito:', data[0]);
    return data[0];
  } catch (error) {
    console.error('Error en updateParteProveedor:', error);
    throw error;
  }
};

// Eliminar un parte de proveedor
export const deleteParteProveedor = async (id) => {
  try {
    const { error } = await supabase
      .from('partes_proveedores')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error en deleteParteProveedor:', error);
    throw error;
  }
};

// Subir una imagen para un parte de proveedor
export const uploadParteProveedorImage = async (file, parteId) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${parteId}/${Date.now()}.${fileExt}`;
    const filePath = `partes-proveedores/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file);
    
    if (uploadError) throw uploadError;
    
    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error al subir imagen:', error);
    throw error;
  }
};

// Subir una firma para un parte de proveedor
export const uploadParteProveedorSignature = async (signatureDataUrl, parteId) => {
  if (!signatureDataUrl) {
    throw new Error('Faltan datos de la firma.');
  }

  // Convertir Data URL a Blob
  const blob = await dataURLtoBlob(signatureDataUrl);
  if (!blob) {
    throw new Error('No se pudo convertir la firma a un formato subible.');
  }

  try {
    let filePath;
    
    // Si no hay parteId, guardamos la firma en una ubicación temporal
    if (!parteId) {
      // Generar un ID temporal para la firma
      const tempId = Date.now().toString();
      filePath = `partes-proveedores/temp/${tempId}.png`;
      console.log(`Guardando firma temporal en: ${filePath}`);
    } else {
      // Usar la ruta normal para la firma del proveedor
      filePath = `partes-proveedores/${parteId}/signature.png`;
      console.log(`Intentando subir firma a: ${filePath}`);
    }

    const { data, error: uploadError } = await supabase.storage
      .from('images') // Asegúrate que este es el bucket correcto
      .upload(filePath, blob, { upsert: true });

    if (uploadError) {
      console.error('Error completo de Supabase al subir firma:', JSON.stringify(uploadError));
      throw uploadError;
    }

    // Obtener la URL pública
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      console.error('No se pudo obtener la URL pública después de subir la firma.');
      throw new Error('No se pudo obtener la URL pública de la firma.');
    }

    console.log('Firma subida y URL pública obtenida:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl;

  } catch (error) {
    // Loguear el error aquí también para tener más contexto si se propaga
    console.error('Error en la función uploadParteProveedorSignature:', error);
    // Si el error ya es una instancia de Error con mensaje de Supabase, re-lanzarlo
    // Si no, envolverlo en un nuevo Error para asegurar que tenga un .message
    if (error.message) {
      throw error; 
    } else {
      throw new Error(JSON.stringify(error));
    }
  }
}; 

/**
 * Función auxiliar para convertir Data URL a Blob
 * @param {string} dataURL - Data URL de la imagen
 * @returns {Blob} Blob de la imagen
 */
function dataURLtoBlob(dataURL) {
  const bytes = dataURL.split(',')[1];
  const mime = dataURL.split(',')[0].split(':')[1].split(';')[0];
  const binary = atob(bytes);
  const arrayBuffer = new ArrayBuffer(binary.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < binary.length; i++) {
    uint8Array[i] = binary.charCodeAt(i);
  }

  return new Blob([arrayBuffer], { type: mime });
}
