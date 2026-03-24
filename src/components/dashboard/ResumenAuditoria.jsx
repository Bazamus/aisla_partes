import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ClipboardDocumentListIcon, 
  ArrowPathIcon,
  UserIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { RoleGuard } from '../auth/PermissionGuard';

const ResumenAuditoria = () => {
  const [loading, setLoading] = useState(true);
  const [actividadReciente, setActividadReciente] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    totalHoy: 0,
    totalSemana: 0,
    loginHoy: 0,
    usuariosActivos: 0
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar actividad reciente
      const { data: actividad, error: errorActividad } = await supabase
        .from('auditoria')
        .select(`
          id,
          accion,
          tabla,
          registro_id,
          user_id,
          detalles,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (errorActividad) throw errorActividad;
      
      setActividadReciente(actividad || []);
      
      // Calcular fechas para estadísticas
      const ahora = new Date();
      const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).toISOString();
      const inicioSemana = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 7).toISOString();
      
      // Obtener estadísticas
      const [
        { count: totalHoy },
        { count: totalSemana },
        { count: loginHoy }
      ] = await Promise.all([
        // Total de acciones hoy
        supabase
          .from('auditoria')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', inicioHoy),
        
        // Total de acciones esta semana
        supabase
          .from('auditoria')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', inicioSemana),
        
        // Total de logins hoy
        supabase
          .from('auditoria')
          .select('id', { count: 'exact', head: true })
          .eq('accion', 'login')
          .gte('created_at', inicioHoy)
      ]);
      
      // Obtener usuarios activos hoy (distintos)
      const { data: usuariosActivos } = await supabase
        .from('auditoria')
        .select('user_id')
        .gte('created_at', inicioHoy);
      
      // Contar usuarios únicos
      const usuariosUnicos = new Set();
      if (usuariosActivos) {
        usuariosActivos.forEach(item => {
          if (item.user_id) {
            usuariosUnicos.add(item.user_id);
          }
        });
      }
      
      setEstadisticas({
        totalHoy: totalHoy || 0,
        totalSemana: totalSemana || 0,
        loginHoy: loginHoy || 0,
        usuariosActivos: usuariosUnicos.size
      });
      
    } catch (error) {
      console.error('Error al cargar datos de auditoría:', error);
    } finally {
      setLoading(false);
    }
  };

  // Formatear fecha
  const formatearFecha = (fechaStr) => {
    try {
      const fecha = new Date(fechaStr);
      return format(fecha, "d 'de' MMMM, HH:mm", { locale: es });
    } catch (error) {
      return fechaStr;
    }
  };

  // Obtener ID corto del usuario
  const getUsuarioIdCorto = (userId) => {
    return userId ? `Usuario ID: ${userId.substring(0, 8)}...` : 'Usuario desconocido';
  };

  // Obtener descripción de la acción
  const getDescripcionAccion = (accion) => {
    switch (accion) {
      case 'login':
        return 'Inicio de sesión';
      case 'logout':
        return 'Cierre de sesión';
      case 'actualizar_perfil':
        return 'Actualización de perfil';
      case 'cambiar_contraseña':
        return 'Cambio de contraseña';
      case 'crear':
        return 'Creación de registro';
      case 'editar':
        return 'Edición de registro';
      case 'eliminar':
        return 'Eliminación de registro';
      case 'asignar_rol':
        return 'Asignación de rol';
      case 'revocar_rol':
        return 'Revocación de rol';
      default:
        return accion;
    }
  };

  // Obtener color según la acción
  const getColorByAccion = (accion) => {
    switch (accion) {
      case 'login':
        return 'bg-green-100 text-green-800';
      case 'logout':
        return 'bg-yellow-100 text-yellow-800';
      case 'actualizar_perfil':
      case 'cambiar_contraseña':
        return 'bg-blue-100 text-blue-800';
      case 'crear':
        return 'bg-indigo-100 text-indigo-800';
      case 'editar':
        return 'bg-purple-100 text-purple-800';
      case 'eliminar':
        return 'bg-red-100 text-red-800';
      case 'asignar_rol':
      case 'revocar_rol':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <RoleGuard requiredRole="admin">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Registro de Auditoría
          </h3>
          
          <div className="flex items-center">
            <button
              onClick={cargarDatos}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Recargar datos"
            >
              <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <Link
              to="/auditoria"
              className="ml-4 px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 transition-colors"
            >
              Ver completo
            </Link>
          </div>
        </div>
        
        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b border-gray-200">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Acciones hoy</p>
            <p className="mt-1 text-2xl font-semibold text-indigo-600">{estadisticas.totalHoy}</p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Acciones esta semana</p>
            <p className="mt-1 text-2xl font-semibold text-indigo-600">{estadisticas.totalSemana}</p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Inicios de sesión hoy</p>
            <p className="mt-1 text-2xl font-semibold text-indigo-600">{estadisticas.loginHoy}</p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-500">Usuarios activos hoy</p>
            <p className="mt-1 text-2xl font-semibold text-indigo-600">{estadisticas.usuariosActivos}</p>
          </div>
        </div>
        
        {/* Lista de actividad reciente */}
        <div className="overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : actividadReciente.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hay actividad reciente
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {actividadReciente.map((actividad) => (
                <li key={actividad.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {getUsuarioIdCorto(actividad.user_id)}
                        </p>
                        <div className="flex items-center mt-1">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getColorByAccion(actividad.accion)}`}>
                            {getDescripcionAccion(actividad.accion)}
                          </span>
                          
                          {actividad.tabla && (
                            <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                              {actividad.tabla}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {formatearFecha(actividad.created_at)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="bg-gray-50 px-4 py-3 flex justify-center">
          <Link
            to="/auditoria"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Ver todos los registros de auditoría
          </Link>
        </div>
      </div>
    </RoleGuard>
  );
};

export default ResumenAuditoria;
