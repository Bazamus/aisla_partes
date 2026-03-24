import React, { useState, useEffect, useRef, useCallback } from 'react'
import { buscarArticulos } from '../../services/articulosService'
import { toast } from 'react-hot-toast'
import BuscadorArticulosModal from './BuscadorArticulosModal'

// Función para convertir números en texto a dígitos
const convertirNumerosTextoADigitos = (texto) => {
  // Mapeo de números en texto a dígitos
  const numerosSimples = {
    'cero': '0', 'uno': '1', 'dos': '2', 'tres': '3', 'cuatro': '4',
    'cinco': '5', 'seis': '6', 'siete': '7', 'ocho': '8', 'nueve': '9',
    'diez': '10', 'once': '11', 'doce': '12', 'trece': '13', 'catorce': '14',
    'quince': '15', 'dieciséis': '16', 'dieciseis': '16', 'diecisiete': '17',
    'dieciocho': '18', 'diecinueve': '19', 'veinte': '20',
    'veintiuno': '21', 'veintidos': '22', 'veintidós': '22', 'veintitrés': '23',
    'veintitres': '23', 'veinticuatro': '24', 'veinticinco': '25',
    'veintiséis': '26', 'veintiseis': '26', 'veintisiete': '27',
    'veintiocho': '28', 'veintinueve': '29', 'treinta': '30',
    'cuarenta': '40', 'cincuenta': '50', 'sesenta': '60', 'setenta': '70',
    'ochenta': '80', 'noventa': '90', 'cien': '100', 'ciento': '100',
    'doscientos': '200', 'trescientos': '300', 'cuatrocientos': '400',
    'quinientos': '500', 'seiscientos': '600', 'setecientos': '700',
    'ochocientos': '800', 'novecientos': '900', 'mil': '1000'
  }

  // Convertir a minúsculas y preservar la estructura
  let textoConvertido = texto.toLowerCase()
  
  // Patrones específicos para códigos comunes de materiales
  textoConvertido = textoConvertido.replace(/ciento setenta/g, '170')
  textoConvertido = textoConvertido.replace(/ciento cuarenta/g, '140')
  
  // Reemplazar números compuestos (ej: "treinta y cinco" -> "35")
  textoConvertido = textoConvertido.replace(/treinta y (\w+)/g, (match, unidad) => {
    const num = numerosSimples[unidad] || unidad
    return `3${num}`
  })
  textoConvertido = textoConvertido.replace(/cuarenta y (\w+)/g, (match, unidad) => {
    const num = numerosSimples[unidad] || unidad
    return `4${num}`
  })
  textoConvertido = textoConvertido.replace(/cincuenta y (\w+)/g, (match, unidad) => {
    const num = numerosSimples[unidad] || unidad
    return `5${num}`
  })
  textoConvertido = textoConvertido.replace(/sesenta y (\w+)/g, (match, unidad) => {
    const num = numerosSimples[unidad] || unidad
    return `6${num}`
  })
  textoConvertido = textoConvertido.replace(/setenta y (\w+)/g, (match, unidad) => {
    const num = numerosSimples[unidad] || unidad
    return `7${num}`
  })
  textoConvertido = textoConvertido.replace(/ochenta y (\w+)/g, (match, unidad) => {
    const num = numerosSimples[unidad] || unidad
    return `8${num}`
  })
  textoConvertido = textoConvertido.replace(/noventa y (\w+)/g, (match, unidad) => {
    const num = numerosSimples[unidad] || unidad
    return `9${num}`
  })

  // Reemplazar números simples
  Object.keys(numerosSimples).forEach(palabra => {
    const regex = new RegExp(`\\b${palabra}\\b`, 'gi')
    textoConvertido = textoConvertido.replace(regex, numerosSimples[palabra])
  })

  return textoConvertido
}

