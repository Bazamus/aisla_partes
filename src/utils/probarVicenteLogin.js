// Script para probar específicamente el login de Vicente
import { supabase } from '../lib/supabase';

// Función para probar el login
async function probarVicenteLogin() {
  try {
    console.log('Probando login específico para Vicente...');
    
    // Datos de prueba
    const email = 'vicente@demo.com';
    const password = 'vicente123';
    
    console.log(`Intentando login con: ${email} / ${password}`);
    
    // Intentar login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Error en login específico:', error);
      return { success: false, error };
    }
    
    console.log('Login exitoso:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error inesperado en login específico:', error);
    return { success: false, error };
  }
}

export default probarVicenteLogin;
