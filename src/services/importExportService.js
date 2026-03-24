import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// FUNCIONES DE EXPORTACIÓN

/**
 * Exporta los empleados a un archivo Excel
 * @param {Array} empleados - Lista de empleados a exportar
 */
export const exportarEmpleados = (empleados) => {
  // Preparar los datos para Excel
  const excelData = empleados.map(empleado => ({
    'Código': empleado.codigo || '',
    'Nombre': empleado.nombre || '',
    'Email': empleado.email || '',
    'Categoría': empleado.categoria || '',
    'Coste Hora Trabajador (€)': empleado.coste_hora_trabajador || 0,
    'Coste Hora Empresa (€)': empleado.coste_hora_empresa || 0,
    'Obra Asignada': empleado.obra_asignada || '',
    'Fecha Creación': empleado.created_at ? new Date(empleado.created_at).toLocaleString() : '',
  }));

  // Crear una nueva hoja de cálculo
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Ajustar el ancho de las columnas
  const columnsWidth = [
    { wch: 10 },  // Código
    { wch: 30 },  // Nombre
    { wch: 30 },  // Email
    { wch: 20 },  // Categoría
    { wch: 20 },  // Coste Hora Trabajador
    { wch: 20 },  // Coste Hora Empresa
    { wch: 30 },  // Obra Asignada
    { wch: 20 },  // Fecha Creación
  ];
  worksheet['!cols'] = columnsWidth;

  // Crear el libro de Excel y añadir la hoja
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Empleados');

  // Generar el archivo
  const fecha = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `empleados_${fecha}.xlsx`);
};

/**
 * Exporta las obras a un archivo Excel
 * @param {Array} obras - Lista de obras a exportar
 */
export const exportarObras = (obras) => {
  // Preparar los datos para Excel
  const excelData = obras.map(obra => ({
    'Nº de Obra': obra.numero_obra || '',
    'Nombre de Obra': obra.nombre_obra || '',
    'Fecha de Alta': obra.fecha_alta ? new Date(obra.fecha_alta).toLocaleDateString() : '',
    'Cliente': obra.cliente || '',
    'Ref. Interna': obra.ref_interna || '',
    'Estado': obra.estado || '',
    'Dirección Obra': obra.direccion_obra || '',
    'Fecha Creación': obra.created_at ? new Date(obra.created_at).toLocaleString() : '',
  }));

  // Crear una nueva hoja de cálculo
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Ajustar el ancho de las columnas
  const columnsWidth = [
    { wch: 12 },  // Nº de Obra
    { wch: 30 },  // Nombre de Obra
    { wch: 15 },  // Fecha de Alta
    { wch: 30 },  // Cliente
    { wch: 15 },  // Ref. Interna
    { wch: 15 },  // Estado
    { wch: 40 },  // Dirección Obra
    { wch: 20 },  // Fecha Creación
  ];
  worksheet['!cols'] = columnsWidth;

  // Crear el libro de Excel y añadir la hoja
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Obras');

  // Generar el archivo
  const fecha = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `obras_${fecha}.xlsx`);
};

export const exportarProveedores = (proveedores) => {
  try {
    const proveedoresParaExportar = proveedores.map(proveedor => ({
      'Código': proveedor.codigo,
      'Razón Social': proveedor.razon_social,
      'CIF': proveedor.cif,
      'Persona de Contacto': proveedor.persona_contacto,
      'Teléfono': proveedor.telefono,
      'Email': proveedor.email,
      'Dirección': proveedor.direccion,
      'Notas': proveedor.notas
    }));

    const worksheet = XLSX.utils.json_to_sheet(proveedoresParaExportar);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Proveedores');
    
    // Generar el archivo Excel
    XLSX.writeFile(workbook, 'proveedores.xlsx');
  } catch (error) {
    console.error('Error al exportar proveedores:', error);
    throw error;
  }
};

/**
 * Exporta todos los partes de proveedores a un archivo Excel con formato específico
 * @param {Array} partesProveedores - Lista de partes de proveedores a exportar
 */
