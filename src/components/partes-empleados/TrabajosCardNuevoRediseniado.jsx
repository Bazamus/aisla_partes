import React, { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-hot-toast'
import BuscadorArticulos from './BuscadorArticulos'
import SelectorArticulos from './SelectorArticulos'
import SelectorTipoPrecio from './SelectorTipoPrecio'
import ListaArticulosSeleccionados from './ListaArticulosSeleccionados'
import OtrosTrabajosTemporal from './OtrosTrabajosTemporal'
import { 
  obtenerArticulosParte, 
  añadirArticuloAParte 
} from '../../services/articulosService'
import { obtenerOtrosTrabajos } from '../../services/otrosTrabajosService'

const TrabajosCardNuevoRediseñado = ({ parteId, readOnly = false, onTrabajosChange }) => {
  const [articulosSeleccionados, setArticulosSeleccionados] = useState([])
  const [otrosTrabajos, setOtrosTrabajos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modoSeleccion, setModoSeleccion] = useState('jerarquico') // 'busqueda' o 'jerarquico' - Por defecto 'jerarquico' (Ver Materiales)
  const [articuloParaConfirmar, setArticuloParaConfirmar] = useState(null)
  
  // Trabajos temporales para cuando no hay parteId
  const [articulosTemporales, setArticulosTemporales] = useState([])
  const [otrosTrabajosTemporales, setOtrosTrabajosTemporales] = useState([])

  useEffect(() => {
    if (parteId) {
      cargarDatos()
    } else {
      setLoading(false)
    }
  }, [parteId])

  // Calcular datos de trabajos de forma memoizada
  const datosTrabajos = useMemo(() => {
    const articulosFinales = parteId ? articulosSeleccionados : articulosTemporales
    const otrosTrabajosFinales = parteId ? otrosTrabajos : otrosTrabajosTemporales
    const totalTrabajos = articulosFinales.length + otrosTrabajosFinales.length
    const costoOtrosTrabajos = otrosTrabajosFinales.reduce(
      (sum, t) => sum + ((t.cantidad || 0) * (t.precio_unitario || 0)), 0
    )

    return {
      articulos: articulosFinales,
      otrosTrabajos: otrosTrabajosFinales,
      totalTrabajos,
      hayTrabajos: totalTrabajos > 0,
      costoOtrosTrabajos
    }
  }, [articulosSeleccionados, otrosTrabajos, articulosTemporales, otrosTrabajosTemporales, parteId])

  // Notificar cambios en trabajos al componente padre
  useEffect(() => {
    if (onTrabajosChange) {
      onTrabajosChange(datosTrabajos)
    }
  }, [datosTrabajos, onTrabajosChange])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [articulosData, otrosTrabajosData] = await Promise.all([
        obtenerArticulosParte(parteId),
        obtenerOtrosTrabajos(parteId)
      ])
      
      setArticulosSeleccionados(articulosData)
      setOtrosTrabajos(otrosTrabajosData)
    } catch (error) {
      console.error('Error al cargar datos:', error)
      toast.error('Error al cargar los trabajos')
    } finally {
      setLoading(false)
    }
  }

  const handleSeleccionarArticulo = (articulo) => {
    // Verificar que el artículo tenga precios disponibles
    if (articulo.tipos_precio_disponibles === 'ninguno') {
      toast.error('Este artículo no tiene precios disponibles')
      return
    }
    
    setArticuloParaConfirmar(articulo)
  }

  const handleConfirmarArticulo = async ({ articulo, tipoPrecio, cantidad }) => {
    if (!parteId) {
      // Añadir a lista temporal
      const nuevoArticulo = {
        id: `temp_${Date.now()}`,
        articulo_id: articulo.id,
        tipo_precio: tipoPrecio,
        cantidad: cantidad,
        articulos_precios: {
          codigo: articulo.codigo,
          tipo: articulo.tipo,
          espesor: articulo.espesor,
          diametro: articulo.diametro,
          pulgada: articulo.pulgada,
          unidad: articulo.unidad
        },
        temporal: true
      }
      
      setArticulosTemporales(prev => [...prev, nuevoArticulo])
      toast.success('Material añadido (se guardará al completar el parte)')
      setArticuloParaConfirmar(null)
      return
    }

    try {
      await añadirArticuloAParte(parteId, articulo.id, tipoPrecio, cantidad)
      toast.success('Material añadido correctamente')
      setArticuloParaConfirmar(null)
      cargarDatos()
    } catch (error) {
      console.error('Error al añadir artículo:', error)
      toast.error('Error al añadir el material')
    }
  }

  const handleCancelarSeleccion = () => {
    setArticuloParaConfirmar(null)
  }

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
          <span className="text-gray-600">Cargando trabajos...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sección de Añadir Trabajos */}
      {!readOnly && (
        <div className="bg-gray-50 rounded-xl p-4 md:p-6">
          <div className="space-y-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                Añadir Material
              </h3>
              <p className="text-sm text-gray-600 ml-11">
                Busca o selecciona materiales del catálogo
              </p>
            </div>
            
            {/* Toggle modo de selección - Optimizado para móvil */}
            <div className="flex bg-white rounded-lg p-1 border border-gray-200">
              <button
                type="button"
                onClick={() => setModoSeleccion('jerarquico')}
                className={`flex-1 px-4 py-3 md:py-2 text-base md:text-sm font-medium rounded-md transition-colors duration-200 ${
                  modoSeleccion === 'jerarquico'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Ver Materiales
              </button>
              <button
                type="button"
                onClick={() => setModoSeleccion('busqueda')}
                className={`flex-1 px-4 py-3 md:py-2 text-base md:text-sm font-medium rounded-md transition-colors duration-200 ${
                  modoSeleccion === 'busqueda'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Buscar
              </button>
            </div>
          </div>

          {/* Búsqueda Universal */}
          {modoSeleccion === 'busqueda' && (
            <div>
              <BuscadorArticulos 
                onSeleccionarArticulo={handleSeleccionarArticulo}
                placeholder="Buscar por..."
              />
            </div>
          )}

          {/* Selección Jerárquica */}
          {modoSeleccion === 'jerarquico' && (
            <div>
              <SelectorArticulos 
                onSeleccionarArticulo={handleSeleccionarArticulo}
              />
            </div>
          )}
        </div>
      )}

      {/* Lista de Materiales Seleccionados */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            Lista de Materiales
          </h3>
          {datosTrabajos.articulos.length > 0 && (
            <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {datosTrabajos.articulos.length} material{datosTrabajos.articulos.length !== 1 ? 'es' : ''}
            </span>
          )}
        </div>

        <ListaArticulosSeleccionados 
          articulos={datosTrabajos.articulos}
          onActualizar={cargarDatos}
          readOnly={readOnly}
          onEliminarTemporal={(id) => {
            setArticulosTemporales(prev => prev.filter(art => art.id !== id))
          }}
          onActualizarTemporal={(id, cantidad) => {
            setArticulosTemporales(prev => 
              prev.map(art => art.id === id ? { ...art, cantidad } : art)
            )
          }}
        />
      </div>

      {/* Otros Trabajos */}
      <OtrosTrabajosTemporal 
        parteId={parteId}
        otrosTrabajos={otrosTrabajos}
        otrosTrabajosTemporales={otrosTrabajosTemporales}
        setOtrosTrabajosTemporales={setOtrosTrabajosTemporales}
        onActualizar={cargarDatos}
        readOnly={readOnly}
      />

      {/* Modal de Confirmación de Artículo */}
      {articuloParaConfirmar && (
        <SelectorTipoPrecio 
          articulo={articuloParaConfirmar}
          onSeleccionar={handleConfirmarArticulo}
          onCancelar={handleCancelarSeleccion}
        />
      )}
    </div>
  )
}

export default TrabajosCardNuevoRediseñado
