import * as XLSX from 'xlsx';

export const generarPlantillaProveedores = () => {
  // Datos de ejemplo para la plantilla
  const datosEjemplo = [
    {
      'Código': 'PROV001',
      'Razón Social': 'Ejemplo Suministros S.L.',
      'CIF': 'B12345678',
      'Persona de Contacto': 'Juan Ejemplo',
      'Teléfono': '666123456',
      'Email': 'contacto@ejemplo.com',
      'Dirección': 'Calle Ejemplo 123, 28001 Madrid',
      'Notas': 'Proveedor de material eléctrico'
    },
    {
      'Código': 'PROV002',
      'Razón Social': 'Distribuciones Ejemplo S.A.',
      'CIF': 'A87654321',
      'Persona de Contacto': 'María Ejemplo',
      'Teléfono': '666789012',
      'Email': 'info@distribuciones-ejemplo.com',
      'Dirección': 'Avenida Ejemplo 456, 08001 Barcelona',
      'Notas': 'Distribuidor oficial de fontanería'
    }
  ];

  // Crear una nueva hoja de cálculo
  const worksheet = XLSX.utils.json_to_sheet(datosEjemplo);

  // Ajustar el ancho de las columnas
  const columnsWidth = [
    { wch: 12 },  // Código
    { wch: 40 },  // Razón Social
    { wch: 15 },  // CIF
    { wch: 30 },  // Persona de Contacto
    { wch: 15 },  // Teléfono
    { wch: 35 },  // Email
    { wch: 50 },  // Dirección
    { wch: 40 },  // Notas
  ];
  worksheet['!cols'] = columnsWidth;

  // Crear el libro de Excel y añadir la hoja
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Proveedores');

  // Generar el archivo
  XLSX.writeFile(workbook, 'plantilla_proveedores.xlsx');
};