import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { supabase } from '../lib/supabase'

// Crear contexto de autenticación
const AuthContext = createContext()

// Métodos para gestionar la caché
const getCachedPermissions = (userId) => {
  const key = `permissions_${userId}`
  const cached = localStorage.getItem(key)
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached)
      // Caché válida por 15 minutos
      if (Date.now() - timestamp < 15 * 60 * 1000) {
        return data
      }
    } catch (e) {
      // Si hay error al parsear, ignorar caché
    }
  }
  return null
}

const setCachedPermissions = (userId, permissions) => {
  const key = `permissions_${userId}`
  localStorage.setItem(key, JSON.stringify({
    data: permissions,
    timestamp: Date.now()
  }))
}

const getCachedRoles = (userId) => {
  const key = `roles_${userId}`
  const cached = localStorage.getItem(key)
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached)
      // Caché válida por 15 minutos
      if (Date.now() - timestamp < 15 * 60 * 1000) {
        return data
      }
    } catch (e) {
      // Si hay error al parsear, ignorar caché
    }
  }
  return null
}

const setCachedRoles = (userId, roles) => {
  const key = `roles_${userId}`
  localStorage.setItem(key, JSON.stringify({
    data: roles,
    timestamp: Date.now()
  }))
}

const clearCache = (userId) => {
  if (userId) {
    localStorage.removeItem(`permissions_${userId}`)
    localStorage.removeItem(`roles_${userId}`)
  } else {
    // Limpiar todas las cachés relacionadas
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('permissions_') || key.startsWith('roles_')) {
        localStorage.removeItem(key)
      }
    })
  }
}

// Funciones para obtener permisos y roles del usuario
const getUserPermissions = async (userId) => {
  try {
    // Verificar si hay permisos en caché
    const cachedPermissions = getCachedPermissions(userId)
    if (cachedPermissions) {
      return cachedPermissions
    }

    // Si no hay caché, consultar a la base de datos
    // Primero intentamos obtener los permisos directamente
    const { data, error } = await supabase
      .from('permisos')
      .select(`
        codigo,
        descripcion,
        roles_permisos!inner(
          roles!inner(
            usuarios_roles!inner(
              user_id
            )
          )
        )
      `)
      .eq('roles_permisos.roles.usuarios_roles.user_id', userId)

    if (error) {
      console.error('Error en la consulta principal de permisos:', error)
      
      // Si falla, intentamos con un enfoque alternativo usando múltiples consultas
      // 1. Obtener los roles del usuario
      const { data: userRoles, error: rolesError } = await supabase
        .from('usuarios_roles')
        .select('rol_id')
        .eq('user_id', userId)
      
      if (rolesError) throw rolesError
      
      if (!userRoles || userRoles.length === 0) {
        setCachedPermissions(userId, [])
        return []
      }
      
      // 2. Obtener los permisos para esos roles
      const roleIds = userRoles.map(ur => ur.rol_id)
      
      const { data: rolePermisos, error: permisosError } = await supabase
        .from('roles_permisos')
        .select('permiso_id')
        .in('rol_id', roleIds)
      
      if (permisosError) throw permisosError
      
      if (!rolePermisos || rolePermisos.length === 0) {
        setCachedPermissions(userId, [])
        return []
      }
      
      // 3. Obtener los detalles de los permisos
      const permisoIds = rolePermisos.map(rp => rp.permiso_id)
      
      const { data: permisos, error: permisosDetalleError } = await supabase
        .from('permisos')
        .select('codigo, descripcion')
        .in('id', permisoIds)
      
      if (permisosDetalleError) throw permisosDetalleError
      
      // Guardar en caché y retornar
      const result = permisos || []
      setCachedPermissions(userId, result)
      return result
    }

    // Guardar en caché y retornar
    const result = data || []
    setCachedPermissions(userId, result)
    return result
  } catch (error) {
    console.error('Error al obtener permisos:', error)
    return []
  }
}

