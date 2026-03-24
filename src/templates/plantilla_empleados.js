import * as XLSX from 'xlsx';

/**
 * Genera una plantilla Excel para importar empleados
 */
export const generarPlantillaEmpleados = () => {
  // Datos de ejemplo para la plantilla
  const datosEjemplo = [
    {
      'Código': 'E001',
      'Nombre': 'Juan Pérez García',
      'Email': 'juan.perez@ejemplo.com',
      'Categoría': 'Oficial 1ª',
      'Coste Hora Trabajador (€)': 15.50,
      'Coste Hora Empresa (€)': 25.00,
      'Obra Asignada': 'Alza 145'
    },
    {
      'Código': 'E002',
      'Nombre': 'María López Sánchez',
      'Email': 'maria.lopez@ejemplo.com',
      'Categoría': 'Técnico',
      'Coste Hora Trabajador (€)': 16.00,
      'Coste Hora Empresa (€)': 26.50,
      'Obra Asignada': 'Acciona 330'
    },
    {
      'Código': 'E003',
      'Nombre': 'Carlos Rodríguez Martín',
      'Email': 'carlos.rodriguez@ejemplo.com',
      'Categoría': 'Ayudante',
      'Coste Hora Trabajador (€)': 14.75,
      'Coste Hora Empresa (€)': 24.25,
      'Obra Asignada': 'Cardoner 25'
    }
  ];

  // Crear una nueva hoja de cálculo
  const worksheet = XLSX.utils.json_to_sheet(datosEjemplo);

  // Ajustar el ancho de las columnas
  const columnsWidth = [
    { wch: 10 },  // Código
    { wch: 30 },  // Nombre
    { wch: 30 },  // Email
    { wch: 20 },  // Categoría
    { wch: 20 },  // Coste Hora Trabajador
    { wch: 20 },  // Coste Hora Empresa
    { wch: 30 },  // Obra Asignada
  ];
  worksheet['!cols'] = columnsWidth;

  // Crear el libro de Excel y añadir la hoja
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Empleados');

  // Generar el archivo
  XLSX.writeFile(workbook, 'plantilla_empleados.xlsx');
};

// Ejecutar la función si se llama directamente al archivo
if (typeof window !== 'undefined') {
  window.generarPlantillaEmpleados = generarPlantillaEmpleados;
}
