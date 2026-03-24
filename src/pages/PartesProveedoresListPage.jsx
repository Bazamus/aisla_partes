import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as parteProveedorService from '../services/parteProveedorService';
import * as importExportService from '../services/importExportService';
import VerificacionTablas from '../components/partes-proveedores/VerificacionTablas';
import toast from 'react-hot-toast';
import { PermissionGuard } from '../components/auth/PermissionGuard';
import { useAuth } from '../contexts/AuthContext';
import { Badge, Skeleton, EmptyState } from '../components/ui';
import {
  PlusCircleIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilSquareIcon,
  TrashIcon,
  ClipboardDocumentListIcon,
  XMarkIcon,
  CurrencyEuroIcon,
} from '@heroicons/react/24/outline';

// ── Estado filter chips ──────────────────────────────────────────────────────
const ESTADO_FILTERS = [
  { value: '',                      label: 'Todos'     },
  { value: 'Borrador',              label: 'Borrador'  },
  { value: 'Pendiente de Revisión', label: 'Pendiente' },
  { value: 'Aprobado',              label: 'Aprobado'  },
  { value: 'Rechazado',             label: 'Rechazado' },
];

const fmtFecha = (d) =>
  d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';

const fmtImporte = (v) =>
  v != null ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(v) : '—';

// ── Desktop Row ──────────────────────────────────────────────────────────────
const ParteRow = ({ parte, onDelete, deleting, onRowClick, stopProp }) => (
  <tr
    className="hover:bg-surface-50 cursor-pointer transition-colors"
    onClick={() => onRowClick(parte.id)}
  >
    <td className="px-4 py-3 whitespace-nowrap text-sm text-ink-muted">
      {fmtFecha(parte.fecha)}
    </td>
    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-primary-600">
      {parte.numero_parte || '—'}
    </td>
    <td className="px-4 py-3 text-sm text-ink-secondary truncate max-w-[160px]">
      {parte.empresa || parte.razon_social || '—'}
    </td>
    <td className="px-4 py-3 text-sm text-ink-secondary truncate max-w-[180px]">
      {parte.descripcion || '—'}
    </td>
    <td className="px-4 py-3 whitespace-nowrap">
      <Badge status={parte.estado} dot>{parte.estado || 'Borrador'}</Badge>
    </td>
    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-ink-primary">
      {fmtImporte(parte.coste_total)}
    </td>
    <td className="px-4 py-3 whitespace-nowrap text-right" onClick={stopProp}>
      <div className="flex items-center justify-end gap-1.5">
        <PermissionGuard requiredPermission="partes:editar" fallback={null}>
          <Link
            to={`/parte-proveedor/editar/${parte.id}`}
            className="p-1.5 text-ink-muted hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            aria-label="Editar parte"
          >
            <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </PermissionGuard>
        <PermissionGuard requiredPermission="partes:eliminar" fallback={null}>
          <button
            onClick={() => onDelete(parte.id)}
            disabled={deleting === parte.id}
            className="p-1.5 text-ink-muted hover:text-status-error hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
            aria-label="Eliminar parte"
          >
            <TrashIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </PermissionGuard>
      </div>
    </td>
  </tr>
);