const getUserRoles = async (userId) => {
  try {
    // Verificar si hay roles en caché
    const cachedRoles = getCachedRoles(userId)
    if (cachedRoles) {
      return cachedRoles
    }

    // Si no hay caché, consultar a la base de datos
    const { data, error } = await supabase
      .from('roles')
      .select(`
        id,
        nombre,
        descripcion,
        usuarios_roles!inner(user_id)
      `)
      .eq('usuarios_roles.user_id', userId)

    if (error) throw error
    
    // Guardar en caché y retornar
    const result = data || []
    setCachedRoles(userId, result)
    return result
  } catch (error) {
    console.error('Error al obtener roles:', error)
    return []
  }
}

// Función para obtener un rol por su nombre
const getRoleByName = async (roleName) => {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('nombre', roleName)
      .single()
    
    if (error) throw error
    
    return data
  } catch (error) {
    console.error('Error al obtener rol por nombre:', error)
    return null
  }
}

// Función para crear un usuario administrador
const createAdminUser = async (email, password) => {
  try {
    // 1. Crear el usuario en Supabase Auth
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password
    })
    
    if (signUpError) throw signUpError
    
    const userId = user.id
    
    // 2. Obtener el rol de administrador
    const adminRole = await getRoleByName('administrador')
    
    if (!adminRole) {
      throw new Error('No se encontró el rol de administrador')
    }
    
    // 3. Asignar el rol de administrador al usuario
    const { error: roleError } = await supabase
      .from('usuarios_roles')
      .insert({
        user_id: userId,
        rol_id: adminRole.id
      })
    
    if (roleError) throw roleError
    
    // 4. Registrar la acción en auditoría
    await logAction('crear_usuario', 'usuarios', userId, {
      email,
      rol: 'administrador'
    })
    
    // Mostrar instrucciones si el email debe ser confirmado
    toast.success('Usuario administrador creado. Si recibiste un email de confirmación, por favor confírmalo antes de iniciar sesión.')

    return { user: { id: userId, email }, success: true }
  } catch (error) {
    console.error('Error al crear admin:', error)
    throw error
  }
}

// Función para registrar acciones en auditoría
const logAction = async (accion, tabla, registroId, detalles = {}) => {
  try {
    // Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.error('No hay usuario autenticado para registrar la acción')
      return
    }
    
    // Simplificar los detalles para evitar problemas
    const detallesSimplificados = typeof detalles === 'object' ? 
      JSON.stringify(detalles) : 
      String(detalles)
    
    // Insertar directamente en la tabla de auditoría
    const { error } = await supabase.from('auditoria').insert({
      accion,
      tabla,
      registro_id: registroId ? String(registroId) : null,
      detalles: detallesSimplificados,
      user_id: user.id
    })
    
    if (error) {
      console.error('Error al registrar auditoría:', error)
    }
  } catch (error) {
    console.error('Error en logAction:', error)
  }
}

// Función para obtener registros de auditoría
const getAuditoriaRegistros = async (opciones = {}) => {
  try {
    // Opciones por defecto
    const {
      limite = 50,
      pagina = 1,
      ordenar = 'created_at',
      direccion = 'desc',
      filtros = {}
    } = opciones
    
    // Calcular el offset para la paginación
    const offset = (pagina - 1) * limite
    
    // Construir la consulta base
    let query = supabase
      .from('auditoria')
      .select('*', { count: 'exact' })
      .order(ordenar, { ascending: direccion === 'asc' })
      .range(offset, offset + limite - 1)
    
    // Aplicar filtros si existen
    if (filtros.userId) {
      query = query.eq('user_id', filtros.userId)
    }
    
    if (filtros.accion) {
      query = query.eq('accion', filtros.accion)
    }
    
    if (filtros.tabla) {
      query = query.eq('tabla', filtros.tabla)
    }
    
    if (filtros.fechaInicio) {
      query = query.gte('created_at', filtros.fechaInicio)
    }
    
    if (filtros.fechaFin) {
      query = query.lte('created_at', filtros.fechaFin)
    }
    
    // Ejecutar la consulta
    const { data, error, count } = await query
    
    if (error) throw error
    
    return {
      registros: data || [],
      paginacion: {
        pagina,
        limite,
        total: count || 0,
        totalPaginas: Math.ceil((count || 0) / limite)
      }
    }
  } catch (error) {
    console.error('Error al obtener registros de auditoría:', error)
    return {
      registros: [],
      paginacion: {
        pagina: 1,
        limite: 50,
        total: 0,
        totalPaginas: 0
      }
    }
  }
}

