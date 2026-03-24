import { useState, useEffect } from 'react'
import { obtenerServicios } from '../../services/serviciosService'

const SelectorServicios = ({ onSeleccionar }) => {
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await obtenerServicios()
        setServicios(data)
      } catch (error) {
        console.error('Error al cargar servicios:', error)
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  const serviciosFiltrados = busqueda.trim()
    ? servicios.filter(s =>
        s.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.codigo.toLowerCase().includes(busqueda.toLowerCase())
      )
    : servicios

  if (loading) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        Cargando servicios...
      </div>
    )
  }

  if (servicios.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        No hay servicios disponibles. Crea servicios desde la página de Precios.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Campo de búsqueda */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar servicio..."
          className="w-full pl-10 pr-4 py-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
      </div>

      {/* Lista de servicios */}
      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
        {serviciosFiltrados.length === 0 ? (
          <div className="p-3 text-center text-gray-500 text-sm">
            No se encontraron servicios
          </div>
        ) : (
          serviciosFiltrados.map((servicio) => (
            <button
              key={servicio.id}
              type="button"
              onClick={() => onSeleccionar(servicio)}
              className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors duration-150 flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded shrink-0">
                    {servicio.codigo}
                  </span>
                  <span className="text-sm text-gray-800 truncate">
                    {servicio.descripcion}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-semibold text-green-600">
                  {Number(servicio.precio).toFixed(2)}€
                </span>
                <span className="text-xs text-gray-500 ml-1">/{servicio.unidad}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

export default SelectorServicios
