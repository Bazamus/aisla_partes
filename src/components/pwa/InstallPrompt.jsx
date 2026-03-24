import { useEffect, useState } from 'react'

/**
 * Componente profesional para mostrar el prompt de instalación PWA
 * Adaptado al estilo de Aisla Partes
 */
function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Verificar si el usuario ya rechazó el prompt anteriormente
    const wasDismissed = localStorage.getItem('pwa-install-dismissed')
    if (wasDismissed === 'true') {
      setDismissed(true)
      return
    }

    const handler = (e) => {
      e.preventDefault()
      console.log('🎯 [InstallPrompt] beforeinstallprompt detectado')
      setDeferredPrompt(e)
      
      // Mostrar el prompt después de un pequeño delay para mejor UX
      setTimeout(() => {
        setShowPrompt(true)
      }, 3000) // 3 segundos después de cargar la página
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Detectar si ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('✅ [InstallPrompt] App ya instalada')
      setShowPrompt(false)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.warn('⚠️ [InstallPrompt] No hay prompt diferido disponible')
      return
    }

    try {
      // Mostrar el prompt nativo de instalación
      deferredPrompt.prompt()
      
      // Esperar la decisión del usuario
      const { outcome } = await deferredPrompt.userChoice
      
      console.log(`👤 [InstallPrompt] Decisión del usuario: ${outcome}`)
      
      if (outcome === 'accepted') {
        console.log('✅ [InstallPrompt] Usuario aceptó la instalación')
      } else {
        console.log('❌ [InstallPrompt] Usuario rechazó la instalación')
      }
      
      // Limpiar el prompt
      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      console.error('❌ [InstallPrompt] Error al mostrar el prompt:', error)
    }
  }

  const handleDismiss = () => {
    console.log('🚫 [InstallPrompt] Usuario cerró el prompt')
    setShowPrompt(false)
    setDismissed(true)
    // Guardar en localStorage para no volver a mostrar
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  const handleRemindLater = () => {
    console.log('⏰ [InstallPrompt] Usuario seleccionó "Recordar más tarde"')
    setShowPrompt(false)
    // El prompt se volverá a mostrar en la próxima sesión
  }

  if (!showPrompt || dismissed) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up">
      <div 
        className="bg-white rounded-xl shadow-2xl border-2 border-blue-600 overflow-hidden"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        {/* Header con color AISLA */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <img 
              src="/vimar_favicon.png" 
              alt="AISLA" 
              className="w-8 h-8"
              onError={(e) => {
                // Fallback a un icono SVG si la imagen no carga
                e.target.style.display = 'none'
                e.target.parentElement.innerHTML = `
                  <svg class="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                  </svg>
                `
              }}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg">
              Instalar aplicación
            </h3>
            <p className="text-blue-100 text-sm">
              AISLA Gestor de Partes
            </p>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-4">
          <p className="text-gray-700 mb-4 leading-relaxed">
            📱 <strong>¡Instala nuestra app!</strong> Accede más rápido a tus partes de trabajo, 
            funciona sin conexión y recibe notificaciones.
          </p>

          {/* Beneficios */}
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span>Acceso rápido desde tu pantalla de inicio</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span>Funciona sin conexión a internet</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span>Notificaciones y actualizaciones automáticas</span>
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Instalar ahora
            </button>
            
            <button
              onClick={handleRemindLater}
              className="flex-1 sm:flex-initial bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Más tarde
            </button>
          </div>

          {/* Enlace para cerrar permanentemente */}
          <button
            onClick={handleDismiss}
            className="w-full mt-2 text-center text-xs text-gray-500 hover:text-gray-700 py-2"
          >
            No volver a mostrar
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

export default InstallPrompt

