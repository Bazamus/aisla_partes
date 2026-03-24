import React, { useState, useEffect, useRef } from 'react'
import {
  obtenerTipos,
  obtenerEspesoresPorTipo,
  obtenerDiametrosPorTipoEspesor,
  obtenerArticuloPorEspecificaciones
} from '../../services/articulosService'
import { toast } from 'react-hot-toast'

const SelectorArticulosMobileModal = ({ isOpen, onClose, onSeleccionarArticulo }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [tipos, setTipos] = useState([])
  const [espesores, setEspesores] = useState([])
  const [diametros, setDiametros] = useState([])

  const [tipoSeleccionado, setTipoSeleccionado] = useState('')
  const [espesorSeleccionado, setEspesorSeleccionado] = useState('')

  const [loading, setLoading] = useState({
    tipos: false,
    espesores: false,
    diametros: false,
    articulo: false
  })

  const scrollContainerRef = useRef(null)

  // Cargar tipos al abrir el modal - SIN bloquear body
  useEffect(() => {
    if (isOpen) {
      cargarTipos()
      resetearSeleccion()

      // Resetear scroll al inicio cuando abre
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0
      }
    }
  }, [isOpen])

  const cargarTipos = async () => {
    setLoading(prev => ({ ...prev, tipos: true }))
    try {
      const tiposData = await obtenerTipos()
      setTipos(tiposData)
    } catch (error) {
      console.error('Error cargando tipos:', error)
      toast.error('Error al cargar tipos de artículos')
    } finally {
      setLoading(prev => ({ ...prev, tipos: false }))
    }
  }

  const cargarEspesores = async (tipo) => {
    setLoading(prev => ({ ...prev, espesores: true }))
    try {
      const espesoresData = await obtenerEspesoresPorTipo(tipo)
      setEspesores(espesoresData)
    } catch (error) {
      console.error('Error cargando espesores:', error)
      toast.error('Error al cargar espesores')
    } finally {
      setLoading(prev => ({ ...prev, espesores: false }))
    }
  }

  const cargarDiametros = async (tipo, espesor) => {
    setLoading(prev => ({ ...prev, diametros: true }))
    try {
      const diametrosData = await obtenerDiametrosPorTipoEspesor(tipo, espesor)
      setDiametros(diametrosData)
    } catch (error) {
      console.error('Error cargando diámetros:', error)
      toast.error('Error al cargar diámetros')
    } finally {
      setLoading(prev => ({ ...prev, diametros: false }))
    }
  }

  const buscarArticulo = async (tipo, espesor, diametro) => {
    setLoading(prev => ({ ...prev, articulo: true }))
    try {
      const articulo = await obtenerArticuloPorEspecificaciones(tipo, espesor, diametro)
      if (articulo) {
        onSeleccionarArticulo(articulo)
        handleClose()
        toast.success('Artículo encontrado y añadido')
      } else {
        toast.error('No se encontró un artículo con esas especificaciones')
      }
    } catch (error) {
      console.error('Error buscando artículo:', error)
      toast.error('Error al buscar el artículo')
    } finally {
      setLoading(prev => ({ ...prev, articulo: false }))
    }
  }

  const resetearSeleccion = () => {
    setCurrentStep(1)
    setTipoSeleccionado('')
    setEspesorSeleccionado('')
    setEspesores([])
    setDiametros([])
  }

  const handleClose = () => {
    resetearSeleccion()
    onClose()
  }

  const handleTipoSelect = async (tipo) => {
    setTipoSeleccionado(tipo)
    setCurrentStep(2)
    await cargarEspesores(tipo)
    // Reset scroll al cambiar de paso
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }

  const handleEspesorSelect = async (espesor) => {
    setEspesorSeleccionado(espesor)
    setCurrentStep(3)
    await cargarDiametros(tipoSeleccionado, espesor)
    // Reset scroll al cambiar de paso
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }

  const handleDiametroSelect = async (diametro) => {
    await buscarArticulo(tipoSeleccionado, espesorSeleccionado, diametro)
  }

  const handleBack = () => {
    if (currentStep === 3) {
      setCurrentStep(2)
      setDiametros([])
    } else if (currentStep === 2) {
      setCurrentStep(1)
      setEspesorSeleccionado('')
      setEspesores([])
      setDiametros([])
    }
    // Reset scroll al volver atrás
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/50"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden'
      }}
    >
      {/* Modal Container */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl"
        style={{
          maxHeight: '90vh',
          height: 'auto',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.3s ease-out'
        }}
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white shrink-0">
          <div className="flex items-center">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="mr-3 p-2 rounded-full hover:bg-blue-700 transition-colors active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h3 className="text-lg font-semibold">
              {currentStep === 1 && 'Seleccionar Tipo'}
              {currentStep === 2 && 'Seleccionar Espesor'}
              {currentStep === 3 && 'Seleccionar Diámetro'}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-blue-700 transition-colors active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress indicator - Fixed */}
        <div className="px-4 py-3 bg-gray-50 shrink-0">
          <div className="flex items-center justify-between text-sm">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                1
              </div>
              <span className="ml-2">Tipo</span>
            </div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                2
              </div>
              <span className="ml-2">Espesor</span>
            </div>
            <div className={`flex items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                3
              </div>
              <span className="ml-2">Diámetro</span>
            </div>
          </div>
        </div>

        {/* Breadcrumb - Fixed */}
        {(tipoSeleccionado || espesorSeleccionado) && (
          <div className="px-4 py-2 bg-blue-50 border-b shrink-0">
            <div className="flex items-center text-sm text-blue-700">
              {tipoSeleccionado && (
                <>
                  <span className="font-medium">{tipoSeleccionado}</span>
                  {espesorSeleccionado && (
                    <>
                      <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="font-medium">{espesorSeleccionado}</span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* SCROLLABLE CONTENT AREA */}
        <div
          ref={scrollContainerRef}
          className="p-4 grow"
          style={{
            overflowY: 'scroll',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            height: 'auto',
            maxHeight: 'calc(90vh - 180px)',
            position: 'relative'
          }}
        >
          {/* Step 1: Tipos */}
          {currentStep === 1 && (
            <div className="space-y-3">
              {loading.tipos ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                  <span className="text-gray-600">Cargando tipos...</span>
                </div>
              ) : (
                tipos.map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => handleTipoSelect(tipo)}
                    className="w-full p-4 text-left bg-white border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{tipo}</span>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Step 2: Espesores */}
          {currentStep === 2 && (
            <div className="space-y-3">
              {loading.espesores ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                  <span className="text-gray-600">Cargando espesores...</span>
                </div>
              ) : (
                espesores.map((espesor) => (
                  <button
                    key={espesor}
                    type="button"
                    onClick={() => handleEspesorSelect(espesor)}
                    className="w-full p-4 text-left bg-white border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{espesor}</span>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Step 3: Diámetros */}
          {currentStep === 3 && (
            <div className="space-y-3">
              {loading.diametros ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                  <span className="text-gray-600">Cargando diámetros...</span>
                </div>
              ) : (
                diametros.map((diametro) => (
                  <button
                    key={diametro}
                    type="button"
                    onClick={() => handleDiametroSelect(diametro)}
                    disabled={loading.articulo}
                    className="w-full p-4 text-left bg-white border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{diametro}</span>
                      {loading.articulo ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      ) : (
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Loading overlay cuando busca artículo */}
        {loading.articulo && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-t-3xl">
            <div className="bg-white rounded-xl p-6 mx-4 shadow-xl">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
                <span className="text-gray-700 font-medium">Buscando artículo...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default SelectorArticulosMobileModal
