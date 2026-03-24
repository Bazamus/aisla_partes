import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';

export default function ObrasAsignadas() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [proveedor, setProveedor] = useState(null);
  const [obrasAsignadas, setObrasAsignadas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      cargarDatosProveedor(user.id);
    }
  }, [user]);

  const cargarDatosProveedor = async (userId) => {
    try {
      setLoading(true);
      
      // 1. Buscar el proveedor por el user_id
      let { data: proveedor, error: errorProveedor } = await supabase
        .from('proveedores')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      // Si no se encuentra por user_id, buscar por email
      if (!proveedor && user?.email) {
        const { data: proveedorPorEmail, error: errorEmail } = await supabase
          .from('proveedores')
          .select('*')
          .ilike('email', user.email)
          .single();
          
        if (proveedorPorEmail && !errorEmail) {
          proveedor = proveedorPorEmail;
        }
      }
      
      if (!proveedor) {
        setError('No se encontró el proveedor asociado a tu cuenta. Por favor, contacta con el administrador.');
        setLoading(false);
        return;
      }
      
      setProveedor(proveedor);
      
      // 2. Cargar obras asignadas al proveedor
      const { data: obrasData, error: errorObras } = await supabase
        .from('proveedores_obras')
        .select(`
          id,
          proveedor_id,
          obra_id,
          obras (
            id,
            nombre_obra,
            numero_obra,
            cliente,
            estado,
            direccion
          )
        `)
        .eq('proveedor_id', proveedor.id);
        
      if (errorObras) {
        console.error('Error al cargar obras asignadas:', errorObras);
        setError('Error al cargar obras asignadas');
      } else if (obrasData) {
        const obras = obrasData.map(item => ({
          ...item.obras
        })).filter(Boolean);
        setObrasAsignadas(obras);
      }
      
    } catch (error) {
      console.error('Error general al cargar datos:', error);
      setError('Error al cargar datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar obras según el término de búsqueda
  const filteredObras = obrasAsignadas.filter(obra => 
    obra.nombre_obra?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    obra.numero_obra?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    obra.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    obra.direccion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Función para formatear el estado de la obra con color
  const getEstadoElement = (estado) => {
    if (!estado) return <span className="text-gray-400">-</span>;
    
    // Mapping de estados a colores
    const estadoColors = {
      'Pendiente': 'bg-orange-100 text-orange-800',
      'En Curso': 'bg-green-100 text-green-800',
      'Finalizada': 'bg-blue-100 text-blue-800',
      'Garantía': 'bg-yellow-100 text-yellow-800',
      'Cerrada': 'bg-gray-100 text-gray-800'
    };
    
    const colorClass = estadoColors[estado] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {estado}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 text-center">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 obras-asignadas-mobile">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Obras Asignadas</h1>
          <p className="text-sm md:text-base text-gray-600">Listado de obras asignadas a {proveedor?.razon_social}</p>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="relative">
          <input
            type="search"
            placeholder="Buscar obras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all text-base search-input"
          />
          <svg
            className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        {/* Texto de ayuda para móvil */}
        <p className="mt-2 text-xs text-gray-500 md:hidden">
          Busca por nombre, número, cliente o dirección
        </p>
      </div>

      {/* Listado de obras */}
      {filteredObras.length > 0 ? (
        <>
          {/* Vista de tabla para desktop */}
          <div className="hidden md:block bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dirección</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredObras.map((obra) => (
                    <tr key={obra.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{obra.numero_obra || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{obra.nombre_obra || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{obra.cliente || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getEstadoElement(obra.estado)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{obra.direccion || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vista de tarjetas para móvil */}
          <div className="md:hidden">
            {/* Indicador de resultados para móvil */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                {filteredObras.length} {filteredObras.length === 1 ? 'obra' : 'obras'} encontrada{filteredObras.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="space-y-4">
              {filteredObras.map((obra) => (
                <div key={obra.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm obra-card">
                  {/* Header con número y estado */}
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-indigo-600 break-words leading-tight obra-title">
                        {obra.nombre_obra || 'Sin nombre'}
                      </h3>
                      <div className="ml-2 flex-shrink-0">
                        {getEstadoElement(obra.estado)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 font-mono obra-number">
                      Número: {obra.numero_obra || 'N/A'}
                    </p>
                  </div>
                  
                  {/* Información de la obra */}
                  <div className="space-y-3 obra-info">
                    <div className="flex justify-between items-start obra-info-row">
                      <span className="text-gray-500 text-sm obra-info-label">Cliente:</span>
                      <span className="font-medium text-sm text-gray-900 break-words text-right obra-info-value">
                        {obra.cliente || 'Sin cliente'}
                      </span>
                    </div>
                    {obra.direccion && (
                      <div className="flex justify-between items-start obra-info-row">
                        <span className="text-gray-500 text-sm obra-info-label">Dirección:</span>
                        <span className="font-medium text-sm text-gray-900 break-words text-right obra-info-value">
                          {obra.direccion}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No hay obras asignadas</h3>
          <p className="text-gray-500">
            No se encontraron obras asignadas a este proveedor{searchTerm ? ' con los criterios de búsqueda actuales' : ''}.
          </p>
        </div>
      )}
    </div>
  );
}
