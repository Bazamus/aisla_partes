import { supabase } from '../lib/supabase'

// Función para generar código automáticamente
const generarCodigo = (tipo, espesor, diametro) => {
  if (!tipo || !espesor || !diametro) return '';
  
  const tipoAbrev = tipo.substring(0, 3).toUpperCase();
  const espesorFormat = String(espesor).padStart(2, '0');
  const diametroFormat = String(diametro).padStart(3, '0');
  
  return `${tipoAbrev}-${espesorFormat}-${diametroFormat}`;
};

// Función para convertir precio con coma decimal a número
const convertirPrecio = (precioStr) => {
  if (!precioStr || precioStr.trim() === '') return null;
  // Reemplazar coma por punto para conversión a número
  return parseFloat(precioStr.replace(',', '.'));
};

// Función para procesar datos del CSV
export const procesarDatosCSV = (csvData) => {
  const lineas = csvData.split('\n');
  const articulos = [];
  
  // Saltar la primera línea (headers)
  for (let i = 1; i < lineas.length; i++) {
    const linea = lineas[i].trim();
    if (!linea) continue;
    
    // Dividir por punto y coma
    const campos = linea.split(';');
    
    if (campos.length >= 7) {
      const tipo = campos[0]?.trim();
      const espesor = parseInt(campos[1]?.trim());
      const diametro = parseInt(campos[2]?.trim());
      const pulgada = campos[3]?.trim().replace(/"/g, '"'); // Normalizar comillas
      const unidad = campos[4]?.trim();
      const precioAislamiento = convertirPrecio(campos[5]?.trim());
      const precioAluminio = convertirPrecio(campos[6]?.trim());
      
      if (tipo && !isNaN(espesor) && !isNaN(diametro)) {
        articulos.push({
          tipo,
          espesor,
          diametro,
          pulgada: pulgada || null,
          unidad: unidad || 'Ml',
          precio_aislamiento: precioAislamiento,
          precio_aluminio: precioAluminio,
          codigo: generarCodigo(tipo, espesor, diametro)
        });
      }
    }
  }
  
  return articulos;
};

// Función para importar artículos a Supabase
export const importarArticulos = async (articulos) => {
  try {
    console.log(`Importando ${articulos.length} artículos...`);
    
    // Dividir en lotes de 100 para evitar límites de la API
    const loteSize = 100;
    const resultados = {
      importados: 0,
      errores: 0,
      detallesErrores: []
    };
    
    for (let i = 0; i < articulos.length; i += loteSize) {
      const lote = articulos.slice(i, i + loteSize);
      
      const { data, error } = await supabase
        .from('articulos_precios')
        .insert(lote)
        .select();
      
      if (error) {
        console.error(`Error en lote ${Math.floor(i/loteSize) + 1}:`, error);
        resultados.errores += lote.length;
        resultados.detallesErrores.push({
          lote: Math.floor(i/loteSize) + 1,
          error: error.message
        });
      } else {
        resultados.importados += data.length;
        console.log(`Lote ${Math.floor(i/loteSize) + 1} importado: ${data.length} artículos`);
      }
    }
    
    return resultados;
  } catch (error) {
    console.error('Error general en importación:', error);
    throw error;
  }
};

// Función principal para importar desde archivo CSV
export const importarDesdeCSV = async (archivoCSV) => {
  try {
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = async (e) => {
        try {
          const csvData = e.target.result;
          const articulos = procesarDatosCSV(csvData);
          
          if (articulos.length === 0) {
            reject(new Error('No se encontraron datos válidos en el archivo CSV'));
            return;
          }
          
          const resultados = await importarArticulos(articulos);
          resolve(resultados);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'));
      };
      
      reader.readAsText(archivoCSV, 'UTF-8');
    });
  } catch (error) {
    console.error('Error en importarDesdeCSV:', error);
    throw error;
  }
};
