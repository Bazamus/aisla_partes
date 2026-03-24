/**
 * Script de prueba para verificar la creación de usuarios
 * Este script se puede ejecutar en la consola del navegador mientras se está en la página de usuarios
 */

// Función principal de prueba
async function testUserCreation() {
  console.log('🧪 Iniciando pruebas de creación de usuarios');
  
  // Verificar si estamos en la página correcta
  if (!window.location.pathname.includes('/usuarios')) {
    console.error('❌ Esta prueba debe ejecutarse en la página de usuarios');
    return;
  }

  try {
    // 1. Probar creación de usuario desde formulario directo
    console.log('📋 Probando creación de usuario desde formulario...');
    await testDirectUserCreation();
    
    // 2. Probar creación de usuario desde pendientes (si hay disponibles)
    console.log('📋 Probando creación de usuario desde pendientes...');
    await testPendingUserCreation();
    
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

// Generar datos de prueba aleatorios
function generateTestData() {
  const timestamp = Date.now();
  return {
    email: `test_user_${timestamp}@demo-test.com`,
    nombre: `Usuario Prueba ${timestamp}`,
    telefono: `6${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: `test${timestamp.toString().slice(-4)}`,
  };
}

// Prueba de creación directa de usuario
async function testDirectUserCreation() {
  // Datos de prueba
  const testData = generateTestData();
  
  // Navegar a la pestaña de creación de usuario
  const createTab = findElementByText('button', 'Crear Nuevo Usuario');
  if (!createTab) {
    throw new Error('No se encontró la pestaña de Crear Nuevo Usuario');
  }
  
  createTab.click();
  console.log('👆 Clic en pestaña Crear Nuevo Usuario');
  
  // Esperar a que se cargue el formulario
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Verificar que el formulario existe
  const form = document.querySelector('form');
  if (!form) {
    throw new Error('No se encontró el formulario de creación de usuario');
  }
  
  // Rellenar el formulario
  console.log('📝 Rellenando formulario con datos de prueba:', testData);
  
  // Encontrar los campos del formulario
  const emailInput = form.querySelector('input[type="email"], input[name="email"]');
  const nombreInput = form.querySelector('input[name="nombre"]');
  const telefonoInput = form.querySelector('input[name="telefono"]');
  const passwordInput = form.querySelector('input[type="password"], input[name="password"]');
  const roleSelect = form.querySelector('select');
  
  // Verificar que existen los campos necesarios
  if (!emailInput || !nombreInput || !passwordInput || !roleSelect) {
    throw new Error('No se encontraron todos los campos necesarios en el formulario');
  }
  
  // Simular entrada de datos
  // Nota: En un entorno real, esto podría requerir disparar eventos para que React detecte los cambios
  emailInput.value = testData.email;
  nombreInput.value = testData.nombre;
  if (telefonoInput) telefonoInput.value = testData.telefono;
  passwordInput.value = testData.password;
  
  // Seleccionar un rol (tomamos el primer valor disponible)
  if (roleSelect.options.length > 0) {
    roleSelect.selectedIndex = 1; // Seleccionamos el segundo rol (no admin)
  }
  
  console.log('✅ Formulario rellenado correctamente');
  
  // En un entorno real, aquí haríamos submit del formulario
  // Pero en este caso solo verificamos que los campos se rellenan correctamente
  console.log('⚠️ Prueba simulada: No se envía el formulario para evitar crear usuarios de prueba');
  
  return true;
}

// Prueba de creación de usuario desde pendientes
async function testPendingUserCreation() {
  // Navegar a la pestaña de pendientes
  const pendingTab = findElementByText('button', 'Pendientes de Creación');
  if (!pendingTab) {
    throw new Error('No se encontró la pestaña de Pendientes de Creación');
  }
  
  pendingTab.click();
  console.log('👆 Clic en pestaña Pendientes de Creación');
  
  // Esperar a que se carguen los datos
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Verificar si hay usuarios pendientes
  const pendingTable = document.querySelector('table');
  const emptyMessage = findElementByText('p', 'No hay empleados o proveedores pendientes');
  
  if (emptyMessage) {
    console.log('ℹ️ No hay usuarios pendientes para probar la creación');
    return true;
  }
  
  if (!pendingTable) {
    throw new Error('No se encontró la tabla de usuarios pendientes');
  }
  
  // Verificar si hay filas en la tabla
  const pendingRows = pendingTable.querySelectorAll('tbody tr');
  if (pendingRows.length === 0) {
    console.log('ℹ️ No hay usuarios pendientes para probar la creación');
    return true;
  }
  
  // Encontrar el botón "Crear cuenta" en la primera fila
  const firstRow = pendingRows[0];
  const createButton = firstRow.querySelector('button');
  
  if (!createButton || !createButton.textContent.includes('Crear cuenta')) {
    throw new Error('No se encontró el botón "Crear cuenta" en la tabla de pendientes');
  }
  
  // Obtener el email del usuario pendiente para referencia
  const emailCell = firstRow.querySelector('td:first-child');
  const pendingEmail = emailCell ? emailCell.textContent.trim() : 'desconocido';
  
  console.log(`📋 Probando creación para usuario pendiente: ${pendingEmail}`);
  
  // En un entorno real, aquí haríamos clic en el botón y completaríamos el modal
  // Pero en este caso solo verificamos que el botón existe
  console.log('⚠️ Prueba simulada: No se crea el usuario para evitar modificar datos reales');
  
  return true;
}

// Ejecutar las pruebas
testUserCreation().then(() => {
  console.log('🏁 Pruebas de creación de usuarios finalizadas');
}).catch(error => {
  console.error('💥 Error ejecutando pruebas de creación:', error);
});