export const exportarPartesProveedores = async (partesProveedores) => {
  try {
    console.log('🔍 DEBUG exportarPartesProveedores - Inicio', { 
      XLSX: typeof XLSX, 
      utils: typeof XLSX?.utils,
      writeFile: typeof XLSX?.writeFile
    });
    
    logExport.clear();
    logExport.step('Iniciando exportación de partes de proveedores', { cantidad: partesProveedores.length });
    
    console.log('Exportando partes de proveedores a Excel:', partesProveedores.length);
    
    // Array para almacenar todas las filas (una fila por cada trabajo en cada parte)
    let excelData = [];
    
    // Procesar cada parte de proveedor
    for (const parte of partesProveedores) {
      console.log('Procesando parte:', parte.id, parte);
      
      // Si el parte tiene trabajos registrados
      if (parte.trabajos && Array.isArray(parte.trabajos) && parte.trabajos.length > 0) {
        // Por cada trabajo (que puede contener obra, portal, vivienda y líneas)
        for (const trabajo of parte.trabajos) {
          // Si el trabajo tiene líneas de trabajos específicos
          if (trabajo.lineas && Array.isArray(trabajo.lineas) && trabajo.lineas.length > 0) {
            // Por cada línea de trabajo, crear una fila en el Excel
            for (const linea of trabajo.lineas) {
              excelData.push({
                'FECHA': parte.fecha || (parte.created_at ? new Date(parte.created_at).toLocaleDateString('es-ES') : ''),
                'Nº PARTE': parte.numero_parte || '',
                'COD.PROVEEDOR': parte.codigo_proveedor || '',
                'RAZON SOCIAL': parte.razon_social || parte.empresa || '',
                'Email': parte.email || '',
                'CIF': parte.cif || '',
                'OBRA': trabajo.obra || '',
                'PORTAL': trabajo.portal || '',
                'VIVIENDA': trabajo.vivienda || '',
                'TRABAJO': linea.descripcion || '',
                'CANTIDAD': linea.cantidad || 0,
                'PRECIO UNITARIO': linea.precio_unitario || 0,
                'DESCUENTO': linea.descuento || 0,
                'TOTAL': linea.total || (linea.cantidad * linea.precio_unitario * (1 - (linea.descuento || 0) / 100)) || 0
              });
            }
          } else {
            // Si no tiene líneas pero es un trabajo simple (estructura plana)
            // Esto maneja casos donde los trabajos no están anidados con el formato obra, portal, vivienda
            excelData.push({
              'FECHA': parte.fecha || (parte.created_at ? new Date(parte.created_at).toLocaleDateString('es-ES') : ''),
              'Nº PARTE': parte.numero_parte || '',
              'COD.PROVEEDOR': parte.codigo_proveedor || '',
              'RAZON SOCIAL': parte.razon_social || parte.empresa || '',
              'Email': parte.email || '',
              'CIF': parte.cif || '',
              'OBRA': trabajo.obra || parte.nombre_obra || '',
              'PORTAL': trabajo.portal || '',
              'VIVIENDA': trabajo.vivienda || '',
              'TRABAJO': trabajo.descripcion || '',
              'CANTIDAD': trabajo.cantidad || 0,
              'PRECIO UNITARIO': trabajo.precio_unitario || 0,
              'DESCUENTO': trabajo.descuento || 0,
              'TOTAL': trabajo.total || (trabajo.cantidad * trabajo.precio_unitario * (1 - (trabajo.descuento || 0) / 100)) || 0
            });
          }
        }
      } else {
        // Si el parte no tiene trabajos, crear una fila con los datos básicos
        excelData.push({
          'FECHA': parte.fecha || (parte.created_at ? new Date(parte.created_at).toLocaleDateString('es-ES') : ''),
          'Nº PARTE': parte.numero_parte || '',
          'COD.PROVEEDOR': parte.codigo_proveedor || '',
          'RAZON SOCIAL': parte.razon_social || parte.empresa || '',
          'Email': parte.email || '',
          'CIF': parte.cif || '',
          'OBRA': parte.nombre_obra || '',
          'PORTAL': '',
          'VIVIENDA': '',
          'TRABAJO': '',
          'CANTIDAD': 0,
          'PRECIO UNITARIO': 0,
          'DESCUENTO': 0,
          'TOTAL': 0
        });
      }
    }
    
    // Si no hay datos que exportar
    if (excelData.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }
    
    // Crear una nueva hoja de cálculo
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Ajustar el ancho de las columnas
    const columnsWidth = [
      { wch: 12 },  // FECHA
      { wch: 10 },  // Nº PARTE
      { wch: 15 },  // COD.PROVEEDOR
      { wch: 30 },  // RAZON SOCIAL
      { wch: 25 },  // Email
      { wch: 12 },  // CIF
      { wch: 30 },  // OBRA
      { wch: 10 },  // PORTAL
      { wch: 15 },  // VIVIENDA
      { wch: 40 },  // TRABAJO
      { wch: 10 },  // CANTIDAD
      { wch: 15 },  // PRECIO UNITARIO
      { wch: 12 },  // DESCUENTO
      { wch: 12 },  // TOTAL
    ];
    worksheet['!cols'] = columnsWidth;
    
    // Dar formato a las celdas numéricas
    const formatNumberCell = (cell, col) => {
      // Columnas de números (cantidad, precio unitario, etc.)
      if ([10, 11, 12, 13].includes(col)) { 
        cell.t = 'n'; // Tipo numérico
        cell.z = col === 13 || col === 11 ? '#,##0.00 €' : (col === 12 ? '0.00 "%"' : '#,##0.00');
      }
    };
    
    // Aplicar formato a todas las celdas
    for (let r = 1; r <= excelData.length; r++) {
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let c = 0; c <= range.e.c; c++) {
        const cell_ref = XLSX.utils.encode_cell({ r, c });
        if (worksheet[cell_ref]) {
          formatNumberCell(worksheet[cell_ref], c);
        }
      }
    }
    
    // Crear el libro de Excel y añadir la hoja
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Partes Proveedores');
    
    // Generar el archivo
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `partes_proveedores_${fecha}.xlsx`);
    
    toast.success(`Excel generado con ${excelData.length} filas`);
    
  } catch (error) {
    console.error('Error al exportar partes de proveedores a Excel:', error);
    toast.error('Error al exportar: ' + (error.message || 'Error desconocido'));
  }
};

