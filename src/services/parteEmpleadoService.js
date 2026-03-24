import { supabase, getCurrentUser } from '../lib/supabase';

// --- CONSTANTS ---
const BUCKET_IMAGES = 'images';

// --- ERROR HANDLING & HELPERS ---

/**
 * Centralized error handler for Supabase calls.
 * @param {Error} error - The error object from Supabase.
 * @param {string} context - The context of the function where the error occurred.
 */
const handleSupabaseError = (error, context) => {
  console.error(`Error in ${context}:`, error.message);
  throw error;
};

/**
 * Generic wrapper for calling Supabase RPC functions.
 * @param {string} rpcName - The name of the RPC function to call.
 * @param {object} params - The parameters to pass to the RPC function.
 * @returns {Promise<any>} The data returned from the RPC call.
 */
const callRpc = async (rpcName, params = {}) => {
  try {
    const { data, error } = await supabase.rpc(rpcName, params);
    if (error) {
      handleSupabaseError(error, `RPC/${rpcName}`);
    }
    return data;
  } catch (error) {
    // This catches exceptions outside the RPC call itself
    handleSupabaseError(error, `callRpc/${rpcName}`);
  }
};

/**
 * Converts a Data URL to a Blob object.
 * @param {string} dataURL - The Data URL string.
 * @returns {Blob|null} A Blob object or null if conversion fails.
 */
const dataURLtoBlob = (dataURL) => {
  try {
    const parts = dataURL.split(',');
    if (parts.length < 2) throw new Error("Invalid Data URL");
    
    const mimePart = parts[0].match(/:(.*?);/);
    if (!mimePart || mimePart.length < 2) throw new Error("MIME type not found in Data URL");
    
    const mime = mimePart[1];
    const byteString = atob(parts[1]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }
    return new Blob([arrayBuffer], { type: mime });
  } catch (error) {
    console.error("Error converting Data URL to Blob:", error.message);
    return null;
  }
};


// --- EMPLEADO SERVICES ---

/**
 * Obtiene los datos del empleado actual basándose en el usuario autenticado.
 */
export const getEmpleadoFromUser = async () => {
  try {
    // SISTEMA AUTH PERSONALIZADO - obtener usuario actual
    const user = getCurrentUser()
    if (!user) {
      throw new Error('User not authenticated.');
    }

    const { data: empleadoData, error: empleadoError } = await supabase
      .from('empleados')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (empleadoError) {
        if (empleadoError.code === 'PGRST116') {
            console.warn(`No employee profile found for user_id ${user.id}`);
            return null;
        }
        handleSupabaseError(empleadoError, 'getEmpleadoFromUser');
    }
    return empleadoData;
  } catch (error) {
    handleSupabaseError(error, 'getEmpleadoFromUser (exception)');
  }
};

/**
 * Obtiene las obras asignadas a un empleado. Si no se provee ID, usa el del usuario actual.
 * @param {string} [empleadoUserId=null] - El user_id del empleado (UUID).
 */
export const getObrasAsignadasEmpleado = async (empleadoUserId = null) => {
  try {
    if (!empleadoUserId) {
      // Si no se proporciona empleadoUserId, usar el usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Error al obtener usuario actual:', userError);
        return [];
      }
      empleadoUserId = user.id;
    }

    // Usar la función RPC que espera un UUID (user_id)
    const { data, error } = await supabase.rpc('obtener_obras_asignadas_por_user_id', {
      p_user_id: empleadoUserId
    });

    if (error) {
      console.error('Error al obtener obras asignadas:', error);
      return [];
    }

    // La función RPC devuelve directamente el array de obras
    return data || [];
  } catch (error) {
    console.error('Error en getObrasAsignadasEmpleado:', error);
    return [];
  }
};


// --- PARTES SERVICES ---

/**
 * Crea un nuevo parte de trabajo para un empleado.
 * Utiliza la función RPC `crear_parte_empleado`.
 * @param {object} parteData - Datos del parte a crear.
 */
export const createParteEmpleado = (parteData) => {
  return callRpc('crear_parte_empleado', { parte: parteData });
};

/**
 * Obtiene todos los partes de un empleado por su user_id.
 * Incluye tanto los partes que el empleado creó como los que le fueron asignados.
 * @param {string} userId - El user_id del empleado.
 */
