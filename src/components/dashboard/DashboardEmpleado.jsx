import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import * as exportService from '../../services/exportService'
import { verificarYCorregirPermisosEmpleado } from '../../utils/permisosEmpleado'
import * as parteEmpleadoService from '../../services/parteEmpleadoService'
import {
  BuildingOfficeIcon,
  CalendarIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'
import { formatDate } from '../../utils/dateUtils'
import { formatParteNumber } from '../../utils/formatUtils'
import Badge, { getStatusVariant } from '../ui/Badge'
import Skeleton from '../ui/Skeleton'
import EmptyState from '../ui/EmptyState'

// ── Chips de filtro de estado ─────────────────────────────────────────────
const ESTADOS = [
  { value: 'todos',                 label: 'Todos' },
  { value: 'Borrador',              label: 'Borrador' },
  { value: 'Pendiente de Revisión', label: 'Pendiente' },
  { value: 'Aprobado',              label: 'Aprobado' },
  { value: 'Rechazado',             label: 'Rechazado' },
]

// ── Tarjeta individual de parte ───────────────────────────────────────────
const ParteCard = ({ parte, onVer, onEliminar }) => {
  const isBorrador = parte.estado === 'Borrador'

  return (
    <article
      className="bg-white rounded-card border border-surface-200 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
      aria-label={`Parte ${formatParteNumber(parte)}`}
    >
      <button
        className="w-full text-left p-4 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
        onClick={() => onVer(parte)}
        aria-label={`Ver parte ${formatParteNumber(parte)}`}
      >
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-primary truncate">
              {formatParteNumber(parte) || 'Sin número'}
            </p>
            <p className="text-xs text-ink-muted flex items-center gap-1 mt-0.5">
              <CalendarIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {formatDate(parte.fecha)}
            </p>
          </div>
          <Badge status={parte.estado || 'Borrador'} />
        </div>

        {/* Detalles */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-ink-secondary">
            <BuildingOfficeIcon className="h-4 w-4 flex-shrink-0 text-ink-muted" aria-hidden="true" />
            <span className="truncate">{parte.nombre_obra || 'Sin obra asignada'}</span>
          </div>
          {parte.coste_trabajos > 0 && (
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-surface-200">
              <span className="text-xs text-ink-muted">Importe</span>
              <span className="text-sm font-bold text-status-success">
                €{Number(parte.coste_trabajos).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </button>

      {/* Acciones */}
      <div className="flex border-t border-surface-200 divide-x divide-surface-200">
        {isBorrador ? (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onEliminar(e, parte) }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
              aria-label="Eliminar parte"
            >
              <TrashIcon className="h-4 w-4" aria-hidden="true" />
              Eliminar
            </button>
            <button
              onClick={() => onVer(parte)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-primary-600 hover:bg-primary-50 transition-colors font-medium"
              aria-label="Continuar editando parte"
            >
              Continuar
              <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </>
        ) : (
          <>
            <button
              disabled
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-ink-muted opacity-50 cursor-not-allowed"
              title="PDF disponible solo para administradores"
            >
              <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
              PDF
            </button>
            <button
              onClick={() => onVer(parte)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-primary-600 hover:bg-primary-50 transition-colors font-medium"
              aria-label={`Ver detalle del parte ${formatParteNumber(parte)}`}
            >
              <DocumentTextIcon className="h-4 w-4" aria-hidden="true" />
              Ver detalle
            </button>
          </>
        )}
      </div>
    </article>
  )
}

// ── Componente principal ──────────────────────────────────────────────────
export default function DashboardEmpleado() {
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()

  const [loading,        setLoading]        = useState(true)
  const [empleado,       setEmpleado]       = useState(null)
  const [obrasAsignadas, setObrasAsignadas] = useState([])
  const [partes,         setPartes]         = useState([])
  const [filteredPartes, setFilteredPartes] = useState([])
  const [searchTerm,     setSearchTerm]     = useState('')
  const [estadoFilter,   setEstadoFilter]   = useState('todos')
  const [dateRange,      setDateRange]      = useState({ startDate: '', endDate: '' })
  const [error,          setError]          = useState(null)

  // ── Carga de datos ──────────────────────────────────────────────────────
  const cargarDatos = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const seHicieronCambios = await verificarYCorregirPermisosEmpleado(user.id)
      if (seHicieronCambios) {
        toast.success('Permisos actualizados. Refrescando…')
        setTimeout(() => window.location.reload(), 1500)
        return
      }
      const empleadoData = await parteEmpleadoService.getEmpleadoFromUser()
      if (!empleadoData) {
        toast.error('No se pudo cargar el perfil del empleado.')
        setError('No se pudo cargar el perfil del empleado.')
        setLoading(false)
        return
      }
      setEmpleado(empleadoData)
      const [partesData, obrasData] = await Promise.all([
        parteEmpleadoService.getPartesByEmpleadoUserId(user.id),
        parteEmpleadoService.getObrasAsignadasEmpleado(user.id),
      ])
      setPartes(partesData)
      setObrasAsignadas(obrasData)
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
      setPartes([])
      setObrasAsignadas([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  // ── Filtrado ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!partes) { setFilteredPartes([]); return }
    const lower = searchTerm.toLowerCase()
    const filtered = partes.filter(p => {
      const matchSearch = !searchTerm ||
        p.numero_parte?.toString().toLowerCase().includes(lower) ||
        p.nombre_obra?.toLowerCase().includes(lower) ||
        p.nombre_trabajador?.toLowerCase().includes(lower)
      const matchEstado = estadoFilter === 'todos' || p.estado === estadoFilter
      let matchDate = true
      if (dateRange.startDate && dateRange.endDate) {
        try {
          const d = new Date(p.fecha)
          const s = new Date(dateRange.startDate)
          const e = new Date(dateRange.endDate)
          e.setHours(23, 59, 59, 999)
          matchDate = d >= s && d <= e
        } catch { matchDate = false }
      }
      return matchSearch && matchEstado && matchDate
    })
    setFilteredPartes(filtered)
  }, [searchTerm, estadoFilter, dateRange, partes])

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleNuevoParte = () => {
    if (!hasPermission('partes:crear')) { toast.error('Sin permiso para crear partes.'); return }
    navigate('/parte-empleado', { state: { empleadoId: empleado?.id, userId: user?.id } })
  }

  const handleVerParte = (parte) => navigate(`/ver-detalle/empleado/${parte.id}`)

  const handleVerObrasAsignadas = () => {
    if (obrasAsignadas.length === 0) toast('No tienes obras asignadas actualmente.')
    navigate('/empleado/obras-asignadas', { state: { obrasData: obrasAsignadas } })
  }

  const handleDeleteParte = async (e, parte) => {
    e.stopPropagation()
    if (parte.estado !== 'Borrador') { toast.error('Solo puedes eliminar partes en estado "Borrador".'); return }
    if (!confirm(`¿Eliminar el parte ${formatParteNumber(parte)}? Esta acción no se puede deshacer.`)) return
    const tid = toast.loading('Eliminando parte…')
    try {
      await parteEmpleadoService.deleteParteEmpleado(parte.id)
      setPartes(prev => prev.filter(p => p.id !== parte.id))
      setFilteredPartes(prev => prev.filter(p => p.id !== parte.id))
      toast.success('Parte eliminado.', { id: tid })
    } catch (err) {
      toast.error(`Error: ${err.message || 'Error desconocido'}`, { id: tid })
    }
  }

  // ── Estadísticas rápidas ────────────────────────────────────────────────
  const now = new Date()
  const partesEsteMes = partes.filter(p => {
    const d = new Date(p.fecha)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
  const partesPendientes = partes.filter(p => p.estado === 'Pendiente de Revisión').length
  const partesAprobados  = partes.filter(p => p.estado === 'Aprobado').length
  const obrasActivas     = obrasAsignadas.filter(o => o.obras?.estado === 'En Curso').length

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-5" aria-label="Cargando dashboard" aria-busy="true">
        <div className="bg-primary-50 rounded-card p-5">
          <Skeleton.Block className="h-6 w-48 mb-2" />
          <Skeleton.Block className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton.Stat key={i} />)}
        </div>
        <Skeleton count={3} type="parte-card" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-card border border-red-200 p-6 text-center" role="alert">
        <ExclamationCircleIcon className="h-10 w-10 text-red-400 mx-auto mb-3" aria-hidden="true" />
        <p className="text-red-600 font-medium">{error}</p>
        <button onClick={cargarDatos} className="mt-4 btn-secondary text-sm">
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Saludo ────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-card p-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-primary-100 text-sm mb-0.5">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 className="text-xl font-bold">
              Hola, {empleado?.nombre?.split(' ')[0] || 'empleado'} 👋
            </h1>
            {empleado && (
              <p className="text-primary-200 text-xs mt-1">
                {empleado.categoria} · {empleado.codigo}
              </p>
            )}
          </div>
          {hasPermission('partes:crear') && (
            <button
              onClick={handleNuevoParte}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white text-primary-600 rounded-input font-medium text-sm shadow-sm hover:bg-primary-50 transition-colors"
              aria-label="Crear nuevo parte de trabajo"
            >
              <PlusIcon className="h-5 w-5" aria-hidden="true" />
              <span className="hidden sm:inline">Nuevo Parte</span>
            </button>
          )}
        </div>
      </div>

      {/* ── KPIs ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Este mes',  value: partesEsteMes,   icon: <ClipboardDocumentListIcon className="h-5 w-5" />, color: 'text-primary-600 bg-primary-50' },
          { label: 'Pendientes', value: partesPendientes, icon: <ClockIcon             className="h-5 w-5" />, color: 'text-amber-600 bg-amber-50'   },
          { label: 'Aprobados',  value: partesAprobados,  icon: <CheckCircleIcon        className="h-5 w-5" />, color: 'text-green-600 bg-green-50'   },
          { label: 'Obras activas', value: obrasActivas,  icon: <BuildingOfficeIcon     className="h-5 w-5" />, color: 'text-blue-600 bg-blue-50'     },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-white rounded-card border border-surface-200 shadow-card p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`} aria-hidden="true">
              {icon}
            </div>
            <p className="text-2xl font-bold text-ink-primary">{value}</p>
            <p className="text-xs text-ink-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Accesos rápidos ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {hasPermission('partes:crear') && (
          <button
            onClick={handleNuevoParte}
            className="flex items-center gap-4 bg-white rounded-card border border-surface-200 shadow-card hover:shadow-card-hover p-4 text-left transition-all group"
            aria-label="Crear nuevo parte de trabajo"
          >
            <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors" aria-hidden="true">
              <PlusIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-primary">Nuevo Parte</p>
              <p className="text-xs text-ink-muted">Registrar un nuevo parte de trabajo</p>
            </div>
            <ChevronRightIcon className="h-5 w-5 text-ink-muted ml-auto flex-shrink-0 group-hover:text-primary-500 transition-colors" aria-hidden="true" />
          </button>
        )}
        <button
          onClick={handleVerObrasAsignadas}
          className="flex items-center gap-4 bg-white rounded-card border border-surface-200 shadow-card hover:shadow-card-hover p-4 text-left transition-all group"
          aria-label={`Ver ${obrasActivas} obras asignadas`}
        >
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 transition-colors" aria-hidden="true">
            <BuildingOfficeIcon className="h-6 w-6 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-primary">Obras Asignadas</p>
            <p className="text-xs text-ink-muted">
              {obrasAsignadas.length > 0
                ? `${obrasActivas} en curso · ${obrasAsignadas.length} total`
                : 'Sin obras asignadas'}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            {obrasAsignadas.length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full" aria-label={`${obrasAsignadas.length} obras`}>
                {obrasAsignadas.length}
              </span>
            )}
            <ChevronRightIcon className="h-5 w-5 text-ink-muted group-hover:text-primary-500 transition-colors" aria-hidden="true" />
          </div>
        </button>
      </div>

      {/* ── Filtros ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-card border border-surface-200 shadow-card p-4 space-y-3">
        {/* Búsqueda */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true">
            <MagnifyingGlassIcon className="h-5 w-5" />
          </span>
          <input
            type="search"
            placeholder="Buscar partes…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar partes de trabajo"
            className="w-full pl-10 pr-4 py-2.5 rounded-input border border-surface-200 text-sm text-ink-primary placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          />
        </div>

        {/* Chips de estado */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" role="group" aria-label="Filtrar por estado">
          {ESTADOS.map(e => (
            <button
              key={e.value}
              onClick={() => setEstadoFilter(e.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                estadoFilter === e.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface-100 text-ink-secondary hover:bg-surface-200'
              }`}
              aria-pressed={estadoFilter === e.value}
            >
              {e.label}
            </button>
          ))}
        </div>

        {/* Rango de fechas */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" aria-hidden="true" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(p => ({ ...p, startDate: e.target.value }))}
              aria-label="Fecha desde"
              className="w-full pl-9 pr-3 py-2 rounded-input border border-surface-200 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>
          <span className="text-ink-muted text-xs flex-shrink-0">hasta</span>
          <div className="relative flex-1">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" aria-hidden="true" />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(p => ({ ...p, endDate: e.target.value }))}
              aria-label="Fecha hasta"
              className="w-full pl-9 pr-3 py-2 rounded-input border border-surface-200 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>
          {(dateRange.startDate || dateRange.endDate || searchTerm) && (
            <button
              onClick={() => { setDateRange({ startDate: '', endDate: '' }); setSearchTerm('') }}
              className="flex-shrink-0 text-xs text-ink-muted hover:text-ink-primary transition-colors underline"
              aria-label="Limpiar filtros"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ── Listado ────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink-primary">
            Mis Partes de Trabajo
            {filteredPartes.length > 0 && (
              <span className="ml-2 text-xs font-normal text-ink-muted">({filteredPartes.length})</span>
            )}
          </h2>
          {partes.length > 0 && (
            <button
              onClick={() => navigate('/partes-empleados')}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              Ver todos →
            </button>
          )}
        </div>

        {filteredPartes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPartes.map(parte => (
              <ParteCard
                key={parte.id}
                parte={parte}
                onVer={handleVerParte}
                onEliminar={handleDeleteParte}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<ClipboardDocumentListIcon className="h-8 w-8" />}
            title="Sin partes de trabajo"
            description={
              searchTerm || estadoFilter !== 'todos'
                ? 'No hay partes que coincidan con los filtros aplicados.'
                : '¡Empieza registrando tu primer parte de trabajo!'
            }
            action={
              hasPermission('partes:crear') && !searchTerm && estadoFilter === 'todos' ? (
                <button onClick={handleNuevoParte} className="btn-primary text-sm">
                  <PlusIcon className="h-4 w-4" aria-hidden="true" />
                  Crear primer parte
                </button>
              ) : null
            }
          />
        )}
      </div>
    </div>
  )
}