// Función para obtener estadísticas de auditoría
const getEstadisticasAuditoria = async (fechaInicio, fechaFin) => {
  try {
    // Implementar lógica para obtener estadísticas
    // ...
    
    return {
      totalAcciones: 0,
      accionesPorTipo: {},
      accionesPorUsuario: {},
      accionesPorTabla: {}
    }
  } catch (error) {
    console.error('Error al obtener estadísticas de auditoría:', error)
    return null
  }
}

// Función para obtener historial de un registro
const getHistorialRegistro = async (tabla, registroId) => {
  try {
    const { data, error } = await supabase
      .from('auditoria')
      .select('*')
      .eq('tabla', tabla)
      .eq('registro_id', registroId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return data || []
  } catch (error) {
    console.error('Error al obtener historial del registro:', error)
    return []
  }
}

// Función para obtener todos los roles
const getAllRoles = async () => {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('nombre')
    
    if (error) throw error
    
    return data || []
  } catch (error) {
    console.error('Error al obtener roles:', error)
    return []
  }
}

// Función para obtener todos los permisos
const getAllPermissions = async () => {
  try {
    const { data, error } = await supabase
      .from('permisos')
      .select('*')
      .order('codigo')
    
    if (error) throw error
    
    return data || []
  } catch (error) {
    console.error('Error al obtener permisos:', error)
    return []
  }
}

// Función para obtener los permisos de un rol
const getRolePermissions = async (roleId) => {
  try {
    const { data, error } = await supabase
      .from('roles_permisos')
      .select(`
        permiso_id,
        permisos:permiso_id (id, codigo, descripcion)
      `)
      .eq('rol_id', roleId)
    
    if (error) throw error
    
    return data?.map(rp => rp.permisos) || []
  } catch (error) {
    console.error('Error al obtener permisos del rol:', error)
    return []
  }
}

// Función para asignar un permiso a un rol
const assignPermissionToRole = async (roleId, permissionId) => {
  try {
    const { error } = await supabase
      .from('roles_permisos')
      .insert({
        rol_id: roleId,
        permiso_id: permissionId
      })
    
    if (error) throw error
    
    return true
  } catch (error) {
    console.error('Error al asignar permiso a rol:', error)
    return false
  }
}

// Función para eliminar un permiso de un rol
const removePermissionFromRole = async (roleId, permissionId) => {
  try {
    const { error } = await supabase
      .from('roles_permisos')
      .delete()
      .eq('rol_id', roleId)
      .eq('permiso_id', permissionId)
    
    if (error) throw error
    
    return true
  } catch (error) {
    console.error('Error al eliminar permiso de rol:', error)
    return false
  }
}

// Función para asignar un rol a un usuario
const assignRoleToUser = async (userId, roleId) => {
  try {
    // Verificar si ya tiene el rol asignado
    const { data: existingRole, error: checkError } = await supabase
      .from('usuarios_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('rol_id', roleId)
      .maybeSingle()
    
    if (checkError) throw checkError
    
    // Si ya tiene el rol, no hacer nada
    if (existingRole) {
      return true
    }
    
    // Asignar el rol
    const { error } = await supabase
      .from('usuarios_roles')
      .insert({
        user_id: userId,
        rol_id: roleId
      })
    
    if (error) throw error
    
    // Limpiar caché de permisos y roles
    clearCache(userId)
    
    return true
  } catch (error) {
    console.error('Error al asignar rol a usuario:', error)
    return false
  }
}

// Función para eliminar un rol de un usuario
const removeRoleFromUser = async (userId, roleId) => {
  try {
    // Verificar si es el último rol del usuario
    const { data: userRoles, error: checkError } = await supabase
      .from('usuarios_roles')
      .select('*')
      .eq('user_id', userId)
    
    if (checkError) throw checkError
    
    // No permitir eliminar el último rol
    if (userRoles.length <= 1) {
      throw new Error('No se puede eliminar el último rol del usuario')
    }
    
    // Eliminar el rol
    const { error } = await supabase
      .from('usuarios_roles')
      .delete()
      .eq('user_id', userId)
      .eq('rol_id', roleId)
    
    if (error) throw error
    
    // Limpiar caché de permisos y roles
    clearCache(userId)
    
    return true
  } catch (error) {
    console.error('Error al eliminar rol de usuario:', error)
    throw error
  }
}

// Función para obtener usuarios con sus roles
const getUsersWithRoles = async () => {
  try {
    // Obtener usuarios de Auth
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) throw authError
    
    // Obtener roles de usuarios
    const { data: userRoles, error: rolesError } = await supabase
      .from('usuarios_roles')
      .select(`
        user_id,
        roles:rol_id (id, nombre, descripcion)
      `)
    
    if (rolesError) throw rolesError
    
    // Combinar la información
    const usersWithRoles = users.map(user => {
      const roles = userRoles
        .filter(ur => ur.user_id === user.id)
        .map(ur => ur.roles)
      
      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        roles
      }
    })
    
    return usersWithRoles
  } catch (error) {
    console.error('Error al obtener usuarios con roles:', error)
    return []
  }
}

