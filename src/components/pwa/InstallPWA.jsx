import { useState, useEffect } from 'react'

/**
 * Componente para mostrar el prompt de instalación PWA
 * Se muestra en el Inicio después del login según especificaciones
 */
function InstallPWA({ showOnDashboard = false }) {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Manejar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
      
      // Solo mostrar en Inicio según especificación
      if (showOnDashboard) {
        setShowInstallButton(true)
      }
    }

    // Detectar si ya está instalado
    const handleAppInstalled = () => {
      setShowInstallButton(false)
      setInstallPrompt(null)
      console.log('✅ PWA instalada exitosamente')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [showOnDashboard])

  const handleInstallClick = async () => {
    if (!installPrompt) return

    try {
      installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('✅ Usuario aceptó la instalación PWA')
        setShowInstallButton(false)
      } else {
        console.log('❌ Usuario canceló la instalación PWA')
      }
      
      setInstallPrompt(null)
    } catch (error) {
      console.error('Error durante la instalación PWA:', error)
    }
  }

  const handleDismiss = () => {
    setShowInstallButton(false)
    // Guardar en localStorage que el usuario desestimó el prompt
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  // No mostrar si no debe mostrarse o si ya fue desestimado
  if (!showInstallButton || localStorage.getItem('pwa-install-dismissed')) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            📱 Instala AISLA Gestor
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Instala la aplicación en tu dispositivo para acceso rápido y funcionalidad offline
          </p>
          
          <div className="text-xs text-gray-500 mb-4">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Acceso rápido
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Funciona offline
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Experiencia nativa
              </span>
            </div>
          </div>

          {isIOS ? (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
              <p className="text-sm text-blue-800">
                <strong>En iOS:</strong> Toca el botón de compartir 
                <svg className="inline w-4 h-4 mx-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
                y selecciona "Añadir a pantalla de inicio"
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex space-x-3 mt-4">
        {!isIOS && installPrompt && (
          <button
            onClick={handleInstallClick}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Instalar App
          </button>
        )}
        
        <button
          onClick={handleDismiss}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Ahora no
        </button>
      </div>
    </div>
  )
}

export default InstallPWA
