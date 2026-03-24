import React, { useState, useEffect } from 'react'
import { 
  obtenerTipos, 
  obtenerEspesoresPorTipo, 
  obtenerDiametrosPorTipoEspesor,
  obtenerArticuloPorEspecificaciones 
} from '../../services/articulosService'
import { toast } from 'react-hot-toast'
import SelectorArticulosMobileModal from './SelectorArticulosMobileModal'

const SelectorArticulos = ({ onSeleccionarArticulo }) => {
  const [tipos, setTipos] = useState([])
  const [espesores, setEspesores] = useState([])
  const [diametros, setDiametros] = useState([])
  
  const [tipoSeleccionado, setTipoSeleccionado] = useState('')
  const [espesorSeleccionado, setEspesorSeleccionado] = useState('')
  const [diametroSeleccionado, setDiametroSeleccionado] = useState('')
  
  const [loading, setLoading] = useState({
    tipos: false,
    espesores: false,
    diametros: false,
    articulo: false
  })

  // Estado para el modal móvil
  const [showMobileModal, setShowMobileModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Cargar tipos al montar el componente
  useEffect(() => {
    cargarTipos()
  }, [])

  // Cargar espesores cuando se selecciona un tipo
  useEffect(() => {
    if (tipoSeleccionado) {
      cargarEspesores(tipoSeleccionado)
      setEspesorSeleccionado('')
      setDiametroSeleccionado('')
      setEspesores([])
      setDiametros([])
    }
  }, [tipoSeleccionado])

  // Cargar diámetros cuando se selecciona un espesor
  useEffect(() => {
    if (tipoSeleccionado && espesorSeleccionado) {
      cargarDiametros(tipoSeleccionado, espesorSeleccionado)
      setDiametroSeleccionado('')
      setDiametros([])
    }
  }, [tipoSeleccionado, espesorSeleccionado])

  // Cargar artículo cuando se completa la selección
  useEffect(() => {
    if (tipoSeleccionado && espesorSeleccionado && diametroSeleccionado) {
      cargarArticulo(tipoSeleccionado, espesorSeleccionado, diametroSeleccionado)
    }
  }, [tipoSeleccionado, espesorSeleccionado, diametroSeleccionado])

  const cargarTipos = async () => {
    try {
      setLoading(prev => ({ ...prev, tipos: true }))
      const data = await obtenerTipos()
      setTipos(data)
    } catch (error) {
      console.error('Error al cargar tipos:', error)
      toast.error('Error al cargar tipos de materiales')
    } finally {
      setLoading(prev => ({ ...prev, tipos: false }))
    }
  }

  const cargarEspesores = async (tipo) => {
    try {
      setLoading(prev => ({ ...prev, espesores: true }))
      const data = await obtenerEspesoresPorTipo(tipo)
      setEspesores(data)
    } catch (error) {
      console.error('Error al cargar espesores:', error)
      toast.error('Error al cargar espesores')
    } finally {
      setLoading(prev => ({ ...prev, espesores: false }))
    }
  }

  const cargarDiametros = async (tipo, espesor) => {
    try {
      setLoading(prev => ({ ...prev, diametros: true }))
      const data = await obtenerDiametrosPorTipoEspesor(tipo, parseInt(espesor))
      setDiametros(data)
    } catch (error) {
      console.error('Error al cargar diámetros:', error)
      toast.error('Error al cargar diámetros')
    } finally {
      setLoading(prev => ({ ...prev, diametros: false }))
    }
  }

  const cargarArticulo = async (tipo, espesor, diametro) => {
    try {
      setLoading(prev => ({ ...prev, articulo: true }))
      const articulo = await obtenerArticuloPorEspecificaciones(
        tipo, 
        parseInt(espesor), 
        parseInt(diametro)
      )
      onSeleccionarArticulo(articulo)
    } catch (error) {
      console.error('Error al cargar artículo:', error)
      toast.error('Error al cargar el artículo seleccionado')
    } finally {
      setLoading(prev => ({ ...prev, articulo: false }))
    }
  }

  const resetearSeleccion = () => {
    setTipoSeleccionado('')
    setEspesorSeleccionado('')
    setDiametroSeleccionado('')
    setEspesores([])
    setDiametros([])
  }

  // Si es móvil, mostrar solo el botón para abrir el modal
  if (isMobile) {
    return (
      <>
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="mb-3">
              <svg className="w-12 h-12 mx-auto text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Selección por Características</h3>
            <p className="text-sm text-gray-600 mb-4">Selecciona tipo, espesor y diámetro</p>
            <button
              type="button"
              onClick={() => setShowMobileModal(true)}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold text-base hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Iniciar Selección</span>
            </button>
          </div>
        </div>

        {/* Modal móvil */}
        <SelectorArticulosMobileModal
          isOpen={showMobileModal}
          onClose={() => setShowMobileModal(false)}
          onSeleccionarArticulo={onSeleccionarArticulo}
        />
      </>
    )
  }

  // Vista desktop tradicional
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Selección por Características</h3>
        {(tipoSeleccionado || espesorSeleccionado || diametroSeleccionado) && (
          <button
            type="button"
            onClick={resetearSeleccion}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Selector de Tipo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          1. Selecciona el Tipo
        </label>
        <select
          value={tipoSeleccionado}
          onChange={(e) => setTipoSeleccionado(e.target.value)}
          disabled={loading.tipos}
          className="w-full px-4 py-4 text-lg bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
        >
          <option value="">-- Selecciona un tipo --</option>
          {tipos.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>
        {loading.tipos && (
          <div className="mt-2 text-sm text-gray-500 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            Cargando tipos...
          </div>
        )}
      </div>

      {/* Selector de Espesor */}
      {tipoSeleccionado && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            2. Selecciona el Espesor
          </label>
          <select
            value={espesorSeleccionado}
            onChange={(e) => setEspesorSeleccionado(e.target.value)}
            disabled={loading.espesores || espesores.length === 0}
            className="w-full px-4 py-4 text-lg bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          >
            <option value="">-- Selecciona un espesor --</option>
            {espesores.map((espesor) => (
              <option key={espesor} value={espesor}>
                {espesor}
              </option>
            ))}
          </select>
          {loading.espesores && (
            <div className="mt-2 text-sm text-gray-500 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              Cargando espesores...
            </div>
          )}
        </div>
      )}

      {/* Selector de Diámetro */}
      {tipoSeleccionado && espesorSeleccionado && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            3. Selecciona el Diámetro
          </label>
          <select
            value={diametroSeleccionado}
            onChange={(e) => setDiametroSeleccionado(e.target.value)}
            disabled={loading.diametros || diametros.length === 0}
            className="w-full px-4 py-4 text-lg bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          >
            <option value="">-- Selecciona un diámetro --</option>
            {diametros.map((diametro) => (
              <option key={diametro} value={diametro}>
                {diametro}
              </option>
            ))}
          </select>
          {loading.diametros && (
            <div className="mt-2 text-sm text-gray-500 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              Cargando diámetros...
            </div>
          )}
        </div>
      )}

      {/* Indicador de carga del artículo */}
      {loading.articulo && (
        <div className="p-4 bg-blue-50 rounded-xl">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
            <span className="text-blue-700 font-medium">Cargando artículo...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default SelectorArticulos
