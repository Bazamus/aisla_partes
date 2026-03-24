/**
 * Modal — Componente modal unificado (desktop + mobile-friendly)
 * Props:
 *   isOpen, onClose, title, children
 *   size: 'sm' | 'md' | 'lg' | 'xl' | 'full'
 *   footer: ReactNode
 *   showClose: bool
 */
import { useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

const sizeClasses = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-2xl',
  full: 'max-w-none w-full h-full rounded-none',
}

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  showClose = true,
  className = '',
}) => {
  // Bloquear scroll del body mientras está abierto
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [isOpen])

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeCls = sizeClasses[size] || sizeClasses.md

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`
          relative z-10 bg-white w-full
          rounded-t-2xl sm:rounded-card
          shadow-card-elevated
          animate-slide-up sm:animate-scale-in
          flex flex-col
          max-h-[92vh] sm:max-h-[85vh]
          ${sizeCls}
          ${className}
        `}
      >
        {/* Drag handle (solo móvil) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-surface-200 rounded-full" aria-hidden="true" />
        </div>

        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200">
            {title && (
              <h2 id="modal-title" className="text-base font-semibold text-ink-primary">
                {title}
              </h2>
            )}
            {showClose && (
              <button
                onClick={onClose}
                className="ml-auto p-1.5 rounded-lg text-ink-muted hover:text-ink-primary hover:bg-surface-100 transition-colors"
                aria-label="Cerrar modal"
              >
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-4 border-t border-surface-200 flex items-center justify-end gap-3 flex-shrink-0 pb-safe">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
