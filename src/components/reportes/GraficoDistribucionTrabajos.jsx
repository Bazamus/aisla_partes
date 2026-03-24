import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function GraficoDistribucionTrabajos({ datos }) {
  if (!datos || datos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-3 md:p-4 lg:p-6 mb-3 md:mb-6">
        <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-3 md:mb-4 text-gray-900">
          Distribución de Costos por Tipo
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No hay datos disponibles
        </div>
      </div>
    );
  }

  // Datos ya vienen agrupados por tipo de material (incluye "Servicios" si hay)
  const datosFormateados = datos.map(item => ({
    name: item.tipo_material || 'Sin definir',
    value: Number(item.costo_total || 0),
    cantidad: Number(item.total_cantidad || 0)
  }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#14B8A6', '#EC4899'];

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            Costo: <span className="font-semibold">{data.value.toFixed(2)} €</span>
          </p>
          <p className="text-sm text-gray-600">
            Cantidad: <span className="font-semibold">{data.cantidad}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow p-3 md:p-4 lg:p-6 mb-3 md:mb-6">
      <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-3 md:mb-4 text-gray-900">
        Distribución de Costos por Tipo
      </h3>
      <div className="w-full overflow-x-auto">
        <ResponsiveContainer width="100%" height={300} className="lg:h-[400px]">
          <PieChart>
            <Pie
              data={datosFormateados}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={100}
              innerRadius={50}
              fill="#8884d8"
              dataKey="value"
            >
              {datosFormateados.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.name === 'Servicios' ? '#F97316' : COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default GraficoDistribucionTrabajos;

