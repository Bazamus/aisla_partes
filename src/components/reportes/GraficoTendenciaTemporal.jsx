import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function GraficoTendenciaTemporal({ datos }) {
  if (!datos || datos.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 lg:p-6 mb-6">
        <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Tendencia Temporal
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          No hay datos disponibles
        </div>
      </div>
    );
  }

  // Formatear datos para el gráfico
  const datosFormateados = datos.map(item => ({
    periodo: item.periodo || '',
    partes: Number(item.total_partes) || 0,
    horas: Number(item.total_horas) || 0,
    empleados: Number(item.empleados_activos) || 0
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
              <span style={{ color: entry.color }}>●</span> {entry.name}: {' '}
              <span className="font-semibold">{Number(entry.value).toFixed(2)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 lg:p-6 mb-6">
      <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Tendencia Temporal
      </h3>
      <div className="w-full overflow-x-auto">
        <ResponsiveContainer width="100%" height={300} className="lg:h-[400px]">
          <LineChart 
            data={datosFormateados}
            margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis 
              dataKey="periodo" 
              stroke="#9CA3AF"
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={10}
            />
            <YAxis stroke="#9CA3AF" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="partes" 
              name="Partes Creados"
              stroke="#3B82F6" 
              strokeWidth={2}
              activeDot={{ r: 8 }}
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="horas" 
              name="Horas Trabajadas"
              stroke="#10B981" 
              strokeWidth={2}
              activeDot={{ r: 8 }}
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="empleados" 
              name="Empleados Activos"
              stroke="#F59E0B" 
              strokeWidth={2}
              strokeDasharray="5 5"
              activeDot={{ r: 8 }}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default GraficoTendenciaTemporal;