export const getPartesByEmpleadoUserId = async (userId) => {
  if (!userId) {
    throw new Error('User ID not provided.');
  }
  try {
    // Primero, obtener el código y nombre del empleado
    const { data: empleadoData, error: empleadoError } = await supabase
      .from('empleados')
      .select('codigo, nombre')
      .eq('user_id', userId)
      .single();

    if (empleadoError) {
      console.error('Error al obtener código de empleado:', empleadoError);
      // Si no se encuentra el empleado, solo buscar por user_id
      const { data, error } = await supabase
        .from('partes')
        .select('id, numero_parte, fecha, nombre_obra, nombre_trabajador, estado, cliente, id_obra, coste_trabajos, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        handleSupabaseError(error, 'getPartesByEmpleadoUserId');
      }
      console.log('🔍 [getPartesByEmpleadoUserId] Partes encontrados (solo por user_id):', data?.length || 0);
      return data || [];
    }

    const codigoEmpleado = empleadoData?.codigo;
    const nombreEmpleado = empleadoData?.nombre;
    
    console.log('🔍 [getPartesByEmpleadoUserId] Datos del empleado:', {
      userId,
      codigo: codigoEmpleado,
      nombre: nombreEmpleado
    });

    // Buscar partes donde:
    // 1. El empleado los creó (user_id = userId)
    // 2. O el empleado está asignado por código (codigo_empleado = codigoEmpleado)
    // 3. O el empleado está asignado por nombre (nombre_trabajador = nombreEmpleado)
    const { data, error } = await supabase
      .from('partes')
      .select('id, numero_parte, fecha, nombre_obra, nombre_trabajador, estado, cliente, id_obra, user_id, codigo_empleado, coste_trabajos, created_at')
      .or(`user_id.eq.${userId},codigo_empleado.eq.${codigoEmpleado},nombre_trabajador.ilike.${nombreEmpleado}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [getPartesByEmpleadoUserId] Error en consulta:', error);
      handleSupabaseError(error, 'getPartesByEmpleadoUserId');
    }
    
    console.log('✅ [getPartesByEmpleadoUserId] Total partes encontrados:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('📋 [getPartesByEmpleadoUserId] Primeros 3 partes:', data.slice(0, 3).map(p => ({
        numero_parte: p.numero_parte,
        nombre_trabajador: p.nombre_trabajador,
        codigo_empleado: p.codigo_empleado,
        user_id: p.user_id
      })));
    }
    
    return data || [];
  } catch (error) {
    console.error('❌ [getPartesByEmpleadoUserId] Excepción:', error);
    handleSupabaseError(error, 'getPartesByEmpleadoUserId (exception)');
  }
};

/**
 * Obtiene un parte de trabajo específico por su ID.
 * @param {string} id - El ID del parte.
 */
export const getParteById = async (id) => {
  if (!id) {
    throw new Error('Parte ID not provided.');
  }
  try {
    const { data, error } = await supabase
      .from('partes')
      .select('*') // Selecciona todos los campos para detalle completo
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      handleSupabaseError(error, 'getParteById');
    }
    return data;
  } catch (error) {
    handleSupabaseError(error, 'getParteById (exception)');
  }
};

/**
 * Actualiza un parte de trabajo.
 * @param {string} id - El ID del parte a actualizar.
 * @param {object} parteData - Los datos a actualizar.
 */
export const updateParteEmpleado = async (id, parteData) => {
  if (!id) {
    throw new Error('Parte ID not provided for update.');
  }
  try {
    const { user_id, ...updateData } = parteData; // Avoid updating user_id
    const { data, error } = await supabase
      .from('partes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, 'updateParteEmpleado');
    }
    return data;
  } catch (error) {
    handleSupabaseError(error, 'updateParteEmpleado (exception)');
  }
};

/**
 * Elimina un parte de trabajo y todos sus trabajos asociados.
 * @param {string} id - El ID del parte a eliminar.
 */
export const deleteParteEmpleado = async (id) => {
  if (!id) {
    throw new Error('Parte ID not provided for deletion.');
  }
  try {
    console.log('🗑️ Eliminando parte empleado con ID:', id);
    
    // Usar función RPC que maneja eliminación en cascada
    const { data, error } = await supabase
      .rpc('eliminar_parte_cascada', { p_parte_id: id });

    if (error) {
      console.error('Error en RPC eliminar_parte_cascada:', error);
      handleSupabaseError(error, 'deleteParteEmpleado');
    }
    
    if (!data) {
      throw new Error('No se pudo eliminar el parte. Verifique que el parte existe.');
    }
    
    console.log('✅ Parte empleado eliminado exitosamente:', id);
    return true;
  } catch (error) {
    handleSupabaseError(error, 'deleteParteEmpleado (exception)');
  }
};


// --- TRABAJOS EMPLEADO SERVICES (RPC-based) ---

/**
 * Obtiene todos los trabajos de un parte de empleado.
 * Utiliza la función RPC `obtener_trabajos_parte_empleado`.
 * @param {string} parteId - El ID del parte.
 */
export const getTrabajosParteEmpleado = (parteId) => {
  if (!parteId) throw new Error('Parte ID is required.');
  return callRpc('obtener_trabajos_parte_empleado', { p_parte_id: parteId });
};

/**
 * Agrega una nueva línea de trabajo a un parte.
 * Utiliza la función RPC `agregar_trabajo_empleado`.
 * @param {object} trabajoData - Datos del trabajo a agregar.
 */
export const addTrabajoEmpleado = (trabajoData) => {
  if (!trabajoData.parte_id || !trabajoData.descripcion) {
    throw new Error('Incomplete data for adding a job.');
  }
  return callRpc('agregar_trabajo_empleado', {
    p_parte_id: trabajoData.parte_id,
    p_trabajo_id: trabajoData.trabajo_id || null,
    p_descripcion: trabajoData.descripcion,
    p_tiempo_empleado: trabajoData.tiempo_empleado,
    p_observaciones: trabajoData.observaciones || '',
    p_tipo_trabajo: trabajoData.tipo_trabajo || 'catalogo',
    p_grupo_id: trabajoData.grupo_id || null,
    p_subgrupo_id: trabajoData.subgrupo_id || null,
    p_portal: trabajoData.portal || null,
    p_vivienda: trabajoData.vivienda || null,
    p_cantidad: trabajoData.cantidad || 1.0
  });
};

/**
 * Actualiza el tiempo de una línea de trabajo específica.
 * Utiliza la función RPC `actualizar_tiempo_trabajo_empleado`.
 * @param {string} lineaId - El ID de la línea de trabajo.
 * @param {number} tiempoEmpleado - El nuevo tiempo empleado.
 */
export const updateTiempoTrabajoEmpleado = (lineaId, tiempoEmpleado) => {
  if (!lineaId || tiempoEmpleado === undefined) {
    throw new Error('Line ID and time are required.');
  }
  return callRpc('actualizar_tiempo_trabajo_empleado', {
    p_linea_id: lineaId,
    p_tiempo_empleado: tiempoEmpleado
  });
};

/**
 * Elimina una línea de trabajo de un parte.
 * Utiliza la función RPC `eliminar_trabajo_empleado`.
 * @param {string} lineaId - El ID de la línea de trabajo a eliminar.
 */
export const deleteTrabajoEmpleado = (lineaId) => {
  if (!lineaId) throw new Error('Line ID is required.');
  return callRpc('eliminar_trabajo_empleado', { p_linea_id: lineaId });
};

/**
 * Calcula el tiempo total de un parte.
 * Utiliza la función RPC `calcular_tiempo_total_parte`.
 * @param {string} parteId - El ID del parte.
 */
export const calcularTiempoTotalParte = (parteId) => {
  if (!parteId) throw new Error('Parte ID is required.');
  return callRpc('calcular_tiempo_total_parte', { p_parte_id: parteId });
};

/**
 * Obtiene estadísticas de un parte.
 * Utiliza la función RPC `obtener_estadisticas_parte_empleado`.
 * @param {string} parteId - El ID del parte.
 */
export const getEstadisticasParte = (parteId) => {
  if (!parteId) throw new Error('Parte ID is required.');
  return callRpc('obtener_estadisticas_parte_empleado', { p_parte_id: parteId });
};


// --- FILE UPLOAD SERVICES ---

/**
 * Sube una imagen para un parte de trabajo.
 * @param {File} file - El archivo de imagen.
 * @param {string} parteId - El ID del parte.
 * @returns {Promise<string>} La URL pública de la imagen subida.
 */
export const uploadParteImage = async (file, parteId) => {
  if (!file || !parteId) {
    throw new Error('File and Parte ID are required for image upload.');
  }
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `partes-empleados/${parteId}/images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_IMAGES)
      .upload(filePath, file);

    if (uploadError) {
      handleSupabaseError(uploadError, 'uploadParteImage');
    }

    const { data } = supabase.storage
      .from(BUCKET_IMAGES)
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    handleSupabaseError(error, 'uploadParteImage (exception)');
  }
};

/**
 * Sube una firma para un parte de trabajo.
 * @param {string} signatureDataUrl - La firma como Data URL.
 * @param {string} parteId - El ID del parte.
 * @returns {Promise<string>} La URL pública de la firma subida.
 */
export const uploadParteSignature = async (signatureDataUrl, parteId) => {
  if (!signatureDataUrl || !parteId) {
    throw new Error('Signature data and Parte ID are required.');
  }

  const blob = dataURLtoBlob(signatureDataUrl);
  if (!blob) {
    throw new Error('Could not convert signature to a submittable format.');
  }

  try {
    const filePath = `partes-empleados/${parteId}/signatures/signature_${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_IMAGES)
      .upload(filePath, blob, { upsert: true });

    if (uploadError) {
      handleSupabaseError(uploadError, 'uploadParteSignature');
    }

    const { data } = supabase.storage
      .from(BUCKET_IMAGES)
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error('Could not get the public URL for the signature.');
    }
    return data.publicUrl;
  } catch (error) {
    handleSupabaseError(error, 'uploadParteSignature (exception)');
  }
};
