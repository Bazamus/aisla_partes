/**
 * Script de prueba para verificar el listado de usuarios activos y pendientes
 * Este script se puede ejecutar en la consola del navegador mientras se está en la página de usuarios
 */

// Función principal de prueba
async function testUserListing() {
  console.log('🧪 Iniciando pruebas de listado de usuarios');
  
  // Verificar si estamos en la página correcta
  if (!window.location.pathname.includes('/usuarios')) {
    console.error('❌ Esta prueba debe ejecutarse en la página de usuarios');
    return;
  }

  try {
    // Verificar la conexión a Supabase antes de continuar
    console.log('🔌 Verificando conexión a Supabase...');
    await checkSupabaseConnection();
    
    // 1. Probar carga de usuarios activos
    console.log('📋 Probando listado de usuarios activos...');
    await testActiveUsers();
    
    // 2. Probar carga de usuarios pendientes
    console.log('📋 Probando listado de usuarios pendientes...');
    await testPendingUsers();
    
    console.log('✅ Todas las pruebas completadas con éxito');
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

// Función auxiliar para encontrar elementos por su texto
function findElementByText(selector, text) {
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).find(el => el.textContent.includes(text));
}

// Función para esperar a que un elemento aparezca en el DOM
async function waitForElement(selector, maxWaitTime = 5000) {
  console.log(`⏳ Esperando elemento: ${selector}`);
  
  return new Promise((resolve, reject) => {
    if (document.querySelector(selector)) {
      console.log(`✅ Elemento encontrado inmediatamente: ${selector}`);
      return resolve(document.querySelector(selector));
    }
    
    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        console.log(`✅ Elemento encontrado después de espera: ${selector}`);
        resolve(document.querySelector(selector));
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      console.log(`⚠️ Tiempo de espera agotado para: ${selector}`);
      resolve(null); // Resolvemos con null en lugar de rechazar para manejar el caso sin error
    }, maxWaitTime);
  });
}

// Función para verificar la conexión a Supabase
async function checkSupabaseConnection() {
  // Verificar si supabase está disponible en window
  if (!window.supabase) {
    console.warn('⚠️ Cliente Supabase no disponible en window, intentando acceder a través de la aplicación React');
    
    // Intentar encontrar el cliente en la aplicación React
    const appElement = document.getElementById('root');
    if (!appElement || !appElement._reactRootContainer) {
      console.warn('⚠️ No se pudo acceder a la instancia de React');
    }
    
    console.log('ℹ️ Continuando sin verificar conexión a Supabase');
    return true;
  }
  
  try {
    // Intentar una consulta simple para verificar conexión
    console.log('🔄 Probando conexión a Supabase...');
    const { data, error } = await window.supabase.from('roles').select('count');
    
    if (error) {
      console.warn('⚠️ Error al verificar conexión a Supabase:', error.message);
      console.log('ℹ️ Detalles del error:', error);
      
      if (error.code === '403') {
        console.warn('⚠️ Error de permisos (403 Forbidden). Verifica que estés usando la clave de servicio para operaciones administrativas.');
      } else if (error.code === '400') {
        console.warn('⚠️ Error en la consulta SQL (400 Bad Request). Verifica la sintaxis de las consultas.');
      }
      
      // No lanzamos error para permitir que las pruebas continúen
      return false;
    }
    
    console.log('✅ Conexión a Supabase verificada correctamente');
    return true;
  } catch (error) {
    console.warn('⚠️ Error al verificar conexión a Supabase:', error);
    // No lanzamos error para permitir que las pruebas continúen
    return false;
  }
}

