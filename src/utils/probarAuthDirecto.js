// Script para probar la autenticación directamente con la API de Supabase
// Este script utiliza fetch para hacer una solicitud directa a la API

async function probarAuthDirecto() {
  try {
    console.log('Probando autenticación directa con API Supabase...');
    
    // Datos de prueba
    const email = 'prueba2@demo.com';
    const password = 'prueba123';
    
    // URL y clave de Supabase
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log(`URL: ${supabaseUrl}`);
    console.log(`Clave disponible: ${supabaseAnonKey ? 'Sí' : 'No'}`);
    console.log(`Intentando login con: ${email} / ${password}`);
    
    // Hacer solicitud directa a la API
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({
        email,
        password
      })
    });
    
    // Obtener respuesta completa
    const responseData = await response.json();
    
    console.log('Código de estado:', response.status);
    console.log('Respuesta completa:', responseData);
    
    if (!response.ok) {
      console.error('Error en autenticación directa:', responseData);
      return { success: false, error: responseData };
    }
    
    console.log('Autenticación directa exitosa:', responseData);
    return { success: true, data: responseData };
  } catch (error) {
    console.error('Error inesperado en autenticación directa:', error);
    return { success: false, error };
  }
}

export default probarAuthDirecto;