/**
 * Exporta partes de empleados a un archivo Excel con la nueva estructura de materiales
 * Cada material individual se exporta en una fila separada con su información completa
 * @param {Array} partesEmpleados - Lista de partes de empleados a exportar
 */
export const exportarPartesEmpleados = async (partesEmpleados) => {
  try {
    console.log('🔍 DEBUG exportarPartesEmpleados - Inicio', { 
      XLSX: typeof XLSX, 
      utils: typeof XLSX?.utils,
      writeFile: typeof XLSX?.writeFile,
      partesEmpleados: partesEmpleados?.length
    });
    
    logExport.clear();
    logExport.step('Iniciando exportación de partes de empleados', { cantidad: partesEmpleados.length });
    console.log('Iniciando exportación de partes de empleados:', partesEmpleados.length);
    
    // Verificar datos de entrada
    if (!partesEmpleados || !Array.isArray(partesEmpleados)) {
      console.error('Los datos de entrada no son válidos');
      return { success: false, message: 'Los datos de entrada no son válidos' };
    }
    
    // Array para almacenar todas las filas (una fila por cada trabajo en cada parte)
    let excelData = [];
    
    // Procesar cada parte de empleado
    for (const parte of partesEmpleados) {
      console.log('Procesando parte ID:', parte.id, 'Tipo:', parte.tipo_parte);
      console.log('🔍 DEBUG - Campo cliente del parte:', parte.cliente);
      console.log('🔍 DEBUG - Todos los campos del parte:', Object.keys(parte));
      
      try {
        // Obtener materiales del parte desde la nueva tabla partes_empleados_articulos
        const { data: articulos, error: articulosError } = await supabase
          .from('partes_empleados_articulos')
          .select(`
            id,
            articulo_id,
            tipo_precio,
            cantidad,
            precio_unitario,
            subtotal,
            created_at,
            articulos_precios (
              codigo,
              tipo,
              espesor,
              diametro,
              pulgada,
              unidad
            )
          `)
          .eq('parte_id', parte.id)
          .order('created_at', { ascending: true });

        if (articulosError) {
          console.error('Error al obtener materiales del parte:', parte.id, articulosError);
          logExport.error(`Error al obtener materiales del parte ${parte.id}`, articulosError);
          continue;
        }

        // Obtener otros trabajos/servicios del parte
        const { data: otrosTrabajos, error: otrosError } = await supabase
          .from('partes_empleados_otros_trabajos')
          .select(`
            id,
            descripcion,
            cantidad,
            unidad,
            precio_unitario,
            subtotal,
            servicio_id,
            servicios(codigo)
          `)
          .eq('parte_id', parte.id)
          .order('created_at', { ascending: true });

        if (otrosError) {
          console.error('Error al obtener otros trabajos del parte:', parte.id, otrosError);
        }

        const tieneArticulos = articulos && Array.isArray(articulos) && articulos.length > 0;
        const tieneOtros = otrosTrabajos && Array.isArray(otrosTrabajos) && otrosTrabajos.length > 0;

        // Si el parte tiene materiales registrados
        if (tieneArticulos) {
          // Por cada material, crear una fila en el Excel con la nueva estructura
          for (const articulo of articulos) {
            const articuloPrecio = articulo.articulos_precios;

            excelData.push({
              'Fecha': parte.fecha ? new Date(parte.fecha).toLocaleDateString('es-ES') : '',
              'Nº de Parte': parte.numero_parte || '',
              'Estado del Parte': parte.estado || 'Borrador',
              'Trabajador': parte.nombre_trabajador || '',
              'Cliente': parte.cliente || '',
              'Obra': parte.nombre_obra || '',
              'CODIGO': articuloPrecio?.codigo || 'N/A',
              'TIPO': articuloPrecio?.tipo || 'N/A',
              'ESPESOR': articuloPrecio?.espesor || 0,
              'Diámetro': articuloPrecio?.diametro || 'N/A',
              'Ud/Ml': articulo.cantidad || 0,
              'MATERIAL': articulo.tipo_precio === 'aislamiento' ? 'Aislamiento' : 'Aluminio',
              'Precio unitario': articulo.precio_unitario || 0,
              'Precio Total': articulo.subtotal || 0
            });
          }
        }

        // Añadir filas de otros trabajos / servicios
        if (tieneOtros) {
          for (const trabajo of otrosTrabajos) {
            const codigoServicio = trabajo.servicios?.codigo || '';
            excelData.push({
              'Fecha': parte.fecha ? new Date(parte.fecha).toLocaleDateString('es-ES') : '',
              'Nº de Parte': parte.numero_parte || '',
              'Estado del Parte': parte.estado || 'Borrador',
              'Trabajador': parte.nombre_trabajador || '',
              'Cliente': parte.cliente || '',
              'Obra': parte.nombre_obra || '',
              'CODIGO': codigoServicio || 'SERVICIO',
              'TIPO': trabajo.descripcion || '',
              'ESPESOR': '',
              'Diámetro': '',
              'Ud/Ml': trabajo.cantidad || 0,
              'MATERIAL': codigoServicio ? `Servicio (${codigoServicio})` : 'Otro Trabajo',
              'Precio unitario': trabajo.precio_unitario || 0,
              'Precio Total': trabajo.subtotal || ((trabajo.cantidad || 0) * (trabajo.precio_unitario || 0))
            });
          }
        }

        // Si no tiene ni materiales ni otros trabajos, crear fila básica
        if (!tieneArticulos && !tieneOtros) {
          excelData.push({
            'Fecha': parte.fecha ? new Date(parte.fecha).toLocaleDateString('es-ES') : '',
            'Nº de Parte': parte.numero_parte || '',
            'Estado del Parte': parte.estado || 'Borrador',
            'Trabajador': parte.nombre_trabajador || '',
            'Cliente': parte.cliente || '',
            'Obra': parte.nombre_obra || '',
            'CODIGO': '',
            'TIPO': '',
            'ESPESOR': '',
            'Diámetro': '',
            'Ud/Ml': '',
            'MATERIAL': '',
            'Precio unitario': '',
            'Precio Total': ''
          });
        }
      } catch (parteError) {
        console.error('Error al procesar parte:', parte.id, parteError);
        logExport.error(`Error al procesar parte ${parte.id}`, parteError);
      }
    }
    
    // Si no hay datos que exportar
    if (excelData.length === 0) {
      const msg = 'No hay datos para exportar';
      console.error(msg);
      logExport.error(msg);
      return { success: false, message: msg };
    }
    
    console.log('Datos preparados para Excel:', excelData.length, 'filas');
    logExport.step('Datos preparados para Excel', { registros: excelData.length });
    
    // Crear una nueva hoja de cálculo
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Ajustar el ancho de las columnas para la nueva estructura de materiales
    const columnsWidth = [
      { wch: 12 },  // Fecha
      { wch: 15 },  // Nº de Parte
      { wch: 15 },  // Estado del Parte
      { wch: 25 },  // Trabajador
      { wch: 20 },  // Cliente
      { wch: 40 },  // Obra
      { wch: 15 },  // CODIGO
      { wch: 12 },  // TIPO
      { wch: 10 },  // ESPESOR
      { wch: 15 },  // Diámetro
      { wch: 8 },   // Ud/Ml
      { wch: 12 },  // MATERIAL
      { wch: 12 },  // Precio unitario
      { wch: 12 },  // Precio Total
    ];
    worksheet['!cols'] = columnsWidth;
    
    // Dar formato a las celdas numéricas para la nueva estructura
    const formatNumberCell = (cell, col) => {
      // Columna ESPESOR (columna 8)
      if (col === 8) { 
        cell.t = 'n';
        cell.z = '0'; // Número entero
      }
      // Columna Ud/Ml (columna 10)
      else if (col === 10) { 
        cell.t = 'n';
        cell.z = '0'; // Número entero
      }
      // Columna Precio unitario (columna 12)
      else if (col === 12) { 
        cell.t = 'n';
        cell.z = '0.00€'; // Formato de moneda
      }
      // Columna Precio Total (columna 13)
      else if (col === 13) { 
        cell.t = 'n';
        cell.z = '0.00€'; // Formato de moneda
      }
    };
    
    // Aplicar formato a todas las celdas
    for (let r = 1; r <= excelData.length; r++) {
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let c = 0; c <= range.e.c; c++) {
        const cell_ref = XLSX.utils.encode_cell({ r, c });
        if (worksheet[cell_ref]) {
          formatNumberCell(worksheet[cell_ref], c);
        }
      }
    }
    
    // Crear el libro de Excel y añadir la hoja
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Partes Empleados');
    
    // Generar el archivo
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `partes_empleados_${fecha}.xlsx`;
    XLSX.writeFile(workbook, nombreArchivo);
    
    console.log('✅ Archivo Excel generado:', nombreArchivo);
    logExport.step('Archivo Excel generado correctamente', { nombre: nombreArchivo });
    
    toast.success(`Excel generado con ${excelData.length} filas`);
    
    return { success: true, message: `Se ha generado el archivo Excel con ${excelData.length} materiales de empleados` };
    
  } catch (error) {
    console.error('Error al exportar partes de empleados a Excel:', error);
    logExport.error('Error al exportar partes de empleados', error);
    toast.error('Error al exportar: ' + (error.message || 'Error desconocido'));
    return { success: false, message: 'Error al exportar los partes: ' + (error.message || 'Error desconocido') };
  }
};

