import { supabase } from '../lib/supabase';

/**
 * Ejecuta el script SQL para añadir la columna código a la tabla lista_de_precios
 * @returns {Promise<{exito: boolean, mensaje: string}>}
 */
export const ejecutarScriptSQL = async () => {
  try {
    // Verificar si la columna ya existe
    const { data: columnaExistente, error: errorVerificacion } = await supabase
      .rpc('verificar_columna_existe', { 
        tabla: 'lista_de_precios', 
        columna: 'codigo' 
      });
    
    // Si hay un error con la función RPC, intentar ejecutar el SQL directamente
    if (errorVerificacion) {
      console.warn('Error al verificar columna, intentando ejecutar SQL directamente:', errorVerificacion);
      
      // Añadir la columna código
      const { error: errorAlterTable } = await supabase
        .rpc('ejecutar_sql', { 
          sql: 'ALTER TABLE lista_de_precios ADD COLUMN IF NOT EXISTS codigo VARCHAR(20)' 
        });
      
      if (errorAlterTable) {
        throw new Error(`Error al añadir columna: ${errorAlterTable.message}`);
      }
      
      // Crear índice
      const { error: errorCrearIndice } = await supabase
        .rpc('ejecutar_sql', { 
          sql: 'CREATE INDEX IF NOT EXISTS idx_lista_de_precios_codigo ON lista_de_precios(codigo)' 
        });
      
      if (errorCrearIndice) {
        console.warn('Error al crear índice:', errorCrearIndice);
        // No lanzamos error aquí porque el índice no es crítico
      }
      
      return { 
        exito: true, 
        mensaje: 'Columna código añadida correctamente a la tabla lista_de_precios' 
      };
    }
    
    // Si la columna ya existe, no hacemos nada
    if (columnaExistente) {
      return { 
        exito: true, 
        mensaje: 'La columna código ya existe en la tabla lista_de_precios' 
      };
    }
    
    // Ejecutar el script SQL completo
    const { error } = await supabase
      .rpc('ejecutar_sql', { 
        sql: `
          ALTER TABLE lista_de_precios ADD COLUMN codigo VARCHAR(20);
          CREATE INDEX idx_lista_de_precios_codigo ON lista_de_precios(codigo);
          COMMENT ON COLUMN lista_de_precios.codigo IS 'Código corto del trabajo en formato GP-SG-NNN (Grupo Principal - Subgrupo - Número secuencial)';
        `
      });
    
    if (error) {
      throw new Error(`Error al ejecutar script SQL: ${error.message}`);
    }
    
    return { 
      exito: true, 
      mensaje: 'Script SQL ejecutado correctamente' 
    };
  } catch (error) {
    console.error('Error al ejecutar script SQL:', error);
    return { 
      exito: false, 
      mensaje: `Error al ejecutar script SQL: ${error.message}` 
    };
  }
};

/**
 * Crea la función RPC para verificar si una columna existe en una tabla
 * @returns {Promise<{exito: boolean, mensaje: string}>}
 */
export const crearFuncionVerificarColumna = async () => {
  try {
    const { error } = await supabase
      .rpc('ejecutar_sql', { 
        sql: `
          CREATE OR REPLACE FUNCTION verificar_columna_existe(tabla text, columna text)
          RETURNS boolean
          LANGUAGE plpgsql
          AS $$
          DECLARE
            existe boolean;
          BEGIN
            SELECT EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_name = tabla
                AND column_name = columna
            ) INTO existe;
            
            RETURN existe;
          END;
          $$;
        `
      });
    
    if (error) {
      throw new Error(`Error al crear función verificar_columna_existe: ${error.message}`);
    }
    
    return { 
      exito: true, 
      mensaje: 'Función verificar_columna_existe creada correctamente' 
    };
  } catch (error) {
    console.error('Error al crear función verificar_columna_existe:', error);
    return { 
      exito: false, 
      mensaje: `Error al crear función verificar_columna_existe: ${error.message}` 
    };
  }
};

/**
 * Crea la función RPC para ejecutar SQL
 * @returns {Promise<{exito: boolean, mensaje: string}>}
 */
export const crearFuncionEjecutarSQL = async () => {
  try {
    const { error } = await supabase
      .rpc('ejecutar_sql', { 
        sql: `
          CREATE OR REPLACE FUNCTION ejecutar_sql(sql text)
          RETURNS void
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            EXECUTE sql;
          END;
          $$;
        `
      });
    
    if (error) {
      // Si el error es porque la función no existe, intentamos crearla con otro método
      if (error.message.includes('function ejecutar_sql does not exist')) {
        // Este SQL debe ejecutarse directamente en la base de datos por un administrador
        return { 
          exito: false, 
          mensaje: 'La función ejecutar_sql no existe. Por favor, ejecuta el script SQL manualmente desde el panel de administración de Supabase.' 
        };
      }
      
      throw new Error(`Error al crear función ejecutar_sql: ${error.message}`);
    }
    
    return { 
      exito: true, 
      mensaje: 'Función ejecutar_sql creada correctamente' 
    };
  } catch (error) {
    console.error('Error al crear función ejecutar_sql:', error);
    return { 
      exito: false, 
      mensaje: `Error al crear función ejecutar_sql: ${error.message}` 
    };
  }
};
