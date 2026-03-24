import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { supabase } from '../lib/supabase'

// Modo de emergencia - Desactiva verificación de permisos
const EMERGENCY_MODE = false;

// Crear el contexto de autenticación
const AuthContext = createContext(null)

// Hook para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) { // Comprobar contra el valor inicial de AuthContext
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Proveedor del contexto de autenticación
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userPermissions, setUserPermissions] = useState([])
  const [userRoles, setUserRoles] = useState([])
  const [authError, setAuthError] = useState(null)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  // Función para registrar acciones en la tabla de auditoría
  const logAction = useCallback(async (accion, detalles = '', tabla = 'usuarios', registro_id = null) => {
    if (!user) return { success: false, error: 'No hay usuario autenticado' }

    try {
      // Crear objeto base para la inserción
      const auditData = {
        accion,
        detalles,
        tabla,
        registro_id: registro_id || user.id,
        user_id: user.id
      };

      // Intentar añadir user_email si es posible
      try {
        auditData.user_email = user.email;
      } catch (emailError) {
        console.warn('No se pudo incluir user_email en la auditoría:', emailError);
      }

      const { error } = await supabase.from('auditoria').insert(auditData);

      if (error) {
        console.warn('Error al registrar acción en auditoría:', error);
        // Si hay error, intentar sin el campo user_email
        if (error.message && error.message.includes('user_email')) {
          delete auditData.user_email;
          const { error: retryError } = await supabase.from('auditoria').insert(auditData);

          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Error al registrar acción:', error)
      // No fallar la operación principal por un error de auditoría
      return { success: true, auditError: error.message }
    }
  }, [user])

  // Función para obtener los permisos del usuario de forma segura
  const fetchUserPermissions = useCallback(async (userId) => {
    if (!userId) return [];

    try {
      console.log('Iniciando obtención de permisos para el usuario (v3):', userId);

      // 1. Obtener los IDs de los roles del usuario
      const { data: userRolesData, error: rolesError } = await supabase
        .from('usuarios_roles')
        .select('rol_id')
        .eq('user_id', userId);

      if (rolesError) {
        console.error('Error al obtener los roles del usuario:', rolesError);
        return [];
      }
      if (!userRolesData || userRolesData.length === 0) {
        console.warn('El usuario no tiene roles asignados.');
        return [];
      }
      const roleIds = userRolesData.map(role => role.rol_id);
      console.log('Roles del usuario (IDs):', roleIds);

      // 2. Obtener los IDs de los permisos para esos roles
      const { data: rolePermissionsData, error: rolePermsError } = await supabase
        .from('roles_permisos')
        .select('permiso_id')
        .in('rol_id', roleIds);

      if (rolePermsError) {
        console.error('Error al obtener los IDs de permisos:', rolePermsError);
        return [];
      }
      if (!rolePermissionsData || rolePermissionsData.length === 0) {
        console.warn('No se encontraron IDs de permisos para los roles.');
        return [];
      }
      const permissionIds = rolePermissionsData.map(p => p.permiso_id);
      console.log('Permisos del usuario (IDs):', permissionIds);

      // 3. Obtener los detalles de los permisos
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permisos')
        .select('id, codigo, nombre, descripcion')
        .in('id', permissionIds);

      if (permissionsError) {
        console.error('Error DETALLADO al obtener los detalles de los permisos (Supabase):', JSON.stringify(permissionsError, null, 2));
        throw permissionsError; // Re-lanzamos para que el catch general lo maneje
      }

      if (!permissionsData) {
        console.error('No se recibieron datos de permisos (permissionsData es null/undefined) para los IDs:', permissionIds);
        throw new Error('No se recibieron datos de permisos de Supabase (permissionsData es null/undefined).');
      }

      console.log('Datos de permisos obtenidos CRUDOS (permissionsData):', JSON.stringify(permissionsData, null, 2));

      // Asegurarse de que permissionsData es un array y que los objetos tienen 'codigo'
      if (!Array.isArray(permissionsData) || (permissionsData.length > 0 && permissionsData.some(p => typeof p.codigo === 'undefined'))) {
        console.error('Formato inesperado para permissionsData o falta la propiedad "codigo":', JSON.stringify(permissionsData, null, 2));
        throw new Error('Formato de datos de permisos incorrecto o falta la propiedad codigo.');
      }
      
      return permissionsData;

    } catch (error) {
      console.error('Error CAPTURADO en fetchUserPermissions (objeto error):', error);
      console.error('Error CAPTURADO en fetchUserPermissions (JSON):', JSON.stringify(error, Object.getOwnPropertyNames(error).reduce((acc, key) => { acc[key] = error[key]; return acc; }, {}), 2));
      return [];
    }
  }, [])

  // Función para obtener los roles del usuario de forma segura
  const fetchUserRoles = useCallback(async (userId) => {
    if (!userId) return []

    try {
      console.log('Obteniendo roles para el usuario:', userId);

      // Método 1: Consulta directa con join
      try {
        const { data: userRolesData, error: rolesError } = await supabase
          .from('usuarios_roles')
          .select(`
            roles!inner(
              id,
              nombre,
              descripcion
            )
          `)
          .eq('user_id', userId);

        if (rolesError) {
          console.error('Error al obtener roles del usuario (Método 1):', rolesError);
          throw rolesError;
        }

        if (!userRolesData || userRolesData.length === 0) {
          console.warn('El usuario no tiene roles asignados');
          return [];
        }

        console.log('Datos de roles obtenidos (Método 1):', userRolesData);

        // Extraer roles y transformar al formato esperado
        const roles = userRolesData.map(r => ({
          id: r.roles.id,
          nombre: r.roles.nombre,
          descripcion: r.roles.descripcion
        }));

        console.log('Roles procesados:', roles);

        // Eliminar duplicados basados en el ID
        const uniqueRoles = Array.from(
          new Map(roles.map(item => [item.id, item])).values()
        );

        console.log('Roles únicos:', uniqueRoles);
        return uniqueRoles;
      } catch (error1) {
        // Si falla el método 1, intentar con el método 2
        console.log('Intentando método alternativo para obtener roles...');

        // Método 2: Enfoque alternativo con consultas separadas
        // Obtener IDs de roles del usuario
        const { data: userRoleIds, error: roleIdsError } = await supabase
          .from('usuarios_roles')
          .select('rol_id')
          .eq('user_id', userId);

        if (roleIdsError) {
          console.error('Error al obtener IDs de roles del usuario:', roleIdsError);
          return [];
        }

        if (!userRoleIds || userRoleIds.length === 0) {
          console.warn('El usuario no tiene roles asignados');
          return [];
        }

        const roleIds = userRoleIds.map(role => role.rol_id);
        console.log('IDs de roles obtenidos:', roleIds);

        // Obtener detalles de los roles
        const { data: rolesDetails, error: rolesDetailsError } = await supabase
          .from('roles')
          .select('id, nombre, descripcion')
          .in('id', roleIds);

        if (rolesDetailsError) {
          console.error('Error al obtener detalles de roles:', rolesDetailsError);
          return [];
        }

        console.log('Roles obtenidos (Método 2):', rolesDetails);
        return rolesDetails;
      }
    } catch (error) {
      console.error('Error general al obtener roles:', error);
      // En caso de error, devolver un array vacío para evitar errores en cascada
      return [];
    }
  }, []);

  // Funciones de ayuda para roles comunes. Definidas aquí para que estén disponibles para hasPermission.
  const hasRole = useCallback((roleName) => {
    if (!userRoles || userRoles.length === 0) {
      return false;
    }
    if (!roleName || typeof roleName !== 'string') {
      return false;
    }
    const normalizedRoleName = roleName.toLowerCase().trim();
    const result = userRoles.some(userRoleString => {
      if (typeof userRoleString !== 'string') {
        return false;
      }
      return userRoleString.toLowerCase().trim() === normalizedRoleName;
    });
    return result;
  }, [userRoles]);

  const isAdmin = useCallback(() => hasRole('administrador') || hasRole('superadmin'), [hasRole]);
  const isSupervisor = useCallback(() => {
    // Acceso directo para el superadmin principal
    if (user && user.email === 'admin@vimar.com') {
      console.log('[SuperAdmin] Usuario admin@vimar.com reconocido como supervisor');
      return true;
    }
    return hasRole('supervisor') || hasRole('administrador') || hasRole('superadmin');
  }, [hasRole, user]);
  const isEmpleado = useCallback(() => hasRole('empleado'), [hasRole]);
  const isProveedor = useCallback(() => hasRole('proveedor'), [hasRole]);

  // Función para verificar si un usuario tiene un permiso específico
  const hasPermission = useCallback((requiredPermission) => {
    // Si no se especifica un permiso, se concede acceso (comportamiento por defecto)
    if (!requiredPermission) return true;

    // En modo de emergencia, permitir todos los permisos
    if (EMERGENCY_MODE) {
        console.warn(`[Modo Emergencia] Concediendo permiso '${requiredPermission}'`);
        return true;
    }

    // El superadmin y el admin siempre tienen permiso
    if (hasRole('superadmin') || isAdmin()) {
        return true;
    }

    // Verificar si el permiso existe en la lista de permisos del usuario
    if (!userPermissions) return false;
    const has = userPermissions.some(p => p === requiredPermission);
    
    console.log(`[Diagnóstico AuthContext] Verificando permiso: '${requiredPermission}'. ¿Tiene? ${has}. Permisos del usuario: [${userPermissions.join(', ')}]`);

    return has;
  }, [userPermissions, hasRole, isAdmin]);

  // Inicializar autenticación
  const initAuth = useCallback(async () => {
    try {
      setLoading(true)

      // En modo de emergencia, usar datos simulados
      if (EMERGENCY_MODE) {
        const mockPermissions = [
          { id: 1, nombre: 'partes:leer' },
          { id: 2, nombre: 'partes:crear' },
          { id: 3, nombre: 'partes:editar' },
          { id: 4, nombre: 'partes:eliminar' },
          { id: 5, nombre: 'empleados:leer' },
          { id: 6, nombre: 'empleados:crear' },
          { id: 7, nombre: 'empleados:editar' },
          { id: 8, nombre: 'empleados:eliminar' },
          { id: 9, nombre: 'obras:leer' },
          { id: 10, nombre: 'obras:crear' },
          { id: 11, nombre: 'obras:editar' },
          { id: 12, nombre: 'obras:eliminar' },
          { id: 13, nombre: 'precios:leer' },
          { id: 14, nombre: 'precios:crear' },
          { id: 15, nombre: 'precios:editar' },
          { id: 16, nombre: 'precios:eliminar' },
          { id: 17, nombre: 'proveedores:leer' },
          { id: 18, nombre: 'proveedores:crear' },
          { id: 19, nombre: 'proveedores:editar' },
          { id: 20, nombre: 'proveedores:eliminar' },
          { id: 21, nombre: 'roles:administrar' },
          { id: 22, nombre: 'auditoria:ver' },
          { id: 23, nombre: 'usuarios:ver' }
        ];

        const mockRoles = [
          { id: 1, nombre: 'superadmin' },
          { id: 2, nombre: 'admin' },
          { id: 3, nombre: 'empleado' },
          { id: 4, nombre: 'proveedor' }
        ];

        // Verificar si hay una sesión activa
        const { data: sessionData } = await supabase.auth.getSession();

        if (sessionData?.session) {
          setSession(sessionData.session);
          setUser(sessionData.session.user);
          setUserPermissions(mockPermissions);
          setUserRoles(mockRoles);
          console.log('Sesión activa en modo de emergencia:', sessionData.session);
        } else {
          setSession(null);
          setUser(null);
          setUserPermissions([]);
          setUserRoles([]);
          console.log('No hay sesión activa en modo de emergencia');
        }

        return;
      }

      // VERIFICAR SESIÓN PERSONALIZADA PRIMERO
      const customUser = localStorage.getItem('custom_auth_user')
      const customSession = localStorage.getItem('supabase.auth.token')
      
      if (customUser && customSession) {
        console.log('🔄 Restaurando sesión personalizada desde localStorage')
        
        try {
          const userData = JSON.parse(customUser)
          const sessionData = JSON.parse(customSession)
          
          // Verificar que la sesión sigue siendo válida
          const { data: verifyResult, error: verifyError } = await supabase.rpc('verify_custom_session', {
            p_user_id: userData.id
          })
          
          if (verifyError || !verifyResult?.success) {
            console.log('Sesión personalizada inválida, limpiando...')
            localStorage.removeItem('custom_auth_user')
            localStorage.removeItem('supabase.auth.token')
          } else {
            // Restaurar sesión válida
            setSession(sessionData)
            setUser(sessionData.user)
            setUserRoles(userData.roles || [])
            
            try {
              const permissions = await fetchUserPermissions(userData.id)
              setUserPermissions(permissions.map(p => p.codigo))
              console.log('🔑 Permisos restaurados desde sesión personalizada:', permissions.map(p => p.codigo))
            } catch (permError) {
              console.warn('Error al cargar permisos desde sesión personalizada:', permError)
              setUserPermissions([]) // Limpiar permisos en caso de error
            }
            
            console.log('✅ Sesión personalizada restaurada exitosamente')
            return
          }
        } catch (parseError) {
          console.error('Error al parsear sesión personalizada:', parseError)
          localStorage.removeItem('custom_auth_user')
          localStorage.removeItem('supabase.auth.token')
        }
      }

      // Fallback a Supabase Auth si no hay sesión personalizada
      console.log('Verificando sesión de Supabase Auth...')
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.log('Error al obtener sesión de Supabase (esperado):', sessionError);
        // No setear como error ya que es esperado
        return;
      }

      console.log('Datos de sesión Supabase obtenidos:', sessionData);

      if (sessionData?.session) {
        console.log('Usando sesión de Supabase Auth como fallback')
        setSession(sessionData.session);
        setUser(sessionData.session.user);

        try {
          // Obtener permisos y roles del usuario
          const permissions = await fetchUserPermissions(sessionData.session.user.id);
          const roles = await fetchUserRoles(sessionData.session.user.id);

          setUserPermissions(permissions.map(p => p.codigo));
          setUserRoles(roles.map(r => r.nombre));

          console.log('Permisos y roles cargados correctamente');
        } catch (permissionsError) {
          console.error('Error al cargar permisos y roles:', permissionsError);

          // Si hay un error al cargar permisos, usar datos simulados temporalmente
          const mockPermissions = [
            { id: 1, nombre: 'partes:leer' },
            { id: 2, nombre: 'partes:crear' },
            { id: 3, nombre: 'partes:editar' }
          ];

          const mockRoles = [
            { id: 1, nombre: 'empleado' }
          ];

          setUserPermissions(mockPermissions);
          setUserRoles(mockRoles);

          toast.error('Error al cargar permisos. Funcionando con permisos limitados.');
        }
      } else {
        setSession(null);
        setUser(null);
        setUserPermissions([]);
        setUserRoles([]);
      }
    } catch (error) {
      console.error('Error al inicializar autenticación:', error);
      setAuthError(error.message);

      // En caso de error, usar datos simulados para permitir funcionamiento básico
      const mockPermissions = [
        { id: 1, nombre: 'partes:leer' }
      ];

      const mockRoles = [
        { id: 1, nombre: 'empleado' }
      ];

      setUserPermissions(mockPermissions);
      setUserRoles(mockRoles);

      toast.error('Error de autenticación. Funcionando con permisos limitados.');
    } finally {
      setLoading(false);
    }
  }, [fetchUserPermissions, fetchUserRoles]);

  // Suscribirse a cambios en la autenticación - Implementación simplificada
  useEffect(() => {
    // Inicializar autenticación al montar el componente
    initAuth()

    // Configurar el listener de cambios de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event, newSession?.user?.email || 'No user')

        // Manejar diferentes eventos de autenticación
        if (event === 'SIGNED_IN') {
          if (newSession) {
            setSession(newSession)
            setUser(newSession.user)

            // En modo de emergencia, no cargar permisos reales
            if (EMERGENCY_MODE) {
              const mockPermissions = [
                { id: 1, nombre: 'partes:leer' },
                { id: 2, nombre: 'partes:crear' },
                { id: 3, nombre: 'partes:editar' },
                { id: 4, nombre: 'partes:eliminar' },
                { id: 5, nombre: 'empleados:leer' },
                { id: 6, nombre: 'empleados:crear' },
                { id: 7, nombre: 'empleados:editar' },
                { id: 8, nombre: 'empleados:eliminar' },
                { id: 9, nombre: 'obras:leer' },
                { id: 10, nombre: 'obras:crear' },
                { id: 11, nombre: 'obras:editar' },
                { id: 12, nombre: 'obras:eliminar' },
                { id: 13, nombre: 'precios:leer' },
                { id: 14, nombre: 'precios:crear' },
                { id: 15, nombre: 'precios:editar' },
                { id: 16, nombre: 'precios:eliminar' },
                { id: 17, nombre: 'proveedores:leer' },
                { id: 18, nombre: 'proveedores:crear' },
                { id: 19, nombre: 'proveedores:editar' },
                { id: 20, nombre: 'proveedores:eliminar' },
                { id: 21, nombre: 'roles:administrar' },
                { id: 22, nombre: 'auditoria:ver' },
                { id: 23, nombre: 'usuarios:ver' }
              ];

              const mockRoles = [
                { id: 1, nombre: 'superadmin' },
                { id: 2, nombre: 'admin' },
                { id: 3, nombre: 'empleado' },
                { id: 4, nombre: 'proveedor' }
              ];

              setUserPermissions(mockPermissions)
              setUserRoles(mockRoles)
              setLoading(false)
              return
            }

            // Cargar permisos y roles de forma asíncrona sin bloquear
            setTimeout(async () => {
              try {
                const permissions = await fetchUserPermissions(newSession.user.id)
                const roles = await fetchUserRoles(newSession.user.id)

                setUserPermissions(permissions.map(p => p.codigo))
                setUserRoles(roles.map(r => r.nombre))
              } catch (error) {
                console.error('Error al cargar permisos:', error)
                setUserPermissions([])
                setUserRoles([])
              } finally {
                setLoading(false)
              }
            }, 100)
          }
        } else if (event === 'SIGNED_OUT') {
          // Limpiar estado
          setSession(null)
          setUser(null)
          setUserPermissions([])
          setUserRoles([])
          setLoading(false)
        }
      }
    )

    // Limpiar suscripción al desmontar
    return () => {
      if (authListener?.subscription?.unsubscribe) {
        authListener.subscription.unsubscribe()
      }
    }
  }, [initAuth, fetchUserPermissions, fetchUserRoles])

  // Verificar el rol del usuario y redirigir según corresponda
  const redirectUserBasedOnRole = useCallback(async (userId) => {
    try {
      console.log('Redirigiendo usuario según su rol:', userId);

      // Si es admin@vimar.com, redirigir al dashboard principal
      if (user?.email === 'admin@vimar.com') {
        console.log('Usuario admin@vimar.com detectado, redirigiendo al dashboard principal');
        navigate('/');
        return;
      }

      // Verificar si es proveedor
      const { data: proveedor, error: errorProveedor } = await supabase
        .from('proveedores')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!errorProveedor && proveedor) {
        console.log('Usuario es proveedor, redirigiendo a dashboard de proveedor');
        navigate('/');
        return;
      }

      // Verificar si es empleado
      const { data: empleado, error: errorEmpleado } = await supabase
        .from('empleados')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!errorEmpleado && empleado) {
        console.log('Usuario es empleado, redirigiendo a dashboard principal');
        navigate('/');
        return;
      }

      // Si no es ninguno de los anteriores, verificar roles administrativos
      const isAdminUser = await hasRole('administrador');
      const isSuperAdminUser = await hasRole('superadmin');

      if (isAdminUser || isSuperAdminUser) {
        console.log('Usuario es administrador o superadmin, redirigiendo a dashboard principal');
        navigate('/');
        return;
      }

      // Por defecto, redirigir al dashboard principal
      navigate('/');

    } catch (error) {
      console.error('Error al redirigir usuario:', error);
      // En caso de error, redirigir al dashboard principal
      navigate('/');
    }
  }, [navigate, hasRole, user]);

  // Función para iniciar sesión - USANDO SISTEMA AUTH PERSONALIZADO
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true)
      setAuthError(null)

      console.log('🔥 AuthContext: Usando sistema auth personalizado')

      // USAR NUESTRO SISTEMA PERSONALIZADO EN LUGAR DE SUPABASE AUTH
      const { data: customAuthResult, error: customAuthError } = await supabase.rpc('custom_login', {
        p_email: email,
        p_password: password
      })

      if (customAuthError) {
        console.error('Error en sistema auth personalizado:', customAuthError)
        throw new Error('Error de conexión con la base de datos')
      }

      if (!customAuthResult || !customAuthResult.success) {
        console.error('Login fallido con sistema personalizado:', customAuthResult)
        throw new Error(customAuthResult?.error || 'Credenciales inválidas')
      }

      console.log('✅ AuthContext: Login exitoso con sistema personalizado:', customAuthResult.user)

      // Simular estructura de Supabase para compatibilidad
      const mockSession = {
        access_token: customAuthResult.user.session_token,
        token_type: 'bearer',
        expires_in: 3600,
        user: {
          id: customAuthResult.user.id,
          email: customAuthResult.user.email,
          user_metadata: {
            nombre: customAuthResult.user.nombre,
            roles: customAuthResult.user.roles
          },
          aud: 'authenticated',
          role: 'authenticated'
        }
      }

      const mockUser = mockSession.user

      // Guardar sesión personalizada en localStorage
      localStorage.setItem('supabase.auth.token', JSON.stringify(mockSession))
      localStorage.setItem('custom_auth_user', JSON.stringify(customAuthResult.user))

      // Guardar sesión y usuario en el contexto
      setSession(mockSession)
      setUser(mockUser)

      try {
        // Registrar acción de inicio de sesión
        await logAction('login', 'Inicio de sesión exitoso')
      } catch (logError) {
        console.warn('Error al registrar acción de login:', logError)
        // Continuar a pesar del error de registro
      }

      try {
        // Establecer roles directamente desde la respuesta personalizada
        setUserRoles(customAuthResult.user.roles || [])
        
        // Obtener permisos del usuario y establecerlos
        const permissions = await fetchUserPermissions(customAuthResult.user.id)
        setUserPermissions(permissions.map(p => p.codigo))
        
        console.log('🔑 Permisos establecidos:', permissions.map(p => p.codigo))
      } catch (permError) {
        console.warn('Error al obtener permisos:', permError)
        // Usar roles de la respuesta como fallback
        setUserRoles(customAuthResult.user.roles || [])
        setUserPermissions([]) // Limpiar permisos en caso de error
      }

      try {
        // Redirigir al usuario según su rol
        await redirectUserBasedOnRole(customAuthResult.user.id)
      } catch (redirectError) {
        console.warn('Error al redirigir usuario:', redirectError)
        // En caso de error de redirección, ir al dashboard principal
        navigate('/')
      }

      return { success: true }
    } catch (error) {
      console.error('Error de inicio de sesión:', error)
      setAuthError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }, [logAction, fetchUserPermissions, fetchUserRoles, redirectUserBasedOnRole, navigate])

  // Función para cerrar sesión - SISTEMA PERSONALIZADO
  const logout = useCallback(async () => {
    try {
      setLoading(true)

      console.log('🚪 AuthContext: Logout con sistema personalizado')

      // Registrar acción de cierre de sesión
      if (user) {
        await logAction('logout', 'Cierre de sesión exitoso')
      }

      // Limpiar sesión personalizada
      localStorage.removeItem('supabase.auth.token')
      localStorage.removeItem('custom_auth_user')

      // Intentar logout de Supabase también (por compatibilidad)
      try {
        await supabase.auth.signOut()
      } catch (supabaseError) {
        console.log('Supabase Auth signOut falló (esperado):', supabaseError)
      }

      // Limpiar estado
      setSession(null)
      setUser(null)
      setUserPermissions([])
      setUserRoles([])

      // Redirigir al login
      navigate('/login')

      return { success: true }
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      // Forzar limpieza incluso si hay error
      localStorage.removeItem('supabase.auth.token')
      localStorage.removeItem('custom_auth_user')
      setSession(null)
      setUser(null)
      setUserPermissions([])
      setUserRoles([])
      navigate('/login')
      return { success: true }
    } finally {
      setLoading(false)
    }
  }, [user, navigate, logAction])

  // Función para crear y asignar el rol de superadmin
  const createAndAssignSuperadminRole = useCallback(async (email) => {
    try {
      setLoading(true)

      // 1. Verificar si el usuario existe
      const { data: { user: userData }, error: userError } = await supabase.auth.getUserByEmail(email);

      if (userError) {
        throw new Error(`Error al buscar el usuario: ${userError.message}`)
      }

      if (!userData) {
        throw new Error(`No se encontró el usuario con email ${email}`)
      }

      const userId = userData.id

      // 2. Verificar si el rol superadmin ya existe
      const { data: existingRoles, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .eq('nombre', 'superadmin')

      if (rolesError) {
        throw new Error(`Error al verificar roles existentes: ${rolesError.message}`)
      }

      let superadminRoleId

      // 3. Crear el rol superadmin si no existe
      if (!existingRoles || existingRoles.length === 0) {
        const { data: newRole, error: createRoleError } = await supabase
          .from('roles')
          .insert({
            nombre: 'superadmin',
            descripcion: 'Rol con acceso completo a todas las funciones del sistema'
          })
          .select()

        if (createRoleError) {
          throw new Error(`Error al crear el rol superadmin: ${createRoleError.message}`)
        }

        superadminRoleId = newRole[0].id
      } else {
        superadminRoleId = existingRoles[0].id
      }

      // 4. Obtener todos los permisos disponibles
      const { data: allPermissions, error: permissionsError } = await supabase
        .from('permisos')
        .select('*')

      if (permissionsError) {
        throw new Error(`Error al obtener permisos: ${permissionsError.message}`)
      }

      // 5. Asignar todos los permisos al rol superadmin
      for (const permission of allPermissions) {
        // Verificar si el permiso ya está asignado
        const { data: existingPermission, error: checkPermissionError } = await supabase
          .from('roles_permisos')
          .select('*')
          .eq('rol_id', superadminRoleId)
          .eq('permiso_id', permission.id)

        if (checkPermissionError) {
          console.warn(`Error al verificar permiso existente: ${checkPermissionError.message}`)
          continue
        }

        // Si el permiso no está asignado, asignarlo
        if (!existingPermission || existingPermission.length === 0) {
          const { error: assignPermissionError } = await supabase
            .from('roles_permisos')
            .insert({
              rol_id: superadminRoleId,
              permiso_id: permission.id
            })

          if (assignPermissionError) {
            console.warn(`Error al asignar permiso ${permission.id}: ${assignPermissionError.message}`)
          }
        }
      }

      // 6. Verificar si el usuario ya tiene el rol superadmin
      const { data: existingUserRole, error: checkUserRoleError } = await supabase
        .from('usuarios_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('rol_id', superadminRoleId)

      if (checkUserRoleError) {
        throw new Error(`Error al verificar rol de usuario: ${checkUserRoleError.message}`)
      }

      // 7. Asignar el rol superadmin al usuario si no lo tiene
      if (!existingUserRole || existingUserRole.length === 0) {
        const { error: assignRoleError } = await supabase
          .from('usuarios_roles')
          .insert({
            user_id: userId,
            rol_id: superadminRoleId
          })

        if (assignRoleError) {
          throw new Error(`Error al asignar rol superadmin al usuario: ${assignRoleError.message}`)
        }
      }

      // 8. Registrar la acción en el log de auditoría
      await logAction('Asignación de rol superadmin', `Se asignó el rol superadmin al usuario ${email}`, 'usuarios', userId)

      // 9. Actualizar los permisos y roles del usuario actual si es el mismo
      if (user && user.email === email) {
        const permissions = await fetchUserPermissions(user.id)
        const roles = await fetchUserRoles(user.id)

        setUserPermissions(permissions)
        setUserRoles(roles)

        // Actualizar caché
        try {
          localStorage.setItem('userPermissions', JSON.stringify(permissions))
          localStorage.setItem('userRoles', JSON.stringify(roles))
        } catch (storageError) {
          console.warn('Error al guardar en caché:', storageError)
        }
      }

      return { success: true, message: `Se ha asignado correctamente el rol superadmin al usuario ${email}` }
    } catch (error) {
      console.error('Error al crear y asignar rol superadmin:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [user, logAction, fetchUserPermissions, fetchUserRoles])

  // Función para verificar y corregir los permisos en la base de datos
  const verificarYCorregirPermisos = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Verificar que el usuario actual tiene permisos de superadmin
      if (!hasRole('superadmin')) {
        toast.error('Necesitas ser superadmin para realizar esta acción');
        return { success: false, message: 'Se requieren permisos de superadmin' };
      }

      // 2. Verificar si hay problemas con las políticas RLS en Supabase
      const testResults = [];

      // Prueba 1: Verificar acceso a la tabla de roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('id, nombre')
        .limit(1);

      testResults.push({
        name: 'Acceso a roles',
        success: !rolesError,
        error: rolesError?.message || null
      });

      // Prueba 2: Verificar acceso a la tabla de permisos
      const { data: permisosData, error: permisosError } = await supabase
        .from('permisos')
        .select('id, nombre')
        .limit(1);

      testResults.push({
        name: 'Acceso a permisos',
        success: !permisosError,
        error: permisosError?.message || null
      });

      // Prueba 3: Verificar acceso a la tabla de roles_permisos
      const { data: rolesPermisosData, error: rolesPermisosError } = await supabase
        .from('roles_permisos')
        .select('rol_id, permiso_id')
        .limit(1);

      testResults.push({
        name: 'Acceso a roles_permisos',
        success: !rolesPermisosError,
        error: rolesPermisosError?.message || null
      });

      // Prueba 4: Verificar acceso a la tabla de usuarios_roles
      const { data: usuariosRolesData, error: usuariosRolesError } = await supabase
        .from('usuarios_roles')
        .select('user_id, rol_id')
        .limit(1);

      testResults.push({
        name: 'Acceso a usuarios_roles',
        success: !usuariosRolesError,
        error: usuariosRolesError?.message || null
      });

      // Verificar si todas las pruebas fueron exitosas
      const allTestsPassed = testResults.every(test => test.success);

      if (allTestsPassed) {
        // Si todas las pruebas pasaron, podemos desactivar el modo de emergencia
        toast.success('Todas las verificaciones de permisos fueron exitosas');
        return {
          success: true,
          message: 'Verificación completada con éxito. Puedes desactivar el modo de emergencia.',
          testResults
        };
      } else {
        // Si alguna prueba falló, mostrar los resultados
        const failedTests = testResults.filter(test => !test.success);

        toast.error(`Se encontraron ${failedTests.length} problemas de permisos`);

        // Registrar los problemas en la consola
        console.error('Problemas de permisos detectados:', failedTests);

        return {
          success: false,
          message: 'Se encontraron problemas de permisos. No se recomienda desactivar el modo de emergencia.',
          testResults
        };
      }
    } catch (error) {
      console.error('Error al verificar permisos:', error);
      toast.error('Error al verificar permisos en la base de datos');

      return {
        success: false,
        message: `Error al verificar permisos: ${error.message}`,
        error
      };
    } finally {
      setLoading(false);
    }
  }, [hasRole]);

  // Función para crear un usuario administrador
  const createAdminUser = useCallback(async (email, password) => {
    try {
      setLoading(true);

      // Verificar si ya existe un administrador
      const { data: adminUsers, error: adminCheckError } = await supabase
        .from('usuarios_roles')
        .select('user_id')
        .eq('rol_id', (await supabase.from('roles').select('id').eq('nombre', 'administrador').single()).data?.id);

      if (adminCheckError) {
        console.error('Error al verificar administradores:', adminCheckError);
        return { success: false, error: adminCheckError.message };
      }

      // Si ya existe un administrador, devolver que ya existe
      if (adminUsers && adminUsers.length > 0) {
        return { success: false, exists: true };
      }

      // Crear el usuario en auth
      const { data: userData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            rol: 'administrador',
            nombre: 'Administrador'
          }
        }
      });

      if (signupError) {
        console.error('Error al crear usuario:', signupError);
        return { success: false, error: signupError.message };
      }

      if (!userData || !userData.user) {
        console.error('No se pudo crear el usuario');
        return { success: false, error: 'No se pudo crear el usuario' };
      }

      // Obtener el ID del rol administrador
      const { data: rolData, error: rolError } = await supabase
        .from('roles')
        .select('id')
        .eq('nombre', 'administrador')
        .single();

      if (rolError || !rolData) {
        console.error('Error al obtener rol administrador:', rolError);
        return { success: false, error: 'Error al obtener rol administrador' };
      }

      // Asignar rol administrador al usuario
      const { error: asignarRolError } = await supabase
        .from('usuarios_roles')
        .insert({
          user_id: userData.user.id,
          rol_id: rolData.id
        });

      if (asignarRolError) {
        console.error('Error al asignar rol:', asignarRolError);
        return { success: false, error: asignarRolError.message };
      }

      // Confirmar email del usuario
      const { error: confirmEmailError } = await supabase.rpc('confirmar_email_usuario', {
        user_email: email
      });

      if (confirmEmailError) {
        console.warn('Error al confirmar email:', confirmEmailError);
        // No bloqueamos el proceso por este error
      }

      return { success: true };
    } catch (error) {
      console.error('Error al crear administrador:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    if (user) {
      console.log('Forzando recarga de datos de usuario (roles y permisos)...');
      
      // Recargar roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('usuarios_roles')
        .select('roles(nombre)')
        .eq('user_id', user.id);

      if (rolesError) {
        console.error('Error al recargar roles:', rolesError);
      } else {
        const roleNames = rolesData ? rolesData.map(r => r.roles.nombre) : [];
        setUserRoles(roleNames);
      }

      // Recargar permisos
      const permissions = await fetchUserPermissions(user.id);
      setUserPermissions(permissions.map(p => p.codigo));
      
      console.log('Datos de usuario recargados.');
    }
  }, [user, fetchUserPermissions]);

  // Valor del contexto
  const contextValue = useMemo(() => ({
    user,
    session,
    loading,
    error,
    authError,
    userRoles,
    login,
    logout,
    hasPermission,
    hasRole,
    isAdmin,
    isSupervisor,
    isEmpleado,
    isProveedor,
    createAndAssignSuperadminRole,
    verificarYCorregirPermisos,
    redirectUserBasedOnRole,
    createAdminUser,
    logAction,
    refreshUserData
  }), [
    user,
    session,
    loading,
    error,
    authError,
    userRoles,
    login,
    logout,
    hasPermission,
    hasRole,
    isAdmin,
    isSupervisor,
    isEmpleado,
    isProveedor,
    createAndAssignSuperadminRole,
    verificarYCorregirPermisos,
    redirectUserBasedOnRole,
    createAdminUser,
    logAction,
    refreshUserData
  ]);

  useEffect(() => {
    initAuth()
  }, [])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}


// Componente para proteger rutas
export const ProtectedRoute = ({ children, requiredPermission, requiredRole }) => {
  const { user, loading, hasPermission, hasRole } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Si el usuario tiene rol superadmin, permitir acceso a todas las rutas
  if (hasRole('superadmin')) {
    return children;
  }

  // Verificar permisos específicos solo si no es superadmin
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/acceso-denegado" replace />
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/acceso-denegado" replace />
  }

  return children
}
