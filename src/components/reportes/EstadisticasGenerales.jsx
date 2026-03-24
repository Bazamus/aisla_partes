import { 
  DocumentTextIcon, 
  UserIcon, 
  BuildingOfficeIcon, 
  CurrencyEuroIcon 
} from '@heroicons/react/24/outline';

function EstadisticasGenerales({ datos, costoServicios = 0 }) {
  if (!datos) {
    return null;
  }

  const formatearNumero = (numero, decimales = 0) => {
    if (numero === null || numero === undefined) return '0';
    return Number(numero).toLocaleString('es-ES', {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales
    });
  };

  const costoMateriales = Number(datos.costo_total_materiales) || 0;
  const costoServ = Number(costoServicios) || 0;
  const costoTotal = costoMateriales + costoServ;

  const estadisticas = [
    {
      id: 'partes',
      titulo: 'Total Partes',
      valor: formatearNumero(datos.total_partes || 0),
      icono: DocumentTextIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      id: 'empleados',
      titulo: 'Empleados Activos',
      valor: formatearNumero(datos.total_empleados_activos || 0),
      icono: UserIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      id: 'obras',
      titulo: 'Obras Activas',
      valor: formatearNumero(datos.total_obras_activas || 0),
      icono: BuildingOfficeIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      id: 'costo',
      titulo: 'Costo Total',
      valor: formatearNumero(costoTotal, 2) + ' €',
      subtitulo: costoServ > 0
        ? `Mat: ${formatearNumero(costoMateriales, 2)}€ | Serv: ${formatearNumero(costoServ, 2)}€`
        : null,
      icono: CurrencyEuroIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-3 md:mb-6">
      {estadisticas.map((stat) => {
        const Icon = stat.icono;
        return (
          <div
            key={stat.id}
            className="bg-white rounded-lg shadow p-3 md:p-4 lg:p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 mb-1">
                  {stat.titulo}
                </p>
                <p className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900">
                  {stat.valor}
                </p>
                {stat.subtitulo && (
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 mt-0.5">
                    {stat.subtitulo}
                  </p>
                )}
              </div>
              <div className={`p-2 md:p-3 rounded-full ${stat.bgColor}`}>
                <Icon className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 ${stat.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default EstadisticasGenerales;