/**
 * Exporta todos los partes (empleados y proveedores) a archivos Excel separados
 * @param {Array} partes - Lista de todos los partes a exportar
 */
export const exportarTodosPartes = async (partes) => {
  try {
    console.log('🔍 DEBUG exportarTodosPartes - Inicio', { 
      XLSX: typeof XLSX, 
      utils: typeof XLSX?.utils,
      writeFile: typeof XLSX?.writeFile,
      partes: partes?.length
    });
    
    logExport.clear();
    logExport.step('Iniciando exportación de todos los partes', { cantidad: partes.length });
    
    // Separar partes por tipo
    const partesEmpleados = partes.filter(parte => parte.tipo_parte === 'empleado');
    const partesProveedores = partes.filter(parte => parte.tipo_parte === 'proveedor');
    
    console.log('Partes separados:', { 
      empleados: partesEmpleados.length, 
      proveedores: partesProveedores.length 
    });
    
    let resultadoEmpleados = { success: true, message: 'No hay partes de empleados para exportar' };
    let resultadoProveedores = { success: true, message: 'No hay partes de proveedores para exportar' };
    
    // Exportar partes de empleados si hay
    if (partesEmpleados.length > 0) {
      try {
        console.log('Exportando partes de empleados dentro de exportarTodosPartes');
        resultadoEmpleados = await exportarPartesEmpleados(partesEmpleados);
        logExport.step('Resultado exportación empleados', resultadoEmpleados);
      } catch (errorEmpleados) {
        console.error('Error al exportar partes de empleados:', errorEmpleados);
        logExport.error('Error al exportar partes de empleados', errorEmpleados);
        resultadoEmpleados = { 
          success: false, 
          message: 'Error al exportar partes de empleados: ' + (errorEmpleados.message || 'Error desconocido') 
        };
      }
    }
    
    // Exportar partes de proveedores si hay
    if (partesProveedores.length > 0) {
      try {
        console.log('Exportando partes de proveedores dentro de exportarTodosPartes');
        resultadoProveedores = await exportarPartesProveedores(partesProveedores);
        logExport.step('Resultado exportación proveedores', resultadoProveedores);
      } catch (errorProveedores) {
        console.error('Error al exportar partes de proveedores:', errorProveedores);
        logExport.error('Error al exportar partes de proveedores', errorProveedores);
        resultadoProveedores = { 
          success: false, 
          message: 'Error al exportar partes de proveedores: ' + (errorProveedores.message || 'Error desconocido') 
        };
      }
    }
    
    // Determinar resultado general
    const exitoTotal = resultadoEmpleados.success && resultadoProveedores.success;
    let mensaje = '';
    
    if (exitoTotal) {
      mensaje = 'Se han generado todos los archivos Excel correctamente';
      
      if (partesEmpleados.length === 0 && partesProveedores.length === 0) {
        mensaje = 'No hay partes para exportar';
      } else if (partesEmpleados.length === 0) {
        mensaje = 'Se han generado los archivos de proveedores correctamente (no hay empleados)';
      } else if (partesProveedores.length === 0) {
        mensaje = 'Se han generado los archivos de empleados correctamente (no hay proveedores)';
      }
      
      return { success: true, message: mensaje };
    } else {
      // Si alguno falló pero el otro tuvo éxito
      if (resultadoEmpleados.success && !resultadoProveedores.success) {
        mensaje = 'Se exportaron los partes de empleados, pero hubo un error con los de proveedores';
      } else if (!resultadoEmpleados.success && resultadoProveedores.success) {
        mensaje = 'Se exportaron los partes de proveedores, pero hubo un error con los de empleados';
      } else {
        mensaje = 'Hubo errores al generar los archivos Excel';
      }
      
      return { success: false, message: mensaje };
    }
  } catch (error) {
    console.error('Error general al exportar todos los partes:', error);
    logExport.error('Error general en exportarTodosPartes', error);
    return { 
      success: false, 
      message: 'Error al generar los archivos Excel: ' + (error.message || 'Error desconocido') 
    };
  }
};

