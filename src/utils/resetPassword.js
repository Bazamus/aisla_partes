// Script para restablecer la contraseña de un usuario
import { supabase } from '../lib/supabase';

// Función para solicitar restablecimiento de contraseña
async function resetPassword(email) {
  try {
    console.log(`Solicitando restablecimiento de contraseña para ${email}...`);
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) {
      console.error('Error al solicitar restablecimiento:', error);
      return { success: false, error };
    }
    
    console.log('Solicitud de restablecimiento enviada correctamente');
    return { success: true };
  } catch (error) {
    console.error('Error inesperado al restablecer contraseña:', error);
    return { success: false, error };
  }
}

export default resetPassword;
