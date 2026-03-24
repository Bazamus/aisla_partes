/**
 * Input — Campo de formulario unificado
 * Props:
 *   label, placeholder, error, hint
 *   iconLeft, iconRight
 *   type: text | email | password | date | number | search | tel
 *   required, disabled, readOnly
 */

const Input = ({
  label,
  id,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error,
  hint,
  iconLeft,
  iconRight,
  required = false,
  disabled = false,
  readOnly = false,
  className = '',
  inputClassName = '',
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  const borderCls = error
    ? 'border-red-400 focus:ring-red-500 focus:border-red-500'
    : 'border-surface-200 focus:ring-primary-500 focus:border-primary-500'

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink-secondary mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative">
        {iconLeft && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none">
            {iconLeft}
          </span>
        )}

        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={`
            w-full rounded-input border bg-white text-ink-primary placeholder-ink-muted
            px-4 py-3 text-base
            focus:outline-none focus:ring-2 focus:ring-offset-0
            transition-colors duration-150
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-100
            read-only:bg-surface-50 read-only:cursor-default
            ${iconLeft  ? 'pl-10' : ''}
            ${iconRight ? 'pr-10' : ''}
            ${borderCls}
            ${inputClassName}
          `}
          {...props}
        />

        {iconRight && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted">
            {iconRight}
          </span>
        )}
      </div>

      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-red-600 flex items-center gap-1" role="alert">
          <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {hint && !error && (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-ink-muted">{hint}</p>
      )}
    </div>
  )
}

export default Input