// FUNCIONES DE IMPORTACIÓN

/**
 * Importa empleados desde un archivo Excel
 * @param {File} file - Archivo Excel a importar
 * @returns {Promise<{success: boolean, message: string, count: number}>} - Resultado de la importación
 */
export const importarEmpleados = async (file) => {
  try {
    if (!file.name.endsWith('.xlsx')) {
      return { success: false, message: 'El archivo debe tener formato .xlsx', count: 0 };
    }

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return { success: false, message: 'El archivo no contiene datos', count: 0 };
    }

    const camposRequeridos = ['Código', 'Nombre'];
    const camposFaltantes = camposRequeridos.filter(campo => 
      !jsonData.some(row => row[campo] !== undefined && row[campo] !== '')
    );

    if (camposFaltantes.length > 0) {
      return {
        success: false,
        message: `El archivo no contiene los campos obligatorios: ${camposFaltantes.join(', ')}`,
        count: 0
      };
    }

    const empleadosParaInsertar = [];
    const errores = [];

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      // Validar datos obligatorios
      if (!row['Código'] || !row['Nombre']) {
        errores.push(`Fila ${i + 2}: Faltan campos obligatorios (Código o Nombre)`);
        continue;
      }

      // Validar formato de costes
      const costeHoraTrabajador = parseFloat(row['Coste Hora Trabajador (€)'] || 0);
      const costeHoraEmpresa = parseFloat(row['Coste Hora Empresa (€)'] || 0);

      if (isNaN(costeHoraTrabajador) || isNaN(costeHoraEmpresa)) {
        errores.push(`Fila ${i + 2}: Los costes deben ser números válidos`);
        continue;
      }

      empleadosParaInsertar.push({
        codigo: row['Código'].toString(),
        nombre: row['Nombre'],
        email: row['Email'] || null,
        categoria: row['Categoría'] || null,
        coste_hora_trabajador: costeHoraTrabajador,
        coste_hora_empresa: costeHoraEmpresa
      });
    }

    if (errores.length > 0) {
      return {
        success: false,
        message: 'Se encontraron errores en el archivo',
        errores,
        count: 0
      };
    }

    const { error } = await supabase
      .from('empleados')
      .insert(empleadosParaInsertar);

    if (error) throw error;

    return {
      success: true,
      message: `Se importaron ${empleadosParaInsertar.length} empleados correctamente`,
      count: empleadosParaInsertar.length
    };

  } catch (error) {
    console.error('Error al importar empleados:', error);
    return {
      success: false,
      message: 'Error al procesar el archivo: ' + error.message,
      count: 0
    };
  }
};

