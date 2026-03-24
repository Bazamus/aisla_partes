import { useMemo } from 'react'
import PropTypes from 'prop-types'
import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'

export default function DashboardStats({ partes = [], statsData = null }) {
  const stats = useMemo(() => {
    // Si se proporcionan estadísticas ya calculadas, usarlas
    if (statsData) {
      return [
        {
          name: 'Total Partes',
          value: statsData.totalPartes || 0,
          icon: DocumentTextIcon,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-100'
        },
        {
          name: 'Pendientes',
          value: statsData.partesPendientes || 0,
          icon: ClockIcon,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-100'
        },
        {
          name: 'Completados',
          value: statsData.partesCompletados || statsData.partesAprobados || 0,
          icon: CheckCircleIcon,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-100'
        },
        {
          name: 'Partes Hoy',
          value: statsData.partesHoy || 0,
          icon: ExclamationCircleIcon,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-100'
        }
      ];
    }
    
    // Fallback: Calcular desde el array de partes (comportamiento original)
    const today = new Date().toISOString().split('T')[0]
    
    return [
      {
        name: 'Total Partes',
        value: partes?.length || 0,
        icon: DocumentTextIcon,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-100'
      },
      {
        name: 'Pendientes',
        value: partes?.filter(parte => 
          parte.estado === 'Pendiente' || 
          parte.estado === 'Pendiente de Revisión'
        ).length || 0,
        icon: ClockIcon,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-100'
      },
      {
        name: 'Completados',
        value: partes?.filter(parte => 
          parte.estado === 'Completado' || 
          parte.estado === 'Aprobado'
        ).length || 0,
        icon: CheckCircleIcon,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-100'
      },
      {
        name: 'Partes Hoy',
        value: partes?.filter(parte => {
          const parteDate = new Date(parte.created_at || parte.fecha).toISOString().split('T')[0]
          return parteDate === today
        }).length || 0,
        icon: ExclamationCircleIcon,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-100'
      }
    ]
  }, [partes, statsData])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.name}
            className={`relative overflow-hidden rounded-lg ${stat.bgColor} border ${stat.borderColor} p-6 transition-all duration-200 hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.name}
                </p>
                <p className={`mt-2 text-3xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`rounded-full p-3 ${stat.bgColor}`}>
                <Icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
            
            <div 
              className={`absolute bottom-0 left-0 h-1 w-full ${stat.color.replace('text-', 'bg-')} opacity-20`}
            />
          </div>
        )
      })}
    </div>
  )
}

DashboardStats.propTypes = {
  partes: PropTypes.arrayOf(PropTypes.shape({
    estado: PropTypes.string,
    created_at: PropTypes.string,
    fecha: PropTypes.string
  })),
  statsData: PropTypes.shape({
    totalPartes: PropTypes.number,
    partesPendientes: PropTypes.number,
    partesCompletados: PropTypes.number,
    partesAprobados: PropTypes.number,
    partesHoy: PropTypes.number
  })
}
