import { useRegisterSW } from 'virtual:pwa-register/react'

const SW_UPDATE_KEY = 'sw_update_timestamp'
const SW_UPDATE_COOLDOWN = 10000 // 10 segundos de cooldown entre actualizaciones

/**
 * Componente que maneja las actualizaciones PWA
 * Muestra un prompt cuando hay una nueva versión disponible
 */
function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW registrado:', r)
    },
    onRegisterError(error) {
      console.error('Error registrando SW:', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  // Detectar si estamos en un bucle de actualización
  const isUpdateLoop = () => {
    try {
      const lastUpdate = sessionStorage.getItem(SW_UPDATE_KEY)
      if (lastUpdate) {
        const elapsed = Date.now() - parseInt(lastUpdate, 10)
        return elapsed < SW_UPDATE_COOLDOWN
      }
    } catch {
      // sessionStorage no disponible
    }
    return false
  }

  const reload = async () => {
    // Protección anti-bucle: si ya se intentó actualizar hace poco, solo cerrar el prompt
    if (isUpdateLoop()) {
      console.warn('Actualización SW ignorada: cooldown activo')
      close()
      return
    }

    try {
      sessionStorage.setItem(SW_UPDATE_KEY, Date.now().toString())
    } catch {
      // sessionStorage no disponible
    }

    try {
      await updateServiceWorker(true)
    } catch (e) {
      console.error('Error actualizando SW:', e)
      window.location.reload()
    }
  }

  // Si estamos en un bucle de actualización, no mostrar el prompt
  if (needRefresh && isUpdateLoop()) {
    return null
  }

  // No mostrar nada si no hay notificaciones
  if (!offlineReady && !needRefresh) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {offlineReady ? (
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            ) : (
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 mb-1">
              {offlineReady ? 'App lista para offline' : 'Nueva versión disponible'}
            </p>
            <p className="text-sm text-gray-500">
              {offlineReady 
                ? 'La aplicación ahora puede funcionar sin conexión' 
                : 'Haz clic en actualizar para obtener la última versión'
              }
            </p>
          </div>
        </div>

        <div className="mt-4 flex space-x-2">
          {needRefresh && (
            <button
              onClick={reload}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Actualizar
            </button>
          )}
          <button
            onClick={close}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReloadPrompt
