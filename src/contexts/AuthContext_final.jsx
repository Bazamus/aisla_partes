import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { supabase } from '../lib/supabase'

// Crear el contexto de autenticación
const AuthContext = createContext(null)

// Proveedor del contexto de autenticación
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userPermissions, setUserPermissions] = useState([])
  const [userRoles, setUserRoles] = useState([])
  const navigate = useNavigate()

  // Verificar si hay una sesión activa al cargar la aplicación
  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true)
        
        // Obtener la sesión actual
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error al obtener la sesión:', error)
          return
        }
        
        if (currentSession) {
          setSession(currentSession)
          setUser(currentSession.user)
          
          // Cargar permisos y roles del usuario
          await getUserPermissions(currentSession.user.id)
          await getUserRoles(currentSession.user.id)
        }
      } catch (error) {
        console.error('Error al verificar la sesión:', error)
      } finally {
        setLoading(false)
      }
    }
    
    checkSession()
    
    // Suscribirse a cambios en la autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event, newSession)
      
      if (event === 'SIGNED_IN' && newSession) {
        setSession(newSession)
        setUser(newSession.user)
        
        // Cargar permisos y roles del usuario
        await getUserPermissions(newSession.user.id)
        await getUserRoles(newSession.user.id)
      } else if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
        setUserPermissions([])
        setUserRoles([])
        
        // Limpiar caché de permisos y roles
        localStorage.removeItem('userPermissions')
        localStorage.removeItem('userRoles')
      }
    })
    
    // Limpiar suscripción al desmontar
    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  // Función para iniciar sesión
  const login = useCallback(async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      // Registrar acción de inicio de sesión
      await logAction('Inicio de sesión', `El usuario ${email} ha iniciado sesión`)
      
      return { success: true, data }
    } catch (error) {
      console.error('Error al iniciar sesión:', error)
      return { success: false, error: error.message }
    }
  }, [])

  // Función para cerrar sesión
  const logout = useCallback(async () => {
    try {
      // Registrar acción de cierre de sesión
      if (user) {
        await logAction('Cierre de sesión', `El usuario ${user.email} ha cerrado sesión`)
      }
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Limpiar estado y caché
      setSession(null)
      setUser(null)
      setUserPermissions([])
      setUserRoles([])
      localStorage.removeItem('userPermissions')
      localStorage.removeItem('userRoles')
      
      // Redirigir al login
      navigate('/login')
      
      return { success: true }
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      return { success: false, error: error.message }
    }
  }, [user, navigate])

  // Función para obtener los permisos del usuario
  const getUserPermissions = useCallback(async (userId) => {
    try {
      // Verificar si hay permisos en caché
      const cachedPermissions = localStorage.getItem('userPermissions')
      if (cachedPermissions) {
        const parsedPermissions = JSON.parse(cachedPermissions)
        setUserPermissions(parsedPermissions)
        return parsedPermissions
      }
      
      // Obtener roles del usuario
      const { data: userRolesData, error: rolesError } = await supabase
        .from('usuarios_roles')
        .select('rol_id')
        .eq('user_id', userId)
      
      if (rolesError) throw rolesError
      
      if (!userRolesData || userRolesData.length === 0) {
        setUserPermissions([])
        localStorage.setItem('userPermissions', JSON.stringify([]))
        return []
      }
      
      const roleIds = userRolesData.map(role => role.rol_id)
      
      // Obtener permisos asociados a esos roles
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('roles_permisos')
        .select('permisos(*)')
        .in('rol_id', roleIds)
      
      if (permissionsError) throw permissionsError
      
      // Extraer y eliminar duplicados
      const permissions = permissionsData
        .map(p => p.permisos)
        .filter(Boolean)
      
      // Eliminar duplicados basados en el ID
      const uniquePermissions = Array.from(
        new Map(permissions.map(item => [item.id, item])).values()
      )
      
      setUserPermissions(uniquePermissions)
      
      // Guardar en caché
      localStorage.setItem('userPermissions', JSON.stringify(uniquePermissions))
      
      return uniquePermissions
    } catch (error) {
      console.error('Error al obtener permisos del usuario:', error)
      return []
    }
  }, [])

  // Función para obtener los roles del usuario
  const getUserRoles = useCallback(async (userId) => {
    try {
      // Verificar si hay roles en caché
      const cachedRoles = localStorage.getItem('userRoles')
      if (cachedRoles) {
        const parsedRoles = JSON.parse(cachedRoles)
        setUserRoles(parsedRoles)
        return parsedRoles
      }
      
      // Obtener roles del usuario
      const { data: userRolesData, error: rolesError } = await supabase
        .from('usuarios_roles')
        .select('roles(*)')
        .eq('user_id', userId)
      
      if (rolesError) throw rolesError
      
      if (!userRolesData || userRolesData.length === 0) {
        setUserRoles([])
        localStorage.setItem('userRoles', JSON.stringify([]))
        return []
      }
      
      // Extraer roles
      const roles = userRolesData
        .map(r => r.roles)
        .filter(Boolean)
      
      setUserRoles(roles)
      
      // Guardar en caché
      localStorage.setItem('userRoles', JSON.stringify(roles))
      
      return roles
    } catch (error) {
      console.error('Error al obtener roles del usuario:', error)
      return []
    }
  }, [])

  // Función para verificar si el usuario tiene un permiso específico
  const hasPermission = useCallback((permissionCode) => {
    if (!userPermissions || userPermissions.length === 0) return false
    return userPermissions.some(p => p.codigo === permissionCode)
  }, [userPermissions])

  // Función para verificar si el usuario tiene un rol específico
  const hasRole = useCallback((roleName) => {
    if (!userRoles || userRoles.length === 0) return false
    return userRoles.some(r => r.nombre === roleName)
  }, [userRoles])

  // Función para registrar acciones en la tabla de auditoría
  const logAction = useCallback(async (accion, detalles = '') => {
    try {
      const { error } = await supabase.from('auditoria').insert({
        accion,
        detalles,
        user_id: user?.id,
        user_email: user?.email
      })
      
      if (error) throw error
      
      return { success: true }
    } catch (error) {
      console.error('Error al registrar acción:', error)
      return { success: false, error: error.message }
    }
  }, [user])

  // Funciones para gestión de roles y permisos
  const getAllRoles = useCallback(async () => {
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
  }, [])

  const getAllPermissions = useCallback(async () => {
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
  }, [])

  const getRolePermissions = useCallback(async (roleId) => {
    try {
      const { data, error } = await supabase
        .from('roles_permisos')
        .select('permisos(*)')
        .eq('rol_id', roleId)
      
      if (error) throw error
      
      return data?.map(item => item.permisos) || []
    } catch (error) {
      console.error('Error al obtener permisos del rol:', error)
      return []
    }
  }, [])

  const assignPermissionToRole = useCallback(async (roleId, permissionId) => {
    try {
      const { error } = await supabase
        .from('roles_permisos')
        .insert({
          rol_id: roleId,
          permiso_id: permissionId
        })
      
      if (error) throw error
      
      await logAction('Asignación de permiso', `Se asignó un permiso al rol ${roleId}`)
      
      return { success: true }
    } catch (error) {
      console.error('Error al asignar permiso al rol:', error)
      return { success: false, error: error.message }
    }
  }, [logAction])

  const removePermissionFromRole = useCallback(async (roleId, permissionId) => {
    try {
      const { error } = await supabase
        .from('roles_permisos')
        .delete()
        .eq('rol_id', roleId)
        .eq('permiso_id', permissionId)
      
      if (error) throw error
      
      await logAction('Eliminación de permiso', `Se eliminó un permiso del rol ${roleId}`)
      
      return { success: true }
    } catch (error) {
      console.error('Error al eliminar permiso del rol:', error)
      return { success: false, error: error.message }
    }
  }, [logAction])

  const getUsersWithRoles = useCallback(async () => {
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      
      if (authError) throw authError
      
      const users = authUsers.users || []
      
      // Obtener roles para cada usuario
      const usersWithRoles = await Promise.all(
        users.map(async (user) => {
          const { data: rolesData } = await supabase
            .from('usuarios_roles')
            .select('roles(*)')
            .eq('user_id', user.id)
          
          const roles = rolesData?.map(item => item.roles) || []
          
          return {
            ...user,
            roles
          }
        })
      )
      
      return usersWithRoles
    } catch (error) {
      console.error('Error al obtener usuarios con roles:', error)
      return []
    }
  }, [])

  const assignRoleToUser = useCallback(async (userId, roleId) => {
    try {
      const { error } = await supabase
        .from('usuarios_roles')
        .insert({
          user_id: userId,
          rol_id: roleId
        })
      
      if (error) throw error
      
      await logAction('Asignación de rol', `Se asignó un rol al usuario ${userId}`)
      
      return { success: true }
    } catch (error) {
      console.error('Error al asignar rol al usuario:', error)
      return { success: false, error: error.message }
    }
  }, [logAction])

  const removeRoleFromUser = useCallback(async (userId, roleId) => {
    try {
      const { error } = await supabase
        .from('usuarios_roles')
        .delete()
        .eq('user_id', userId)
        .eq('rol_id', roleId)
      
      if (error) throw error
      
      await logAction('Eliminación de rol', `Se eliminó un rol del usuario ${userId}`)
      
      return { success: true }
    } catch (error) {
      console.error('Error al eliminar rol del usuario:', error)
      return { success: false, error: error.message }
    }
  }, [logAction])

  // Función para crear y asignar rol de superadmin
  const createAndAssignSuperadminRole = useCallback(async (email) => {
    try {
      // 1. Verificar si ya existe el rol superadmin
      const { data: existingRoles, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .eq('nombre', 'superadmin');
      
      if (rolesError) throw rolesError;
      
      let superadminRoleId;
      
      // Si no existe, crearlo
      if (!existingRoles || existingRoles.length === 0) {
        const { data: newRole, error: createRoleError } = await supabase
          .from('roles')
          .insert({
            nombre: 'superadmin',
            descripcion: 'Acceso total a todas las funcionalidades del sistema'
          })
          .select()
          .single();
        
        if (createRoleError) throw createRoleError;
        superadminRoleId = newRole.id;
      } else {
        superadminRoleId = existingRoles[0].id;
      }
      
      // 2. Obtener todos los permisos
      const { data: allPermisos, error: permisosError } = await supabase
        .from('permisos')
        .select('*');
      
      if (permisosError) throw permisosError;
      
      // 3. Asignar todos los permisos al rol superadmin
      for (const permiso of allPermisos) {
        // Verificar si ya existe la asignación
        const { data: existingAssignment, error: checkError } = await supabase
          .from('roles_permisos')
          .select('*')
          .eq('rol_id', superadminRoleId)
          .eq('permiso_id', permiso.id);
        
        if (checkError) throw checkError;
        
        // Si no existe, crear la asignación
        if (!existingAssignment || existingAssignment.length === 0) {
          const { error: assignError } = await supabase
            .from('roles_permisos')
            .insert({
              rol_id: superadminRoleId,
              permiso_id: permiso.id
            });
          
          if (assignError) throw assignError;
        }
      }
      
      // 4. Buscar al usuario por email
      // Intentar buscar en la tabla auth.users
      const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserByEmail(email);
      
      if (authUserError || !authUser) {
        // Intentar buscar en la tabla de usuarios
        const { data: users, error: usersError } = await supabase
          .from('auth.users')
          .select('id')
          .eq('email', email);
        
        if (usersError || !users || users.length === 0) {
          throw new Error(`No se encontró el usuario con email ${email}`);
        }
        
        // 5. Asignar el rol superadmin al usuario
        const { error: assignRoleError } = await supabase
          .from('usuarios_roles')
          .insert({
            user_id: users[0].id,
            rol_id: superadminRoleId
          });
        
        if (assignRoleError) throw assignRoleError;
      } else {
        // 5. Asignar el rol superadmin al usuario
        const { error: assignRoleError } = await supabase
          .from('usuarios_roles')
          .insert({
            user_id: authUser.id,
            rol_id: superadminRoleId
          });
        
        if (assignRoleError) throw assignRoleError;
      }
      
      // 6. Registrar la acción en el log de auditoría
      await logAction('Asignación de rol superadmin', `Se asignó el rol superadmin al usuario ${email}`);
      
      // 7. Actualizar los permisos y roles del usuario actual si es el mismo
      if (user && user.email === email) {
        await getUserPermissions(user.id);
        await getUserRoles(user.id);
      }
      
      return { success: true, message: `Rol superadmin asignado correctamente a ${email}` };
    } catch (error) {
      console.error('Error al crear/asignar rol superadmin:', error);
      return { success: false, error: error.message };
    }
  }, [logAction, getUserPermissions, getUserRoles, user]);

  // Funciones para auditoría
  const getAuditoriaRegistros = useCallback(async (filtros = {}, pagina = 1, porPagina = 10) => {
    try {
      let query = supabase
        .from('auditoria')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
      
      // Aplicar filtros
      if (filtros.accion) {
        query = query.ilike('accion', `%${filtros.accion}%`)
      }
      
      if (filtros.usuario) {
        query = query.ilike('user_email', `%${filtros.usuario}%`)
      }
      
      if (filtros.fechaDesde) {
        query = query.gte('created_at', filtros.fechaDesde)
      }
      
      if (filtros.fechaHasta) {
        query = query.lte('created_at', filtros.fechaHasta)
      }
      
      // Paginación
      const desde = (pagina - 1) * porPagina
      query = query.range(desde, desde + porPagina - 1)
      
      const { data, error, count } = await query
      
      if (error) throw error
      
      return {
        registros: data || [],
        total: count || 0,
        pagina,
        porPagina,
        totalPaginas: Math.ceil((count || 0) / porPagina)
      }
    } catch (error) {
      console.error('Error al obtener registros de auditoría:', error)
      return {
        registros: [],
        total: 0,
        pagina,
        porPagina,
        totalPaginas: 0
      }
    }
  }, [])

  const getEstadisticasAuditoria = useCallback(async () => {
    try {
      // Obtener total de registros
      const { count: totalRegistros, error: countError } = await supabase
        .from('auditoria')
        .select('*', { count: 'exact', head: true })
      
      if (countError) throw countError
      
      // Obtener acciones más comunes
      const { data: accionesFrecuentes, error: accionesError } = await supabase
        .rpc('acciones_frecuentes')
      
      if (accionesError) throw accionesError
      
      // Obtener usuarios más activos
      const { data: usuariosActivos, error: usuariosError } = await supabase
        .rpc('usuarios_activos')
      
      if (usuariosError) throw usuariosError
      
      return {
        totalRegistros,
        accionesFrecuentes: accionesFrecuentes || [],
        usuariosActivos: usuariosActivos || []
      }
    } catch (error) {
      console.error('Error al obtener estadísticas de auditoría:', error)
      return {
        totalRegistros: 0,
        accionesFrecuentes: [],
        usuariosActivos: []
      }
    }
  }, [])

  const getHistorialRegistro = useCallback(async (registroId) => {
    try {
      const { data, error } = await supabase
        .from('auditoria')
        .select('*')
        .eq('id', registroId)
        .single()
      
      if (error) throw error
      
      return data
    } catch (error) {
      console.error('Error al obtener historial de registro:', error)
      return null
    }
  }, [])

  // Valores del contexto
  const value = useMemo(() => ({
    user,
    session,
    loading,
    login,
    logout,
    hasPermission,
    hasRole,
    userPermissions,
    userRoles,
    getAllRoles,
    getAllPermissions,
    getRolePermissions,
    assignPermissionToRole,
    removePermissionFromRole,
    getUsersWithRoles,
    assignRoleToUser,
    removeRoleFromUser,
    logAction,
    createAndAssignSuperadminRole,
    getAuditoriaRegistros,
    getEstadisticasAuditoria,
    getHistorialRegistro
  }), [
    user, 
    session, 
    loading, 
    login, 
    logout, 
    hasPermission, 
    hasRole, 
    userPermissions, 
    userRoles,
    getAllRoles,
    getAllPermissions,
    getRolePermissions,
    assignPermissionToRole,
    removePermissionFromRole,
    getUsersWithRoles,
    assignRoleToUser,
    removeRoleFromUser,
    logAction,
    createAndAssignSuperadminRole,
    getAuditoriaRegistros,
    getEstadisticasAuditoria,
    getHistorialRegistro
  ])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook personalizado para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}

// Componente para proteger rutas
export function ProtectedRoute({ children, requiredPermission, requiredRole }) {
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
  
  // Si el usuario es superadmin, permitir acceso a todo
  if (hasRole('superadmin')) {
    return children
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
