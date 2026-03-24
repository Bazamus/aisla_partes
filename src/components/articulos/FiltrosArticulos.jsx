export default function FiltrosArticulos({ filtros, filtrosSeleccionados, onFiltroChange }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div>
          <label className="block text-md font-medium text-blue-700 mb-2">Tipo</label>
          <select
            value={filtrosSeleccionados.tipo}
            onChange={(e) => onFiltroChange('tipo', e.target.value)}
            className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-md py-3 px-4 bg-blue-50 text-blue-800"
          >
            <option value="">Todos los tipos</option>
            {filtros.tipos.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-md font-medium text-blue-700 mb-2">Espesor</label>
          <select
            value={filtrosSeleccionados.espesor}
            onChange={(e) => onFiltroChange('espesor', e.target.value)}
            className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-md py-3 px-4 bg-blue-50 text-blue-800"
          >
            <option value="">Todos los espesores</option>
            {filtros.espesores.map((espesor) => (
              <option key={espesor} value={espesor}>
                {espesor}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-md font-medium text-blue-700 mb-2">Diámetro</label>
          <select
            value={filtrosSeleccionados.diametro}
            onChange={(e) => onFiltroChange('diametro', e.target.value)}
            className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-md py-3 px-4 bg-blue-50 text-blue-800"
          >
            <option value="">Todos los diámetros</option>
            {filtros.diametros.map((diametro) => (
              <option key={diametro} value={diametro}>
                {diametro}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
