import * as XLSX from 'xlsx';

/**
 * Genera una plantilla Excel para importar partes de proveedores
 * Incluye todos los campos necesarios con datos de ejemplo
 */
export const generarPlantillaPartesProveedores = () => {
  // Datos de ejemplo para la plantilla
  const datosEjemplo = [
    {
      'FECHA': '2025-01-15',
      'Nº PARTE': 'PP-2025-001',
      'COD.PROVEEDOR': 'PROV001',
      'RAZON SOCIAL': 'Electroinstalaciones García S.L.',
      'Email': 'info@electrogarcia.com',
      'CIF': 'B12345678',
      'OBRA': 'Alza 145 - Residencial Las Palmeras',
      'PORTAL': 'Portal A',
      'VIVIENDA': 'Vivienda 3A',
      'TRABAJO': 'Instalación de puntos de luz en dormitorio principal',
      'CANTIDAD': 8,
      'PRECIO UNITARIO': 25.50,
      'DESCUENTO': 0,
      'TOTAL': 204.00
    },
    {
      'FECHA': '2025-01-15',
      'Nº PARTE': 'PP-2025-001',
      'COD.PROVEEDOR': 'PROV001',
      'RAZON SOCIAL': 'Electroinstalaciones García S.L.',
      'Email': 'info@electrogarcia.com',
      'CIF': 'B12345678',
      'OBRA': 'Alza 145 - Residencial Las Palmeras',
      'PORTAL': 'Portal A',
      'VIVIENDA': 'Vivienda 3A',
      'TRABAJO': 'Montaje de aparatos de climatización',
      'CANTIDAD': 2,
      'PRECIO UNITARIO': 150.00,
      'DESCUENTO': 10,
      'TOTAL': 270.00
    },
    {
      'FECHA': '2025-01-16',
      'Nº PARTE': 'PP-2025-002',
      'COD.PROVEEDOR': 'PROV002',
      'RAZON SOCIAL': 'Fontanería López e Hijos',
      'Email': 'contacto@fontanerialopez.es',
      'CIF': 'A87654321',
      'OBRA': 'Acciona 330 - Residencial Los Pinos',
      'PORTAL': 'Portal B',
      'VIVIENDA': 'Vivienda 5B',
      'TRABAJO': 'Instalación de tuberías de agua caliente',
      'CANTIDAD': 15,
      'PRECIO UNITARIO': 18.75,
      'DESCUENTO': 5,
      'TOTAL': 267.19
    }
  ];

  // Crear worksheet
  const worksheet = XLSX.utils.json_to_sheet(datosEjemplo);

  // Ajustar ancho de columnas
  const columnWidths = [
    { wch: 12 }, // FECHA
    { wch: 15 }, // Nº PARTE
    { wch: 15 }, // COD.PROVEEDOR
    { wch: 35 }, // RAZON SOCIAL
    { wch: 25 }, // Email
    { wch: 12 }, // CIF
    { wch: 40 }, // OBRA
    { wch: 15 }, // PORTAL
    { wch: 15 }, // VIVIENDA
    { wch: 50 }, // TRABAJO
    { wch: 10 }, // CANTIDAD
    { wch: 15 }, // PRECIO UNITARIO
    { wch: 12 }, // DESCUENTO
    { wch: 12 }  // TOTAL
  ];
  worksheet['!cols'] = columnWidths;

  // Crear workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Partes Proveedores');

  // Generar archivo
  XLSX.writeFile(workbook, 'plantilla_partes_proveedores.xlsx');
};

/**
 * Valida los datos importados de partes de proveedores
 * @param {Array} datos - Array de objetos con los datos del Excel
 * @returns {Object} - Objeto con validación y errores
 */
export const validarDatosPartesProveedores = (datos) => {
  const errores = [];
  const datosValidos = [];

  if (!Array.isArray(datos) || datos.length === 0) {
    return {
      valido: false,
      errores: ['El archivo no contiene datos válidos'],
      datosValidos: []
    };
  }

  datos.forEach((fila, index) => {
    const numeroFila = index + 2; // +2 porque Excel empieza en 1 y la primera fila son headers
    const erroresFila = [];

    // Validar campos obligatorios
    if (!fila['FECHA']) {
      erroresFila.push('FECHA es obligatorio');
    } else {
      // Validar formato de fecha
      const fecha = new Date(fila['FECHA']);
      if (isNaN(fecha.getTime())) {
        erroresFila.push('FECHA debe tener un formato válido (YYYY-MM-DD)');
      }
    }

    if (!fila['COD.PROVEEDOR']) {
      erroresFila.push('COD.PROVEEDOR es obligatorio');
    }

    if (!fila['RAZON SOCIAL']) {
      erroresFila.push('RAZON SOCIAL es obligatorio');
    }

    if (!fila['OBRA']) {
      erroresFila.push('OBRA es obligatorio');
    }

    if (!fila['TRABAJO']) {
      erroresFila.push('TRABAJO es obligatorio');
    }

    // Validar campos numéricos
    if (fila['CANTIDAD'] !== undefined && fila['CANTIDAD'] !== null && fila['CANTIDAD'] !== '') {
      const cantidad = parseFloat(fila['CANTIDAD']);
      if (isNaN(cantidad) || cantidad <= 0) {
        erroresFila.push('CANTIDAD debe ser un número mayor que 0');
      }
    }

    if (fila['PRECIO UNITARIO'] !== undefined && fila['PRECIO UNITARIO'] !== null && fila['PRECIO UNITARIO'] !== '') {
      const precio = parseFloat(fila['PRECIO UNITARIO']);
      if (isNaN(precio) || precio < 0) {
        erroresFila.push('PRECIO UNITARIO debe ser un número mayor o igual a 0');
      }
    }

    if (fila['DESCUENTO'] !== undefined && fila['DESCUENTO'] !== null && fila['DESCUENTO'] !== '') {
      const descuento = parseFloat(fila['DESCUENTO']);
      if (isNaN(descuento) || descuento < 0 || descuento > 100) {
        erroresFila.push('DESCUENTO debe ser un número entre 0 y 100');
      }
    }

    // Validar email si está presente
    if (fila['Email'] && fila['Email'] !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(fila['Email'])) {
        erroresFila.push('Email debe tener un formato válido');
      }
    }

    // Validar CIF si está presente
    if (fila['CIF'] && fila['CIF'] !== '') {
      const cifRegex = /^[A-Z]\d{8}$/;
      if (!cifRegex.test(fila['CIF'])) {
        erroresFila.push('CIF debe tener formato válido (letra + 8 dígitos)');
      }
    }

    if (erroresFila.length > 0) {
      errores.push({
        fila: numeroFila,
        errores: erroresFila
      });
    } else {
      datosValidos.push({
        ...fila,
        // Convertir campos numéricos
        CANTIDAD: fila['CANTIDAD'] ? parseFloat(fila['CANTIDAD']) : 0,
        PRECIO_UNITARIO: fila['PRECIO UNITARIO'] ? parseFloat(fila['PRECIO UNITARIO']) : 0,
        DESCUENTO: fila['DESCUENTO'] ? parseFloat(fila['DESCUENTO']) : 0,
        TOTAL: fila['TOTAL'] ? parseFloat(fila['TOTAL']) : 0
      });
    }
  });

  return {
    valido: errores.length === 0,
    errores,
    datosValidos
  };
};
