import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, getCurrentUser } from '../lib/supabase';
import toast from 'react-hot-toast';
import {
  UserIcon,
  KeyIcon,
  EnvelopeIcon,
  CalendarIcon,
  ArrowPathIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function Perfil() {
  const { user, logAction } = useAuth();
  const [loading, setLoading] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [userInfo, setUserInfo] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [actividadReciente, setActividadReciente] = useState([]);
  const [loadingActividad, setLoadingActividad] = useState(true);

  // Cargar información del usuario
  useEffect(() => {
    if (!user) return;

    const cargarDatosUsuario = async () => {
      try {
        // SISTEMA AUTH PERSONALIZADO - obtener usuario actual
        const userData = getCurrentUser();
        
        if (!userData) {
          throw new Error('No se encontraron datos del usuario');
        }

        console.log('✅ [Perfil] Usuario obtenido:', userData);
        
        if (userData && userData.user_metadata) {
          setUserInfo({
            nombre: userData.user_metadata.nombre || '',
            apellidos: userData.user_metadata.apellidos || '',
            email: userData.email || '',
            telefono: userData.user_metadata.telefono || ''
          });
        } else {
          setUserInfo({
            nombre: '',
            apellidos: '',
            email: userData.email || '',
            telefono: ''
          });
        }
        
        // Cargar actividad reciente
        cargarActividadReciente();
      } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        toast.error('No se pudieron cargar tus datos');
      }
    };
    
    cargarDatosUsuario();
  }, [user]);

  // Cargar actividad reciente del usuario
  const cargarActividadReciente = async () => {
    if (!user) return;
    
    try {
      setLoadingActividad(true);
      
      const { data, error } = await supabase
        .from('auditoria')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      
      setActividadReciente(data || []);
    } catch (error) {
      console.error('Error al cargar actividad reciente:', error);
    } finally {
      setLoadingActividad(false);
    }
  };

  // Actualizar información del perfil
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Debes iniciar sesión para actualizar tu perfil');
      return;
    }
    
    try {
      setLoading(true);
      
      // Actualizar metadatos del usuario
      const { data, error } = await supabase.auth.updateUser({
        data: {
          nombre: userInfo.nombre,
          apellidos: userInfo.apellidos,
          telefono: userInfo.telefono
        }
      });
      
      if (error) {
        console.error('Error detallado al actualizar perfil:', error);
        throw error;
      }
      
      console.log('Perfil actualizado correctamente:', data);
      
      // Si el usuario es un proveedor, actualizar también la tabla de proveedores
      if (user) {
        try {
          // Primero verificamos si el usuario es un proveedor
          const { data: proveedorData, error: proveedorError } = await supabase
            .from('proveedores')
            .select('*')
            .eq('user_id', user.id);
            
          if (proveedorError) {
            console.error('Error al verificar si el usuario es proveedor:', proveedorError);
          }
          
          // Si es un proveedor, actualizamos sus datos
          if (proveedorData && proveedorData.length > 0) {
            const proveedor = proveedorData[0];
            
            const { error: updateError } = await supabase
              .from('proveedores')
              .update({
                nombre: userInfo.nombre,
                telefono: userInfo.telefono
              })
              .eq('id', proveedor.id);
              
            if (updateError) {
              console.error('Error al actualizar datos del proveedor:', updateError);
              toast.error('Se actualizó el perfil, pero no los datos de proveedor');
            } else {
              console.log('Datos de proveedor actualizados correctamente');
            }
          }
        } catch (providerError) {
          console.error('Error al actualizar datos de proveedor:', providerError);
          // No bloqueamos el flujo principal por este error
        }
      }
      
      // Registrar acción en auditoría
      if (logAction) {
        try {
          await logAction('actualizar_perfil', 'usuarios', user.id, {
            campos_actualizados: ['nombre', 'apellidos', 'telefono']
          });
        } catch (auditError) {
          console.error('Error al registrar auditoría:', auditError);
          // No bloqueamos el flujo principal por este error
        }
      }
      
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      toast.error(`Error al actualizar el perfil: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Cambiar contraseña
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Debes iniciar sesión para cambiar tu contraseña');
      return;
    }
    
    // Validar que las contraseñas coincidan
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    
    // Validar que la contraseña cumpla con los requisitos
    if (passwordData.newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    
    try {
      setChangePasswordLoading(true);
      
      // Cambiar contraseña
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });
      
      if (error) throw error;
      
      // Registrar acción en auditoría
      await logAction('cambiar_contraseña', 'usuarios', user.id, {
        detalles: 'Cambio de contraseña exitoso'
      });
      
      // Limpiar formulario
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      toast.success('Contraseña actualizada correctamente');
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      toast.error('Error al cambiar la contraseña');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  // Formatear fecha
  const formatearFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Acceso Denegado</h2>
          <p className="text-gray-600">Debes iniciar sesión para ver tu perfil.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del perfil */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-indigo-600" />
              Información Personal
            </h2>
            
            <form onSubmit={handleUpdateProfile}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    value={userInfo.nombre}
                    onChange={(e) => setUserInfo({...userInfo, nombre: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700 mb-1">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    id="apellidos"
                    value={userInfo.apellidos}
                    onChange={(e) => setUserInfo({...userInfo, apellidos: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={userInfo.email}
                    disabled
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">El email no se puede cambiar</p>
                </div>
                
                <div>
                  <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    id="telefono"
                    value={userInfo.telefono}
                    onChange={(e) => setUserInfo({...userInfo, telefono: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
                >
                  {loading && <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
          
          {/* Cambio de contraseña */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <KeyIcon className="h-5 w-5 mr-2 text-indigo-600" />
              Cambiar Contraseña
            </h2>
            
            <form onSubmit={handleChangePassword}>
              <div className="space-y-4 mb-4">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres</p>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={changePasswordLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
                >
                  {changePasswordLoading && <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />}
                  Cambiar Contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Actividad reciente */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <ShieldCheckIcon className="h-5 w-5 mr-2 text-indigo-600" />
                Actividad Reciente
              </h2>
              
              <button
                onClick={cargarActividadReciente}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Recargar actividad"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            </div>
            
            {loadingActividad ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : actividadReciente.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay actividad reciente
              </div>
            ) : (
              <div className="space-y-4">
                {actividadReciente.map((actividad) => (
                  <div key={actividad.id} className="border-b border-gray-100 pb-3">
                    <div className="flex justify-between items-start">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getColorByAccion(actividad.accion)}`}>
                        {getDescripcionAccion(actividad.accion)}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {formatearFecha(actividad.created_at)}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      {actividad.tabla && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded mr-1">
                          {actividad.tabla}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
