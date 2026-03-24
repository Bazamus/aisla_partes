import { supabase, supabaseAdmin } from '../lib/supabase';

// --- FUNCIONES DE LECTURA ---

/**
 * Obtiene todos los usuarios activos con sus detalles y roles.
 */
export const getUsersWithDetails = async () => {
  const { data, error } = await supabase.rpc('get_all_users');
  if (error) {
    console.error('Error fetching users with details:', error);
    throw new Error('No se pudieron obtener los usuarios.');
  }
  return data;
};

/**
 * Obtiene la lista de todos los roles disponibles en el sistema.
 */
export const getRoles = async () => {
  const { data, error } = await supabase.from('roles').select('*');
  if (error) {
    console.error('Error fetching roles:', error);
    throw new Error('No se pudieron obtener los roles.');
  }
  return data;
};

/**
 * Obtiene la lista de empleados que aún no tienen una cuenta de usuario.
 */
export const getEmpleadosSinUsuario = async (searchTerm) => {
  const { data, error } = await supabase
    .rpc('get_empleados_sin_usuario', { p_search_term: searchTerm });
  if (error) {
    console.error('Error fetching unlinked employees:', error);
    throw new Error('No se pudieron obtener los empleados.');
  }
  return data;
};

/**
 * Obtiene la lista de proveedores que aún no tienen una cuenta de usuario.
 */
export const getProveedoresSinUsuario = async (searchTerm) => {
  const { data, error } = await supabase
    .rpc('get_proveedores_sin_usuario', { p_search_term: searchTerm });
  if (error) {
    console.error('Error fetching unlinked providers:', error);
    throw new Error('No se pudieron obtener los proveedores.');
  }
  return data;
};


// --- FUNCIONES DE ESCRITURA ---

/**
 * Crea un nuevo usuario usando función manual sin triggers.
 * @param {object} formData - Datos del formulario, incluyendo email, password, roleIds, etc.
 */
export const createUser = async (formData) => {
  try {
    console.log('Creating user with formData:', formData);
    
    // Buscar información del empleado/proveedor si está vinculado
    let nombreCompleto = null;
    let telefono = null;
    
    if (formData.linkToType === 'empleado' && formData.linkToId) {
      const { data: empleadoData } = await supabase
        .from('empleados')
        .select('nombre, telefono')
        .eq('id', formData.linkToId)
        .single();
      
      if (empleadoData) {
        nombreCompleto = empleadoData.nombre;
        telefono = empleadoData.telefono;
      }
    } else if (formData.linkToType === 'proveedor' && formData.linkToId) {
      const { data: proveedorData } = await supabase
        .from('proveedores')
        .select('nombre, telefono')
        .eq('id', formData.linkToId)
        .single();
      
      if (proveedorData) {
        nombreCompleto = proveedorData.nombre;
        telefono = proveedorData.telefono;
      }
    }
    
    // Crear usuario usando función CORREGIDA con configuración idéntica a carlospulido
    const { data: sqlResult, error: createError } = await supabase
      .rpc('create_user_correct_config', {
        p_email: formData.email,
        p_password: formData.password,
        p_nombre: nombreCompleto,
        p_telefono: telefono,
        p_empleado_id: formData.linkToType === 'empleado' ? formData.linkToId : null,
        p_proveedor_id: formData.linkToType === 'proveedor' ? formData.linkToId : null
      });

    if (createError) {
      console.error('Error creating user with direct SQL:', createError);
      throw new Error(createError.message || 'Error al crear el usuario.');
    }

    console.log('User created with CORRECT CONFIG:', sqlResult);
    
    if (!sqlResult.success) {
      throw new Error(sqlResult.error || 'Error al crear el usuario');
    }

    const result = sqlResult;

    // Asignar roles al usuario
    if (formData.roleIds && formData.roleIds.length > 0) {
      const roleAssignments = formData.roleIds.map(rolId => ({
        user_id: result.user_id, // usar user_id de auth, no usuario_id
        rol_id: rolId
      }));

      const { error: rolesError } = await supabase
        .from('usuarios_roles')
        .insert(roleAssignments);

      if (rolesError) {
        console.error('Error assigning roles:', rolesError);
        // No fallar completamente, solo avisar
        console.warn('Usuario creado pero error al asignar roles');
      }
    }

    // La vinculación ya está manejada por la función SQL

    return {
      user: { id: result.user_id, email: result.email },
      usuario_id: result.usuario_id,
      success: true
    };
  } catch (error) {
    console.error('Error in createUser:', error);
    throw error;
  }
};

/**
 * Actualiza los roles de un usuario existente.
 * @param {string} userId - El UUID del usuario a modificar.
 * @param {string[]} roleIds - Un array con los UUIDs de los nuevos roles.
 */
export const updateUserRoles = async (userId, roleIds) => {
  // 1. Eliminar los roles antiguos del usuario
  const { error: deleteError } = await supabase
    .from('usuarios_roles')
    .delete()
    .eq('user_id', userId);

  if (deleteError) {
    console.error('Error deleting old roles:', deleteError);
    throw new Error('No se pudieron eliminar los roles antiguos.');
  }

  // 2. Insertar los nuevos roles si se proporcionaron
  if (roleIds && roleIds.length > 0) {
    const newRoles = roleIds.map(rol_id => ({
      user_id: userId,
      rol_id: rol_id,
    }));

    const { error: insertError } = await supabase
      .from('usuarios_roles')
      .insert(newRoles);

    if (insertError) {
      console.error('Error inserting new roles:', insertError);
      throw new Error('No se pudieron asignar los nuevos roles.');
    }
  }

  return { success: true };
};

/**
 * Resetea la contraseña de un usuario (requiere privilegios de admin).
 * @param {string} userId - El UUID del usuario.
 * @param {string} newPassword - La nueva contraseña.
 */
export const resetUserPassword = async (userIdToReset, newPassword) => {
  const { data, error } = await supabase.functions.invoke('reset-user-password-simple', {
    body: { userIdToReset, newPassword },
  });

  if (error) {
    console.error('Error invoking reset-user-password function:', error);
    const errorMessage = data?.error || error.message;
    throw new Error(errorMessage || 'Ocurrió un error al resetear la contraseña.');
  }

  // La Edge function devuelve un mensaje y el usuario actualizado en caso de éxito
  return data;
};

/**
 * Elimina un usuario invocando la Edge Function 'delete-user'.
 * @param {string} userIdToDelete - El UUID del usuario a eliminar.
 */
export const deleteUser = async (userIdToDelete) => {
  // supabase.functions.invoke() automáticamente incluye el token de autorización
  const { data, error } = await supabase.functions.invoke('delete-user', {
    body: { userIdToDelete },
  });

  if (error) {
    console.error('Error invoking delete-user function:', error);
    console.error('Error details:', { data, error });
    // Intenta extraer un mensaje de error más útil si está disponible
    const errorMessage = data?.error || error.message;
    throw new Error(errorMessage || 'Ocurrió un error al eliminar el usuario.');
  }

  return data;
};