import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';

/**
 * Importa códigos desde un archivo Excel y actualiza los registros en la base de datos
 * @param {File} file - Archivo Excel con los códigos
 * @returns {Promise<{actualizados: number, errores: number}>}
 */
export const importarCodigos = async (file) => {
  try {
    // Leer el archivo Excel
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const json = XLSX.utils.sheet_to_json(worksheet);

    if (json.length === 0) {
      toast.error('El archivo no contiene datos');
      return { actualizados: 0, errores: 0 };
    }

    let actualizados = 0;
    let errores = 0;

    // Procesar cada fila del Excel
    for (const row of json) {
      // Verificar que tenga los campos necesarios
      if (!row['Trabajos'] || !row['Código']) {
        errores++;
        continue;
      }

      // Buscar el trabajo por nombre
      const { data: trabajos, error: errorBusqueda } = await supabase
        .from('lista_de_precios')
        .select('id')
        .eq('trabajo', row['Trabajos'])
        .limit(1);

      if (errorBusqueda || !trabajos || trabajos.length === 0) {
        errores++;
        continue;
      }

      // Actualizar el código
      const { error: errorActualizacion } = await supabase
        .from('lista_de_precios')
        .update({ codigo: row['Código'] })
        .eq('id', trabajos[0].id);

      if (errorActualizacion) {
        errores++;
      } else {
        actualizados++;
      }
    }

    return { actualizados, errores };
  } catch (error) {
    console.error('Error al importar códigos:', error);
    toast.error('Error al procesar el archivo');
    return { actualizados: 0, errores: 0 };
  }
};

/**
 * Importa códigos desde un archivo Excel específico
 * @param {string} rutaArchivo - Ruta al archivo Excel
 * @returns {Promise<{actualizados: number, errores: number}>}
 */
export const importarCodigosDesdeArchivo = async (rutaArchivo = 'Precio_Demo.xlsx') => {
  try {
    // Crear un objeto File a partir de la ruta (esto funcionaría en Node.js con fs)
    // En un entorno de navegador, necesitarías usar fetch o una librería como axios
    const response = await fetch(rutaArchivo);
    const blob = await response.blob();
    const file = new File([blob], rutaArchivo);
    
    return await importarCodigos(file);
  } catch (error) {
    console.error('Error al importar códigos desde archivo:', error);
    toast.error('Error al importar códigos desde archivo');
    return { actualizados: 0, errores: 0 };
  }
};
