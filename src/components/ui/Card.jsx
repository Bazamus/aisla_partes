/**
 * Card — Tarjeta base reutilizable
 * Props:
 *   padding   : 'none' | 'sm' | 'md' | 'lg'
 *   elevated  : bool — mayor sombra
 *   interactive: bool — cursor pointer + hover lift
 *   className
 */

const paddingClasses = {
  none: '',
  sm:   'p-3',
  md:   'p-5',
  lg:   'p-6',
}

const Card = ({
  children,
  padding = 'md',
  elevated = false,
  interactive = false,
  className = '',
  onClick,
  ...props
}) => {
  const base = 'bg-white rounded-card border border-surface-200'
  const shadow = elevated ? 'shadow-card-elevated' : 'shadow-card'
  const hover = interactive
    ? 'cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200'
    : ''
  const paddingCls = paddingClasses[padding] ?? paddingClasses.md

  return (
    <div
      className={`${base} ${shadow} ${hover} ${paddingCls} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}

// Sub-componentes útiles
Card.Header = ({ children, className = '' }) => (
  <div className={`flex items-center justify-between mb-4 ${className}`}>
    {children}
  </div>
)

Card.Title = ({ children, icon, className = '' }) => (
  <h3 className={`flex items-center gap-2 text-base font-semibold text-ink-primary ${className}`}>
    {icon && <span className="text-primary-500">{icon}</span>}
    {children}
  </h3>
)

Card.Divider = ({ className = '' }) => (
  <div className={`border-t border-surface-200 my-4 ${className}`} />
)

Card.Footer = ({ children, className = '' }) => (
  <div className={`flex items-center justify-end gap-3 pt-4 mt-4 border-t border-surface-200 ${className}`}>
    {children}
  </div>
)

export default Card
