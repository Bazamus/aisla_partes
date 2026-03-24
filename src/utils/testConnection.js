// Script para probar la conexión con Supabase
import { supabase } from '../lib/supabase';

// Función para probar la autenticación
async function testAuth() {
  try {
    console.log('Probando conexión con Supabase...');
    
    // Probar la conexión básica
    // const { data: version, error: versionError } = await supabase
    //   .from('_version')
    //   .select('*')
    //   .limit(1);
      
    // if (versionError) {
    //   console.error('Error al conectar con Supabase (desde testConnection):', versionError);
    // } else {
    //   console.log('Conexión exitosa con Supabase (desde testConnection)');
    // }
    
    // Probar autenticación específica
    const testEmail = 'vicente@demo.com';
    const testPassword = 'vicente123';
    
    console.log(`Probando autenticación con ${testEmail} (desde testConnection)...`);
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (authError) {
      console.error('Error de autenticación (desde testConnection):', authError);
      
      // Verificar si el usuario existe
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', testEmail)
        .limit(1);
        
      if (userError) {
        console.error('[testConnection.js] Error al verificar usuario en tabla usuarios (desde testConnection):', userError);
      } else if (!userData || userData.length === 0) {
        console.log('[testConnection.js] Usuario no encontrado en tabla usuarios (desde testConnection)');
      } else {
        console.log('[testConnection.js] Usuario encontrado en tabla usuarios (desde testConnection):', userData[0]);
      }
      
    } else {
      console.log('[testConnection.js] Autenticación exitosa (desde testConnection):', authData.user.email);
    }
    
  } catch (error) {
    console.error('Error inesperado (desde testConnection):', error);
  }
}

// Ejecutar la prueba
// testAuth(); // Comentamos la ejecución automática si no es necesaria siempre

export default testAuth;
