/**
 * Skeleton — Placeholder de carga con animación shimmer
 * Tipos: text | card | table | avatar | stat
 */

// Bloque base con shimmer
const SkeletonBlock = ({ className = '' }) => (
  <div
    className={`rounded bg-surface-200 animate-shimmer ${className}`}
    style={{
      backgroundImage: 'linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%)',
      backgroundSize: '200% 100%',
    }}
    aria-hidden="true"
  />
)

// ── Variante: líneas de texto
const TextSkeleton = ({ lines = 3 }) => (
  <div className="space-y-2.5" role="status" aria-label="Cargando contenido">
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonBlock
        key={i}
        className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
      />
    ))}
  </div>
)

// ── Variante: tarjeta
const CardSkeleton = ({ rows = 2 }) => (
  <div className="bg-white rounded-card border border-surface-200 p-5 space-y-3" role="status" aria-label="Cargando">
    <SkeletonBlock className="h-5 w-2/5" />
    {Array.from({ length: rows }).map((_, i) => (
      <SkeletonBlock key={i} className="h-4 w-full" />
    ))}
    <SkeletonBlock className="h-4 w-3/4" />
  </div>
)

// ── Variante: fila de tabla
const TableRowSkeleton = ({ cols = 5 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <SkeletonBlock className="h-4 w-full" />
      </td>
    ))}
  </tr>
)

// ── Variante: tabla completa
const TableSkeleton = ({ rows = 5, cols = 5 }) => (
  <div role="status" aria-label="Cargando tabla">
    <table className="w-full">
      <thead>
        <tr className="bg-surface-50 border-b border-surface-200">
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} className="px-4 py-3 text-left">
              <SkeletonBlock className="h-3.5 w-20" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-surface-200">
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkeleton key={i} cols={cols} />
        ))}
      </tbody>
    </table>
  </div>
)

// ── Variante: tarjeta de estadística KPI
const StatSkeleton = () => (
  <div className="bg-white rounded-card border border-surface-200 p-5 space-y-2" role="status">
    <SkeletonBlock className="h-4 w-24" />
    <SkeletonBlock className="h-8 w-16" />
    <SkeletonBlock className="h-3 w-32" />
  </div>
)

// ── Variante: cuadrícula de stats (4 columnas)
const StatGridSkeleton = ({ count = 4 }) => (
  <div className={`grid grid-cols-2 lg:grid-cols-${count} gap-4`}>
    {Array.from({ length: count }).map((_, i) => (
      <StatSkeleton key={i} />
    ))}
  </div>
)

// ── Variante: tarjeta de parte (listado móvil)
const ParteCardSkeleton = () => (
  <div className="bg-white rounded-card border border-surface-200 p-4 space-y-3" role="status">
    <div className="flex items-center justify-between">
      <SkeletonBlock className="h-4 w-24" />
      <SkeletonBlock className="h-5 w-20 rounded-badge" />
    </div>
    <SkeletonBlock className="h-4 w-3/4" />
    <div className="flex gap-4">
      <SkeletonBlock className="h-3.5 w-24" />
      <SkeletonBlock className="h-3.5 w-20" />
    </div>
  </div>
)

// ── Componente principal con switch por tipo
const Skeleton = ({ type = 'text', count = 1, ...props }) => {
  const renderOne = (i) => {
    switch (type) {
      case 'card':       return <CardSkeleton key={i} {...props} />
      case 'table':      return <TableSkeleton key={i} {...props} />
      case 'stat':       return <StatSkeleton key={i} />
      case 'stat-grid':  return <StatGridSkeleton key={i} {...props} />
      case 'parte-card': return <ParteCardSkeleton key={i} />
      default:           return <TextSkeleton key={i} {...props} />
    }
  }

  if (count === 1) return renderOne(0)

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => renderOne(i))}
    </div>
  )
}

// Exportar variantes individualmente también
Skeleton.Card       = CardSkeleton
Skeleton.Table      = TableSkeleton
Skeleton.Stat       = StatSkeleton
Skeleton.StatGrid   = StatGridSkeleton
Skeleton.ParteCard  = ParteCardSkeleton
Skeleton.Block      = SkeletonBlock

export default Skeleton
