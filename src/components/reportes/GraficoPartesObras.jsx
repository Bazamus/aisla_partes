import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function GraficoPartesObras({ datos }) {
  if (!datos || datos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-3 md:p-4 lg:p-6 mb-3 md:mb-6">
        <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-3 md:mb-4 text-gray-900">
          Actividad por Obra
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No hay datos disponibles
        </div>
      </div>
    );
  }

  // Tomar solo las top 8 obras
  const top8 = datos.slice(0, 8).map(obra => ({
    nombre: (obra.obra_numero || '') + ' - ' + (obra.obra_nombre || 'Sin nombre').substring(0, 20),
    costo: Number(obra.costo_total) || 0,
    costoMateriales: Number(obra.costo_materiales) || Number(obra.costo_total) || 0,
    costoServicios: Number(obra.costo_servicios) || 0,
    partes: Number(obra.total_partes) || 0
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <p className="text-sm text-gray-600">
            Costo Total: <span className="font-semibold">{data?.costo?.toFixed(2)} €</span>
          </p>
          {data?.costoServicios > 0 && (
            <>
              <p className="text-xs text-blue-600 mt-1">
                Materiales: {data.costoMateriales?.toFixed(2)} €
              </p>
              <p className="text-xs text-orange-600">
                Servicios: {data.costoServicios?.toFixed(2)} €
              </p>
            </>
          )}
          <p className="text-sm text-gray-600">
            Partes: <span className="font-semibold">{data?.partes}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow p-3 md:p-4 lg:p-6 mb-3 md:mb-6">
      <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-3 md:mb-4 text-gray-900">
        Actividad por Obra (Top 8)
      </h3>
      <div className="w-full overflow-x-auto">
        <ResponsiveContainer width="100%" height={300} className="lg:h-[400px]">
          <BarChart 
            data={top8}
            margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis 
              dataKey="nombre" 
              stroke="#9CA3AF"
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={10}
            />
            <YAxis stroke="#9CA3AF" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="costo" 
              name="Costo Total (€)"
              fill="#3B82F6" 
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default GraficoPartesObras;