const BuscadorArticulos = ({ onSeleccionarArticulo, placeholder = "Buscar material por código, tipo, medidas..." }) => {
  const [termino, setTermino] = useState('')
  const [resultados, setResultados] = useState([])
  const [loading, setLoading] = useState(false)
  const [mostrarResultados, setMostrarResultados] = useState(false)
  const [reconocimientoVoz, setReconocimientoVoz] = useState(false)
  const [soporteVoz, setSoporteVoz] = useState(false)
  const [sugerencias, setSugerencias] = useState([])
  const [searchState, setSearchState] = useState('empty') // 'empty', 'typing', 'results'
  const [isMobile, setIsMobile] = useState(false)
  const [showModal, setShowModal] = useState(false)
  
  const inputRef = useRef(null)
  const resultadosRef = useRef(null)
  const reconocimientoRef = useRef(null)

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Ocultar teclado cuando se abre el modal en móvil
  useEffect(() => {
    if (showModal && isMobile && inputRef.current) {
      inputRef.current.blur()
    }
  }, [showModal, isMobile])

  // Verificar soporte de reconocimiento de voz
  useEffect(() => {
    const soporta = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    setSoporteVoz(soporta)
    
    if (soporta) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      reconocimientoRef.current = new SpeechRecognition()
      reconocimientoRef.current.continuous = false
      reconocimientoRef.current.interimResults = false
      reconocimientoRef.current.lang = 'es-ES'
      
      reconocimientoRef.current.onstart = () => {
        setReconocimientoVoz(true)
      }
      
      reconocimientoRef.current.onend = () => {
        setReconocimientoVoz(false)
      }
      
      reconocimientoRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        const textoConvertido = convertirNumerosTextoADigitos(transcript)
        setTermino(textoConvertido)
        inputRef.current?.focus()
      }
      
      reconocimientoRef.current.onerror = (event) => {
        console.error('Error de reconocimiento de voz:', event.error)
        setReconocimientoVoz(false)
        if (event.error === 'not-allowed') {
          toast.error('Permiso de micrófono denegado')
        } else {
          toast.error('Error en reconocimiento de voz')
        }
      }
    }
  }, [])

  // Función de búsqueda compartida
  const ejecutarBusqueda = useCallback(async (buscarTermino) => {
    if (buscarTermino.trim().length < 3) {
      setResultados([])
      setMostrarResultados(false)
      setShowModal(false)
      setSearchState('empty')
      setSugerencias([])
      return
    }
    
    try {
      setLoading(true)
      setSearchState('typing')
      const datos = await buscarArticulos(buscarTermino)
      setResultados(datos)
      
      // En móvil, abrir modal; en desktop, mostrar desplegable
      if (isMobile && datos.length > 0) {
        setShowModal(true)
        setMostrarResultados(false)
      } else {
        setMostrarResultados(true)
        setShowModal(false)
      }
      
      setSearchState(datos.length > 0 ? 'results' : 'no-results')
    } catch (error) {
      console.error('Error en búsqueda:', error)
      toast.error('Error al buscar materiales')
      setSearchState('error')
    } finally {
      setLoading(false)
    }
  }, [isMobile])

  // Debounce automático SOLO en desktop
  useEffect(() => {
    // En móvil no hacer búsqueda automática
    if (isMobile) {
      // Limpiar resultados si hay menos de 3 caracteres
      if (termino.trim().length < 3) {
        setResultados([])
        setMostrarResultados(false)
        setShowModal(false)
        setSearchState('empty')
      }
      return
    }

    // En desktop, búsqueda automática con debounce
    const timer = setTimeout(() => {
      ejecutarBusqueda(termino)
    }, 800)

    return () => clearTimeout(timer)
  }, [termino, isMobile, ejecutarBusqueda])

  // Cerrar resultados al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        resultadosRef.current && 
        !resultadosRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setMostrarResultados(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])


  // Generar sugerencias inteligentes
  const generarSugerencias = useCallback((termino) => {
    const sugerenciasComunes = [
      'tubo 9 170', 'tubo 13 170', 'codo 90', 'codo 45',
      'te igual', 'reduccion', 'TUB-09-170', 'COD-90-170',
      'tubo 6 pulgadas', 'tubo 4 pulgadas', 'tubo 2 pulgadas'
    ]
    
    const terminoLower = termino.toLowerCase()
    const sugerenciasFiltradas = sugerenciasComunes
      .filter(s => s.toLowerCase().includes(terminoLower) && s.toLowerCase() !== terminoLower)
      .slice(0, 3)
    
    setSugerencias(sugerenciasFiltradas)
  }, [])

  // Iniciar reconocimiento de voz
  const iniciarReconocimientoVoz = useCallback(() => {
    if (reconocimientoRef.current && soporteVoz) {
      try {
        reconocimientoRef.current.start()
      } catch (error) {
        console.error('Error al iniciar reconocimiento:', error)
        toast.error('Error al iniciar reconocimiento de voz')
      }
    }
  }, [soporteVoz])

  // Aplicar sugerencia
  const aplicarSugerencia = useCallback((sugerencia) => {
    setTermino(sugerencia)
    inputRef.current?.focus()
  }, [])

  const handleSeleccionar = (articulo) => {
    onSeleccionarArticulo(articulo)
    setTermino('')
    setResultados([])
    setMostrarResultados(false)
    setShowModal(false)
    inputRef.current?.blur()
  }

  const handleInputFocus = () => {
    if (resultados.length > 0) {
      setMostrarResultados(true)
      setSearchState('results')
    } else if (termino.trim().length >= 3) {
      setSearchState('no-results')
    } else {
      setSearchState('empty')
    }
  }

  // Búsqueda manual (botón o Enter)
  const handleBusquedaManual = useCallback(() => {
    if (termino.trim().length >= 3) {
      ejecutarBusqueda(termino)
    } else {
      toast.error('Escribe al menos 3 caracteres para buscar')
    }
  }, [termino, ejecutarBusqueda])

  // Handler para tecla Enter
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleBusquedaManual()
    }
  }, [handleBusquedaManual])

  return (
    <>
      <div className={`mobile-search-container ${searchState === 'empty' ? 'search-state-empty' : ''}`}>
      {/* Input de búsqueda optimizado para móvil con entrada por voz */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={termino}
          onChange={(e) => setTermino(e.target.value)}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="mobile-search-input mobile-smooth-transition mobile-interactive"
          autoComplete="off"
          inputMode="search"
          enterKeyHint="search"
        />
        
        {/* Controles de búsqueda */}
        <div className="mobile-search-controls">
          {/* Botón de búsqueda manual - Solo en móvil */}
          {isMobile && (
            <button
              type="button"
              onClick={handleBusquedaManual}
              disabled={loading || termino.trim().length < 3}
              className={`mobile-search-button mobile-touch-target mobile-smooth-transition ${
                termino.trim().length >= 3 ? 'active' : ''
              }`}
              title="Buscar materiales"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          )}
          
          {/* Botón de reconocimiento de voz */}
          {soporteVoz && (
            <button
              type="button"
              onClick={iniciarReconocimientoVoz}
              disabled={reconocimientoVoz}
              className={`mobile-voice-button mobile-touch-target mobile-smooth-transition ${
                reconocimientoVoz ? 'active' : ''
              }`}
              title="Buscar por voz"
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          )}
          
          {/* Indicador de carga / Icono de búsqueda - Solo desktop */}
          {!isMobile && (
            <div className="mobile-search-icon">
              {loading ? (
                <div className="mobile-search-loading">
                  <div className="animate-spin rounded-full border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sugerencias rápidas */}
      {sugerencias.length > 0 && !mostrarResultados && (
        <div className="mobile-search-suggestions">
          <div className="suggestion-label">Sugerencias rápidas:</div>
          <div className="flex flex-wrap gap-2">
            {sugerencias.map((sugerencia, index) => (
              <button
                key={index}
                type="button"
                onClick={() => aplicarSugerencia(sugerencia)}
                className="mobile-suggestion-chip mobile-touch-target mobile-smooth-transition"
              >
                {sugerencia}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Indicador de reconocimiento de voz activo */}
      {reconocimientoVoz && (
        <div className="mobile-voice-indicator">
          <div className="voice-status">
            <div className="voice-dot"></div>
            <span className="voice-text">Escuchando... Habla ahora</span>
          </div>
          <p className="voice-hint">
            Di el código, tipo o medidas del material que buscas
          </p>
        </div>
      )}

      {/* Estado inicial de búsqueda - Placeholder (solo móvil) */}
      {!mostrarResultados && termino.length === 0 && (
        <div className="mobile-search-placeholder block md:hidden">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="placeholder-title">Buscar materiales</p>
          <p className="placeholder-hint">Escribe 3+ caracteres y pulsa buscar</p>
        </div>
      )}

      {/* Resultados de búsqueda mejorados para móvil - Solo en desktop */}
      {mostrarResultados && !isMobile && (
        <div
          ref={resultadosRef}
          className="mobile-search-results mobile-scroll-smooth mobile-hide-scrollbar"
        >
          {resultados.length === 0 ? (
            <div className="mobile-search-empty">
              <svg className="block md:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="empty-title">No se encontraron materiales</p>
              <p className="empty-hint">Intenta con otro término o usa el reconocimiento de voz</p>
            </div>
          ) : (
            <div>
              {/* Encabezado con contador */}
              <div className="results-header">
                <p className="results-count">
                  {resultados.length} material{resultados.length !== 1 ? 'es' : ''} encontrado{resultados.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              {resultados.map((articulo, index) => (
                <button
                  key={articulo.id}
                  type="button"
                  onClick={() => handleSeleccionar(articulo)}
                  className="result-item mobile-touch-target mobile-smooth-transition"
                >
                  <div className="flex flex-col space-y-3">
                    {/* Código del artículo con relevancia */}
                    <div className="flex items-center justify-between">
                      <div className="result-code">
                        {articulo.codigo}
                      </div>
                      {articulo.relevancia > 80 && (
                        <span className="result-badge">
                          Coincidencia exacta
                        </span>
                      )}
                    </div>
                    
                    {/* Información técnica destacada */}
                    <div className="result-details">
                      <div className="result-detail">
                        <span className="result-detail-label">Tipo:</span>
                        <span className="result-detail-value">{articulo.tipo}</span>
                      </div>
                      <div className="result-detail">
                        <span className="result-detail-label">Medida:</span>
                        <span className="result-detail-value">{articulo.pulgada}</span>
                      </div>
                      {articulo.espesor && (
                        <div className="result-detail">
                          <span className="result-detail-label">Espesor:</span>
                          <span className="result-detail-value">{articulo.espesor}mm</span>
                        </div>
                      )}
                      {articulo.diametro && (
                        <div className="result-detail">
                          <span className="result-detail-label">Diámetro:</span>
                          <span className="result-detail-value">{articulo.diametro}mm</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Descripción completa */}
                    <div className="result-description">
                      {articulo.descripcion_completa}
                    </div>
                    
                    {/* Indicadores de precios disponibles mejorados */}
                    <div className="flex items-center justify-between">
                      <div className="result-prices">
                        {articulo.tipos_precio_disponibles === 'ambos' && (
                          <>
                            <span className="price-badge aislamiento">Aislamiento</span>
                            <span className="price-badge aluminio">Aluminio</span>
                          </>
                        )}
                        {articulo.tipos_precio_disponibles === 'aislamiento' && (
                          <span className="price-badge aislamiento">Aislamiento</span>
                        )}
                        {articulo.tipos_precio_disponibles === 'aluminio' && (
                          <span className="price-badge aluminio">Aluminio</span>
                        )}
                      </div>
                      
                      {/* Indicador de selección */}
                      <div className="result-action">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      </div>

      {/* Modal Bottom Sheet para móvil */}
      {isMobile && (
        <BuscadorArticulosModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          resultados={resultados}
          loading={loading}
          onSeleccionarArticulo={handleSeleccionar}
          termino={termino}
        />
      )}
    </>
  )
}

export default BuscadorArticulos
