import React, { useState } from 'react';
import { 
  generarPlantillaPartesEmpleados, 
  validarDatosPartesEmpleados 
} from '../../templates/plantilla_partes_empleados';
import { 
  generarPlantillaPartesProveedores, 
  validarDatosPartesProveedores 
} from '../../templates/plantilla_partes_proveedores';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const ImportarPartesTrabajo = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tipoParte, setTipoParte] = useState('empleados'); // 'empleados' o 'proveedores'
  const [validationErrors, setValidationErrors] = useState([]);
  const [importResults, setImportResults] = useState(null);

  // Descargar plantilla de empleados
  const descargarPlantillaEmpleados = () => {
    try {
      generarPlantillaPartesEmpleados();
      toast.success('Plantilla de empleados descargada correctamente');
    } catch (error) {
      console.error('Error al generar plantilla de empleados:', error);
      toast.error('Error al descargar plantilla de empleados');
    }
  };

  // Descargar plantilla de proveedores
  const descargarPlantillaProveedores = () => {
    try {
      generarPlantillaPartesProveedores();
      toast.success('Plantilla de proveedores descargada correctamente');
    } catch (error) {
      console.error('Error al generar plantilla de proveedores:', error);
      toast.error('Error al descargar plantilla de proveedores');
    }
  };

  // Manejar selección de archivo
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setValidationErrors([]);
      setImportResults(null);
    }
  };

  // Procesar archivo Excel
  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast.error('Por favor, selecciona un archivo');
      return;
    }

    setLoading(true);
    setValidationErrors([]);
    setImportResults(null);

    try {
      const data = await readExcelFile(selectedFile);
      
      if (tipoParte === 'empleados') {
        await procesarPartesEmpleados(data);
      } else {
        await procesarPartesProveedores(data);
      }
    } catch (error) {
      console.error('Error al procesar archivo:', error);
      toast.error('Error al procesar el archivo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Leer archivo Excel
  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Convertir a array de objetos
          const headers = jsonData[0];
          const rows = jsonData.slice(1);
          const result = rows.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          });
          
          resolve(result);
        } catch (error) {
          reject(new Error('Error al leer el archivo Excel'));
        }
      };
      
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Procesar partes de empleados
  const procesarPartesEmpleados = async (data) => {
    const validation = validarDatosPartesEmpleados(data);
    
    if (!validation.valido) {
      setValidationErrors(validation.errores);
      toast.error(`Se encontraron ${validation.errores.length} errores de validación`);
      return;
    }

    try {
      let partesCreados = 0;
      let errores = [];

      for (const fila of validation.datosValidos) {
        try {
          // Crear el parte
          const numeroParte = await generateParteNumber(supabase);
          const parteId = crypto.randomUUID();

          const { error: parteError } = await supabase
            .from('partes')
            .insert([{
              id: parteId,
              numero_parte: numeroParte,
              nombre_obra: fila['Obra'] || '',
              nombre_trabajador: fila['Trabajador'] || '',
              email_contacto: '',
              fecha: fila['Fecha'] || new Date().toISOString().slice(0, 10),
              estado: fila['Estado del Parte'] || 'Borrador',
              notas: '',
              firma: '',
              imagenes: [],
              cliente: fila['Cliente'] || '',
              codigo_empleado: 'SIN_CODIGO',
              user_id: null,
              id_obra: null,
              coste_trabajos: 0,
              coste_empresa: 0,
              otros_trabajos: ''
            }]);

          if (parteError) {
            errores.push(`Error al crear parte ${numeroParte}: ${parteError.message}`);
            continue;
          }

          // Crear el trabajo
          const { error: trabajoError } = await supabase
            .from('partes_empleados_trabajos')
            .insert([{
              parte_id: parteId,
              descripcion: fila['Trabajos Realizados'] || '',
              tiempo_empleado: fila['Tiempo Empleado'] || 0,
              observaciones: '',
              tipo_trabajo: 'importado',
              portal: fila['Portal'] || '',
              vivienda: fila['Vivienda'] || '',
              cantidad: 1
            }]);

          if (trabajoError) {
            errores.push(`Error al crear trabajo para parte ${numeroParte}: ${trabajoError.message}`);
            continue;
          }

          partesCreados++;
        } catch (error) {
          errores.push(`Error procesando fila: ${error.message}`);
        }
      }

      setImportResults({
        total: validation.datosValidos.length,
        creados: partesCreados,
        errores: errores
      });

      if (partesCreados > 0) {
        toast.success(`Se importaron ${partesCreados} partes de empleados correctamente`);
      }
      if (errores.length > 0) {
        toast.error(`Se encontraron ${errores.length} errores durante la importación`);
      }
    } catch (error) {
      console.error('Error en procesarPartesEmpleados:', error);
      toast.error('Error al procesar partes de empleados: ' + error.message);
    }
  };

  // Procesar partes de proveedores
  const procesarPartesProveedores = async (data) => {
    const validation = validarDatosPartesProveedores(data);
    
    if (!validation.valido) {
      setValidationErrors(validation.errores);
      toast.error(`Se encontraron ${validation.errores.length} errores de validación`);
      return;
    }

    try {
      let partesCreados = 0;
      let errores = [];

      // Agrupar por número de parte
      const partesAgrupados = {};
      validation.datosValidos.forEach(fila => {
        const numeroParte = fila['Nº PARTE'];
        if (!partesAgrupados[numeroParte]) {
          partesAgrupados[numeroParte] = {
            datos: fila,
            trabajos: []
          };
        }
        partesAgrupados[numeroParte].trabajos.push({
          descripcion: fila['TRABAJO'],
          cantidad: fila['CANTIDAD'],
          precio_unitario: fila['PRECIO_UNITARIO'],
          descuento: fila['DESCUENTO'],
          total: fila['TOTAL']
        });
      });

      for (const [numeroParte, parteData] of Object.entries(partesAgrupados)) {
        try {
          const numeroParteGenerado = await generateParteNumber(supabase, 'proveedor');
          
          const parteProveedor = {
            fecha: parteData.datos['FECHA'],
            cliente: 'Cliente Importado',
            codigo_proveedor: parteData.datos['COD.PROVEEDOR'],
            empresa: parteData.datos['RAZON SOCIAL'],
            cif: parteData.datos['CIF'] || '',
            email: parteData.datos['Email'] || '',
            telefono: '',
            trabajos: [{
              nombre: 'Trabajos Importados',
              lineas: parteData.trabajos.map(trabajo => ({
                descripcion: trabajo.descripcion,
                cantidad: trabajo.cantidad,
                precio_unitario: trabajo.precio_unitario,
                descuento: trabajo.descuento,
                total: trabajo.total
              }))
            }],
            imagenes: [],
            firma: null,
            coste_total: parteData.trabajos.reduce((sum, t) => sum + t.total, 0),
            estado: 'Borrador',
            numero_parte: numeroParteGenerado
          };

          const parteGuardado = await createParteProveedor(parteProveedor);
          if (parteGuardado) {
            partesCreados++;
          }
        } catch (error) {
          errores.push(`Error procesando parte ${numeroParte}: ${error.message}`);
        }
      }

      setImportResults({
        total: Object.keys(partesAgrupados).length,
        creados: partesCreados,
        errores: errores
      });

      if (partesCreados > 0) {
        toast.success(`Se importaron ${partesCreados} partes de proveedores correctamente`);
      }
      if (errores.length > 0) {
        toast.error(`Se encontraron ${errores.length} errores durante la importación`);
      }
    } catch (error) {
      console.error('Error en procesarPartesProveedores:', error);
      toast.error('Error al procesar partes de proveedores: ' + error.message);
    }
  };

  // Función auxiliar para generar número de parte
  const generateParteNumber = async (supabase, tipo = 'empleado') => {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    
    const prefix = tipo === 'proveedor' ? 'PP' : 'P';
    
    // Obtener el último número del mes actual
    const { data: ultimoParte } = await supabase
      .from(tipo === 'proveedor' ? 'partes_proveedores' : 'partes')
      .select('numero_parte')
      .like('numero_parte', `${prefix}-${año}-${mes}%`)
      .order('numero_parte', { ascending: false })
      .limit(1);

    let siguienteNumero = 1;
    if (ultimoParte && ultimoParte.length > 0) {
      const ultimoNumero = parseInt(ultimoParte[0].numero_parte.split('-')[3]);
      siguienteNumero = ultimoNumero + 1;
    }

    return `${prefix}-${año}-${mes}-${String(siguienteNumero).padStart(3, '0')}`;
  };

  // Función auxiliar para crear parte de proveedor
  const createParteProveedor = async (parteData) => {
    try {
      const { data, error } = await supabase
        .from('partes_proveedores')
        .insert([parteData])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error al crear parte de proveedor:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              📥 Importar Partes de Trabajo
            </h1>
            <p className="text-gray-600 mt-1">
              Importa partes de trabajo de empleados y proveedores desde archivos Excel
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Selector de tipo de parte */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-900 mb-3">
                🎯 Seleccionar Tipo de Parte
              </h3>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="empleados"
                    checked={tipoParte === 'empleados'}
                    onChange={(e) => setTipoParte(e.target.value)}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-blue-800 font-medium">Partes de Empleados</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="proveedores"
                    checked={tipoParte === 'proveedores'}
                    onChange={(e) => setTipoParte(e.target.value)}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-blue-800 font-medium">Partes de Proveedores</span>
                </label>
              </div>
            </div>

            {/* Descarga de plantillas */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-green-900 mb-3">
                📋 Descargar Plantillas
              </h3>
              <div className="flex space-x-4">
                <button
                  onClick={descargarPlantillaEmpleados}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  📥 Plantilla Empleados
                </button>
                <button
                  onClick={descargarPlantillaProveedores}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  📥 Plantilla Proveedores
                </button>
              </div>
              <p className="text-green-700 text-sm mt-2">
                Descarga la plantilla correspondiente, complétala con tus datos y súbela aquí
              </p>
            </div>

            {/* Información de la plantilla seleccionada */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-yellow-900 mb-2">
                📊 Información de la Plantilla
              </h3>
              {tipoParte === 'empleados' ? (
                <div className="text-yellow-800 text-sm">
                  <p><strong>Campos de la plantilla de empleados:</strong></p>
                  <p>Fecha | Nº de Parte | Estado del Parte | Trabajador | Cliente | Obra | Portal | Vivienda | Trabajos Realizados | Tiempo Empleado</p>
                </div>
              ) : (
                <div className="text-yellow-800 text-sm">
                  <p><strong>Campos de la plantilla de proveedores:</strong></p>
                  <p>FECHA | Nº PARTE | COD.PROVEEDOR | RAZON SOCIAL | Email | CIF | OBRA | PORTAL | VIVIENDA | TRABAJO | CANTIDAD | PRECIO UNITARIO | DESCUENTO | TOTAL</p>
                </div>
              )}
            </div>

            {/* Subida de archivo */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                📁 Subir Archivo Excel
              </h3>
              <div className="space-y-4">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <button
                  onClick={handleFileUpload}
                  disabled={!selectedFile || loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Procesando...' : '📤 Procesar Archivo'}
                </button>
              </div>
            </div>

            {/* Errores de validación */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-red-900 mb-3">
                  ❌ Errores de Validación
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {validationErrors.map((error, index) => (
                    <div key={index} className="text-red-700 text-sm">
                      {typeof error === 'string' ? (
                        <p>• {error}</p>
                      ) : (
                        <div>
                          <p className="font-medium">Fila {error.fila}:</p>
                          <ul className="ml-4">
                            {error.errores.map((err, errIndex) => (
                              <li key={errIndex}>• {err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resultados de importación */}
            {importResults && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-green-900 mb-3">
                  ✅ Resultados de la Importación
                </h3>
                <div className="space-y-2">
                  <p className="text-green-800">
                    <strong>Total procesados:</strong> {importResults.total}
                  </p>
                  <p className="text-green-800">
                    <strong>Partes creados:</strong> {importResults.creados}
                  </p>
                  {importResults.errores.length > 0 && (
                    <div>
                      <p className="text-red-700 font-medium">Errores encontrados:</p>
                      <div className="max-h-40 overflow-y-auto">
                        {importResults.errores.map((error, index) => (
                          <p key={index} className="text-red-600 text-sm">• {error}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportarPartesTrabajo;
