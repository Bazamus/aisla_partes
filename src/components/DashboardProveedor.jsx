import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function DashboardProveedor() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [proveedor, setProveedor] = useState(null);
  const [obrasAsignadas, setObrasAsignadas] = useState([]);
  const [partesPendientes, setPartesPendientes] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    totalPartes: 0,
    partesAprobados: 0,
    partesPendientes: 0,
    obrasActivas: 0
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      cargarDatosProveedor(user.id);
    }
  }, [user]);

  const cargarDatosProveedor = async (userId) => {
    try {
      setLoading(true);
      console.log('Iniciando carga de datos para el usuario:', userId);
      
      // 1. Buscar el proveedor por el user_id
      let { data: proveedor, error: errorProveedor } = await supabase
        .from('proveedores')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      console.log('Búsqueda por user_id:', { proveedor, error: errorProveedor?.message });
      
      // Si no se encuentra por user_id, buscar por email
      if (!proveedor && user?.email) {
        console.log('Proveedor no encontrado por user_id, buscando por email:', user.email);
        
        try {
          // Buscar proveedor que coincida con el email del usuario
          const { data: proveedorPorEmail, error: errorEmail } = await supabase
            .from('proveedores')
            .select('*')
            .ilike('email', user.email)
            .single();
            
          console.log('Búsqueda por email:', { proveedorPorEmail, error: errorEmail?.message });
            
          if (proveedorPorEmail && !errorEmail) {
            proveedor = proveedorPorEmail;
            console.log('Proveedor encontrado por email:', proveedor);
            
            // Actualizar el user_id en el proveedor si no está establecido
            if (!proveedor.user_id) {
              console.log('Actualizando user_id en proveedor:', proveedor.id);
              const { error: errorUpdate } = await supabase
                .from('proveedores')
                .update({ user_id: userId })
                .eq('id', proveedor.id);
                
              if (errorUpdate) {
                console.error('Error al actualizar user_id en proveedor:', errorUpdate);
              } else {
                console.log('user_id actualizado correctamente');
              }
            }
          }
        } catch (emailError) {
          console.error('Error al buscar por email:', emailError);
        }
      }
      
      if (errorProveedor && !proveedor) {
        console.error('Error al cargar datos del proveedor:', errorProveedor);
        setError('Error al cargar datos del proveedor: ' + errorProveedor.message);
        return;
      }
      
      if (!proveedor) {
        console.error('No se encontró el proveedor asociado a la cuenta:', userId);
        setError('No se encontró el proveedor asociado a tu cuenta. Por favor, contacta con el administrador.');
        return;
      }
      
      console.log('Proveedor encontrado:', proveedor);
      setProveedor(proveedor);
      
      try {
        // 2. Cargar obras asignadas al proveedor
        console.log('Cargando obras para el proveedor:', proveedor.id);
        const { data: obrasData, error: errorObras } = await supabase
          .from('proveedores_obras')
          .select(`
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
          
        console.log('Resultado de carga de obras:', { obrasData, error: errorObras?.message });
        
        if (errorObras) {
          console.error('Error al cargar obras asignadas:', errorObras);
        } else if (obrasData) {
          const obras = obrasData.map(item => item.obras).filter(Boolean);
          console.log('Obras procesadas:', obras);
          setObrasAsignadas(obras);
          
          // Actualizar estadísticas
          setEstadisticas(prev => ({
            ...prev,
            obrasActivas: obras.filter(obra => obra.estado === 'En Curso').length
          }));
        }
      } catch (obrasError) {
        console.error('Error en el bloque de carga de obras:', obrasError);
      }
      
      try {
        // 3. Cargar partes de trabajo del proveedor
        console.log('Cargando partes para el proveedor:', proveedor.id);
        
        // Verificar si la tabla partes_proveedores existe y qué columnas tiene
        const { data: columnasPartes, error: errorColumnas } = await supabase
          .rpc('get_table_columns', { table_name: 'partes_proveedores' });
          
        console.log('Columnas de partes_proveedores:', { columnasPartes, error: errorColumnas?.message });
        
        // Determinar qué columna usar para filtrar
        const tieneProveedorId = columnasPartes?.some(col => col.column_name === 'proveedor_id');
        const tieneCreadorId = columnasPartes?.some(col => col.column_name === 'creado_por');
        
        console.log('Análisis de columnas:', { tieneProveedorId, tieneCreadorId });
        
        let query = supabase
          .from('partes_proveedores')
          .select(`
            id, 
            fecha, 
            estado, 
            obra_id
          `)
          .order('fecha', { ascending: false });
          
        if (tieneProveedorId) {
          query = query.eq('proveedor_id', proveedor.id);
        } else if (tieneCreadorId) {
          query = query.eq('creado_por', userId);
        } else {
          // Si no existe ninguna de las columnas, intentar otra estrategia
          console.log('No se encontraron columnas adecuadas para filtrar partes');
        }
        
        const { data: partes, error: errorPartes } = await query;
        
        console.log('Resultado de carga de partes:', { partes, error: errorPartes?.message });
        
        if (errorPartes) {
          console.error('Error al cargar partes:', errorPartes);
        } else if (partes) {
          setPartesPendientes(partes.filter(parte => parte.estado === 'pendiente'));
          
          // Actualizar estadísticas
          setEstadisticas(prev => ({
            ...prev,
            totalPartes: partes.length,
            partesAprobados: partes.filter(parte => parte.estado === 'aprobado').length,
            partesPendientes: partes.filter(parte => parte.estado === 'pendiente').length
          }));
        }
      } catch (partesError) {
        console.error('Error en el bloque de carga de partes:', partesError);
      }
      
    } catch (error) {
      console.error('Error general al cargar datos:', error);
      // Mostrar información detallada del error
      let mensajeError = 'Error al cargar datos';
      if (error.message) {
        mensajeError += ': ' + error.message;
      }
      if (error.details) {
        mensajeError += ' - ' + error.details;
      }
      setError(mensajeError);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return fecha;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!proveedor) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 text-center">
        <p className="text-gray-500">No se encontraron datos de proveedor asociados a tu cuenta.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabecera con información del proveedor */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Bienvenido, {proveedor.razon_social}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600"><span className="font-medium">CIF:</span> {proveedor.cif || '-'}</p>
            <p className="text-sm text-gray-600"><span className="font-medium">Contacto:</span> {proveedor.persona_contacto || '-'}</p>
            <p className="text-sm text-gray-600"><span className="font-medium">Email:</span> {proveedor.email || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600"><span className="font-medium">Teléfono:</span> {proveedor.telefono || '-'}</p>
            <p className="text-sm text-gray-600"><span className="font-medium">Dirección:</span> {proveedor.direccion || '-'}</p>
            <p className="text-sm text-gray-600"><span className="font-medium">Código:</span> {proveedor.codigo || '-'}</p>
          </div>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-medium text-blue-800 mb-1">Total Partes</h3>
          <p className="text-2xl font-bold text-blue-600">{estadisticas.totalPartes}</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-medium text-green-800 mb-1">Partes Aprobados</h3>
          <p className="text-2xl font-bold text-green-600">{estadisticas.partesAprobados}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-medium text-yellow-800 mb-1">Partes Pendientes</h3>
          <p className="text-2xl font-bold text-yellow-600">{estadisticas.partesPendientes}</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-medium text-indigo-800 mb-1">Obras Activas</h3>
          <p className="text-2xl font-bold text-indigo-600">{estadisticas.obrasActivas}</p>
        </div>
      </div>

      {/* Partes pendientes */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Partes Pendientes</h2>
        </div>
        <div className="overflow-x-auto">
          {partesPendientes.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Obra</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {partesPendientes.map((parte) => (
                  <tr key={parte.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{parte.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatearFecha(parte.fecha)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{parte.obras?.nombre_obra || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Pendiente
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No hay partes pendientes
            </div>
          )}
        </div>
      </div>

      {/* Obras asignadas */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Obras Asignadas</h2>
        </div>
        <div className="overflow-x-auto">
          {obrasAsignadas.length > 0 ? (
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
                {obrasAsignadas.map((obra) => (
                  <tr key={obra.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{obra.numero_obra}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{obra.nombre_obra}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{obra.cliente || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        obra.estado === 'Pendiente' ? 'bg-orange-100 text-orange-800' :
                        obra.estado === 'En Curso' ? 'bg-green-100 text-green-800' : 
                        obra.estado === 'Finalizada' ? 'bg-blue-100 text-blue-800' : 
                        obra.estado === 'Garantía' ? 'bg-yellow-100 text-yellow-800' : 
                        obra.estado === 'Cerrada' ? 'bg-gray-100 text-gray-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {obra.estado || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{obra.direccion || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No hay obras asignadas
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
