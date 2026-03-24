// Script para probar el login del nuevo usuario de prueba
import { supabase } from '../lib/supabase';

// Función para probar el login
async function probarUsuarioPrueba() {
  try {
    console.log('Probando login con el nuevo usuario de prueba...');
    
    // Datos de prueba
    const email = 'prueba2@demo.com';
    const password = 'prueba123';
    
    console.log(`Intentando login con: ${email} / ${password}`);
    
    // Intentar login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Error en login de usuario prueba:', error);
      return { success: false, error };
    }
    
    console.log('Login exitoso:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error inesperado en login de usuario prueba:', error);
    return { success: false, error };
  }
}

export default probarUsuarioPrueba;
