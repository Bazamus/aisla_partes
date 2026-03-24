/**
 * EmptyState — Estado vacío para listados y páginas sin datos
 * Props:
 *   icon     : ReactNode (icono grande centrado)
 *   title    : string
 *   description: string
 *   action   : ReactNode (botón/enlace de acción)
 *   compact  : bool — versión pequeña para listas inline
 */

const EmptyState = ({
  icon,
  title = 'Sin resultados',
  description,
  action,
  compact = false,
  className = '',
}) => {
  if (compact) {
    return (
      <div className={`flex flex-col items-center justify-center py-8 text-center ${className}`}>
        {icon && (
          <div className="text-ink-muted mb-2 opacity-40" aria-hidden="true">
            {icon}
          </div>
        )}
        <p className="text-sm text-ink-muted">{title}</p>
        {action && <div className="mt-3">{action}</div>}
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      {icon && (
        <div
          className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-5 text-primary-400"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      <h3 className="text-base font-semibold text-ink-primary mb-1.5">{title}</h3>

      {description && (
        <p className="text-sm text-ink-muted max-w-sm mb-6 leading-relaxed">{description}</p>
      )}

      {action && <div>{action}</div>}
    </div>
  )
}

export default EmptyState