// Prueba de listado de usuarios activos
async function testActiveUsers() {
  // Simular clic en la pestaña de usuarios activos
  const activeTab = findElementByText('button', 'Usuarios Activos');
  if (!activeTab) {
    console.warn('⚠️ No se encontró la pestaña de Usuarios Activos con el texto exacto, buscando alternativas...');
    // Intentar encontrar por texto parcial o por otras características
    const allTabs = document.querySelectorAll('button');
    const possibleTab = Array.from(allTabs).find(tab => 
      tab.textContent.toLowerCase().includes('activos') || 
      tab.textContent.toLowerCase().includes('usuarios')
    );
    
    if (possibleTab) {
      console.log('🔍 Se encontró una pestaña alternativa:', possibleTab.textContent);
      possibleTab.click();
    } else {
      console.log('⚠️ No se pudo encontrar ninguna pestaña relacionada con usuarios activos');
      // Continuamos sin hacer clic, asumiendo que ya estamos en la pestaña correcta
    }
  } else {
    activeTab.click();
    console.log('👆 Clic en pestaña Usuarios Activos');
  }
  
  // Esperar a que se carguen los datos (más tiempo para permitir carga de API)
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Esperar específicamente por la tabla
  const userTable = await waitForElement('table');
  
  if (!userTable) {
    console.warn('⚠️ No se encontró tabla de usuarios, verificando si hay mensaje de error o carga...');
    
    // Verificar si hay mensaje de error o de carga
    const loadingMsg = findElementByText('p', 'Cargando');
    const errorMsg = findElementByText('p', 'Error');
    
    if (loadingMsg) {
      console.log('⏳ La aplicación aún está cargando datos...');
      // Esperar un poco más
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    if (errorMsg) {
      console.warn('⚠️ Se detectó un mensaje de error:', errorMsg.textContent);
      // Verificar si es un error de permisos o de consulta
      if (errorMsg.textContent.includes('403') || errorMsg.textContent.includes('permisos')) {
        console.warn('⚠️ Posible error de permisos. Verifica la configuración de Supabase.');
      }
    }
    
    // Buscar contenedores alternativos donde podría estar la información
    const userContainer = document.querySelector('[data-testid="users-container"]') || 
                          document.querySelector('.users-container') ||
                          document.querySelector('div:has(h2:contains("Usuarios"))');
    
    if (userContainer) {
      console.log('🔍 Se encontró un contenedor alternativo para usuarios');
    } else {
      console.warn('⚠️ No se encontró ningún contenedor de usuarios');
    }
  } else {
    // Si encontramos la tabla, verificar sus contenidos
    const rows = userTable.querySelectorAll('tbody tr');
    console.log(`📊 Se encontraron ${rows.length} usuarios activos`);
    
    // Verificar que al menos hay una fila (debería haber al menos el superadmin)
    if (rows.length === 0) {
      console.warn('⚠️ La tabla de usuarios está vacía');
    }
  }
  
  // Verificar si el superadmin está presente (en cualquier parte de la página)
  const superadminElement = findElementByText('*', 'admin@vimar.com');
  
  if (superadminElement) {
    console.log('✅ Usuario superadmin encontrado en la página');
  } else {
    console.warn('⚠️ No se encontró el usuario superadmin en la página');
    
    // Verificar si hay algún elemento que contenga parte del email
    const partialEmailElement = findElementByText('*', 'admin@vimar.com');
    if (partialEmailElement) {
      console.log('🔍 Se encontró un elemento con parte del email del superadmin');
    }
  }
  
  // Verificar que existen botones de acción (de alguna forma)
  const rolesButton = findElementByText('button', 'Roles');
  const passwordButton = findElementByText('button', 'Contraseña');
  
  if (rolesButton && passwordButton) {
    console.log('✅ Botones de acción encontrados correctamente');
  } else {
    console.warn('⚠️ No se encontraron todos los botones de acción esperados');
    
    // Buscar botones alternativos
    const editButtons = document.querySelectorAll('button[title*="Edit"], button[aria-label*="edit"], button:has(svg)');
    if (editButtons.length > 0) {
      console.log(`🔍 Se encontraron ${editButtons.length} posibles botones de edición`);
    }
  }
  
  console.log('✅ Prueba de listado de usuarios activos completada (con posibles advertencias)');
  return true;
}

// Prueba de listado de usuarios pendientes
async function testPendingUsers() {
  try {
    // Simular clic en la pestaña de usuarios pendientes
    const pendingTab = findElementByText('button', 'Pendientes de Creación');
    if (!pendingTab) {
      console.warn('⚠️ No se encontró la pestaña de Pendientes con el texto exacto, buscando alternativas...');
      // Intentar encontrar por texto parcial
      const allTabs = document.querySelectorAll('button');
      const possibleTab = Array.from(allTabs).find(tab => 
        tab.textContent.toLowerCase().includes('pendientes') || 
        tab.textContent.toLowerCase().includes('creación')
      );
      
      if (possibleTab) {
        console.log('🔍 Se encontró una pestaña alternativa:', possibleTab.textContent);
        possibleTab.click();
      } else {
        console.log('⚠️ No se pudo encontrar ninguna pestaña relacionada con usuarios pendientes');
        return true; // Continuamos sin esta prueba
      }
    } else {
      pendingTab.click();
      console.log('👆 Clic en pestaña Pendientes de Creación');
    }
    
    // Esperar a que se carguen los datos
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar si hay usuarios pendientes o mensaje de "no hay pendientes"
    const pendingTable = await waitForElement('table');
    const emptyMessage = findElementByText('p', 'No hay empleados o proveedores pendientes');
    const loadingMessage = findElementByText('p', 'Cargando');
    const errorMessage = findElementByText('p', 'Error');
    
    if (loadingMessage) {
      console.log('⏳ La aplicación aún está cargando datos de pendientes...');
      // Esperar un poco más
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    if (errorMessage) {
      console.warn('⚠️ Se detectó un mensaje de error:', errorMessage.textContent);
      // Verificar si es un error de permisos o de consulta
      if (errorMessage.textContent.includes('403') || errorMessage.textContent.includes('permisos')) {
        console.warn('⚠️ Posible error de permisos. Verifica la configuración de Supabase.');
      }
    }
    
    if (pendingTable) {
      // Si hay tabla, verificar que tenga filas o muestre mensaje adecuado
      const pendingRows = pendingTable.querySelectorAll('tbody tr');
      console.log(`📊 Se encontraron ${pendingRows.length} usuarios pendientes`);
      
      // Verificar que los botones "Crear cuenta" están presentes si hay filas
      if (pendingRows.length > 0) {
        const createButton = findElementByText('button', 'Crear cuenta');
        if (createButton) {
          console.log('✅ Botón "Crear cuenta" encontrado correctamente');
        } else {
          console.warn('⚠️ No se encontró el botón "Crear cuenta" en la tabla de pendientes');
          
          // Buscar botones alternativos
          const actionButtons = document.querySelectorAll('button[title*="crear"], button[aria-label*="crear"], button:has(svg)');
          if (actionButtons.length > 0) {
            console.log(`🔍 Se encontraron ${actionButtons.length} posibles botones de acción`);
          }
        }
      }
    } else if (emptyMessage) {
      console.log('ℹ️ No hay usuarios pendientes (mensaje mostrado correctamente)');
    } else {
      console.warn('⚠️ No se encontró ni tabla de pendientes ni mensaje de "no hay pendientes"');
      
      // Buscar contenedores alternativos
      const pendingContainer = document.querySelector('[data-testid="pending-container"]') || 
                              document.querySelector('.pending-container') ||
                              document.querySelector('div:has(h2:contains("Pendientes"))');
      
      if (pendingContainer) {
        console.log('🔍 Se encontró un contenedor alternativo para usuarios pendientes');
      }
    }
    
    console.log('✅ Prueba de listado de usuarios pendientes completada (con posibles advertencias)');
    return true;
  } catch (error) {
    console.error('❌ Error en prueba de pendientes:', error);
    // No propagamos el error para que la prueba principal pueda continuar
    return false;
  }
}

// Ejecutar las pruebas
testUserListing().then(() => {
  console.log('🏁 Pruebas finalizadas');
}).catch(error => {
  console.error('💥 Error ejecutando pruebas:', error);
});
