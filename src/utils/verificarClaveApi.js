// Script para verificar la clave API de Supabase
// Este script comprueba si la clave API está correctamente formateada y no ha sido modificada

// Función para verificar la clave API
async function verificarClaveApi() {
  try {
    console.log('Verificando clave API de Supabase...');
    
    // Obtener la clave anónima
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log(`URL: ${supabaseUrl}`);
    console.log(`Clave anónima: ${supabaseAnonKey ? supabaseAnonKey.substring(0, 5) + '...' + supabaseAnonKey.substring(supabaseAnonKey.length - 5) : 'No disponible'}`);
    
    // Verificar formato de la clave (debería ser una cadena larga con formato JWT)
    const formatoValido = supabaseAnonKey && 
                          supabaseAnonKey.length > 30 && 
                          supabaseAnonKey.split('.').length === 3;
    
    console.log(`Formato de clave válido: ${formatoValido ? 'Sí' : 'No'}`);
    
    // Hacer una solicitud simple para verificar la clave
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    
    console.log('Código de respuesta:', response.status);
    
    if (response.status === 401) {
      console.error('Error: La clave API no es válida o ha expirado');
      return { 
        success: false, 
        message: 'La clave API no es válida o ha expirado',
        status: response.status
      };
    }
    
    if (!response.ok) {
      console.error('Error en la verificación de la clave API:', await response.text());
      return { 
        success: false, 
        message: 'Error en la verificación de la clave API',
        status: response.status
      };
    }
    
    console.log('Clave API válida');
    return { 
      success: true, 
      message: 'Clave API válida',
      status: response.status
    };
  } catch (error) {
    console.error('Error inesperado al verificar la clave API:', error);
    return { 
      success: false, 
      message: 'Error inesperado al verificar la clave API',
      error
    };
  }
}

export default verificarClaveApi;