// ── Mobile Card ──────────────────────────────────────────────────────────────
const ParteCardMobile = ({ parte, onDelete, deleting, stopProp }) => (
  <div className="bg-white rounded-card border border-surface-200 shadow-card overflow-hidden">
    <Link
      to={`/parte-proveedor/ver/${parte.id}`}
      className="block p-4 hover:bg-surface-50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-primary truncate">
            {parte.empresa || parte.razon_social || '—'}
          </p>
          <p className="text-xs text-ink-muted mt-0.5">{fmtFecha(parte.fecha)}</p>
        </div>
        <Badge status={parte.estado} dot>{parte.estado || 'Borrador'}</Badge>
      </div>
      <div className="space-y-1.5">
        {parte.numero_parte && (
          <p className="text-xs text-ink-muted">
            <span className="font-medium text-ink-secondary">Nº:</span> {parte.numero_parte}
          </p>
        )}
        {parte.descripcion && (
          <p className="text-xs text-ink-muted line-clamp-2">{parte.descripcion}</p>
        )}
        {parte.coste_total != null && (
          <p className="text-sm font-semibold text-ink-primary mt-1">
            {fmtImporte(parte.coste_total)}
          </p>
        )}
      </div>
    </Link>

    <div className="flex items-center border-t border-surface-100 divide-x divide-surface-100" onClick={stopProp}>
      <PermissionGuard requiredPermission="partes:editar" fallback={null}>
        <Link
          to={`/parte-proveedor/editar/${parte.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-ink-secondary hover:text-primary-600 hover:bg-primary-50 transition-colors"
        >
          <PencilSquareIcon className="h-3.5 w-3.5" aria-hidden="true" />
          Editar
        </Link>
      </PermissionGuard>
      <PermissionGuard requiredPermission="partes:eliminar" fallback={null}>
        <button
          onClick={() => onDelete(parte.id)}
          disabled={deleting === parte.id}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-ink-secondary hover:text-status-error hover:bg-red-50 transition-colors disabled:opacity-40"
        >
          <TrashIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {deleting === parte.id ? '…' : 'Eliminar'}
        </button>
      </PermissionGuard>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const PartesProveedoresListPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const [partes,     setPartes]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [deleting,   setDeleting]   = useState(null);
  const [exportando, setExportando] = useState(false);

  const [search,       setSearch]       = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');

  // ── Cargar ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const cargarPartes = async () => {
      try {
        const data = await parteProveedorService.getPartesProveedores();
        setPartes(data || []);
      } catch (err) {
        console.error('Error al cargar partes de proveedores:', err);
        setError('Error al cargar los partes. Inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    };
    cargarPartes();
  }, []);

  // ── Filtered ──────────────────────────────────────────────────────────────
  const partesFiltrados = useMemo(() => {
    let result = partes;
    if (estadoFilter) result = result.filter(p => (p.estado || 'Borrador') === estadoFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        (p.empresa      || '').toLowerCase().includes(q) ||
        (p.razon_social || '').toLowerCase().includes(q) ||
        (p.descripcion  || '').toLowerCase().includes(q) ||
        (p.numero_parte || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [partes, estadoFilter, search]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este parte? Esta acción no se puede deshacer.')) return;
    setDeleting(id);
    try {
      await parteProveedorService.deleteParteProveedor(id);
      setPartes(prev => prev.filter(p => p.id !== id));
      toast.success('Parte eliminado correctamente');
    } catch (err) {
      console.error('Error al eliminar parte:', err);
      toast.error('Error al eliminar el parte');
    } finally {
      setDeleting(null);
    }
  };

  const handleExportarPartes = async () => {
    if (partes.length === 0) { toast.error('No hay partes para exportar'); return; }
    setExportando(true);
    try {
      const partesCompletos = await Promise.all(
        partes.map(p => parteProveedorService.getParteProveedorById(p.id))
      );
      const partesValidos = partesCompletos.filter(Boolean);
      if (partesValidos.length === 0) { toast.error('No se pudieron obtener los partes'); return; }
      await importExportService.exportarPartesProveedores(partesValidos);
      toast.success('Excel exportado correctamente');
    } catch (err) {
      console.error('Error al exportar:', err);
      toast.error('Error al exportar');
    } finally {
      setExportando(false);
    }
  };

  const handleRowClick = (id) => navigate(`/parte-proveedor/ver/${id}`);
  const stopProp = (e) => e.stopPropagation();

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Verificación tablas (oculta si no tiene mensajes) */}
      <VerificacionTablas />

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Partes de Proveedores</h1>
          {!loading && (
            <p className="text-sm text-ink-muted mt-0.5">
              {partesFiltrados.length} {partesFiltrados.length === 1 ? 'parte' : 'partes'}
              {partes.length !== partesFiltrados.length && ` de ${partes.length} totales`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PermissionGuard requiredPermission="partes:exportar" fallback={null}>
            <button
              onClick={handleExportarPartes}
              disabled={exportando || partes.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-surface-100 text-ink-secondary text-sm font-medium rounded-input border border-surface-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Exportar a Excel"
            >
              <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
              {exportando ? 'Exportando…' : 'Excel'}
            </button>
          </PermissionGuard>
          <PermissionGuard requiredPermission="partes:crear" fallback={null}>
            <Link
              to="/parte-proveedor/nuevo"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-input transition-colors shadow-sm"
            >
              <PlusCircleIcon className="h-4 w-4" aria-hidden="true" />
              Nuevo Parte
            </Link>
          </PermissionGuard>
        </div>
      </div>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-card text-red-700 text-sm" role="alert">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto" aria-label="Cerrar">
            <XMarkIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      {!loading && partes.length > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <MagnifyingGlassIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Buscar por empresa, descripción o número…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-input border border-surface-200 bg-white text-sm text-ink-primary placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5" role="group" aria-label="Filtrar por estado">
            <FunnelIcon className="h-4 w-4 text-ink-muted flex-shrink-0" aria-hidden="true" />
            {ESTADO_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setEstadoFilter(f.value)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-badge text-xs font-medium transition-colors ${
                  estadoFilter === f.value
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-surface-100 text-ink-secondary hover:bg-surface-200'
                }`}
                aria-pressed={estadoFilter === f.value}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          <div className="hidden md:block bg-white rounded-card border border-surface-200 overflow-hidden">
            <Skeleton type="table" rows={6} cols={7} />
          </div>
          <div className="md:hidden space-y-3">
            {[1,2,3,4].map(i => <Skeleton key={i} type="parte-card" />)}
          </div>
        </div>
      ) : partesFiltrados.length === 0 ? (
        <EmptyState
          icon={<ClipboardDocumentListIcon className="h-8 w-8" />}
          title={search || estadoFilter ? 'Sin resultados' : 'No hay partes de proveedores'}
          description={
            search || estadoFilter
              ? 'Prueba con otros filtros o términos de búsqueda.'
              : hasPermission('partes:crear')
              ? 'Crea el primer parte de proveedor pulsando el botón "Nuevo Parte".'
              : undefined
          }
          action={
            !search && !estadoFilter && hasPermission('partes:crear')
              ? <Link to="/parte-proveedor/nuevo" className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-input transition-colors">
                  <PlusCircleIcon className="h-4 w-4" aria-hidden="true" />
                  Crear primer parte
                </Link>
              : undefined
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-card border border-surface-200 shadow-card overflow-hidden">
            <table className="min-w-full">
              <thead>
                <tr className="bg-surface-50 border-b border-surface-200">
                  {['Fecha', 'Nº Parte', 'Empresa', 'Descripción', 'Estado', 'Total', 'Acciones'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider ${i === 6 ? 'text-right' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {partesFiltrados.map(parte => (
                  <ParteRow
                    key={parte.id}
                    parte={parte}
                    onDelete={handleDelete}
                    deleting={deleting}
                    onRowClick={handleRowClick}
                    stopProp={stopProp}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {partesFiltrados.map(parte => (
              <ParteCardMobile
                key={parte.id}
                parte={parte}
                onDelete={handleDelete}
                deleting={deleting}
                stopProp={stopProp}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PartesProveedoresListPage;