// Métodos de autenticación
const login = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    
    // Registrar acción de login
    if (data.user) {
      try {
        await supabase.from('auditoria').insert({
          accion: 'login',
          tabla: 'usuarios',
          user_id: data.user.id,
          detalles: JSON.stringify({
            email: data.user.email,
            timestamp: new Date().toISOString()
          })
        })
      } catch (logError) {
        console.error('Error al registrar login:', logError)
      }
    }
    
    return { data, error: null }
  } catch (error) {
    console.error('Error en login:', error)
    return { data: null, error }
  }
}

const logout = async () => {
  try {
    // Obtener usuario actual antes de cerrar sesión
    const { data: { user } } = await supabase.auth.getUser()
    
    // Cerrar sesión
    const { error } = await supabase.auth.signOut()
    
    if (error) throw error
    
    // Registrar acción de logout
    if (user) {
      try {
        await supabase.from('auditoria').insert({
          accion: 'logout',
          tabla: 'usuarios',
          user_id: user.id,
          detalles: JSON.stringify({
            email: user.email,
            timestamp: new Date().toISOString()
          })
        })
      } catch (logError) {
        console.error('Error al registrar logout:', logError)
      }
    }
    
    return { error: null }
  } catch (error) {
    console.error('Error en logout:', error)
    return { error }
  }
}

