import * as XLSX from 'xlsx';

/**
 * Genera una plantilla Excel para importar partes de empleados con materiales
 * Cada fila representa UN MATERIAL de un parte de empleado
 * 
 * NUEVA ESTRUCTURA (Enero 2025):
 * - Incluye campos de materiales: CODIGO, TIPO, ESPESOR, Diámetro, Ud/Ml, MATERIAL, Precios
 * - Una fila por cada material del parte
 * - Soporta materiales tipo "Aislamiento" y "Aluminio"
 * - Validación completa de precios y cálculos
 */
export const generarPlantillaPartesEmpleados = () => {
  // Datos de ejemplo para la plantilla - NUEVA ESTRUCTURA CON MATERIALES
  const datosEjemplo = [
    {
      'Fecha': '2025-01-15',
      'Nº de Parte': 'E0001/25',
      'Estado del Parte': 'Borrador',
      'Trabajador': 'Angelo Parra Hidalgo',
      'Cliente': 'DEMO',
      'Obra': 'SAN JOSE COLEGIO SAGRADO CORAZON MADRID',
      'CODIGO': 'CON-40-076',
      'TIPO': 'CONO',
      'ESPESOR': 40,
      'Diámetro': '76 (2"1/2)',
      'Ud/Ml': 10,
      'MATERIAL': 'Aislamiento',
      'Precio unitario': 2.84,
      'Precio Total': 28.40
    },
    {
      'Fecha': '2025-01-15',
      'Nº de Parte': 'E0001/25',
      'Estado del Parte': 'Borrador',
      'Trabajador': 'Angelo Parra Hidalgo',
      'Cliente': 'DEMO',
      'Obra': 'SAN JOSE COLEGIO SAGRADO CORAZON MADRID',
      'CODIGO': 'TUB-32-050',
      'TIPO': 'TUBO',
      'ESPESOR': 32,
      'Diámetro': '50 (1"1/2)',
      'Ud/Ml': 15,
      'MATERIAL': 'Aluminio',
      'Precio unitario': 3.25,
      'Precio Total': 48.75
    },
    {
      'Fecha': '2025-01-15',
      'Nº de Parte': 'E0001/25',
      'Estado del Parte': 'Borrador',
      'Trabajador': 'Angelo Parra Hidalgo',
      'Cliente': 'DEMO',
      'Obra': 'SAN JOSE COLEGIO SAGRADO CORAZON MADRID',
      'CODIGO': 'TAP-06-025',
      'TIPO': 'TAPA',
      'ESPESOR': 6,
      'Diámetro': '25 (1")',
      'Ud/Ml': 8,
      'MATERIAL': 'Aislamiento',
      'Precio unitario': 1.95,
      'Precio Total': 15.60
    },
    {
      'Fecha': '2025-01-16',
      'Nº de Parte': 'E0002/25',
      'Estado del Parte': 'Completado',
      'Trabajador': 'María López Sánchez',
      'Cliente': 'Acciona Infraestructuras',
      'Obra': 'Acciona 330 - Centro Comercial Plaza Mayor',
      'CODIGO': 'COD-15-032',
      'TIPO': 'CODO',
      'ESPESOR': 15,
      'Diámetro': '32 (1"1/4)',
      'Ud/Ml': 12,
      'MATERIAL': 'Aluminio',
      'Precio unitario': 4.50,
      'Precio Total': 54.00
    },
    {
      'Fecha': '2025-01-16',
      'Nº de Parte': 'E0002/25',
      'Estado del Parte': 'Completado',
      'Trabajador': 'María López Sánchez',
      'Cliente': 'Acciona Infraestructuras',
      'Obra': 'Acciona 330 - Centro Comercial Plaza Mayor',
      'CODIGO': 'RED-20-040',
      'TIPO': 'REDUCCION',
      'ESPESOR': 20,
      'Diámetro': '40 (1"1/2)',
      'Ud/Ml': 6,
      'MATERIAL': 'Aislamiento',
      'Precio unitario': 2.15,
      'Precio Total': 12.90
    },
    {
      'Fecha': '2025-01-17',
      'Nº de Parte': 'E0003/25',
      'Estado del Parte': 'En Revisión',
      'Trabajador': 'Carlos Rodríguez Martín',
      'Cliente': 'Promociones Cardoner',
      'Obra': 'Cardoner 25 - Edificio de Oficinas',
      'CODIGO': 'TUB-25-063',
      'TIPO': 'TUBO',
      'ESPESOR': 25,
      'Diámetro': '63 (2")',
      'Ud/Ml': 20,
      'MATERIAL': 'Aluminio',
      'Precio unitario': 5.80,
      'Precio Total': 116.00
    }
  ];

  // Crear una nueva hoja de cálculo
  const worksheet = XLSX.utils.json_to_sheet(datosEjemplo);

  // Ajustar el ancho de las columnas - NUEVA ESTRUCTURA CON MATERIALES
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

  // Aplicar formato a las celdas de encabezado
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  
  // Formatear encabezados (primera fila)
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) {
      worksheet[cellAddress] = { v: '', t: 's' };
    }
    worksheet[cellAddress].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '4472C4' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      }
    };
  }

  // Formatear datos (filas 2 en adelante)
  for (let row = range.s.r + 1; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          },
          alignment: { vertical: 'center' }
        };
        
        // Formato especial para columnas numéricas
        if (col === 8) { // ESPESOR
          worksheet[cellAddress].s.numberFormat = '0';
        } else if (col === 10) { // Ud/Ml
          worksheet[cellAddress].s.numberFormat = '0';
        } else if (col === 12) { // Precio unitario
          worksheet[cellAddress].s.numberFormat = '0.00€';
        } else if (col === 13) { // Precio Total
          worksheet[cellAddress].s.numberFormat = '0.00€';
        }
      }
    }
  }

  // Crear el libro de Excel y añadir la hoja
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Partes Empleados');

  // Añadir hoja de instrucciones - ACTUALIZADA PARA MATERIALES
  const instrucciones = [
    { 'INSTRUCCIONES PARA LA IMPORTACIÓN DE PARTES DE EMPLEADOS CON MATERIALES': '' },
    { '': '' },
    { 'FORMATO DE DATOS:': '' },
    { 'Fecha': 'Formato: YYYY-MM-DD (ejemplo: 2025-01-15)' },
    { 'Nº de Parte': 'Código único del parte (ejemplo: E0001/25)' },
    { 'Estado del Parte': 'Valores válidos: Borrador, En Revisión, Completado, Aprobado' },
    { 'Trabajador': 'Nombre completo del empleado' },
    { 'Cliente': 'Nombre del cliente de la obra' },
    { 'Obra': 'Nombre completo de la obra' },
    { 'CODIGO': 'Código del material (ejemplo: CON-40-076)' },
    { 'TIPO': 'Tipo de material (CONO, TUBO, TAPA, CODO, REDUCCION, etc.)' },
    { 'ESPESOR': 'Espesor en milímetros (número entero)' },
    { 'Diámetro': 'Diámetro con pulgadas (ejemplo: 76 (2"1/2))' },
    { 'Ud/Ml': 'Unidades o metros lineales (número entero)' },
    { 'MATERIAL': 'Tipo de material: Aislamiento o Aluminio' },
    { 'Precio unitario': 'Precio por unidad con decimales (ejemplo: 2.84)' },
    { 'Precio Total': 'Precio total calculado (Ud/Ml × Precio unitario)' },
    { '': '' },
    { 'REGLAS IMPORTANTES:': '' },
    { '•': 'Cada fila representa UN MATERIAL de un parte de empleado' },
    { '•': 'Si un parte tiene múltiples materiales, cada material va en una fila separada' },
    { '•': 'El Nº de Parte debe ser igual para todos los materiales del mismo parte' },
    { '•': 'CODIGO debe existir en el catálogo de materiales' },
    { '•': 'MATERIAL solo puede ser "Aislamiento" o "Aluminio"' },
    { '•': 'ESPESOR y Ud/Ml deben ser números enteros positivos' },
    { '•': 'Precio unitario y Precio Total deben ser números con decimales' },
    { '•': 'Precio Total = Ud/Ml × Precio unitario' },
    { '•': 'No dejar filas vacías entre los datos' },
    { '': '' },
    { 'EJEMPLO DE USO:': '' },
    { '•': 'Un parte con 3 materiales diferentes = 3 filas con el mismo Nº de Parte' },
    { '•': 'Cada material puede ser de tipo Aislamiento o Aluminio' },
    { '•': 'El coste total del parte será la suma de todos los Precios Totales' },
    { '•': 'Un parte E0001/25 puede tener: 1 CONO + 2 TUBOS + 3 TAPAS = 6 filas' }
  ];

  const worksheetInstrucciones = XLSX.utils.json_to_sheet(instrucciones);
  worksheetInstrucciones['!cols'] = [
    { wch: 50 },
    { wch: 60 }
  ];

  // Formatear instrucciones
  const rangeInst = XLSX.utils.decode_range(worksheetInstrucciones['!ref']);
  for (let row = rangeInst.s.r; row <= rangeInst.e.r; row++) {
    for (let col = rangeInst.s.c; col <= rangeInst.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (worksheetInstrucciones[cellAddress]) {
        if (row === 0) {
          // Título principal
          worksheetInstrucciones[cellAddress].s = {
            font: { bold: true, size: 14, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '2E75B6' } },
            alignment: { horizontal: 'center' }
          };
        } else if (row === 2 || row === 14) {
          // Subtítulos
          worksheetInstrucciones[cellAddress].s = {
            font: { bold: true, size: 12, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '4472C4' } },
            alignment: { horizontal: 'left' }
          };
        } else if (row === 23) {
          // Subtítulo ejemplo
          worksheetInstrucciones[cellAddress].s = {
            font: { bold: true, size: 11, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '70AD47' } },
            alignment: { horizontal: 'left' }
          };
        }
      }
    }
  }

  XLSX.utils.book_append_sheet(workbook, worksheetInstrucciones, 'Instrucciones');

  // Generar el archivo
  XLSX.writeFile(workbook, 'plantilla_partes_empleados.xlsx');
};

