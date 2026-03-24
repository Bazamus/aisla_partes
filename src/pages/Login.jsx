import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { LockClosedIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'
import authService from '../services/authService'
import '../assets/login-pattern.css'

export default function Login() {
  const navigate = useNavigate()
  const { user, login, createAdminUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [adminExists, setAdminExists] = useState(true) // Por defecto asumimos que existe
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false)

  // Verificación simplificada: si hay usuario, redirigir al inicio
  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])

  // Verificar si existe un administrador o superadmin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // Si estamos en modo de emergencia, no verificar
        if (window.EMERGENCY_MODE) {
          return
        }

        // Llamar a la función RPC para verificar si hay administradores registrados
        const { data: exists, error: rpcError } = await supabase.rpc('hay_administradores_registrados');

        if (rpcError) {
          console.error('Error al llamar a la función hay_administradores_registrados:', rpcError);
          setAdminExists(false);
          return;
        }

        // La función devuelve un booleano directamente
        setAdminExists(exists);

        // Si no hay admin, establecer admin@partes.com como email por defecto
        if (!exists) {
          setEmail('admin@partes.com');
          setPassword('admin123');
        }
      } catch (err) {
        console.error('Error al verificar administrador:', err)
        setAdminExists(false)
        // Establecer admin@partes.com como email por defecto en caso de error
        setEmail('admin@partes.com')
        setPassword('admin123')
      }
    }

    checkAdmin()
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Usar directamente el servicio de autenticación
      const result = await authService.login(email, password)
      
      // Verificar si hay errores
      if (result && result.error) {
        console.error('Error de autenticación:', result.error)
        
        // Usar el mensaje personalizado del servicio
        const errorMsg = result.message || 
          (result.error.code === 'email_not_confirmed' ? 'Email no confirmado. Revisa tu bandeja de entrada.' :
          result.error.code === 'invalid_credentials' ? 'Credenciales inválidas. Verifica tu email y contraseña.' :
          'Error al iniciar sesión')
        
        setError(errorMsg)
        toast.error(errorMsg)
        return // Evitar continuar con el proceso
      }
      
      // Si no hay errores, usar el contexto de autenticación para establecer la sesión
      if (result.data) {
        // Actualizar el contexto de autenticación usando login del contexto
        await login(email, password)
      }
    } catch (err) {
      console.error('Error en el proceso de inicio de sesión:', err)
      const errorMsg = 'Error inesperado al iniciar sesión. Por favor, inténtalo de nuevo.'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAdmin = async () => {
    setError('')
    setIsCreatingAdmin(true)

    try {
      // Si la función createAdminUser no está disponible, usar supabase directamente
      if (typeof createAdminUser !== 'function') {
        console.log('Usando método alternativo para crear administrador');

        // Verificar si existe un administrador
        const { data: adminRoles } = await supabase
          .from('roles')
          .select('id')
          .eq('nombre', 'administrador')
          .single();

        if (!adminRoles) {
          // Crear rol administrador si no existe
          await supabase
            .from('roles')
            .insert({
              nombre: 'administrador',
              descripcion: 'Rol con acceso administrativo al sistema'
            });
        }

        // Crear usuario en auth
        const { data: userData, error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              rol: 'administrador',
              nombre: 'Administrador'
            },
            emailRedirectTo: window.location.origin
          }
        });

        if (signupError) {
          throw signupError;
        }

        toast.success('Administrador creado exitosamente');
        setAdminExists(true);
        await login(email, password);
      } else {
        // Usar la función del contexto si está disponible
        const result = await createAdminUser(email, password);

        if (result.success) {
          toast.success('Administrador creado exitosamente');
          setAdminExists(true);
          await login(email, password);
        } else if (result.exists) {
          toast('Ya existe un administrador, inicia sesión');
          setAdminExists(true);
        } else {
          throw new Error(result.error || 'Error desconocido');
        }
      }
    } catch (err) {
      console.error('Error al crear administrador:', err);
      setError('No se pudo crear el administrador');
      toast.error('Error al crear administrador');

      // Intentar iniciar sesión de todos modos
      try {
        await login(email, password);
      } catch (loginErr) {
        console.error('Error al intentar iniciar sesión:', loginErr);
      }
    } finally {
      setIsCreatingAdmin(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 px-4" style={{background: 'linear-gradient(to bottom right, #e0f2fe, #f5f5f5)'}}>
      <div className="flex justify-center">
        <div className="w-full max-w-5xl flex rounded-xl shadow-2xl overflow-hidden">
          {/* Panel izquierdo - Imagen/Logo */}
          <div className="hidden lg:block lg:w-1/2 p-12 relative" style={{backgroundColor: '#0d9488'}}>
            <div className="absolute inset-0 opacity-10 bg-pattern-squares"></div>
            <div className="relative h-full flex flex-col items-center justify-between">
              <div className="w-64 mb-8">
                <img
                  src="/aisla_logo.svg"
                  alt="Aisla Partes Logo"
                  className="w-full h-auto object-contain"
                />
              </div>
              <div className="text-white text-center">
                <h2 className="text-3xl font-bold mb-6">Sistema de Gestión de Partes de Trabajo</h2>
                <p className="text-lg opacity-90 mb-4">
                  Accede al sistema para gestionar empleados, obras y partes de trabajo de manera eficiente.
                </p>
                <div className="grid grid-cols-3 gap-4 mt-12">
                  <div className="bg-white/10 p-4 rounded-lg">
                    <div className="text-4xl font-bold">+500</div>
                    <div className="text-sm">Partes gestionados</div>
                  </div>
                  <div className="bg-white/10 p-4 rounded-lg">
                    <div className="text-4xl font-bold">+100</div>
                    <div className="text-sm">Empleados</div>
                  </div>
                  <div className="bg-white/10 p-4 rounded-lg">
                    <div className="text-4xl font-bold">+50</div>
                    <div className="text-sm">Obras activas</div>
                  </div>
                </div>
              </div>
              <div className="text-white/70 text-sm mt-8">
                {new Date().getFullYear()} AISLA. Todos los derechos reservados.
              </div>
            </div>
          </div>

          {/* Panel derecho - Formulario */}
          <div className="w-full lg:w-1/2 bg-white p-8 md:p-12">
            <div className="lg:hidden flex justify-center mb-8">
              <img
                src="/aisla_logo.svg"
                alt="Aisla Partes Logo"
                className="h-16 object-contain"
              />
            </div>

            <div className="max-w-md mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Bienvenido/a
              </h2>
              <p className="text-gray-600 mb-8">
                Accede a tu cuenta para continuar con la gestión de partes
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md text-sm">
                  <div className="flex">
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              {adminExists === false && (
                <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 rounded-md text-sm">
                  <div className="flex">
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    No existe un usuario administrador. Se creará uno con las credenciales proporcionadas.
                  </div>
                </div>
              )}

              <form className="space-y-6" onSubmit={handleLogin}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm"
                      style={{transition: 'all 0.2s'}}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#0d9488'
                        e.target.style.boxShadow = '0 0 0 3px rgba(1, 78, 208, 0.1)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Contraseña
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm"
                      style={{transition: 'all 0.2s'}}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#0d9488'
                        e.target.style.boxShadow = '0 0 0 3px rgba(1, 78, 208, 0.1)'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d1d5db'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  {adminExists === false ? (
                    <button
                      type="button"
                      onClick={handleCreateAdmin}
                      disabled={isCreatingAdmin}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                    >
                      {isCreatingAdmin ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creando administrador...
                        </>
                      ) : (
                        <>
                          <LockClosedIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                          Crear administrador
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors"
                      style={{
                        backgroundColor: '#0d9488',
                        '&:hover': {backgroundColor: '#004fd7'},
                        '&:focus': {outline: 'none', boxShadow: '0 0 0 3px rgba(1, 78, 208, 0.1)'}
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#004fd7'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#0d9488'}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Iniciando sesión...
                        </>
                      ) : (
                        <>
                          <LockClosedIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                          Iniciar sesión
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Si tienes problemas para acceder, contacta al administrador del sistema.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