// Proveedor del contexto de autenticación
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userPermissions, setUserPermissions] = useState([])
  const [userRoles, setUserRoles] = useState([])
  const navigate = useNavigate()

  // Efecto para cargar la sesión del usuario
  useEffect(() => {
    const loadUserSession = async () => {
      try {
        setLoading(true)
        
        // Obtener sesión actual
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        setSession(currentSession)
        
        if (currentSession?.user) {
          setUser(currentSession.user)
          
          // Simplemente establecer permisos y roles vacíos por ahora
          // para evitar el bucle infinito
          setUserPermissions([])
          setUserRoles([])
        }
      } catch (error) {
        console.error('Error al cargar sesión:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadUserSession()
    
    // Suscribirse a cambios de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Evento de autenticación:', event)
      setSession(newSession)
      
      if (event === 'SIGNED_IN' && newSession?.user) {
        setUser(newSession.user)
        
        // Simplemente establecer permisos y roles vacíos por ahora
        // para evitar el bucle infinito
        setUserPermissions([])
        setUserRoles([])
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setUserPermissions([])
        setUserRoles([])
        navigate('/login')
      }
    })
    
    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [navigate])

  // Función optimizada para verificar permisos
  const hasPermission = useCallback((permissionCode) => {
    // Si no hay usuario o no hay permisos, no tiene el permiso
    if (!user || !userPermissions || userPermissions.length === 0) {
      return false;
    }
    
    // Verificar si el usuario tiene el permiso específico
    return userPermissions.some(p => p.codigo === permissionCode);
  }, [user, userPermissions]);
  
  // Función optimizada para verificar roles
  const hasRole = useCallback((roleName) => {
    // Si no hay usuario o no hay roles, no tiene el rol
    if (!user || !userRoles || userRoles.length === 0) {
      return false;
    }
    
    // Verificar si el usuario tiene el rol específico
    return userRoles.some(r => r.nombre === roleName);
  }, [user, userRoles]);

  // Funciones para verificar roles específicos
  const isAdmin = useCallback(() => hasRole('administrador'), [hasRole])
  const isSupervisor = useCallback(() => hasRole('supervisor'), [hasRole])
  const isEmpleado = useCallback(() => hasRole('empleado'), [hasRole])
  const isProveedor = useCallback(() => hasRole('proveedor'), [hasRole])
  
  // Función para actualizar permisos y roles del usuario
  const refreshUserPermissionsAndRoles = useCallback(async () => {
    if (!user) return
    
    try {
      // Limpiar caché para forzar recarga desde la base de datos
      clearCache(user.id)
      
      // Cargar permisos y roles del usuario
      const [permissions, roles] = await Promise.all([
        getUserPermissions(user.id),
        getUserRoles(user.id)
      ])
      
      setUserPermissions(permissions)
      setUserRoles(roles)
    } catch (error) {
      console.error('Error al actualizar permisos y roles:', error)
    }
  }, [user])
  
  // Funciones de autenticación
  const handleLogin = async (email, password) => {
    try {
      const { data, error } = await login(email, password)
      if (error) throw error
      return data
    } catch (error) {
      throw error
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      setUser(null)
      setUserPermissions([])
      setUserRoles([])
    } catch (error) {
      console.error('Error en logout:', error)
    }
  }

  // Funciones para gestión de roles y permisos
  const handleAssignRoleToUser = async (userId, roleId) => {
    const result = await assignRoleToUser(userId, roleId)
    if (userId === user?.id) {
      await refreshUserPermissionsAndRoles()
    }
    return result
  }

  const handleRemoveRoleFromUser = async (userId, roleId) => {
    const result = await removeRoleFromUser(userId, roleId)
    if (userId === user?.id) {
      await refreshUserPermissionsAndRoles()
    }
    return result
  }

  const handleAssignPermissionToRole = async (roleId, permissionId) => {
    const result = await assignPermissionToRole(roleId, permissionId)
    await refreshUserPermissionsAndRoles()
    return result
  }

  const handleRemovePermissionFromRole = async (roleId, permissionId) => {
    const result = await removePermissionFromRole(roleId, permissionId)
    await refreshUserPermissionsAndRoles()
    return result
  }

  // Crear valor del contexto
  const contextValue = useMemo(() => ({
    user,
    session,
    loading,
    login: handleLogin,
    logout: handleLogout,
    hasPermission,
    hasRole,
    isAdmin,
    isSupervisor,
    isEmpleado,
    isProveedor,
    userPermissions,
    userRoles,
    refreshUserPermissionsAndRoles,
    // Funciones de gestión de roles y permisos
    getAllRoles,
    getAllPermissions,
    getRolePermissions,
    assignPermissionToRole: handleAssignPermissionToRole,
    removePermissionFromRole: handleRemovePermissionFromRole,
    assignRoleToUser: handleAssignRoleToUser,
    removeRoleFromUser: handleRemoveRoleFromUser,
    getUsersWithRoles,
    // Función para registrar acciones en la auditoría
    logAction,
    createAdminUser,
    getAuditoriaRegistros,
    getEstadisticasAuditoria,
    getHistorialRegistro
  }), [
    user, 
    session, 
    loading, 
    hasPermission, 
    hasRole, 
    isAdmin, 
    isSupervisor, 
    isEmpleado, 
    isProveedor,
    userPermissions, 
    userRoles,
    refreshUserPermissionsAndRoles
  ])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook personalizado para usar el contexto
const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}

// Componente para proteger rutas
const ProtectedRoute = ({ children, requiredPermission, requiredRole }) => {
  const { user, loading } = useAuth()
  const auth = useAuth();
  const hasPermission = auth.hasPermission || (() => false);
  const hasRole = auth.hasRole || (() => false);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-700">Cargando...</span>
      </div>
    )
  }
  
  // Si no hay usuario, redirigir al login
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  // Verificar permiso requerido
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Acceso Denegado</h2>
          <p className="text-gray-600">No tienes el permiso necesario para acceder a esta página.</p>
        </div>
      </div>
    )
  }
  
  // Verificar rol requerido
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Acceso Denegado</h2>
          <p className="text-gray-600">No tienes el rol necesario para acceder a esta página.</p>
        </div>
      </div>
    )
  }
  
  return children
}

export { AuthProvider, useAuth, ProtectedRoute }
