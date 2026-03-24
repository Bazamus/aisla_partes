import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import {
  LockClosedIcon,
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardDocumentListIcon,
  DevicePhoneMobileIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'
import authService from '../services/authService'

// ── Características del panel izquierdo ──────────────────────────────────
const FEATURES = [
  {
    icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
    title: 'Gestión completa de partes',
    desc:  'Crea, aprueba y exporta partes de trabajo de empleados y proveedores.',
  },
  {
    icon: <DevicePhoneMobileIcon className="h-5 w-5" />,
    title: 'Diseñado para el campo',
    desc:  'Interfaz optimizada para móvil. Trabaja desde cualquier dispositivo.',
  },
  {
    icon: <ChartBarIcon className="h-5 w-5" />,
    title: 'Reportes en tiempo real',
    desc:  'Visualiza estadísticas, costes y rendimiento de cada obra y empleado.',
  },
]

// ── Spinner ───────────────────────────────────────────────────────────────
const Spinner = () => (
  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path  className="opacity-75"  fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

export default function Login() {
  const navigate = useNavigate()
  const { user, login, createAdminUser } = useAuth()

  const [email,            setEmail]            = useState('')
  const [password,         setPassword]         = useState('')
  const [showPassword,     setShowPassword]     = useState(false)
  const [isLoading,        setIsLoading]        = useState(false)
  const [error,            setError]            = useState('')
  const [adminExists,      setAdminExists]      = useState(true)
  const [isCreatingAdmin,  setIsCreatingAdmin]  = useState(false)

  // Si ya hay sesión activa, redirigir
  useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

  // Verificar si existe administrador
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        if (window.EMERGENCY_MODE) return
        const { data: exists, error: rpcError } = await supabase.rpc('hay_administradores_registrados')
        if (rpcError) { setAdminExists(false); return }
        setAdminExists(exists)
        if (!exists) { setEmail('admin@partes.com'); setPassword('admin123') }
      } catch {
        setAdminExists(false)
        setEmail('admin@partes.com')
        setPassword('admin123')
      }
    }
    checkAdmin()
  }, [])

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const result = await authService.login(email, password)
      if (result?.error) {
        const msg = result.message || 'Error al iniciar sesión'
        setError(msg)
        toast.error(msg)
        return
      }
      if (result.data) await login(email, password)
    } catch {
      const msg = 'Error inesperado. Por favor, inténtalo de nuevo.'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAdmin = async () => {
    setError('')
    setIsCreatingAdmin(true)
    try {
      if (typeof createAdminUser !== 'function') {
        const { data: adminRoles } = await supabase.from('roles').select('id').eq('nombre', 'administrador').single()
        if (!adminRoles) {
          await supabase.from('roles').insert({ nombre: 'administrador', descripcion: 'Rol administrativo' })
        }
        const { error: signupError } = await supabase.auth.signUp({
          email, password,
          options: { data: { rol: 'administrador', nombre: 'Administrador' }, emailRedirectTo: window.location.origin },
        })
        if (signupError) throw signupError
        toast.success('Administrador creado')
        setAdminExists(true)
        await login(email, password)
      } else {
        const result = await createAdminUser(email, password)
        if (result.success) {
          toast.success('Administrador creado')
          setAdminExists(true)
          await login(email, password)
        } else if (result.exists) {
          toast('Ya existe un administrador, inicia sesión')
          setAdminExists(true)
        } else {
          throw new Error(result.error || 'Error desconocido')
        }
      }
    } catch {
      setError('No se pudo crear el administrador')
      toast.error('Error al crear administrador')
      try { await login(email, password) } catch {}
    } finally {
      setIsCreatingAdmin(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-stretch bg-surface-50">

      {/* ── Panel izquierdo (solo desktop) ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-3/5 flex-col bg-primary-600 relative overflow-hidden">
        {/* Patrón decorativo */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
          aria-hidden="true"
        />

        <div className="relative flex flex-col justify-between h-full px-12 py-16">
          {/* Logo */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">AP</span>
              </div>
              <span className="text-white text-2xl font-bold tracking-tight">Aisla Partes</span>
            </div>
            <p className="text-primary-100 text-sm mt-1">Gestión Profesional de Partes de Trabajo</p>
          </div>

          {/* Headline */}
          <div className="my-auto">
            <h1 className="text-4xl font-bold text-white leading-tight mb-6">
              La herramienta que necesitan los instaladores profesionales
            </h1>
            <p className="text-primary-100 text-lg leading-relaxed mb-10">
              Digitaliza tu empresa. Gestiona empleados, obras y partes desde cualquier dispositivo.
            </p>

            {/* Features */}
            <div className="space-y-5">
              {FEATURES.map((f, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center text-white">
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{f.title}</p>
                    <p className="text-primary-200 text-xs mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer izquierdo */}
          <p className="text-primary-300 text-xs">
            © {new Date().getFullYear()} Aisla Partes · Todos los derechos reservados
          </p>
        </div>
      </div>

      {/* ── Panel derecho: formulario ───────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm animate-fade-in">

          {/* Logo móvil */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">AP</span>
            </div>
            <span className="text-ink-primary text-xl font-bold">Aisla Partes</span>
          </div>

          {/* Encabezado formulario */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-ink-primary">Bienvenido de nuevo</h2>
            <p className="text-sm text-ink-muted mt-1">Accede con tu cuenta para continuar</p>
          </div>

          {/* Alerta de error */}
          {error && (
            <div
              className="mb-5 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-card text-red-700 text-sm animate-slide-up"
              role="alert"
            >
              <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Aviso sin admin */}
          {adminExists === false && (
            <div
              className="mb-5 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-card text-amber-700 text-sm"
              role="status"
            >
              <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              No existe administrador. Usa las credenciales indicadas para crear uno.
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink-secondary mb-1.5">
                Email
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true">
                  <EnvelopeIcon className="h-5 w-5" />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  className="w-full pl-10 pr-4 py-3 rounded-input border border-surface-200 bg-white text-ink-primary placeholder-ink-muted text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink-secondary mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true">
                  <LockClosedIcon className="h-5 w-5" />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 rounded-input border border-surface-200 bg-white text-ink-primary placeholder-ink-muted text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-secondary transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword
                    ? <EyeSlashIcon className="h-5 w-5" />
                    : <EyeIcon      className="h-5 w-5" />
                  }
                </button>
              </div>
            </div>

            {/* Botón */}
            {adminExists === false ? (
              <button
                type="button"
                onClick={handleCreateAdmin}
                disabled={isCreatingAdmin}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-input bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingAdmin ? <><Spinner /> Creando administrador...</> : <><LockClosedIcon className="h-5 w-5" /> Crear administrador</>}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-input bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isLoading ? <><Spinner /> Iniciando sesión...</> : <><LockClosedIcon className="h-5 w-5" /> Iniciar sesión</>}
              </button>
            )}
          </form>

          {/* Footer formulario */}
          <p className="mt-8 text-xs text-ink-muted text-center">
            ¿Problemas para acceder? Contacta con el administrador del sistema.
          </p>
          <p className="mt-3 text-xs text-ink-muted text-center">
            Aisla Partes v2.0
          </p>
        </div>
      </div>
    </div>
  )
}
