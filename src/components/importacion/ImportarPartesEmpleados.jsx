import React, { useState } from 'react';
import { generarPlantillaPartesEmpleados, validarDatosPartesEmpleados } from '../../templates/plantilla_partes_empleados';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const ImportarPartesEmpleados = () => {
  const [archivo, setArchivo] = useState(null);
  const [datos, setDatos] = useState(null);
  const [errores, setErrores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [procesando, setProcesando] = useState(false);

  // Descargar plantilla
  const descargarPlantilla = () => {
    try {
      generarPlantillaPartesEmpleados();
      toast.success('Plantilla descargada correctamente');
    } catch (error) {
      console.error('Error al generar plantilla:', error);
      toast.error('Error al generar la plantilla');
    }
  };

  // Manejar selección de archivo
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel') {
        setArchivo(file);
        procesarArchivo(file);
      } else {
        toast.error('Por favor selecciona un archivo Excel (.xlsx o .xls)');
      }
    }
  };

  // Procesar archivo Excel
  const procesarArchivo = async (file) => {
    setLoading(true);
    try {
      const XLSX = await import('xlsx');
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Obtener la primera hoja
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convertir a JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Procesar datos (saltar encabezados)
          const datosProcesados = jsonData.slice(1).map(row => {
            const obj = {};
            jsonData[0].forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          }).filter(row => Object.values(row).some(val => val !== undefined && val !== ''));

          setDatos(datosProcesados);
          
          // Validar datos
          const validacion = validarDatosPartesEmpleados(datosProcesados);
          setErrores(validacion.errores);
          
          if (validacion.esValido) {
            toast.success(`Archivo procesado correctamente. ${datosProcesados.length} trabajos encontrados.`);
          } else {
            toast.error(`Se encontraron ${validacion.errores.length} errores en el archivo.`);
          }
          
        } catch (error) {
          console.error('Error al procesar archivo:', error);
          toast.error('Error al procesar el archivo Excel');
        }
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error al leer archivo:', error);
      toast.error('Error al leer el archivo');
    } finally {
      setLoading(false);
    }
  };

  // Importar datos a la base de datos
  const importarDatos = async () => {
    if (!datos || errores.length > 0) {
      toast.error('Por favor corrige los errores antes de importar');
      return;
    }

    setProcesando(true);
    try {
      // Agrupar trabajos por número de parte
      const partesAgrupados = {};
      datos.forEach(trabajo => {
        if (!partesAgrupados[trabajo.numeroParte]) {
          partesAgrupados[trabajo.numeroParte] = {
            numeroParte: trabajo.numeroParte,
            fecha: trabajo.fecha,
            estado: trabajo.estado,
            trabajador: trabajo.trabajador,
            cliente: trabajo.cliente,
            obra: trabajo.obra,
            trabajos: []
          };
        }
        partesAgrupados[trabajo.numeroParte].trabajos.push({
          portal: trabajo.portal,
          vivienda: trabajo.vivienda,
          descripcion: trabajo.trabajosRealizados,
          tiempoEmpleado: trabajo.tiempoEmpleado
        });
      });

      // Crear partes en la base de datos
      for (const [numeroParte, parte] of Object.entries(partesAgrupados)) {
        try {
          // Crear el parte principal
          const { data: parteData, error: parteError } = await supabase
            .from('partes')
            .insert([{
              numero_parte: parte.numeroParte,
              fecha: parte.fecha,
              estado: parte.estado,
              nombre_trabajador: parte.trabajador,
              cliente: parte.cliente,
              nombre_obra: parte.obra,
              coste_trabajos: 0,
              coste_empresa: 0,
              otros_trabajos: ''
            }])
            .select()
            .single();

          if (parteError) {
            console.error(`Error al crear parte ${numeroParte}:`, parteError);
            toast.error(`Error al crear parte ${numeroParte}`);
            continue;
          }

          // Crear los trabajos del parte
          for (const trabajo of parte.trabajos) {
            const { error: trabajoError } = await supabase
              .from('partes_empleados_trabajos')
              .insert([{
                parte_id: parteData.id,
                descripcion: trabajo.descripcion,
                tiempo_empleado: trabajo.tiempoEmpleado,
                observaciones: `Portal: ${trabajo.portal || 'N/A'}, Vivienda: ${trabajo.vivienda || 'N/A'}`,
                tipo_trabajo: 'manual'
              }]);

            if (trabajoError) {
              console.error(`Error al crear trabajo en parte ${numeroParte}:`, trabajoError);
            }
          }

          toast.success(`Parte ${numeroParte} importado correctamente`);
          
        } catch (error) {
          console.error(`Error al procesar parte ${numeroParte}:`, error);
          toast.error(`Error al procesar parte ${numeroParte}`);
        }
      }

      toast.success('Importación completada');
      setDatos(null);
      setErrores([]);
      setArchivo(null);
      
    } catch (error) {
      console.error('Error en la importación:', error);
      toast.error('Error durante la importación');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          📋 Importar Partes de Trabajo de Empleados
        </h2>

        {/* Descargar Plantilla */}
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            📥 Paso 1: Descargar Plantilla
          </h3>
          <p className="text-blue-700 mb-4">
            Descarga la plantilla Excel con el formato correcto para importar partes de trabajo.
          </p>
          <button
            onClick={descargarPlantilla}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            📄 Descargar Plantilla Excel
          </button>
        </div>

        {/* Subir Archivo */}
        <div className="mb-8 p-4 bg-green-50 rounded-lg">
          <h3 className="text-lg font-semibold text-green-900 mb-3">
            📤 Paso 2: Subir Archivo Completado
          </h3>
          <p className="text-green-700 mb-4">
            Selecciona el archivo Excel que has completado con los datos de los partes.
          </p>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
          {loading && (
            <div className="mt-2 text-green-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 inline-block mr-2"></div>
              Procesando archivo...
            </div>
          )}
        </div>

        {/* Resumen de Datos */}
        {datos && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              📊 Resumen de Datos
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{datos.length}</div>
                <div className="text-sm text-gray-600">Trabajos Totales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {new Set(datos.map(d => d.numeroParte)).size}
                </div>
                <div className="text-sm text-gray-600">Partes Únicos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {new Set(datos.map(d => d.trabajador)).size}
                </div>
                <div className="text-sm text-gray-600">Trabajadores</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {datos.reduce((sum, d) => sum + d.tiempoEmpleado, 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Horas Totales</div>
              </div>
            </div>
          </div>
        )}

        {/* Errores */}
        {errores.length > 0 && (
          <div className="mb-8 p-4 bg-red-50 rounded-lg">
            <h3 className="text-lg font-semibold text-red-900 mb-3">
              ❌ Errores Encontrados ({errores.length})
            </h3>
            <div className="max-h-60 overflow-y-auto">
              {errores.map((error, index) => (
                <div key={index} className="mb-2 p-2 bg-red-100 rounded">
                  <span className="font-semibold text-red-800">Fila {error.fila}:</span>
                  <ul className="ml-4 text-red-700">
                    {error.errores.map((err, errIndex) => (
                      <li key={errIndex}>• {err}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botón de Importación */}
        {datos && errores.length === 0 && (
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-900 mb-3">
              ✅ Paso 3: Importar Datos
            </h3>
            <p className="text-yellow-700 mb-4">
              Los datos están listos para ser importados. Haz clic en el botón para proceder.
            </p>
            <button
              onClick={importarDatos}
              disabled={procesando}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                procesando
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-yellow-600 text-white hover:bg-yellow-700'
              }`}
            >
              {procesando ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Importando...
                </div>
              ) : (
                '🚀 Importar Partes de Trabajo'
              )}
            </button>
          </div>
        )}

        {/* Información Adicional */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            ℹ️ Información Importante
          </h3>
          <ul className="text-gray-700 space-y-2">
            <li>• Cada fila representa un trabajo individual de un parte</li>
            <li>• Si un parte tiene múltiples trabajos, cada trabajo va en una fila separada</li>
            <li>• Los campos Portal y Vivienda son opcionales</li>
            <li>• El tiempo empleado debe ser mayor que 0</li>
            <li>• Los datos se importarán como trabajos manuales</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ImportarPartesEmpleados;
