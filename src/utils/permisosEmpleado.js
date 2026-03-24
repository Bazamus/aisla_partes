import { supabase } from '../lib/supabase';

const ROL_EMPLEADO_ID = '8666a96a-626e-4e67-ab3e-04256e017379'; // ID de rol 'empleado' de la BD del usuario
const PERMISOS_NECESARIOS = [
  '2a72d580-7205-459a-b81c-923a57868705', // partes:crear
  'd8a2a3d3-1230-4536-9c49-597a7c73432a', // partes:leer
  '3ef7bb2c-63d4-400d-947f-046056737e91', // partes:editar
  '55751548-2796-4c00-948f-ca9c324b9abc'  // partes:eliminar
];

// Función para verificar y asignar el rol de empleado si no lo tiene
export const verificarRolEmpleado = async (userId) => {
  console.log(`[Diagnóstico Permisos] 1. Verificando si el usuario ${userId} tiene el rol 'empleado' (${ROL_EMPLEADO_ID})...`);
  const { data, error } = await supabase
    .from('usuarios_roles')
    .select('rol_id')
    .eq('user_id', userId)
    .eq('rol_id', ROL_EMPLEADO_ID)
    .maybeSingle();

  if (error) {
    console.error('[Diagnóstico Permisos] 1.1. ERROR al verificar rol:', error.message);
    return false;
  }
  const tieneRol = !!data;
  console.log(`[Diagnóstico Permisos] 1.2. ¿Tiene rol? ${tieneRol}`);
  return tieneRol;
};

const asignarRolEmpleado = async (userId) => {
  console.log(`[Diagnóstico Permisos] 2. Asignando rol 'empleado' a ${userId}...`);
  const { error } = await supabase.from('usuarios_roles').insert({ user_id: userId, rol_id: ROL_EMPLEADO_ID });
  if (error) {
    console.error(`[Diagnóstico Permisos] 2.1. FALLO CATASTRÓFICO al asignar rol: ${error.message}`);
    throw new Error(`Error al asignar el rol de empleado: ${error.message}`);
  }
  console.log('[Diagnóstico Permisos] 2.2. Rol asignado con ÉXITO.');
};

// Función para verificar y asignar los permisos necesarios al rol de empleado
export const asegurarPermisosParaRolEmpleado = async () => {
  try {
    for (const permisoId of PERMISOS_NECESARIOS) {
      // Verificar si la relación rol-permiso ya existe
      const { data: permisoExistente, error: errorVerificacion } = await supabase
        .from('roles_permisos')
        .select('id')
        .eq('rol_id', ROL_EMPLEADO_ID)
        .eq('permiso_id', permisoId)
        .single();

      if (errorVerificacion && errorVerificacion.code !== 'PGRST116') {
        throw new Error(`Error al verificar el permiso ${permisoId}: ${errorVerificacion.message}`);
      }

      // Si no existe, lo creamos
      if (!permisoExistente) {
        console.log(`Asignando permiso ${permisoId} al rol de empleado...`);
        const { error: errorAsignacion } = await supabase
          .from('roles_permisos')
          .insert({ rol_id: ROL_EMPLEADO_ID, permiso_id: permisoId });

        if (errorAsignacion) {
          throw new Error(`Error al asignar el permiso ${permisoId}: ${errorAsignacion.message}`);
        }
        console.log(`Permiso ${permisoId} asignado correctamente.`);
      }
    }
    return { success: true, message: 'Permisos de empleado verificados y/o asignados.' };

  } catch (error) {
    console.error('Error en asegurarPermisosParaRolEmpleado:', error);
  }
};

// Función principal que combina las dos verificaciones
export const verificarYCorregirPermisosEmpleado = async (userId) => {
  console.log(`[Diagnóstico Permisos] INICIO del proceso para usuario ${userId}`);
  if (!userId) {
    console.error('[Diagnóstico Permisos] Proceso abortado: userId es nulo.');
    return false;
  }

  let seHicieronCambios = false;

  try {
    const tieneRol = await verificarRolEmpleado(userId);
    if (!tieneRol) {
      await asignarRolEmpleado(userId);
      seHicieronCambios = true;
    }

    // Por ahora, nos centramos solo en la asignación del rol, que es el problema principal.
    // La asignación de permisos al rol se asume correcta.

    if (seHicieronCambios) {
      console.log('[Diagnóstico Permisos] FIN: Se asignó el rol. Se devolverá `true` para forzar recarga.');
    } else {
      console.log('[Diagnóstico Permisos] FIN: El rol ya estaba correcto. Se devolverá `false`.');
    }

    return seHicieronCambios;

  } catch (error) {
    console.error('[Diagnóstico Permisos] FIN con ERROR CATASTRÓFICO:', error.message);
    return false;
  }
};
