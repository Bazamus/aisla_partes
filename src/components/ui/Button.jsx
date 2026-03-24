/**
 * Button — Componente de botón unificado
 * Variants: primary | secondary | ghost | danger | link
 * Sizes: sm | md | lg
 */
const Spinner = () => (
  <svg
    className="animate-spin h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

const variantClasses = {
  primary:
    'bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white focus:ring-primary-500 border-transparent shadow-sm',
  secondary:
    'bg-white hover:bg-surface-100 active:bg-surface-200 text-ink-primary border-surface-200 focus:ring-primary-500',
  ghost:
    'bg-transparent hover:bg-surface-100 active:bg-surface-200 text-ink-secondary border-transparent focus:ring-primary-500',
  danger:
    'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white border-transparent focus:ring-red-500 shadow-sm',
  link:
    'bg-transparent hover:underline text-primary-500 hover:text-primary-600 border-transparent focus:ring-primary-500 px-0 py-0',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-5 py-3 text-base gap-2',
}

const iconSizeClasses = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-2.5',
}

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  iconOnly = false,
  type = 'button',
  className = '',
  onClick,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-medium rounded-input border ' +
    'transition-colors duration-150 ' +
    'focus:outline-none focus:ring-2 focus:ring-offset-2 ' +
    'disabled:opacity-50 disabled:cursor-not-allowed select-none'

  const variantCls = variantClasses[variant] || variantClasses.primary
  const sizeCls = iconOnly ? iconSizeClasses[size] : sizeClasses[size]

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${variantCls} ${sizeCls} ${className}`}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}

export default Button