/**
 * Importa obras desde un archivo Excel
 * @param {File} file - Archivo Excel a importar
 * @returns {Promise<{success: boolean, message: string, count: number}>}
 */
export const importarObras = async (file) => {
  try {
    if (!file.name.endsWith('.xlsx')) {
      return { success: false, message: 'El archivo debe tener formato .xlsx', count: 0 };
    }

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return { success: false, message: 'El archivo no contiene datos', count: 0 };
    }

    const camposRequeridos = ['Nº de Obra', 'Nombre de Obra'];
    const camposFaltantes = camposRequeridos.filter(campo => 
      !jsonData.some(row => row[campo] !== undefined && row[campo] !== '')
    );

    if (camposFaltantes.length > 0) {
      return {
        success: false,
        message: `El archivo no contiene los campos obligatorios: ${camposFaltantes.join(', ')}`,
        count: 0
      };
    }

    const obrasParaInsertar = [];
    const errores = [];

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];

      if (!row['Nº de Obra'] || !row['Nombre de Obra']) {
        errores.push(`Fila ${i + 2}: Faltan campos obligatorios (Nº de Obra o Nombre de Obra)`);
        continue;
      }

      obrasParaInsertar.push({
        numero_obra: row['Nº de Obra'].toString(),
        nombre_obra: row['Nombre de Obra'],
        cliente: row['Cliente'] || null,
        estado: row['Estado'] || 'Pendiente',
        direccion_obra: row['Dirección Obra'] || null,
        ref_interna: row['Ref. Interna'] || null
      });
    }

    if (errores.length > 0) {
      return {
        success: false,
        message: 'Se encontraron errores en el archivo',
        errores,
        count: 0
      };
    }

    const { error } = await supabase
      .from('obras')
      .insert(obrasParaInsertar);

    if (error) throw error;

    return {
      success: true,
      message: `Se importaron ${obrasParaInsertar.length} obras correctamente`,
      count: obrasParaInsertar.length
    };

  } catch (error) {
    console.error('Error al importar obras:', error);
    return {
      success: false,
      message: 'Error al procesar el archivo: ' + error.message,
      count: 0
    };
  }
};

