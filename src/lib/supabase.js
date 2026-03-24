import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key disponible:', supabaseAnonKey ? 'Sí' : 'No')
console.log('Supabase Service Key disponible:', supabaseServiceKey ? 'Sí' : 'No')

// Verificar que las credenciales estén presentes
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Error: Faltan credenciales de Supabase')
}

// Crear el cliente Supabase (una sola vez)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
})

// Crear cliente con permisos de administrador (si está disponible la clave)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true
      }
    })
  : supabase; // Fallback al cliente normal si no hay clave de servicio

// Verificar la conexión
const verificarConexion = async () => {
  try {
    const { data, error } = await supabase
      .from('partes')
      .select('count')
      .single()

    if (error) {
      console.error('Error al verificar conexión:', error)
      return false
    }

    console.log('Conexión verificada. Número de registros:', data?.count)
    return true
  } catch (error) {
    console.error('Error al verificar conexión:', error)
    return false
  }
}

verificarConexion()

export const checkSupabaseConnection = verificarConexion

// FUNCIONES AUXILIARES PARA SISTEMA AUTH PERSONALIZADO
/**
 * Obtiene el usuario actual desde nuestro sistema auth personalizado
 * @returns {Object|null} - Objeto usuario o null si no está autenticado
 */
export const getCurrentUser = () => {
  try {
    const customUser = localStorage.getItem('custom_auth_user')
    if (!customUser) {
      return null
    }
    
    const userData = JSON.parse(customUser)
    return {
      id: userData.id,
      email: userData.email,
      nombre: userData.nombre,
      roles: userData.roles || []
    }
  } catch (error) {
    console.error('Error al obtener usuario actual:', error)
    return null
  }
}

/**
 * Verifica si hay un usuario autenticado
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return getCurrentUser() !== null
}
