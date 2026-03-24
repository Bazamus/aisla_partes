import React, { useState } from 'react';
import { testGenerarPdfEmpleado, testGenerarPdfEmpleadoSinTrabajos, ejecutarTodasLasPruebas } from '../test/testPdfEmpleado.js';

const TestPdfPage = () => {
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [mensaje, setMensaje] = useState('');

  const ejecutarPrueba = async (tipoPrueba) => {
    setLoading(true);
    setMensaje('');
    
    try {
      let resultado;
      
      switch (tipoPrueba) {
        case 'completo':
          resultado = await testGenerarPdfEmpleado();
          break;
        case 'sin-trabajos':
          resultado = await testGenerarPdfEmpleadoSinTrabajos();
          break;
        case 'todas':
          resultado = await ejecutarTodasLasPruebas();
          break;
        default:
          throw new Error('Tipo de prueba no válido');
      }
      
      if (tipoPrueba === 'todas') {
        setResultados(resultado);
        const exitosas = resultado.filter(r => r.success).length;
        setMensaje(`Pruebas completadas: ${exitosas}/${resultado.length} exitosas`);
      } else {
        setResultados([{ prueba: tipoPrueba, ...resultado }]);
        setMensaje(resultado.success ? resultado.message : `Error: ${resultado.error}`);
      }
    } catch (error) {
      console.error('Error ejecutando prueba:', error);
      setMensaje(`Error: ${error.message}`);
      setResultados([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              🧪 Pruebas de Plantilla PDF - Partes de Empleado
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Herramienta para probar y validar la nueva plantilla PDF rediseñada
            </p>
          </div>

          <div className="p-6">
            {/* Botones de prueba */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <button
                onClick={() => ejecutarPrueba('completo')}
                disabled={loading}
                className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                PDF Completo
              </button>

              <button
                onClick={() => ejecutarPrueba('sin-trabajos')}
                disabled={loading}
                className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                PDF Sin Trabajos
              </button>

              <button
                onClick={() => ejecutarPrueba('todas')}
                disabled={loading}
                className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                Ejecutar Todas
              </button>
            </div>

            {/* Mensaje de estado */}
            {mensaje && (
              <div className={`mb-6 p-4 rounded-md ${
                mensaje.includes('Error') 
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-green-50 border border-green-200 text-green-700'
              }`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {mensaje.includes('Error') ? (
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{mensaje}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Resultados */}
            {resultados.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Resultados de las Pruebas</h3>
                <div className="space-y-3">
                  {resultados.map((resultado, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-md ${
                        resultado.success
                          ? 'bg-green-100 border border-green-200'
                          : 'bg-red-100 border border-red-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          resultado.success
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {resultado.success ? '✅ ÉXITO' : '❌ ERROR'}
                        </span>
                        <span className="ml-3 text-sm font-medium text-gray-900">
                          {resultado.prueba}
                        </span>
                      </div>
                      {resultado.fileName && (
                        <span className="text-xs text-gray-500">
                          {resultado.fileName}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Información sobre las mejoras */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                🎯 Mejoras Implementadas en la Plantilla PDF
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Desglose detallado de trabajos:</strong> Tabla con portal/vivienda, descripción, tiempo y observaciones</li>
                <li>• <strong>Integración de imágenes:</strong> Las imágenes se muestran en el mismo documento con paginación inteligente</li>
                <li>• <strong>Firma integrada:</strong> La firma se incluye en el documento principal con información del trabajador</li>
                <li>• <strong>Tiempo total calculado:</strong> Se obtiene automáticamente de la base de datos usando RPC</li>
                <li>• <strong>Diseño profesional:</strong> Bloques bien definidos con colores corporativos y tipografía clara</li>
                <li>• <strong>Manejo de casos vacíos:</strong> Mensajes informativos cuando no hay trabajos o imágenes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPdfPage;