export const importarProveedores = async (file) => {
  try {
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data);
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(firstSheet);

          if (rows.length === 0) {
            resolve({
              success: false,
              message: 'El archivo está vacío',
              errores: []
            });
            return;
          }

          const errores = [];
          const proveedoresParaImportar = rows.map((row, index) => {
            // Validar campos requeridos
            if (!row['Código'] || !row['Razón Social']) {
              errores.push(`Fila ${index + 2}: Código y Razón Social son obligatorios`);
              return null;
            }

            return {
              codigo: row['Código']?.toString(),
              razon_social: row['Razón Social']?.toString(),
              cif: row['CIF']?.toString(),
              persona_contacto: row['Persona de Contacto']?.toString(),
              telefono: row['Teléfono']?.toString(),
              email: row['Email']?.toString(),
              direccion: row['Dirección']?.toString(),
              notas: row['Notas']?.toString()
            };
          }).filter(proveedor => proveedor !== null);

          if (errores.length > 0) {
            resolve({
              success: false,
              message: 'Hay errores en el archivo',
              errores
            });
            return;
          }

          // Insertar proveedores en la base de datos
          const { error } = await supabase
            .from('proveedores')
            .insert(proveedoresParaImportar);

          if (error) throw error;

          resolve({
            success: true,
            message: `Se importaron ${proveedoresParaImportar.length} proveedores correctamente`,
            errores: []
          });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  } catch (error) {
    console.error('Error al importar proveedores:', error);
    throw error;
  }
};

/**
 * Asigna obras a un empleado
 * @param {number} empleadoId - ID del empleado
 * @param {number[]} obraIds - Array de IDs de obras
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const asignarObrasAEmpleado = async (empleadoId, obraIds) => {
  try {
    // Primero eliminamos todas las asignaciones existentes
    const { error: deleteError } = await supabase
      .from('empleados_obras')
      .delete()
      .eq('empleado_id', empleadoId);

    if (deleteError) throw deleteError;

    // Si hay obras para asignar, las insertamos
    if (obraIds && obraIds.length > 0) {
      const asignaciones = obraIds.map(obraId => ({
        empleado_id: empleadoId,
        id_obra: parseInt(obraId)
      }));

      const { error: insertError } = await supabase
        .from('empleados_obras')
        .insert(asignaciones);

      if (insertError) throw insertError;
    }

    return {
      success: true,
      message: 'Obras asignadas correctamente'
    };

  } catch (error) {
    console.error('Error al asignar obras:', error);
    return {
      success: false,
      message: 'Error al asignar obras: ' + error.message
    };
  }
};

/**
 * Obtiene las obras asignadas a un empleado
 * @param {string} codigoEmpleado - Código del empleado
 * @returns {Promise<Array>} - Lista de obras asignadas
 */
export const obtenerObrasDeEmpleado = async (codigoEmpleado) => {
  try {
    // Primero obtenemos el ID del empleado
    const { data: empleado, error: errorEmpleado } = await supabase
      .from('empleados')
      .select('id')
      .eq('codigo', codigoEmpleado)
      .single();

    if (errorEmpleado || !empleado) {
      console.error(`No se encontró el empleado con código ${codigoEmpleado}`);
      return [];
    }

    // Obtenemos las obras asignadas
    const { data, error } = await supabase
      .from('empleados_obras')
      .select(`
        obra:obras(id, nombre_obra, numero_obra, cliente, ref_interna)
      `)
      .eq('empleado_id', empleado.id);

    if (error) {
      console.error('Error al obtener obras del empleado:', error);
      return [];
    }

    // Transformamos los datos para obtener solo la información de las obras
    return data.map(item => item.obra);
  } catch (error) {
    console.error('Error al obtener obras del empleado:', error);
    return [];
  }
};

