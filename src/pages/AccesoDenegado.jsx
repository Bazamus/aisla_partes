import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AccesoDenegado() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 max-w-md bg-white rounded-lg shadow-xl">
        <div className="flex justify-center">
          <svg className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="mt-6 text-2xl font-bold text-center text-gray-900">Acceso Denegado</h3>
        <p className="mt-4 text-gray-600 text-center">
          No tienes los permisos necesarios para acceder a esta sección.
        </p>
        <p className="mt-2 text-gray-500 text-center text-sm">
          Si crees que deberías tener acceso, contacta al administrador del sistema.
        </p>
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Volver al inicio
          </button>
          {!user && (
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Iniciar sesión
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
