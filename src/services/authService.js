import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

class AuthService {
  // SISTEMA DE AUTENTICACIÓN PERSONALIZADO - BYPASS DE SUPABASE AUTH
  // Este método NO usa Supabase Auth que está roto
  async login(email, password) {
    try {
      console.log('🚀 USANDO SISTEMA AUTH PERSONALIZADO - BYPASS SUPABASE AUTH')
      
      // Llamar a nuestra función personalizada de login
      const { data, error } = await supabase.rpc('custom_login', {
        p_email: email,
        p_password: password
      })

      if (error) {
        console.error('Error en custom_login:', error)
        return { error: new Error('Error de conexión con la base de datos') }
      }

      // Verificar respuesta de la función personalizada
      if (!data || !data.success) {
        console.error('Login fallido:', data)
        return { 
          error: new Error(data?.error || 'Credenciales inválidas'),
          message: data?.error || 'Credenciales inválidas. Por favor, verifica tu correo electrónico y contraseña.'
        }
      }

      console.log('✅ LOGIN EXITOSO con sistema personalizado:', data.user)

      // Simular estructura de Supabase Auth para compatibilidad
      const mockAuthData = {
        user: {
          id: data.user.id,
          email: data.user.email,
          user_metadata: {
            nombre: data.user.nombre,
            roles: data.user.roles
          },
          app_metadata: {},
          aud: 'authenticated',
          role: 'authenticated'
        },
        session: {
          access_token: data.user.session_token,
          token_type: 'bearer',
          expires_in: 3600,
          user: {
            id: data.user.id,
            email: data.user.email
          }
        }
      }

      // Guardar sesión en localStorage (ya que no usamos Supabase Auth)
      localStorage.setItem('supabase.auth.token', JSON.stringify(mockAuthData))
      localStorage.setItem('custom_auth_user', JSON.stringify(data.user))

      try {
        await this.logAction('login', 'usuarios', data.user.id, {
          email: data.user.email,
          sistema: 'auth_personalizado'
        })
      } catch (logError) {
        console.error('Error al registrar acción de login:', logError)
        // No interrumpimos el flujo por un error en el log
      }

      return { data: mockAuthData }
    } catch (error) {
      console.error('Error en login personalizado:', error)
      return { error }
    }
  }

  // Cerrar sesión - SISTEMA PERSONALIZADO
  async logout() {
    try {
      console.log('🚪 LOGOUT con sistema personalizado')
      
      // Limpiar sesión almacenada localmente
      localStorage.removeItem('supabase.auth.token')
      localStorage.removeItem('custom_auth_user')
      
      // Intentar logout de Supabase también (por compatibilidad)
      try {
        await supabase.auth.signOut()
      } catch (supabaseError) {
        console.log('Supabase Auth signOut falló (esperado):', supabaseError)
      }
      
      return true
    } catch (error) {
      console.error('Error en logout:', error)
      // Forzar limpieza incluso si hay error
      localStorage.removeItem('supabase.auth.token')
      localStorage.removeItem('custom_auth_user')
      return true
    }
  }

  // Registrar nuevo usuario
  async register(email, password, userData = {}) {
    try {
      // Registrar usuario en auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      })

      if (authError) throw authError

      // Registrar acción
      await this.logAction('register', 'usuarios', authData.user.id, {
        email,
        ...userData,
      })

      return { user: authData.user }
    } catch (error) {
      console.error('Error en register:', error)
      throw error
    }
  }

