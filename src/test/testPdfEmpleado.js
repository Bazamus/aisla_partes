import { generateEmpleadoPDF } from '../services/exportService.js';

// Datos de ejemplo para probar la nueva plantilla PDF
const parteEjemplo = {
  id: 'test-123',
  numero_parte: 'E0001/25',
  fecha: '2025-01-18',
  nombre_obra: 'Residencial Las Flores - Fase 2',
  nombre_trabajador: 'Juan Pérez García',
  cliente: 'Constructora Madrid S.L.',
  email_contacto: 'obras@constructoramadrid.com',
  estado: 'Borrador',
  notas: 'Trabajo realizado en condiciones normales. Se completaron todas las tareas programadas sin incidencias.',
  coste_trabajos: 120.50,
  coste_empresa: 180.75,
  // Datos de trabajos que serían obtenidos por la RPC
  trabajos: [
    {
      id: 1,
      descripcion: 'Instalación de velas en portal principal',
      tiempo_empleado: 2.5,
      portal: 'Portal 1',
      vivienda: '1ºA',
      observaciones: 'Instalación completada sin problemas',
      tipo_trabajo: 'catalogo'
    },
    {
      id: 2,
      descripcion: 'Montaje de aparatos en vivienda',
      tiempo_empleado: 1.5,
      portal: 'Portal 1',
      vivienda: '2ºB',
      observaciones: 'Requirió ajustes adicionales',
      tipo_trabajo: 'catalogo'
    },
    {
      id: 3,
      descripcion: 'Trabajo en sótanos - mantenimiento general',
      tiempo_empleado: 3.0,
      portal: null,
      vivienda: null,
      observaciones: 'Trabajo libre sin portal/vivienda específica',
      tipo_trabajo: 'manual'
    }
  ],
  tiempoTotal: 7.0,
  // Imágenes de ejemplo (base64 simulado)
  imagenes: [
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  ],
  // Firma de ejemplo (base64 simulado)
  firma: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
};

/**
 * Función de prueba para generar y descargar el PDF de empleado
 */
export const testGenerarPdfEmpleado = async () => {
  try {
    console.log('🧪 Iniciando prueba de generación de PDF para empleado...');
    
    // Generar el PDF
    const pdfDoc = await generateEmpleadoPDF(parteEjemplo);
    
    if (pdfDoc) {
      // Descargar el PDF
      const fileName = `Parte_Empleado_Test_${parteEjemplo.numero_parte.replace('/', '_')}.pdf`;
      pdfDoc.save(fileName);
      
      console.log('✅ PDF generado y descargado exitosamente:', fileName);
      return {
        success: true,
        message: `PDF generado correctamente: ${fileName}`,
        fileName
      };
    } else {
      throw new Error('No se pudo generar el documento PDF');
    }
  } catch (error) {
    console.error('❌ Error en la prueba de PDF:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Función de prueba sin trabajos para verificar el manejo de casos vacíos
 */
export const testGenerarPdfEmpleadoSinTrabajos = async () => {
  try {
    console.log('🧪 Iniciando prueba de PDF sin trabajos...');
    
    const parteSinTrabajos = {
      ...parteEjemplo,
      id: 'test-sin-trabajos',
      numero_parte: 'E0002/25',
      trabajos: [],
      tiempoTotal: 0,
      imagenes: [],
      firma: null
    };
    
    const pdfDoc = await generateEmpleadoPDF(parteSinTrabajos);
    
    if (pdfDoc) {
      const fileName = `Parte_Empleado_Sin_Trabajos_Test.pdf`;
      pdfDoc.save(fileName);
      
      console.log('✅ PDF sin trabajos generado exitosamente:', fileName);
      return {
        success: true,
        message: `PDF sin trabajos generado correctamente: ${fileName}`,
        fileName
      };
    } else {
      throw new Error('No se pudo generar el documento PDF');
    }
  } catch (error) {
    console.error('❌ Error en la prueba de PDF sin trabajos:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Función para ejecutar todas las pruebas
 */
export const ejecutarTodasLasPruebas = async () => {
  console.log('🚀 Ejecutando todas las pruebas de PDF para empleados...');
  
  const resultados = [];
  
  // Prueba 1: PDF con trabajos completo
  const resultado1 = await testGenerarPdfEmpleado();
  resultados.push({ prueba: 'PDF Completo', ...resultado1 });
  
  // Prueba 2: PDF sin trabajos
  const resultado2 = await testGenerarPdfEmpleadoSinTrabajos();
  resultados.push({ prueba: 'PDF Sin Trabajos', ...resultado2 });
  
  // Mostrar resumen
  console.log('📊 Resumen de pruebas:');
  resultados.forEach((resultado, index) => {
    const status = resultado.success ? '✅' : '❌';
    console.log(`${status} ${resultado.prueba}: ${resultado.success ? 'ÉXITO' : 'ERROR'}`);
    if (!resultado.success) {
      console.log(`   Error: ${resultado.error}`);
    }
  });
  
  const exitosas = resultados.filter(r => r.success).length;
  console.log(`\n🎯 Resultado final: ${exitosas}/${resultados.length} pruebas exitosas`);
  
  return resultados;
};

// Exportar también los datos de ejemplo para uso en otras pruebas
export { parteEjemplo };
