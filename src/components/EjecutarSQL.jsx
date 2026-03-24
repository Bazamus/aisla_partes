import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { ejecutarScriptSQL, crearFuncionVerificarColumna, crearFuncionEjecutarSQL } from '../scripts/ejecutarSQL';

export default function EjecutarSQL({ onClose }) {
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const handleEjecutarSQL = async () => {
    try {
      setCargando(true);
      setResultado(null);
      
      // Primero intentamos crear las funciones necesarias
      const resultadoFuncionSQL = await crearFuncionEjecutarSQL();
      if (!resultadoFuncionSQL.exito) {
        setResultado({
          exito: false,
          mensaje: resultadoFuncionSQL.mensaje,
          instrucciones: true
        });
        return;
      }
      
      const resultadoFuncionVerificar = await crearFuncionVerificarColumna();
      if (!resultadoFuncionVerificar.exito) {
        setResultado({
          exito: false,
          mensaje: resultadoFuncionVerificar.mensaje,
          instrucciones: true
        });
        return;
      }
      
      // Ejecutar el script SQL
      const resultadoScript = await ejecutarScriptSQL();
      setResultado(resultadoScript);
      
      if (resultadoScript.exito) {
        toast.success(resultadoScript.mensaje);
      } else {
        toast.error(resultadoScript.mensaje);
      }
    } catch (error) {
      console.error('Error al ejecutar SQL:', error);
      setResultado({
        exito: false,
        mensaje: `Error: ${error.message}`
      });
      toast.error('Error al ejecutar SQL');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-10">
      <div className="fixed inset-0 bg-blue-900/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-2xl rounded-xl bg-white p-8 shadow-2xl">
          <Dialog.Title className="text-2xl font-bold text-blue-800 mb-6">Ejecutar SQL</Dialog.Title>
          
          <div className="space-y-6">
            <div>
              <p className="text-md text-gray-700 mb-4">
                Este proceso añadirá la columna "codigo" a la tabla "lista_de_precios" en la base de datos.
                Esta columna se utilizará para almacenar los códigos cortos de los trabajos.
              </p>
              
              <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Asegúrate de tener una copia de seguridad de la base de datos antes de ejecutar este script.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-100 p-4 rounded-md mb-4">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                  {`-- Script SQL que se ejecutará:
ALTER TABLE lista_de_precios ADD COLUMN codigo VARCHAR(20);
CREATE INDEX idx_lista_de_precios_codigo ON lista_de_precios(codigo);
COMMENT ON COLUMN lista_de_precios.codigo IS 'Código corto del trabajo en formato GP-SG-NNN (Grupo Principal - Subgrupo - Número secuencial)';`}
                </pre>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={handleEjecutarSQL}
                  disabled={cargando}
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-700 hover:bg-blue-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cargando ? 'Ejecutando...' : 'Ejecutar Script SQL'}
                </button>
              </div>
            </div>
            
            {resultado && (
              <div className={`mt-4 p-4 rounded-lg ${resultado.exito ? 'bg-green-50' : 'bg-red-50'}`}>
                <h3 className={`text-lg font-semibold mb-2 ${resultado.exito ? 'text-green-800' : 'text-red-800'}`}>
                  {resultado.exito ? 'Operación exitosa' : 'Error'}
                </h3>
                <p className={`${resultado.exito ? 'text-green-700' : 'text-red-700'}`}>
                  {resultado.mensaje}
                </p>
                
                {resultado.instrucciones && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-md">
                    <h4 className="text-md font-semibold text-blue-800 mb-2">Instrucciones manuales:</h4>
                    <p className="text-sm text-blue-700 mb-2">
                      Para ejecutar el script SQL manualmente, sigue estos pasos:
                    </p>
                    <ol className="list-decimal pl-5 text-sm text-blue-700 space-y-1">
                      <li>Accede al panel de administración de Supabase (app.supabase.io)</li>
                      <li>Selecciona tu proyecto</li>
                      <li>Ve a la sección "SQL Editor"</li>
                      <li>Crea una nueva consulta</li>
                      <li>Pega el siguiente código SQL:</li>
                    </ol>
                    <pre className="mt-2 p-3 bg-gray-800 text-white text-xs rounded-md overflow-x-auto">
                      {`-- Añadir columna código a la tabla lista_de_precios
ALTER TABLE lista_de_precios ADD COLUMN IF NOT EXISTS codigo VARCHAR(20);

-- Crear índice para búsquedas rápidas por código
CREATE INDEX IF NOT EXISTS idx_lista_de_precios_codigo ON lista_de_precios(codigo);

-- Comentario para la columna
COMMENT ON COLUMN lista_de_precios.codigo IS 'Código corto del trabajo en formato GP-SG-NNN (Grupo Principal - Subgrupo - Número secuencial)';`}
                    </pre>
                    <p className="mt-2 text-sm text-blue-700">
                      Haz clic en "Run" para ejecutar el script.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
