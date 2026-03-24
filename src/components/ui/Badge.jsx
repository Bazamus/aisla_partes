/**
 * Badge — Etiqueta de estado para partes de trabajo
 * Variants: success | warning | error | draft | info | primary
 *
 * Mapeo de estados de partes:
 *   "Aprobado"             → success
 *   "Pendiente de Revisión"→ warning
 *   "Borrador"             → draft
 *   "Rechazado"            → error
 *   "En Curso"             → info
 *   "Finalizada"           → draft
 */

const variantClasses = {
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error:   'bg-red-50 text-red-700 border-red-200',
  draft:   'bg-slate-100 text-slate-600 border-slate-200',
  info:    'bg-blue-50 text-blue-700 border-blue-200',
  primary: 'bg-primary-50 text-primary-700 border-primary-200',
}

const dots = {
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  error:   'bg-red-500',
  draft:   'bg-slate-400',
  info:    'bg-blue-500',
  primary: 'bg-primary-500',
}

// Mapa automático de texto de estado → variante
const STATUS_MAP = {
  'aprobado':               'success',
  'pendiente de revisión':  'warning',
  'pendiente de revision':  'warning',
  'pendiente':              'warning',
  'borrador':               'draft',
  'rechazado':              'error',
  'en curso':               'info',
  'finalizada':             'draft',
  'activo':                 'success',
  'inactivo':               'draft',
}

/**
 * Dado el texto de un estado de parte, devuelve la variante correcta.
 */
export const getStatusVariant = (status = '') => {
  return STATUS_MAP[status.toLowerCase()] || 'draft'
}

const Badge = ({
  children,
  variant,
  status,       // alternativa: pasar texto de estado directamente
  dot = true,
  className = '',
}) => {
  const resolvedVariant = variant || (status ? getStatusVariant(status) : 'draft')
  const colorCls = variantClasses[resolvedVariant] || variantClasses.draft
  const dotCls = dots[resolvedVariant] || dots.draft

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-badge text-xs font-medium border ${colorCls} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} aria-hidden="true" />
      )}
      {children}
    </span>
  )
}

export default Badge
