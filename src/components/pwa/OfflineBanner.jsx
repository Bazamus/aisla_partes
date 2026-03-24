import { useOnlineStatus } from '../../hooks/useOnlineStatus'

/**
 * Banner que se muestra cuando la aplicación está offline
 * Informa al usuario sobre el estado de la conexión
 */
function OfflineBanner() {
  const isOnline = useOnlineStatus()

  // No mostrar nada si está online
  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 text-center shadow-lg">
      <div className="flex items-center justify-center space-x-2">
        <svg 
          className="w-5 h-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
          />
        </svg>
        <span className="font-medium">
          📶 Sin conexión - Trabajando en modo offline
        </span>
      </div>
      <p className="text-sm mt-1 opacity-90">
        Los datos se sincronizarán cuando se restaure la conexión
      </p>
    </div>
  )
}

export default OfflineBanner