// Función para validar y procesar datos importados - ACTUALIZADA PARA MATERIALES
export const validarDatosPartesEmpleados = (datos) => {
  const errores = [];
  const datosProcesados = [];

  datos.forEach((fila, index) => {
    const numeroFila = index + 2; // +2 porque Excel empieza en 1 y la primera fila son encabezados
    const erroresFila = [];

    // Validar fecha
    if (!fila['Fecha'] || !/^\d{4}-\d{2}-\d{2}$/.test(fila['Fecha'])) {
      erroresFila.push('Fecha debe tener formato YYYY-MM-DD');
    }

    // Validar número de parte
    if (!fila['Nº de Parte'] || fila['Nº de Parte'].toString().trim() === '') {
      erroresFila.push('Nº de Parte es obligatorio');
    }

    // Validar estado
    const estadosValidos = ['Borrador', 'En Revisión', 'Completado', 'Aprobado'];
    if (!fila['Estado del Parte'] || !estadosValidos.includes(fila['Estado del Parte'])) {
      erroresFila.push('Estado del Parte debe ser: Borrador, En Revisión, Completado, o Aprobado');
    }

    // Validar trabajador
    if (!fila['Trabajador'] || fila['Trabajador'].toString().trim() === '') {
      erroresFila.push('Trabajador es obligatorio');
    }

    // Validar cliente
    if (!fila['Cliente'] || fila['Cliente'].toString().trim() === '') {
      erroresFila.push('Cliente es obligatorio');
    }

    // Validar obra
    if (!fila['Obra'] || fila['Obra'].toString().trim() === '') {
      erroresFila.push('Obra es obligatoria');
    }

    // Validar CODIGO del material
    if (!fila['CODIGO'] || fila['CODIGO'].toString().trim() === '') {
      erroresFila.push('CODIGO del material es obligatorio');
    }

    // Validar TIPO del material
    const tiposValidos = ['CONO', 'TUBO', 'TAPA', 'CODO', 'REDUCCION', 'TE', 'CURVA', 'BRIDA'];
    if (!fila['TIPO'] || !tiposValidos.includes(fila['TIPO'].toString().toUpperCase())) {
      erroresFila.push('TIPO debe ser uno de: CONO, TUBO, TAPA, CODO, REDUCCION, TE, CURVA, BRIDA');
    }

    // Validar ESPESOR
    const espesor = parseInt(fila['ESPESOR']);
    if (isNaN(espesor) || espesor <= 0) {
      erroresFila.push('ESPESOR debe ser un número entero positivo');
    }

    // Validar Diámetro
    if (!fila['Diámetro'] || fila['Diámetro'].toString().trim() === '') {
      erroresFila.push('Diámetro es obligatorio');
    }

    // Validar Ud/Ml (Unidades o Metros Lineales)
    const unidades = parseInt(fila['Ud/Ml']);
    if (isNaN(unidades) || unidades <= 0) {
      erroresFila.push('Ud/Ml debe ser un número entero positivo');
    }

    // Validar MATERIAL
    const materialesValidos = ['Aislamiento', 'Aluminio'];
    if (!fila['MATERIAL'] || !materialesValidos.includes(fila['MATERIAL'])) {
      erroresFila.push('MATERIAL debe ser "Aislamiento" o "Aluminio"');
    }

    // Validar Precio unitario
    const precioUnitario = parseFloat(fila['Precio unitario']);
    if (isNaN(precioUnitario) || precioUnitario <= 0) {
      erroresFila.push('Precio unitario debe ser un número mayor que 0');
    }

    // Validar Precio Total
    const precioTotal = parseFloat(fila['Precio Total']);
    if (isNaN(precioTotal) || precioTotal <= 0) {
      erroresFila.push('Precio Total debe ser un número mayor que 0');
    }

    // Validar que Precio Total = Ud/Ml × Precio unitario (con tolerancia para decimales)
    if (!isNaN(unidades) && !isNaN(precioUnitario) && !isNaN(precioTotal)) {
      const precioCalculado = unidades * precioUnitario;
      const diferencia = Math.abs(precioTotal - precioCalculado);
      if (diferencia > 0.01) { // Tolerancia de 1 céntimo
        erroresFila.push(`Precio Total (${precioTotal}) no coincide con Ud/Ml × Precio unitario (${precioCalculado})`);
      }
    }

    if (erroresFila.length > 0) {
      errores.push({
        fila: numeroFila,
        errores: erroresFila
      });
    } else {
      datosProcesados.push({
        fecha: fila['Fecha'],
        numeroParte: fila['Nº de Parte'].toString().trim(),
        estado: fila['Estado del Parte'],
        trabajador: fila['Trabajador'].toString().trim(),
        cliente: fila['Cliente'].toString().trim(),
        obra: fila['Obra'].toString().trim(),
        codigo: fila['CODIGO'].toString().trim(),
        tipo: fila['TIPO'].toString().toUpperCase(),
        espesor: espesor,
        diametro: fila['Diámetro'].toString().trim(),
        unidades: unidades,
        material: fila['MATERIAL'],
        precioUnitario: precioUnitario,
        precioTotal: precioTotal
      });
    }
  });

  return {
    errores,
    datosProcesados,
    esValido: errores.length === 0
  };
};

// Ejecutar la función si se llama directamente al archivo
if (typeof window !== 'undefined') {
  window.generarPlantillaPartesEmpleados = generarPlantillaPartesEmpleados;
  window.validarDatosPartesEmpleados = validarDatosPartesEmpleados;
}
