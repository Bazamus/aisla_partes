import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

export default function VerificadorPermisos() {
  const { verificarYCorregirPermisos, hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState(null);
  const [ejecutandoScript, setEjecutandoScript] = useState(false);

  const verificarPermisos = async () => {
    try {
      setLoading(true);
      const resultado = await verificarYCorregirPermisos();
      setResultados(resultado);
      
      if (resultado.success) {
        toast.success('Verificación de permisos completada con éxito');
      } else {
        toast.error('Se encontraron problemas en la verificación de permisos');
      }
    } catch (error) {
      console.error('Error al verificar permisos:', error);
      toast.error('Error al verificar permisos');
    } finally {
      setLoading(false);
    }
  };

  const ejecutarScriptSQL = async (scriptName) => {
    try {
      setEjecutandoScript(true);
      
      // Verificar si el usuario tiene permisos de superadmin
      if (!await hasRole('superadmin')) {
        toast.error('Necesitas ser superadmin para ejecutar scripts SQL');
        return;
      }
      
      let scriptSQL = '';
      
      // Determinar qué script ejecutar
      if (scriptName === 'politicas') {
        // Ejecutar script de políticas de acceso
        const { data, error } = await supabase.rpc('ejecutar_script_politicas_acceso');
        
        if (error) {
          throw error;
        }
        
        toast.success('Script de políticas de acceso ejecutado correctamente');
      } else if (scriptName === 'roles') {
        // Ejecutar script de verificación de roles
        const { data, error } = await supabase.rpc('ejecutar_script_verificar_roles');
        
        if (error) {
          throw error;
        }
        
        toast.success('Script de verificación de roles ejecutado correctamente');
      } else {
        toast.error('Script no reconocido');
      }
      
      // Verificar permisos después de ejecutar el script
      await verificarPermisos();
    } catch (error) {
      console.error(`Error al ejecutar script ${scriptName}:`, error);
      toast.error(`Error al ejecutar script: ${error.message}`);
    } finally {
      setEjecutandoScript(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Verificador de Permisos</h2>
      
      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          Esta herramienta verifica y corrige problemas de permisos en el sistema.
          Utilízala si experimentas problemas de acceso o permisos denegados.
        </p>
        
        <button
          onClick={verificarPermisos}
          disabled={loading}
          className={`${
            loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          } text-white font-medium py-2 px-4 rounded-md transition duration-200 mr-3`}
        >
          {loading ? 'Verificando...' : 'Verificar Permisos'}
        </button>
        
        <button
          onClick={() => ejecutarScriptSQL('politicas')}
          disabled={ejecutandoScript}
          className={`${
            ejecutandoScript ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'
          } text-white font-medium py-2 px-4 rounded-md transition duration-200 mr-3 mt-3 md:mt-0`}
        >
          {ejecutandoScript ? 'Ejecutando...' : 'Corregir Políticas de Acceso'}
        </button>
        
        <button
          onClick={() => ejecutarScriptSQL('roles')}
          disabled={ejecutandoScript}
          className={`${
            ejecutandoScript ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'
          } text-white font-medium py-2 px-4 rounded-md transition duration-200 mt-3 md:mt-0`}
        >
          {ejecutandoScript ? 'Ejecutando...' : 'Verificar Roles'}
        </button>
      </div>
      
      {resultados && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Resultados de la Verificación</h3>
          
          <div className={`p-4 rounded-md ${resultados.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <p className="font-medium">{resultados.message}</p>
          </div>
          
          {resultados.testResults && (
            <div className="mt-4">
              <h4 className="text-md font-medium text-gray-700 mb-2">Pruebas realizadas:</h4>
              <ul className="space-y-2">
                {resultados.testResults.map((test, index) => (
                  <li key={index} className="flex items-start">
                    <span className={`inline-block w-5 h-5 rounded-full flex-shrink-0 ${test.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} flex items-center justify-center mr-2`}>
                      {test.success ? '✓' : '✗'}
                    </span>
                    <div>
                      <span className="font-medium">{test.name}: </span>
                      <span>{test.success ? 'Correcto' : 'Error'}</span>
                      {!test.success && test.error && (
                        <p className="text-sm text-red-600 mt-1">{test.error}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
