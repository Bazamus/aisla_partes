import { useState, useEffect } from 'react'

/**
 * Hook personalizado para detectar el estado online/offline del navegador
 * @returns {boolean} true si está online, false si está offline
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      console.log('🟢 Conexión restaurada')
    }

    const handleOffline = () => {
      setIsOnline(false)
      console.log('🔴 Conexión perdida - Modo offline activado')
    }

    // Añadir event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
