import React, { useState } from 'react'
import { actualizarCantidadArticulo, eliminarArticuloDeParte } from '../../services/articulosService'
import { toast } from 'react-hot-toast'

const ListaArticulosSeleccionados = ({ articulos, onActualizar, readOnly = false, onEliminarTemporal, onActualizarTemporal }) => {
  const [editandoCantidad, setEditandoCantidad] = useState(null)
  const [nuevaCantidad, setNuevaCantidad] = useState('')

  const handleEditarCantidad = (articulo) => {
    setEditandoCantidad(articulo.id)
    setNuevaCantidad(articulo.cantidad.toString())
  }

  const handleGuardarCantidad = async (articulo) => {
    try {
      const cantidad = parseFloat(nuevaCantidad)
      if (cantidad <= 0) {
        toast.error('La cantidad debe ser mayor a 0')
        return
      }

      if (articulo.temporal) {
        // Actualizar artículo temporal
        if (onActualizarTemporal) {
          onActualizarTemporal(articulo.id, cantidad)
        }
        toast.success('Cantidad actualizada')
      } else {
        // Actualizar artículo guardado
        await actualizarCantidadArticulo(articulo.id, cantidad)
        toast.success('Cantidad actualizada')
        onActualizar()
      }
      
      setEditandoCantidad(null)
      setNuevaCantidad('')
    } catch (error) {
      console.error('Error al actualizar cantidad:', error)
      toast.error('Error al actualizar la cantidad')
    }
  }

  const handleCancelarEdicion = () => {
    setEditandoCantidad(null)
    setNuevaCantidad('')
  }

  const handleEliminar = async (articulo) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este material?')) {
      try {
        if (articulo.temporal) {
          // Eliminar artículo temporal
          if (onEliminarTemporal) {
            onEliminarTemporal(articulo.id)
          }
          toast.success('Material eliminado')
        } else {
          // Eliminar artículo guardado
          await eliminarArticuloDeParte(articulo.id)
          toast.success('Material eliminado')
          onActualizar()
        }
      } catch (error) {
        console.error('Error al eliminar artículo:', error)
        toast.error('Error al eliminar el material')
      }
    }
  }

  if (articulos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3" />
        </svg>
        <p>No hay materiales añadidos</p>
        <p className="text-sm mt-1">Usa la búsqueda o selección para añadir materiales</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {articulos.map((item) => (
        <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          {/* Header con código y tipo de precio */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <div className="font-mono text-sm font-semibold text-blue-600">
                  {item.articulos_precios?.codigo}
                </div>
                {item.temporal && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Temporal
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-800 leading-relaxed">
                {item.articulos_precios?.tipo} - Espesor: {item.articulos_precios?.espesor} - Diámetro: {item.articulos_precios?.diametro}
                {item.articulos_precios?.pulgada && (
                  <span> ({item.articulos_precios.pulgada})</span>
                )}
              </div>
            </div>
            
            {/* Indicador de tipo de precio */}
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 ${
              item.tipo_precio === 'aislamiento' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {item.tipo_precio === 'aislamiento' ? 'Aislamiento' : 'Aluminio'}
            </span>
          </div>

          {/* Cantidad y acciones */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {editandoCantidad === item.id ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={nuevaCantidad}
                    onChange={(e) => setNuevaCantidad(e.target.value)}
                    min="0.01"
                    step="0.01"
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                  <span className="text-sm text-gray-600">
                    {item.articulos_precios?.unidad}
                  </span>
                  <button
                    onClick={() => handleGuardarCantidad(item)}
                    className="p-1 text-green-600 hover:text-green-800"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={handleCancelarEdicion}
                    className="p-1 text-red-600 hover:text-red-800"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-lg text-gray-900">
                    {item.cantidad}
                  </span>
                  <span className="text-sm text-gray-600">
                    {item.articulos_precios?.unidad}
                  </span>
                  {!readOnly && (
                    <button
                      onClick={() => handleEditarCantidad(item)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Botón eliminar */}
            {!readOnly && editandoCantidad !== item.id && (
              <button
                onClick={() => handleEliminar(item)}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ListaArticulosSeleccionados
