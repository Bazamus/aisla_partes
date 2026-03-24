import React, { useEffect } from 'react'

const BuscadorArticulosModal = ({ 
  isOpen, 
  onClose, 
  resultados, 
  loading, 
  onSeleccionarArticulo,
  termino 
}) => {
  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-[9998] transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-[9999] animate-slide-up">
        <div className="bg-white rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col">
          {/* Handle visual para indicar que se puede deslizar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
          </div>

          {/* Header del modal */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Resultados de búsqueda
              </h3>
              <p className="text-sm text-gray-600">
                {loading ? 'Buscando...' : `${resultados.length} material${resultados.length !== 1 ? 'es' : ''} encontrado${resultados.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Cerrar"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : resultados.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-gray-600 font-medium mb-2">No se encontraron materiales</p>
                <p className="text-sm text-gray-500">Intenta con otro término</p>
              </div>
            ) : (
              <div className="space-y-3">
                {resultados.map((articulo) => (
                  <button
                    key={articulo.id}
                    type="button"
                    onClick={() => {
                      onSeleccionarArticulo(articulo)
                      onClose()
                    }}
                    className="w-full bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-500 hover:shadow-md transition-all duration-200 text-left"
                  >
                    {/* Código del artículo */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-bold text-lg text-blue-600">
                        {articulo.codigo}
                      </div>
                      {articulo.relevancia > 80 && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                          Coincidencia exacta
                        </span>
                      )}
                    </div>
                    
                    {/* Grid de información técnica */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-xs text-gray-500 mb-1">Tipo</div>
                        <div className="font-semibold text-gray-900">{articulo.tipo}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-xs text-gray-500 mb-1">Medida</div>
                        <div className="font-semibold text-gray-900">{articulo.pulgada}</div>
                      </div>
                      {articulo.espesor && (
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="text-xs text-gray-500 mb-1">Espesor</div>
                          <div className="font-semibold text-gray-900">{articulo.espesor}mm</div>
                        </div>
                      )}
                      {articulo.diametro && (
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="text-xs text-gray-500 mb-1">Diámetro</div>
                          <div className="font-semibold text-gray-900">{articulo.diametro}mm</div>
                        </div>
                      )}
                    </div>
                    
                    {/* Descripción completa */}
                    <div className="text-sm text-gray-700 mb-3 line-clamp-2">
                      {articulo.descripcion_completa}
                    </div>
                    
                    {/* Indicadores de precios */}
                    <div className="flex items-center gap-2">
                      {articulo.tipos_precio_disponibles === 'ambos' && (
                        <>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                            Aislamiento
                          </span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                            Aluminio
                          </span>
                        </>
                      )}
                      {articulo.tipos_precio_disponibles === 'aislamiento' && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                          Aislamiento
                        </span>
                      )}
                      {articulo.tipos_precio_disponibles === 'aluminio' && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                          Aluminio
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer con botón de cerrar */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default BuscadorArticulosModal

