import * as XLSX from 'xlsx';

/**
 * Genera una plantilla Excel para importar obras
 */
export const generarPlantillaObras = () => {
  // Datos de ejemplo para la plantilla
  const datosEjemplo = [
    {
      'Nº de Obra': 'OB-001',
      'Nombre de Obra': 'Alza 145',
      'Fecha de Alta': '01/01/2025',
      'Cliente': 'Construcciones ABC',
      'Ref. Interna': 'REF-001',
      'Estado': 'En curso',
      'Dirección Obra': 'Calle Alza 145, San Sebastián'
    },
    {
      'Nº de Obra': 'OB-002',
      'Nombre de Obra': 'Acciona 330',
      'Fecha de Alta': '15/01/2025',
      'Cliente': 'Acciona Infraestructuras',
      'Ref. Interna': 'REF-002',
      'Estado': 'Planificación',
      'Dirección Obra': 'Avenida Principal 330, Madrid'
    },
    {
      'Nº de Obra': 'OB-003',
      'Nombre de Obra': 'Cardoner 25',
      'Fecha de Alta': '05/02/2025',
      'Cliente': 'Promotora XYZ',
      'Ref. Interna': 'REF-003',
      'Estado': 'Finalizada',
      'Dirección Obra': 'Calle Cardoner 25, Barcelona'
    }
  ];

  // Crear una nueva hoja de cálculo
  const worksheet = XLSX.utils.json_to_sheet(datosEjemplo);

  // Ajustar el ancho de las columnas
  const columnsWidth = [
    { wch: 12 },  // Nº de Obra
    { wch: 30 },  // Nombre de Obra
    { wch: 15 },  // Fecha de Alta
    { wch: 30 },  // Cliente
    { wch: 15 },  // Ref. Interna
    { wch: 15 },  // Estado
    { wch: 40 },  // Dirección Obra
  ];
  worksheet['!cols'] = columnsWidth;

  // Crear el libro de Excel y añadir la hoja
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Obras');

  // Generar el archivo
  XLSX.writeFile(workbook, 'plantilla_obras.xlsx');
};

// Ejecutar la función si se llama directamente al archivo
if (typeof window !== 'undefined') {
  window.generarPlantillaObras = generarPlantillaObras;
}
