import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ProcesarUsuariosPendientes from '../components/ProcesarUsuariosPendientes';
import CreateUserModal from '../components/users/CreateUserModal';

export default function UsuariosPendientes() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [usuariosPendientes, setUsuariosPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [procesandoTodos, setProcesandoTodos] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [selectedUserToCreate, setSelectedUserToCreate] = useState(null);
  const [rolesDisponibles, setRolesDisponibles] = useState([]);

  useEffect(() => {
    const cargarRoles = async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('id, nombre');
      if (error) {
        console.error('Error al cargar roles:', error);
        toast.error('Error al cargar roles');
      } else {
        console.log('Roles cargados desde Supabase:', data);
        setRolesDisponibles(data);
      }
    };
    cargarRoles();
  }, []);

  useEffect(() => {
    // Verificar si el usuario tiene permisos de administrador
    const verificarPermisos = async () => {
      try {
        // Verificar si el usuario tiene rol de administrador o superadmin
        const esAdmin = await hasRole('administrador') || await hasRole('superadmin');
        if (!esAdmin) {
          toast.error('No tienes permisos para acceder a esta página');
          navigate('/');
        } else {
          cargarUsuariosPendientes();
        }

      } catch (error) {
        console.error('Error al verificar permisos:', error);
        toast.error('Error al verificar permisos');
      }
    };

    verificarPermisos();
  }, [hasRole, navigate]);

  const cargarUsuariosPendientes = async () => {
    try {
      setLoading(true);

      // Obtener todos los usuarios pendientes (procesados y no procesados)
      const { data, error } = await supabase
        .from('usuarios_pendientes')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (error) {
        console.error('Error al cargar usuarios pendientes:', error);
        toast.error('Error al cargar usuarios pendientes');
        return;
      }

      // Si hay usuarios pendientes y algunos son de tipo proveedor, cargar los datos de los proveedores
      if (data && data.length > 0) {
        const usuariosProveedores = data.filter(u => u.entidad_tipo === 'proveedores' && u.entidad_id);

        if (usuariosProveedores.length > 0) {
          // Obtener los IDs de los proveedores
          const proveedorIds = usuariosProveedores.map(u => u.entidad_id);

          // Cargar los datos de los proveedores
          const { data: proveedoresData, error: proveedoresError } = await supabase
            .from('proveedores')
            .select('id, razon_social, cif')
            .in('id', proveedorIds);

          if (!proveedoresError && proveedoresData) {
            // Crear un mapa de proveedores para acceso rápido
            const proveedoresMap = {};
            proveedoresData.forEach(p => {
              proveedoresMap[p.id] = p;
            });

            // Añadir los datos de proveedores a los usuarios pendientes
            data.forEach(usuario => {
              if (usuario.entidad_tipo === 'proveedores' && usuario.entidad_id && proveedoresMap[usuario.entidad_id]) {
                usuario.proveedores = proveedoresMap[usuario.entidad_id];
              }
            });
          } else {
            console.error('Error al cargar datos de proveedores:', proveedoresError);
          }
        }
      }

      setUsuariosPendientes(data || []);
    } catch (error) {
      console.error('Error al cargar usuarios pendientes:', error);
      toast.error('Error al cargar usuarios pendientes');
    } finally {
      setLoading(false);
    }
  };

  const procesarUsuario = async (id, aprobar) => {
    try {
      setProcesando(true);

      if (aprobar) {
        try {
          // Obtener los datos del usuario pendiente
          const { data: usuarioPendiente, error: errorUsuario } = await supabase
            .from('usuarios_pendientes')
            .select('*')
            .eq('id', id)
            .single();

          if (errorUsuario) {
            console.error('Error al obtener datos del usuario pendiente:', errorUsuario);
            toast.error(`Error al obtener datos del usuario: ${errorUsuario.message}`);
            return;
          }

          // Crear el usuario en Supabase Auth
          const { data: userData, error: signupError } = await supabase.auth.signUp({
            email: usuarioPendiente.email,
            password: usuarioPendiente.password || `${usuarioPendiente.email.split('@')[0]}123`,
            options: {
              data: {
                rol: usuarioPendiente.rol_asignar || 'proveedor',
                nombre: usuarioPendiente.nombre || ''
              },
              emailRedirectTo: window.location.origin,
              emailConfirm: false
            }
          });

          if (signupError) {
            console.error('Error al crear usuario en Supabase Auth:', signupError);
            toast.error(`Error al crear usuario: ${signupError.message}`);

            // Si el error es porque el usuario ya existe, continuamos con el proceso
            if (!signupError.message.includes('already exists')) {
              return;
            }
          }

          // Obtener el ID del usuario (ya sea nuevo o existente)
          let userId;

          if (userData?.user?.id) {
            userId = userData.user.id;
            console.log('Usuario creado con ID:', userId);
          } else {
            // Intentar obtener el ID del usuario existente
            const { data: existingUser, error: fetchError } = await supabase
              .from('usuarios')
              .select('user_id')
              .eq('email', usuarioPendiente.email)
              .single();

            if (fetchError || !existingUser) {
              console.error('Error al obtener usuario existente:', fetchError);
              // Continuamos de todos modos, ya que el usuario podría estar en auth.users pero no en usuarios
            } else {
              userId = existingUser.user_id;
              console.log('Usuario existente con ID:', userId);
            }
          }

          // Actualizar el registro de usuario pendiente
          const { error: errorUpdate } = await supabase
            .from('usuarios_pendientes')
            .update({
              procesado: true,
              estado: 'aprobado',
              fecha_procesado: new Date().toISOString()
            })
            .eq('id', id);

          if (errorUpdate) {
            console.error('Error al actualizar usuario pendiente:', errorUpdate);
            toast.error(`Error al actualizar usuario: ${errorUpdate.message}`);
            return;
          }

          // Asignar rol al usuario si tenemos su ID
          if (userId && usuarioPendiente.rol_asignar) {
            try {
              // Obtener el ID del rol
              const { data: rolData, error: rolError } = await supabase
                .from('roles')
                .select('id')
                .eq('nombre', usuarioPendiente.rol_asignar)
                .single();

              if (!rolError && rolData) {
                // Asignar rol al usuario
                const { error: asignarRolError } = await supabase
                  .from('usuarios_roles')
                  .insert({
                    user_id: userId,
                    rol_id: rolData.id
                  })
                  .select();

                if (asignarRolError) {
                  console.error('Error al asignar rol al usuario:', asignarRolError);
                  // No bloqueamos el proceso por este error
                }
              }
            } catch (rolError) {
              console.error('Error al asignar rol:', rolError);
              // No bloqueamos el proceso por este error
            }
          }

          // Si es un proveedor, actualizar la tabla de proveedores
          if (usuarioPendiente.rol_asignar === 'proveedor' &&
              usuarioPendiente.entidad_tipo === 'proveedores' &&
              usuarioPendiente.entidad_id &&
              userId) {

            const { error: errorProveedor } = await supabase
              .from('proveedores')
              .update({ user_id: userId })
              .eq('id', usuarioPendiente.entidad_id);

            if (errorProveedor) {
              console.error('Error al actualizar proveedor:', errorProveedor);
              // No bloqueamos el proceso por este error
            }
          }

          toast.success('Usuario aprobado correctamente');
        } catch (error) {
          console.error('Error al aprobar usuario:', error);
          toast.error('Error al aprobar usuario');
          return;
        }
      } else {
        try {
          // Rechazar la creación del usuario
          const { error } = await supabase
            .from('usuarios_pendientes')
            .update({ procesado: true, estado: 'rechazado', fecha_procesado: new Date().toISOString() })
            .eq('id', id);

          if (error) {
            console.error('Error al rechazar usuario:', error);
            toast.error(`Error al rechazar usuario: ${error.message}`);
            return;
          }

          toast.success('Usuario rechazado correctamente');
        } catch (error) {
          console.error('Error al rechazar usuario:', error);
          toast.error('Error al rechazar usuario');
          return;
        }
      }

      // Recargar la lista de usuarios pendientes
      cargarUsuariosPendientes();
    } catch (error) {
      console.error('Error general al procesar usuario:', error);
      toast.error('Error al procesar el usuario');
    } finally {
      setProcesando(false);
    }
  };

  const procesarTodosUsuarios = async () => {
    try {
      setProcesandoTodos(true);

      // Obtener todos los usuarios pendientes sin procesar
      const { data: usuariosPendientesData, error: errorUsuarios } = await supabase
        .from('usuarios_pendientes')
        .select('*')
        .eq('procesado', false);

      if (errorUsuarios) {
        console.error('Error al obtener usuarios pendientes:', errorUsuarios);
        toast.error('Error al obtener usuarios pendientes');
        return;
      }

      if (!usuariosPendientesData || usuariosPendientesData.length === 0) {
        toast('No hay usuarios pendientes para procesar');
        return;
      }

      // Contador de usuarios procesados
      let usuariosProcesados = 0;

      // Procesar cada usuario
      for (const usuario of usuariosPendientesData) {
        try {
          await procesarUsuario(usuario.id, true);
          usuariosProcesados++;
        } catch (error) {
          console.error(`Error al procesar usuario ${usuario.id}:`, error);
          // Continuar con el siguiente usuario
        }
      }

      toast.success(`${usuariosProcesados} usuarios procesados correctamente`);

      // Recargar la lista de usuarios pendientes
      cargarUsuariosPendientes();
    } catch (error) {
      console.error('Error al procesar todos los usuarios:', error);
      toast.error('Error al procesar todos los usuarios');
    } finally {
      setProcesandoTodos(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';

    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return fecha;
    }
  };

  // Filtrar usuarios según el estado seleccionado
  const usuariosFiltrados = useMemo(() => {
    if (filtroEstado === 'todos') {
      return usuariosPendientes;
    } else if (filtroEstado === 'pendientes') {
      return usuariosPendientes.filter(usuario => !usuario.procesado || (!usuario.estado && !usuario.fecha_procesado));
    } else if (filtroEstado === 'aprobados') {
      return usuariosPendientes.filter(usuario => usuario.estado === 'aprobado');
    } else if (filtroEstado === 'rechazados') {
      return usuariosPendientes.filter(usuario => usuario.estado === 'rechazado');
    }
    return usuariosPendientes;
  }, [usuariosPendientes, filtroEstado]);

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Usuarios Pendientes</h1>
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 items-center">
            {/* Filtros de estado */}
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="mt-1 block w-full md:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="todos">Todos</option>
              <option value="pendientes">Pendientes</option>
              <option value="aprobados">Aprobados</option>
              <option value="rechazados">Rechazados</option>
            </select>

            {/* Botón para procesar todos los usuarios */}
            <button
              onClick={procesarTodosUsuarios}
              disabled={procesandoTodos}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
            >
              {procesandoTodos ? 'Procesando...' : 'Procesar Todos los Pendientes'}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Cargando usuarios pendientes...</p>
        ) : (
          <div>
            {usuariosFiltrados.length > 0 && ( /* Solo mostrar la tabla si hay usuarios filtrados */
              <div className="mb-4 flex justify-end">
                <ProcesarUsuariosPendientes onProcesarTodos={procesarTodosUsuarios} />
              </div>
            )}

            {usuariosFiltrados.length === 0 ? (
              <p className="text-center text-gray-500">No hay usuarios pendientes que coincidan con el filtro.</p>
            ) : (
              <div className="mt-4 bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full table-fixed border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="w-1/6 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th scope="col" className="w-1/6 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Nombre
                      </th>
                      <th scope="col" className="w-1/6 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tipo Entidad
                      </th>
                      <th scope="col" className="w-1/6 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Entidad
                      </th>
                      <th scope="col" className="w-1/6 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Fecha Solicitud
                      </th>
                      <th scope="col" className="w-1/6 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Estado
                      </th>
                      <th scope="col" className="w-1/6 px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usuariosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-3 py-4 text-center text-sm text-gray-500">
                          No hay usuarios {filtroEstado !== 'todos' ? filtroEstado : 'pendientes'}
                        </td>
                      </tr>
                    ) : (
                      usuariosFiltrados.map(usuario => (
                        <tr key={usuario.id} className="hover:bg-gray-50">
                          <td className="px-3 py-4 text-sm text-gray-900 truncate">
                            {usuario.email}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            {usuario.nombre}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            {usuario.entidad_tipo === 'proveedores' ? 'Proveedor' : 'N/A'}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            {usuario.entidad_tipo === 'proveedores' && usuario.proveedores ?
                              `${usuario.proveedores.razon_social} (${usuario.proveedores.cif})` : 'N/A'}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            {formatearFecha(usuario.fecha_creacion)}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            {usuario.estado === 'aprobado' ? (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Aprobado
                              </span>
                            ) : usuario.estado === 'rechazado' ? (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                Rechazado
                              </span>
                            ) : (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Pendiente
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-4 text-center">
                            {usuario.estado === 'aprobado' || usuario.estado === 'rechazado' ? (
                              <span className="text-gray-400">No disponible</span>
                            ) : (
                              <div className="flex justify-center space-x-2">
                                <button
                                  onClick={() => handleCreateUserClick(usuario)}
                                  disabled={procesando}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                >
                                  Crear cuenta
                                </button>
                                <button
                                  onClick={() => procesarUsuario(usuario.id, true)}
                                  disabled={procesando}
                                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                                >
                                  Aprobar
                                </button>
                                <button
                                  onClick={() => procesarUsuario(usuario.id, false)}
                                  disabled={procesando}
                                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                                >
                                  Rechazar
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      {showCreateUserModal && selectedUserToCreate && (
        <CreateUserModal
          pendingUser={selectedUserToCreate}
          availableRoles={rolesDisponibles}
          onSave={async (password, selectedRole) => {
            const { error: updateError } = await supabase
              .from('usuarios_pendientes')
              .update({
                password: password,
                rol_asignar: selectedRole
              })
              .eq('id', selectedUserToCreate.id);

            if (updateError) {
              toast.error('Error al actualizar usuario pendiente con contraseña y rol.');
              console.error('Error al actualizar usuario pendiente:', updateError);
              return;
            }

            await procesarUsuario(selectedUserToCreate.id, true);
            handleUserCreated();
          }}
          onClose={() => setShowCreateUserModal(false)}
        />
      )}
    </>
  );
}
