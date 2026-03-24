import { supabase, getCurrentUser } from '../lib/supabase';
import toast from 'react-hot-toast';

/**
 * Asigna los permisos necesarios al rol de Proveedor
 * @returns {Promise<{success: boolean, message: string}>} Resultado de la operación
 */
export const asignarPermisosProveedor = async () => {
  try {
    console.log('Iniciando asignación de permisos al rol de Proveedor');
    
    // 1. Obtener el ID del rol Proveedor
    const { data: rolesProveedor, error: errorRol } = await supabase
      .from('roles')
      .select('id')
      .ilike('nombre', 'proveedor');
    
    if (errorRol || !rolesProveedor || rolesProveedor.length === 0) {
      console.error('Error al obtener el rol de Proveedor:', errorRol);
      return { success: false, message: 'No se encontró el rol de Proveedor' };
    }
    
    // Usar el primer rol encontrado si hay múltiples
    const rolProveedor = rolesProveedor[0];
    console.log('Rol de Proveedor encontrado:', rolProveedor);
    
    // 2. Obtener los permisos necesarios para el rol de Proveedor
    const permisosNecesarios = [
      'partes:leer',
      'partes:crear',
      'partes:editar',
      'obras:leer'
    ];
    
    const { data: permisos, error: errorPermisos } = await supabase
      .from('permisos')
      .select('id, nombre')
      .in('nombre', permisosNecesarios);
    
    if (errorPermisos || !permisos) {
      console.error('Error al obtener los permisos:', errorPermisos);
      return { success: false, message: 'Error al obtener los permisos necesarios' };
    }
    
    // 3. Verificar permisos existentes para el rol
    const { data: permisosExistentes, error: errorExistentes } = await supabase
      .from('roles_permisos')
      .select('permiso_id')
      .eq('rol_id', rolProveedor.id);
    
    if (errorExistentes) {
      console.error('Error al verificar permisos existentes:', errorExistentes);
      return { success: false, message: 'Error al verificar permisos existentes' };
    }
    
    // Crear un conjunto de IDs de permisos existentes para búsqueda rápida
    const permisosExistentesSet = new Set(permisosExistentes?.map(p => p.permiso_id) || []);
    
    // 4. Asignar los permisos que no existan ya
    const permisosAAsignar = permisos
      .filter(permiso => !permisosExistentesSet.has(permiso.id))
      .map(permiso => ({
        rol_id: rolProveedor.id,
        permiso_id: permiso.id
      }));
    
    if (permisosAAsignar.length === 0) {
      console.log('El rol de Proveedor ya tiene todos los permisos necesarios');
      return { success: true, message: 'El rol de Proveedor ya tiene todos los permisos necesarios' };
    }
    
    // Insertar los nuevos permisos
    const { error: errorAsignacion } = await supabase
      .from('roles_permisos')
      .insert(permisosAAsignar);
    
    if (errorAsignacion) {
      console.error('Error al asignar permisos al rol de Proveedor:', errorAsignacion);
      return { success: false, message: 'Error al asignar permisos al rol de Proveedor' };
    }
    
    console.log(`Se asignaron ${permisosAAsignar.length} permisos al rol de Proveedor`);
    return { 
      success: true, 
      message: `Se asignaron ${permisosAAsignar.length} permisos al rol de Proveedor` 
    };
    
  } catch (error) {
    console.error('Error general al asignar permisos al rol de Proveedor:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Asigna el rol de Proveedor a un usuario
 * @param {string} userId ID del usuario
 * @returns {Promise<{success: boolean, message: string}>} Resultado de la operación
 */
export const asignarRolProveedorAUsuario = async (userId) => {
  try {
    if (!userId) {
      return { success: false, message: 'ID de usuario no proporcionado' };
    }
    
    // 1. Obtener el ID del rol Proveedor
    const { data: rolesProveedor, error: errorRol } = await supabase
      .from('roles')
      .select('id')
      .ilike('nombre', 'proveedor');
    
    if (errorRol || !rolesProveedor || rolesProveedor.length === 0) {
      console.error('Error al obtener el rol de Proveedor:', errorRol);
      return { success: false, message: 'No se encontró el rol de Proveedor' };
    }
    
    // Usar el primer rol encontrado si hay múltiples
    const rolProveedor = rolesProveedor[0];
    console.log('Rol de Proveedor encontrado:', rolProveedor);
    
    // 2. Verificar si el usuario ya tiene el rol asignado
    const { data: rolExistente, error: errorExistente } = await supabase
      .from('usuarios_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('rol_id', rolProveedor.id);
    
    if (rolExistente && rolExistente.length > 0) {
      console.log('El usuario ya tiene el rol de Proveedor asignado');
      return { success: true, message: 'El usuario ya tiene el rol de Proveedor asignado' };
    }
    
    // 3. Asignar el rol al usuario
    const { error: errorAsignacion } = await supabase
      .from('usuarios_roles')
      .insert({
        user_id: userId,
        rol_id: rolProveedor.id
      });
    
    if (errorAsignacion) {
      console.error('Error al asignar rol de Proveedor al usuario:', errorAsignacion);
      return { success: false, message: 'Error al asignar rol de Proveedor al usuario' };
    }
    
    console.log('Rol de Proveedor asignado correctamente al usuario');
    return { success: true, message: 'Rol de Proveedor asignado correctamente al usuario' };
    
  } catch (error) {
    console.error('Error general al asignar rol de Proveedor al usuario:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Verifica y corrige los permisos y roles para un usuario proveedor
 * @param {string} userId ID del usuario
 * @returns {Promise<{success: boolean, message: string}>} Resultado de la operación
 */
export const verificarYCorregirPermisosProveedor = async (userId) => {
  try {
    if (!userId) {
      return { success: false, message: 'ID de usuario no proporcionado' };
    }
    
    // 1. Verificar si el usuario es un proveedor
    const { data: proveedor, error: errorProveedor } = await supabase
      .from('proveedores')
      .select('*')
      .eq('user_id', userId);
    
    if (errorProveedor) {
      console.error('Error al verificar si el usuario es un proveedor:', errorProveedor);
      return { success: false, message: 'Error al verificar si el usuario es un proveedor' };
    }
    
    // Si no se encuentra por user_id, buscar por email
    if (!proveedor || proveedor.length === 0) {
      // SISTEMA AUTH PERSONALIZADO - obtener usuario actual
      const userData = getCurrentUser();
      
      if (!userData) {
        console.error('Error: Usuario no autenticado');
        return { success: false, message: 'Error al obtener datos del usuario' };
      }

      console.log('✅ [permisosProveedor] Usuario obtenido:', userData);
      
      const email = userData.email;
      
      if (email) {
        const { data: proveedorPorEmail, error: errorEmail } = await supabase
          .from('proveedores')
          .select('*')
          .ilike('email', email);
          
        if (errorEmail) {
          console.error('Error al buscar proveedor por email:', errorEmail);
          return { success: false, message: 'Error al buscar proveedor por email' };
        }
        
        if (proveedorPorEmail && proveedorPorEmail.length > 0) {
          // Actualizar el user_id en el proveedor si no está establecido
          const proveedorEncontrado = proveedorPorEmail[0];
          if (!proveedorEncontrado.user_id) {
            const { error: updateError } = await supabase
              .from('proveedores')
              .update({ user_id: userId })
              .eq('id', proveedorEncontrado.id);
              
            if (updateError) {
              console.error('Error al actualizar user_id en proveedor:', updateError);
              // No bloquear el proceso por este error
            }
          }
          
          // Asignar el rol de Proveedor al usuario
          const resultadoRol = await asignarRolProveedorAUsuario(userId);
          
          if (!resultadoRol.success) {
            return resultadoRol;
          }
          
          // Asignar permisos al rol de Proveedor
          const resultadoPermisos = await asignarPermisosProveedor();
          
          return { 
            success: true, 
            message: 'Permisos y rol de Proveedor verificados y corregidos correctamente' 
          };
        }
      }
    } else {
      // El usuario es un proveedor, asignar rol y permisos
      const resultadoRol = await asignarRolProveedorAUsuario(userId);
      
      if (!resultadoRol.success) {
        return resultadoRol;
      }
      
      // Asignar permisos al rol de Proveedor
      const resultadoPermisos = await asignarPermisosProveedor();
      
      return { 
        success: true, 
        message: 'Permisos y rol de Proveedor verificados y corregidos correctamente' 
      };
    }
    
    return { success: false, message: 'El usuario no es un proveedor' };
    
  } catch (error) {
    console.error('Error general al verificar y corregir permisos de proveedor:', error);
    return { success: false, message: error.message };
  }
};