/**
 * Sistema de logging para depuración
 */
const logExport = {
  steps: [],
  errors: [],
  
  // Registra un paso en el proceso de exportación
  step: function(message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message };
    if (data) logEntry.data = data;
    
    this.steps.push(logEntry);
    console.log(`[EXPORT LOG] ${timestamp} - ${message}`, data ? data : '');
    
    return this; // Para encadenar llamadas
  },
  
  // Registra un error en el proceso de exportación
  error: function(message, errorObj = null) {
    const timestamp = new Date().toISOString();
    const logEntry = { 
      timestamp, 
      message,
      errorDetails: errorObj ? {
        name: errorObj.name,
        message: errorObj.message,
        stack: errorObj.stack
      } : null
    };
    
    this.errors.push(logEntry);
    console.error(`[EXPORT ERROR] ${timestamp} - ${message}`, errorObj ? errorObj : '');
    
    return this; // Para encadenar llamadas
  },
  
  // Obtiene todo el log como string formateado
  getFullLog: function() {
    let log = "=== LOG DE EXPORTACIÓN ===\n\n";
    
    log += "PASOS:\n";
    this.steps.forEach((step, index) => {
      log += `${index + 1}. [${step.timestamp}] ${step.message}\n`;
      if (step.data) log += `   Datos: ${JSON.stringify(step.data)}\n`;
    });
    
    log += "\nERRORES:\n";
    if (this.errors.length === 0) {
      log += "No se registraron errores.\n";
    } else {
      this.errors.forEach((error, index) => {
        log += `${index + 1}. [${error.timestamp}] ${error.message}\n`;
        if (error.errorDetails) {
          log += `   Tipo: ${error.errorDetails.name}\n`;
          log += `   Mensaje: ${error.errorDetails.message}\n`;
          log += `   Stack: ${error.errorDetails.stack}\n`;
        }
      });
    }
    
    return log;
  },
  
  // Muestra el log completo en la consola
  showInConsole: function() {
    console.log(this.getFullLog());
  },
  
  // Limpia el log
  clear: function() {
    this.steps = [];
    this.errors = [];
    console.log('[EXPORT LOG] Log limpiado');
  }
};

// Función para mostrar el log en la consola y en la página
export const showExportLog = () => {
  logExport.showInConsole();
  
  // Crear un elemento en la página para mostrar el log
  const logDiv = document.createElement('div');
  logDiv.id = 'exportLogDisplay';
  logDiv.style.position = 'fixed';
  logDiv.style.top = '10px';
  logDiv.style.right = '10px';
  logDiv.style.width = '80%';
  logDiv.style.maxHeight = '80%';
  logDiv.style.overflow = 'auto';
  logDiv.style.backgroundColor = 'white';
  logDiv.style.border = '1px solid #ccc';
  logDiv.style.borderRadius = '5px';
  logDiv.style.padding = '10px';
  logDiv.style.zIndex = '9999';
  logDiv.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
  
  // Añadir botón para cerrar
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Cerrar';
  closeButton.style.padding = '5px 10px';
  closeButton.style.marginBottom = '10px';
  closeButton.style.backgroundColor = '#f44336';
  closeButton.style.color = 'white';
  closeButton.style.border = 'none';
  closeButton.style.borderRadius = '3px';
  closeButton.style.cursor = 'pointer';
  closeButton.onclick = () => {
    document.body.removeChild(logDiv);
  };
  
  // Añadir contenido del log
  const logContent = document.createElement('pre');
  logContent.style.whiteSpace = 'pre-wrap';
  logContent.style.fontSize = '12px';
  logContent.style.fontFamily = 'monospace';
  logContent.textContent = logExport.getFullLog();
  logContent.style.height = 'calc(100% - 50px)';
  logContent.style.overflow = 'auto';
  logDiv.appendChild(closeButton);
  logDiv.appendChild(logContent);
  
  // Eliminar el div anterior si existe
  const oldLogDiv = document.getElementById('exportLogDisplay');
  if (oldLogDiv) {
    document.body.removeChild(oldLogDiv);
  }
  
  document.body.appendChild(logDiv);
  
  return "Log mostrado en la consola y en la página";
};
