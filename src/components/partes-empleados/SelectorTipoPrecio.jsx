import React, { useState } from 'react'

const SelectorTipoPrecio = ({ articulo, onSeleccionar, onCancelar }) => {
  const [tipoSeleccionado, setTipoSeleccionado] = useState('')
  const [cantidad, setCantidad] = useState('1')

  if (!articulo) return null

  const tiposDisponibles = []
  if (articulo.precio_aislamiento !== null) {
    tiposDisponibles.push('aislamiento')
  }
  if (articulo.precio_aluminio !== null) {
    tiposDisponibles.push('aluminio')
  }

  const handleConfirmar = () => {
    if (!tipoSeleccionado || !cantidad || parseFloat(cantidad) <= 0) {
      return
    }

    onSeleccionar({
      articulo,
      tipoPrecio: tipoSeleccionado,
      cantidad: parseFloat(cantidad)
    })

    // Reset
    setTipoSeleccionado('')
    setCantidad('1')
  }

  const handleCancelar = () => {
    setTipoSeleccionado('')
    setCantidad('1')
    onCancelar()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Confirmar Material</h3>
          <p className="text-sm text-gray-600 mt-1">
            Selecciona el tipo de precio y la cantidad
          </p>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Información del artículo */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="font-mono text-sm font-semibold text-blue-600 mb-2">
              {articulo.codigo}
            </div>
            <div className="text-sm text-gray-800">
              {articulo.descripcion_completa}
            </div>
          </div>

          {/* Selector de tipo de precio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Material
            </label>
            <div className="grid grid-cols-1 gap-3">
              {tiposDisponibles.map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setTipoSeleccionado(tipo)}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    tipoSeleccionado === tipo
                      ? tipo === 'aislamiento'
                        ? 'border-green-500 bg-green-50 text-green-800'
                        : 'border-blue-500 bg-blue-50 text-blue-800'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium capitalize">
                        {tipo === 'aislamiento' ? 'Aislamiento' : 'Aluminio'}
                      </div>
                      <div className="text-sm opacity-75">
                        Material {tipo === 'aislamiento' ? 'de aislamiento' : 'de aluminio'}
                      </div>
                    </div>
                    {tipoSeleccionado === tipo && (
                      <div className={`w-5 h-5 rounded-full ${
                        tipo === 'aislamiento' ? 'bg-green-500' : 'bg-blue-500'
                      } flex items-center justify-center`}>
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Input de cantidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad ({articulo.unidad})
            </label>
            <input
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              min="0.01"
              step="0.01"
              className="w-full px-4 py-4 text-lg bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder="Introduce la cantidad"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="p-6 border-t border-gray-200 flex space-x-3">
          <button
            type="button"
            onClick={handleCancelar}
            className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors duration-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={!tipoSeleccionado || !cantidad || parseFloat(cantidad) <= 0}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors duration-200"
          >
            Añadir
          </button>
        </div>
      </div>
    </div>
  )
}

export default SelectorTipoPrecio
