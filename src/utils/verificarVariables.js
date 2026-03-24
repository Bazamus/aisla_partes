// Script para verificar las variables de entorno de Supabase
import { supabase } from '../lib/supabase';

// Función para verificar las variables de entorno
function verificarVariables() {
  try {
    // Obtener las variables de entorno
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;
    
    console.log('=== VERIFICACIÓN DE VARIABLES DE ENTORNO ===');
    console.log('URL de Supabase:', supabaseUrl);
    console.log('Clave anónima disponible:', supabaseAnonKey ? 'Sí' : 'No');
    console.log('Clave de servicio disponible:', supabaseServiceKey ? 'Sí' : 'No');
    
    // Verificar que las variables estén presentes
    if (!supabaseUrl) {
      console.error('ERROR: La URL de Supabase no está definida');
      return false;
    }
    
    if (!supabaseAnonKey) {
      console.error('ERROR: La clave anónima de Supabase no está definida');
      return false;
    }
    
    // Verificar el formato de la URL
    if (!supabaseUrl.startsWith('https://')) {
      console.error('ERROR: La URL de Supabase debe comenzar con https://');
      return false;
    }
    
    // Verificar que la URL no termine con /
    if (supabaseUrl.endsWith('/')) {
      console.error('ERROR: La URL de Supabase no debe terminar con /');
      return false;
    }
    
    // Verificar que la instancia de Supabase esté disponible
    if (!supabase) {
      console.error('ERROR: La instancia de Supabase no está disponible');
      return false;
    }
    
    console.log('Verificación de variables completada con éxito');
    return true;
  } catch (error) {
    console.error('Error inesperado al verificar variables:', error);
    return false;
  }
}

// Ejecutar la verificación
verificarVariables();

export default verificarVariables;
