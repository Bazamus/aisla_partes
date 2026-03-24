// Script para resetear la contraseña de un usuario utilizando la API de Supabase
import { supabase } from '../lib/supabase';

/**
 * Función para solicitar un restablecimiento de contraseña
 * @param {string} email - El correo electrónico del usuario
 * @returns {Promise<object>} - Resultado de la operación
 */
async function solicitarReseteoContraseña(email) {
  try {
    console.log(`Solicitando reseteo de contraseña para: ${email}`);
    
    // Solicitar el reseteo de contraseña
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) {
      console.error('Error al solicitar reseteo de contraseña:', error);
      return { success: false, error };
    }
    
    console.log('Solicitud de reseteo enviada correctamente:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error inesperado al solicitar reseteo:', error);
    return { success: false, error };
  }
}

/**
 * Función para actualizar la contraseña directamente (requiere token)
 * @param {string} newPassword - La nueva contraseña
 * @returns {Promise<object>} - Resultado de la operación
 */
async function actualizarContraseña(newPassword) {
  try {
    console.log('Actualizando contraseña...');
    
    // Actualizar la contraseña
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      console.error('Error al actualizar contraseña:', error);
      return { success: false, error };
    }
    
    console.log('Contraseña actualizada correctamente:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error inesperado al actualizar contraseña:', error);
    return { success: false, error };
  }
}

export { solicitarReseteoContraseña, actualizarContraseña };
