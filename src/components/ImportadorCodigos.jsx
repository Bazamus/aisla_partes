import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

export default function ImportadorCodigos({ onClose }) {
  const [cargando, setCargando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [total, setTotal] = useState(0);
  const [resultados, setResultados] = useState(null);

  const importarCodigosDesdeExcel = async (file) => {
    try {
      setCargando(true);
      setProgreso(0);
      setResultados(null);
      
      // Leer el archivo Excel
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      if (json.length === 0) {
        toast.error('El archivo no contiene datos');
        setCargando(false);
        return;
      }

      setTotal(json.length);
      
      let actualizados = 0;
      let errores = 0;
      let noEncontrados = 0;

      // Procesar cada fila del Excel
      for (let i = 0; i < json.length; i++) {
        const row = json[i];
        
        // Verificar que tenga los campos necesarios
        // La columna H puede aparecer como __EMPTY_7 o como "Código"
        const codigo = row['Código'] || row.__EMPTY_7;
        
        if (!row['Trabajos'] || !codigo) {
          errores++;
          setProgreso(i + 1);
          continue;
        }

        // Buscar el trabajo por nombre
        const { data: trabajos, error: errorBusqueda } = await supabase
          .from('lista_de_precios')
          .select('id')
          .ilike('trabajo', row['Trabajos'])
          .limit(1);

        if (errorBusqueda || !trabajos || trabajos.length === 0) {
          noEncontrados++;
          setProgreso(i + 1);
          continue;
        }

        // Actualizar el código
        const { error: errorActualizacion } = await supabase
          .from('lista_de_precios')
          .update({ codigo: codigo })
          .eq('id', trabajos[0].id);

        if (errorActualizacion) {
          errores++;
        } else {
          actualizados++;
        }
        
        setProgreso(i + 1);
      }

      setResultados({
        actualizados,
        errores,
        noEncontrados,
        total: json.length
      });

      if (actualizados > 0) {
        toast.success(`Se actualizaron ${actualizados} códigos correctamente`);
      }
      
      if (errores > 0 || noEncontrados > 0) {
        toast.error(`No se pudieron actualizar ${errores + noEncontrados} códigos`);
      }
    } catch (error) {
      console.error('Error al importar códigos:', error);
      toast.error('Error al procesar el archivo');
    } finally {
      setCargando(false);
    }
  };

  const handleImportarCodigos = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    importarCodigosDesdeExcel(file);
  };

  const handleImportarArchivoEspecifico = async () => {
    try {
      setCargando(true);
      
      // Usar el archivo específico que está en la raíz del proyecto
      let file = new File([], 'Precio_Demo.xlsx');
      
      // Intentar cargar el archivo desde la carpeta pública
      try {
        const response = await fetch('/Precio_Demo.xlsx');
        if (response.ok) {
          const blob = await response.blob();
          file = new File([blob], 'Precio_Demo.xlsx');
        }
      } catch (error) {
        console.warn('No se pudo cargar el archivo desde la carpeta pública:', error);
      }
      
      // Si no se pudo cargar desde la carpeta pública, usar el archivo local
      if (file.size === 0) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls';
        
        input.onchange = (e) => {
          const selectedFile = e.target.files[0];
          if (selectedFile) {
            importarCodigosDesdeExcel(selectedFile);
          } else {
            setCargando(false);
          }
        };
        
        input.click();
        return;
      }
      
      await importarCodigosDesdeExcel(file);
    } catch (error) {
      console.error('Error al importar archivo específico:', error);
      toast.error('Error al cargar el archivo Precio_Demo.xlsx');
      setCargando(false);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-10">
      <div className="fixed inset-0 bg-blue-900/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-2xl rounded-xl bg-white p-8 shadow-2xl">
          <Dialog.Title className="text-2xl font-bold text-blue-800 mb-6">Importar Códigos</Dialog.Title>
          
          <div className="space-y-6">
            <div>
              <p className="text-md text-gray-700 mb-4">
                Selecciona un archivo Excel que contenga los códigos para los trabajos. 
                El archivo debe contener al menos las columnas "Trabajos" y "Código".
              </p>
              
              <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
                <label className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-blue-700 bg-white hover:bg-blue-50 transition-colors duration-200 cursor-pointer">
                  Seleccionar archivo
                  <input
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls"
                    onChange={handleImportarCodigos}
                    disabled={cargando}
                  />
                </label>
                
                <button
                  onClick={handleImportarArchivoEspecifico}
                  disabled={cargando}
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-700 hover:bg-blue-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Importar desde Precio_Demo.xlsx
                </button>
              </div>
            </div>
            
            {cargando && (
              <div className="mt-4">
                <div className="text-sm text-blue-700 mb-2">
                  Procesando {progreso} de {total} registros...
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${Math.round((progreso / total) * 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {resultados && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Resultados de la importación</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li className="text-green-700">Códigos actualizados: {resultados.actualizados}</li>
                  {resultados.errores > 0 && (
                    <li className="text-red-700">Errores de actualización: {resultados.errores}</li>
                  )}
                  {resultados.noEncontrados > 0 && (
                    <li className="text-orange-700">Trabajos no encontrados: {resultados.noEncontrados}</li>
                  )}
                  <li className="text-blue-700">Total de registros procesados: {resultados.total}</li>
                </ul>
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