  // Crear usuario administrador inicial
  async createAdminUser(email, password) {
    try {
      // Verificar si ya existe un administrador
      const adminRole = await this.getRoleByName('administrador')
      
      if (!adminRole) {
        console.error('Rol de administrador no encontrado. Asegúrate de ejecutar el script SQL primero.')
        throw new Error('Rol de administrador no encontrado')
      }
      
      const { data: existingAdmins, error: queryError } = await supabase
        .from('usuarios_roles')
        .select('*')
        .eq('rol_id', adminRole.id)

      if (queryError) {
        console.error('Error al verificar administrador:', queryError)
        throw queryError
      }

      if (existingAdmins && existingAdmins.length > 0) {
        console.log('Ya existe un administrador')
        return { exists: true }
      }

      // Primero verificar si el usuario ya existe
      const { data: existingUsers, error: userCheckError } = await supabase.auth.admin.listUsers({
        filters: {
          email: email
        }
      }).catch(err => {
        // Si falla con el método admin (falta de permisos), hacemos una verificación básica
        console.log('No se pudo usar admin.listUsers, intentando método alternativo')
        return { data: null, error: null }
      })

      let userId = null

      // Si el usuario ya existe, lo utilizamos
      if (existingUsers?.users?.length > 0) {
        userId = existingUsers.users[0].id
        console.log('Usuario encontrado, se usará el existente:', userId)
      } else {
        // Crear usuario con autoconfirmación
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nombre: 'Administrador',
              rol: 'administrador'
            },
            emailRedirectTo: `${window.location.origin}/login`,
          },
        })

        if (authError) throw authError
        userId = authData.user.id

        // Intentar confirmar el usuario (si tenemos acceso de admin)
        try {
          const { error: confirmError } = await supabase.auth.admin.updateUserById(
            userId,
            { email_confirm: true }
          ).catch(err => {
            console.log('No se pudo confirmar automáticamente el email, se requiere confirmación manual')
            return { error: err }
          })

          if (!confirmError) {
            console.log('Email confirmado exitosamente')
          }
        } catch (confirmErr) {
          console.log('Error al intentar confirmar email (es normal si no tienes permisos de admin):', confirmErr)
        }
      }

      // Verificar si ya existe una asignación de rol
      const { data: existingRole, error: roleCheckError } = await supabase
        .from('usuarios_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('rol_id', adminRole.id)

      if (roleCheckError) {
        console.error('Error al verificar asignación de rol:', roleCheckError)
      }

      // Solo asignar rol si no existe la asignación
      if (!existingRole || existingRole.length === 0) {
        // Asignar rol al usuario
        const { error: roleError } = await supabase
          .from('usuarios_roles')
          .insert({
            user_id: userId,
            rol_id: adminRole.id
          })

        if (roleError) throw roleError
      } else {
        console.log('El usuario ya tiene el rol de administrador asignado')
      }

      // Registrar acción
      await this.logAction('create_admin', 'usuarios', userId, {
        email,
        role: 'administrador'
      })

      // Mostrar instrucciones si el email debe ser confirmado
      toast.success('Usuario administrador creado. Si recibiste un email de confirmación, por favor confírmalo antes de iniciar sesión.')

      return { user: { id: userId, email }, success: true }
    } catch (error) {
      console.error('Error al crear admin:', error)
      throw error
    }
  }

  // Verificar si un usuario existe
  async checkIfUserExists(email) {
    try {
      const { data, error } = await supabase.auth.admin.listUsers({
        filter: { email }
      })

      if (error) throw error
      
      return data && data.users && data.users.length > 0
    } catch (error) {
      console.error('Error al verificar usuario:', error)
      return false
    }
  }

  // Obtener rol por nombre
  async getRoleByName(roleName) {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('nombre', roleName)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // No se encontró el rol
        }
        console.error(`Error al obtener rol ${roleName}:`, error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error en getRoleByName:', error)
      throw error
    }
  }

  // Obtener permisos de un usuario
  async getUserPermissions(userId) {
    try {
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

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error al obtener permisos:', error)
      return []
    }
  }

  // Obtener roles de un usuario
  async getUserRoles(userId) {
    try {
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

      return data || []
    } catch (error) {
      console.error('Error al obtener roles:', error)
      return []
    }
  }

  // Verificar si es administrador
  async isAdmin(userId) {
    try {
      const roles = await this.getUserRoles(userId)
      return roles.some(role => role.nombre === 'administrador')
    } catch (error) {
      console.error('Error al verificar si es admin:', error)
      return false
    }
  }

  // Registrar acción en log de auditoría
  async logAction(accion, tabla, registroId, detalles = {}) {
    try {
      const { error } = await supabase.from('auditoria').insert({
        accion,
        tabla,
        registro_id: registroId?.toString(),
        detalles,
        user_id: (await supabase.auth.getUser())?.data?.user?.id,
        ip_address: window.location.hostname,
        user_agent: navigator.userAgent
      })

      if (error) console.error('Error al registrar auditoría:', error)
    } catch (error) {
      console.error('Error en logAction:', error)
    }
  }

  // Verificar usuario actual - SISTEMA PERSONALIZADO
  async getCurrentUser() {
    try {
      // Intentar obtener de nuestra sesión personalizada primero
      const customUser = localStorage.getItem('custom_auth_user')
      if (customUser) {
        const userData = JSON.parse(customUser)
        console.log('👤 Usuario obtenido de sesión personalizada:', userData)
        
        // Verificar que la sesión sigue siendo válida
        const { data, error } = await supabase.rpc('verify_custom_session', {
          p_user_id: userData.id
        })
        
        if (error || !data?.success) {
          console.log('Sesión personalizada inválida, limpiando...')
          localStorage.removeItem('custom_auth_user')
          localStorage.removeItem('supabase.auth.token')
          return null
        }
        
        // Retornar en formato compatible con Supabase Auth
        return {
          id: userData.id,
          email: userData.email,
          user_metadata: {
            nombre: userData.nombre,
            roles: userData.roles
          },
          aud: 'authenticated',
          role: 'authenticated'
        }
      }
      
      // Fallback a Supabase Auth si no hay sesión personalizada
      try {
        const { data, error } = await supabase.auth.getUser()
        if (error) throw error
        return data?.user
      } catch (supabaseError) {
        console.log('Supabase Auth getUser falló (esperado):', supabaseError)
        return null
      }
    } catch (error) {
      console.error('Error al obtener usuario actual:', error)
      return null
    }
  }
}

export default new AuthService()
