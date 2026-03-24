export default function TablaServicios({ servicios, loading, onEditServicio, onEliminarServicio }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-10 text-center">
          <p className="text-orange-600 text-lg">Cargando servicios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Vista de tabla para desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-orange-200">
          <thead className="bg-orange-50">
            <tr>
              <th className="px-6 py-4 text-left text-md font-semibold text-orange-800">Código</th>
              <th className="px-6 py-4 text-left text-md font-semibold text-orange-800">Descripción</th>
              <th className="px-6 py-4 text-left text-md font-semibold text-orange-800">Unidad</th>
              <th className="px-6 py-4 text-left text-md font-semibold text-orange-800">Precio</th>
              <th className="px-6 py-4 text-left text-md font-semibold text-orange-800">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-100 bg-white">
            {servicios.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-orange-600">
                  No hay servicios registrados. Pulsa "Añadir Servicio" para crear uno.
                </td>
              </tr>
            ) : (
              servicios.map((servicio) => (
                <tr key={servicio.id} className="hover:bg-orange-50 transition-colors duration-150">
                  <td className="px-6 py-4 text-md text-gray-800 font-mono font-semibold text-orange-700">
                    {servicio.codigo}
                  </td>
                  <td className="px-6 py-4 text-md text-gray-800">
                    {servicio.descripcion}
                  </td>
                  <td className="px-6 py-4 text-md text-gray-800">
                    {servicio.unidad}
                  </td>
                  <td className="px-6 py-4 text-md">
                    <span className="font-semibold text-green-600">{Number(servicio.precio).toFixed(2)} €</span>
                  </td>
                  <td className="px-6 py-4 text-md text-gray-800">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEditServicio(servicio)}
                        className="inline-flex items-center px-4 py-2 border border-orange-300 rounded-md text-orange-700 bg-white hover:bg-orange-50 transition-colors duration-200"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onEliminarServicio(servicio.id)}
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
        {servicios.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-orange-600 text-lg">No hay servicios registrados</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {servicios.map((servicio) => (
              <div key={servicio.id} className="bg-white border border-orange-200 rounded-lg p-4 shadow-sm">
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-orange-700 font-mono">
                    {servicio.codigo}
                  </h3>
                  <p className="text-md text-gray-800 mt-1">{servicio.descripcion}</p>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Unidad:</span>
                    <span className="font-medium text-sm text-gray-800">{servicio.unidad}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Precio:</span>
                    <span className="font-semibold text-lg text-green-600">{Number(servicio.precio).toFixed(2)} €</span>
                  </div>
                </div>

                <div className="flex space-x-2 pt-3 border-t border-orange-100">
                  <button
                    onClick={() => onEditServicio(servicio)}
                    className="flex-1 flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-md shadow-sm transition-colors text-sm"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Editar
                  </button>
                  <button
                    onClick={() => onEliminarServicio(servicio.id)}
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
