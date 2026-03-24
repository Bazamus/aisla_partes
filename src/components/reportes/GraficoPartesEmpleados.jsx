import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

function GraficoPartesEmpleados({ datos }) {
  if (!datos || datos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-3 md:p-4 lg:p-6 mb-3 md:mb-6">
        <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-3 md:mb-4 text-gray-900">
          Costo Total por Empleado
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No hay datos disponibles
        </div>
      </div>
    );
  }

  // Función para acortar nombres largos
  const acortarNombre = (nombreCompleto) => {
    if (!nombreCompleto) return 'Sin nombre';
    
    const partes = nombreCompleto.trim().split(' ');
    
    // Si el nombre tiene más de 2 palabras, mostrar primer apellido + inicial(es)
    if (partes.length > 2) {
      const apellidos = partes.slice(1); // Todo excepto el primer nombre
      const primerApellido = apellidos[0];
      const inicial = partes[0].charAt(0).toUpperCase();
      return `${primerApellido} ${inicial}.`;
    }
    
    // Si tiene 2 palabras o menos, devolver tal cual
    return nombreCompleto;
  };

  // Tomar solo los top 10 empleados
  const top10 = datos.slice(0, 10).map(emp => ({
    nombreCompleto: emp.empleado_nombre || 'Sin nombre',
    nombre: acortarNombre(emp.empleado_nombre),
    costo: Number(emp.costo_total) || 0,
    costoMateriales: Number(emp.costo_materiales) || Number(emp.costo_total) || 0,
    costoServicios: Number(emp.costo_servicios) || 0,
    partes: emp.total_partes || 0
  }));

  // Colores para las barras
  const COLORS = [
    '#3B82F6', // azul
    '#10B981', // verde
    '#F59E0B', // amarillo
    '#EF4444', // rojo
    '#8B5CF6', // púrpura
    '#EC4899', // rosa
    '#14B8A6', // teal
    '#F97316', // naranja
    '#6366F1', // índigo
    '#84CC16'  // lima
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-gray-900">{data.nombreCompleto}</p>
          <p className="text-sm text-gray-600">
            Costo Total: <span className="font-semibold">{data.costo.toFixed(2)} €</span>
          </p>
          {data.costoServicios > 0 && (
            <>
              <p className="text-xs text-blue-600 mt-1">
                Materiales: {data.costoMateriales.toFixed(2)} €
              </p>
              <p className="text-xs text-orange-600">
                Servicios: {data.costoServicios.toFixed(2)} €
              </p>
            </>
          )}
          <p className="text-sm text-gray-600">
            Partes: <span className="font-semibold">{data.partes}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow p-3 md:p-4 lg:p-6 mb-3 md:mb-6">
      <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-3 md:mb-4 text-gray-900">
        Costo Total por Empleado (Top 10)
      </h3>
      <div className="w-full overflow-x-auto">
        <ResponsiveContainer width="100%" height={450} className="lg:h-[500px]">
          <BarChart 
            data={top10} 
            layout="vertical"
            margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis type="number" stroke="#9CA3AF" fontSize={11} />
            <YAxis 
              type="category" 
              dataKey="nombre" 
              stroke="#9CA3AF"
              width={110}
              fontSize={13}
              tick={{ fill: '#9CA3AF' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="costo" radius={[0, 8, 8, 0]} barSize={35}>
              {top10.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default GraficoPartesEmpleados;

