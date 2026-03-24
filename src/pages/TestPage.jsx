import { useEffect, useState } from 'react';
import testAuth from '../utils/testConnection';
import verificarConexion from '../utils/verificarConexion';
import verificarVariables from '../utils/verificarVariables';
import probarVicenteLogin from '../utils/probarVicenteLogin';
import probarUsuarioPrueba from '../utils/probarUsuarioPrueba';
import probarAuthDirecto from '../utils/probarAuthDirecto';
import verificarClaveApi from '../utils/verificarClaveApi';
import { solicitarReseteoContraseña } from '../utils/resetearContraseña';

function TestPage() {
  const [testCompleted, setTestCompleted] = useState(false);
  const [resetStatus, setResetStatus] = useState({});

  useEffect(() => {
    const runTest = async () => {
      try {
        // Verificar las variables de entorno
        console.log('Verificando variables de entorno...');
        const variablesOk = verificarVariables();
        console.log('Resultado de verificación de variables:', variablesOk);
        
        // Verificar la conexión básica
        console.log('Verificando conexión básica...');
        const conexionExitosa = await verificarConexion();
        console.log('Resultado de verificación de conexión:', conexionExitosa);
        
        // Probar login específico de Vicente
        console.log('Probando login específico de Vicente...');
        const loginResult = await probarVicenteLogin();
        console.log('Resultado de login específico:', loginResult);
        
        // Probar la autenticación general
        console.log('Probando autenticación general...');
        await testAuth();
        
        setTestCompleted(true);
      } catch (error) {
        console.error("Error ejecutando prueba:", error);
        setTestCompleted(true);
      }
    };

    runTest();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Prueba de Conexión con Supabase</h1>
      <p className="mb-4">Revisa la consola para ver los resultados de la prueba.</p>
      {testCompleted && (
        <div className="mt-4 p-3 bg-blue-100 rounded">
          <p>Prueba completada. Por favor revisa la consola para ver los resultados.</p>
          <div className="mt-2">
            <p className="font-semibold">Credenciales de prueba:</p>
            <ul className="list-disc pl-5 mt-1">
              <li>Email: vicente@demo.com</li>
              <li>Contraseña: vicente123</li>
            </ul>
          </div>
          <div className="mt-4 space-y-2">
            <div>
              <button 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={async () => {
                  console.log('Ejecutando prueba de login manual con Vicente...');
                  const result = await probarVicenteLogin();
                  console.log('Resultado de login manual con Vicente:', result);
                }}
              >
                Probar Login Vicente
              </button>
            </div>
            <div>
              <button 
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                onClick={async () => {
                  console.log('Ejecutando prueba de login con Usuario Prueba...');
                  const result = await probarUsuarioPrueba();
                  console.log('Resultado de login con Usuario Prueba:', result);
                }}
              >
                Probar Login Usuario Prueba
              </button>
            </div>
            <div>
              <button 
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                onClick={async () => {
                  console.log('Ejecutando prueba de autenticación directa...');
                  const result = await probarAuthDirecto();
                  console.log('Resultado de autenticación directa:', result);
                }}
              >
                Probar Auth Directa
              </button>
            </div>
            <div>
              <button 
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                onClick={async () => {
                  console.log('Verificando clave API...');
                  const result = await verificarClaveApi();
                  console.log('Resultado de verificación de clave API:', result);
                }}
              >
                Verificar Clave API
              </button>
            </div>
            <div className="mt-6 border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">Reseteo de Contraseñas</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <button 
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    onClick={async () => {
                      console.log('Solicitando reseteo para Vicente...');
                      const result = await solicitarReseteoContraseña('vicente@demo.com');
                      console.log('Resultado de solicitud de reseteo:', result);
                      setResetStatus(prev => ({ ...prev, vicente: result }));
                    }}
                  >
                    Resetear Contraseña Vicente
                  </button>
                  {resetStatus.vicente && (
                    <span className={`text-sm ${resetStatus.vicente.success ? 'text-green-600' : 'text-red-600'}`}>
                      {resetStatus.vicente.success ? '✓ Solicitud enviada' : '✗ Error'}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    onClick={async () => {
                      console.log('Solicitando reseteo para Usuario Prueba...');
                      const result = await solicitarReseteoContraseña('prueba2@demo.com');
                      console.log('Resultado de solicitud de reseteo:', result);
                      setResetStatus(prev => ({ ...prev, prueba: result }));
                    }}
                  >
                    Resetear Contraseña Usuario Prueba
                  </button>
                  {resetStatus.prueba && (
                    <span className={`text-sm ${resetStatus.prueba.success ? 'text-green-600' : 'text-red-600'}`}>
                      {resetStatus.prueba.success ? '✓ Solicitud enviada' : '✗ Error'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TestPage;
