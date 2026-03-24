// Script para verificar la conexión con Supabase
import { supabase } from '../lib/supabase';

// Función para verificar la conexión
async function verificarConexion() {
  try {
    console.log('Verificando conexión con Supabase...');
    console.log('URL de Supabase:', supabase.supabaseUrl);
    
    // Verificar si podemos acceder a una tabla existente
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Error al conectar con la tabla usuarios:', error);
      return false;
    }
    
    console.log('Conexión exitosa con Supabase. Datos de usuario:', data);
    return true;
  } catch (error) {
    console.error('Error inesperado al verificar conexión:', error);
    return false;
  }
}

// Ejecutar la verificación
verificarConexion();

export default verificarConexion;
