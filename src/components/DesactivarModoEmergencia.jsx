import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

export default function DesactivarModoEmergencia() {
  const { verificarYCorregirPermisos, hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [canDisable, setCanDisable] = useState(false);
  
  const handleVerificarPermisos = async () => {
    setLoading(true);
    try {
      // Verificar si el usuario tiene permisos de superadmin
      if (!hasRole('superadmin')) {
        toast.error('Necesitas ser superadmin para realizar esta acción');
        return;
      }
      
      const result = await verificarYCorregirPermisos();
      setTestResults(result.testResults);
      setCanDisable(result.success);
      
      if (result.success) {
        toast.success('Verificación completada con éxito. Puedes desactivar el modo de emergencia.');
      } else {
        toast.error('Se encontraron problemas con los permisos. Revisa los resultados.');
      }
    } catch (error) {
      console.error('Error al verificar permisos:', error);
      toast.error('Error al verificar permisos');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDesactivarModoEmergencia = async () => {
    setLoading(true);
    try {
      // Verificar nuevamente los permisos antes de desactivar
      const result = await verificarYCorregirPermisos();
      
      if (!result.success) {
        toast.error('No se puede desactivar el modo de emergencia debido a problemas de permisos');
        return;
      }
      
      // Aquí deberíamos modificar los archivos para desactivar el modo de emergencia
      // Esto requiere una acción manual del desarrollador
      
      toast.success('Para desactivar el modo de emergencia, cambia EMERGENCY_MODE a false en los archivos AuthContext.jsx y GestionRoles.jsx');
      
      // Registrar la acción en la auditoría
      await supabase.from('auditoria').insert({
        accion: 'Verificación para desactivar modo de emergencia',
        detalles: 'Se verificaron los permisos para desactivar el modo de emergencia',
        tabla: 'sistema',
        user_id: supabase.auth.getUser()?.data?.user?.id,
        user_email: supabase.auth.getUser()?.data?.user?.email
      });
    } catch (error) {
      console.error('Error al desactivar modo de emergencia:', error);
      toast.error('Error al desactivar modo de emergencia');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto my-8">
      <h2 className="text-2xl font-bold text-blue-700 mb-6">Desactivar Modo de Emergencia</h2>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Advertencia:</strong> Desactivar el modo de emergencia puede causar problemas si los permisos en la base de datos no están configurados correctamente. Asegúrate de verificar los permisos antes de desactivarlo.
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={handleVerificarPermisos}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
        >
          {loading ? 'Verificando...' : 'Verificar Permisos'}
        </button>
        
        {testResults && (
          <div className="mt-4 border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prueba</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resultado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {testResults.map((test, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{test.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {test.success ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Éxito
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Error
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{test.error || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {canDisable && (
          <button
            onClick={handleDesactivarModoEmergencia}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 mt-4"
          >
            {loading ? 'Procesando...' : 'Desactivar Modo de Emergencia'}
          </button>
        )}
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Instrucciones para desactivar manualmente:</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Abre el archivo <code className="bg-gray-200 px-1 rounded">src/contexts/AuthContext.jsx</code></li>
          <li>Cambia <code className="bg-gray-200 px-1 rounded">const EMERGENCY_MODE = true;</code> a <code className="bg-gray-200 px-1 rounded">const EMERGENCY_MODE = false;</code></li>
          <li>Abre el archivo <code className="bg-gray-200 px-1 rounded">src/pages/GestionRoles.jsx</code></li>
          <li>Cambia <code className="bg-gray-200 px-1 rounded">const EMERGENCY_MODE = true;</code> a <code className="bg-gray-200 px-1 rounded">const EMERGENCY_MODE = false;</code></li>
          <li>Guarda los archivos y reinicia la aplicación</li>
        </ol>
      </div>
    </div>
  );
}
