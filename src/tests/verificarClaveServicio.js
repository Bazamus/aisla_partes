/**
 * Script para verificar que la clave de servicio de Supabase es correcta
 * Ejecuta este script en la consola del navegador mientras estás en la aplicación
 */

async function verificarClaveServicio() {
  console.log('🔑 Verificando clave de servicio de Supabase...');
  
  // Verificar si supabaseAdmin está disponible
  if (typeof supabaseAdmin === 'undefined') {
    console.error('❌ El cliente supabaseAdmin no está disponible en el ámbito global');
    console.log('💡 Intenta importar manualmente el cliente:');
    console.log(`
    import { supabaseAdmin } from '../lib/supabase';
    // o
    const { supabaseAdmin } = await import('../lib/supabase');
    `);
    return false;
  }
  
  try {
    // Intentar una operación administrativa
    console.log('🔄 Probando listado de usuarios (requiere clave de servicio)...');
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Error al listar usuarios:', error.message);
      
      if (error.status === 403) {
        console.error('❌ Error de permisos (403 Forbidden). La clave de servicio no es válida o no tiene permisos suficientes.');
        console.log('💡 Verifica que estés usando la clave "service_role" y no la clave "anon".');
      } else {
        console.error('❌ Otro tipo de error:', error);
      }
      
      return false;
    }
    
    // Si llegamos aquí, la clave funciona
    console.log('✅ Clave de servicio verificada correctamente');
    console.log(`📊 Se encontraron ${data.users.length} usuarios en el sistema`);
    
    // Mostrar algunos datos para confirmar
    if (data.users.length > 0) {
      console.log('📋 Primeros 3 usuarios:');
      data.users.slice(0, 3).forEach(user => {
        console.log(`- ${user.email} (${user.id})`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error al verificar la clave de servicio:', error);
    return false;
  }
}

// Ejecutar la verificación
verificarClaveServicio().then(resultado => {
  if (resultado) {
    console.log('🎉 La clave de servicio está configurada correctamente');
  } else {
    console.log('⚠️ Hay problemas con la clave de servicio. Revisa los mensajes anteriores.');
  }
});
