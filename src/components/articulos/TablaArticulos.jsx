export default function TablaArticulos({ articulos, loading, onEditArticulo, onEliminarArticulo }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-10 text-center">
          <p className="text-blue-600 text-lg">Cargando artículos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Vista de tabla para desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-blue-200">
          <thead className="bg-blue-100">
            <tr>
              <th className="px-6 py-4 text-left text-md font-semibold text-blue-800">Código</th>
              <th className="px-6 py-4 text-left text-md font-semibold text-blue-800">Tipo</th>
              <th className="px-6 py-4 text-left text-md font-semibold text-blue-800">Espesor</th>
              <th className="px-6 py-4 text-left text-md font-semibold text-blue-800">Diámetro</th>
              <th className="px-6 py-4 text-left text-md font-semibold text-blue-800">Pulgada</th>
              <th className="px-6 py-4 text-left text-md font-semibold text-blue-800">Precio Aislamiento</th>
              <th className="px-6 py-4 text-left text-md font-semibold text-blue-800">Precio Aluminio</th>
              <th className="px-6 py-4 text-left text-md font-semibold text-blue-800">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-100 bg-white">
            {articulos.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center text-blue-600">
                  No se encontraron artículos con los filtros seleccionados
                </td>
              </tr>
            ) : (
              articulos.map((articulo) => (
                <tr key={articulo.id} className="hover:bg-blue-50 transition-colors duration-150">
                  <td className="px-6 py-4 text-md text-gray-800 font-mono">
                    {articulo.codigo}
                  </td>
                  <td className="px-6 py-4 text-md text-gray-800">
                    {articulo.tipo}
                  </td>
                  <td className="px-6 py-4 text-md text-gray-800">
                    {articulo.espesor}
                  </td>
                  <td className="px-6 py-4 text-md text-gray-800">
                    {articulo.diametro}
                  </td>
                  <td className="px-6 py-4 text-md text-gray-800">
                    {articulo.pulgada || '-'}
                  </td>
                  <td className="px-6 py-4 text-md text-gray-800">
                    {articulo.precio_aislamiento ? (
                      <span className="font-semibold text-green-600">{articulo.precio_aislamiento} €</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-md text-gray-800">
                    {articulo.precio_aluminio ? (
                      <span className="font-semibold text-blue-600">{articulo.precio_aluminio} €</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-md text-gray-800">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEditArticulo(articulo)}
                        className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md text-blue-700 bg-white hover:bg-blue-50 transition-colors duration-200"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onEliminarArticulo(articulo.id)}
                        className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md text-red-700 bg-white hover:bg-red-50 transition-colors duration-200"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Vista de tarjetas para móvil */}
      <div className="md:hidden">
        {articulos.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-blue-600 text-lg">No se encontraron artículos con los filtros seleccionados</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {articulos.map((articulo) => (
              <div key={articulo.id} className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm">
                {/* Header con código y tipo */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-blue-800 font-mono">
                    {articulo.codigo}
                  </h3>
                  <p className="text-md text-blue-600 mt-1">{articulo.tipo}</p>
                </div>
                
                {/* Información del artículo */}
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Espesor:</span>
                    <span className="font-medium text-sm text-blue-800">{articulo.espesor}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Diámetro:</span>
                    <span className="font-medium text-sm text-blue-800">{articulo.diametro}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Pulgada:</span>
                    <span className="font-medium text-sm text-blue-800">{articulo.pulgada || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Precio Aislamiento:</span>
                    {articulo.precio_aislamiento ? (
                      <span className="font-semibold text-lg text-green-600">{articulo.precio_aislamiento} €</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Precio Aluminio:</span>
                    {articulo.precio_aluminio ? (
                      <span className="font-semibold text-lg text-blue-600">{articulo.precio_aluminio} €</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </div>
                
                {/* Botones de acción */}
                <div className="flex space-x-2 pt-3 border-t border-blue-100">
                  <button
                    onClick={() => onEditArticulo(articulo)}
                    className="flex-1 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md shadow-sm transition-colors text-sm"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Editar
                  </button>
                  <button
                    onClick={() => onEliminarArticulo(articulo.id)}
                    className="flex-1 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md shadow-sm transition-colors text-sm"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
