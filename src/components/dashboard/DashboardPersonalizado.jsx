import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useStats } from '../../contexts/StatsContext';
import { supabase } from '../../lib/supabase';
import { Badge, getStatusVariant, Skeleton, EmptyState } from '../ui';
import {
  DocumentTextIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  TruckIcon,
  DocumentPlusIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  PlusCircleIcon,
  ArrowUpRightIcon,
} from '@heroicons/react/24/outline';
import {
  DocumentTextIcon as DocumentTextSolid,
} from '@heroicons/react/24/solid';

// ── KPI Card ────────────────────────────────────────────────────────────────
const KpiCard = ({ title, value, sub, icon: Icon, iconBg, link, onClick }) => {
  const inner = (
    <div className="bg-white rounded-card shadow-card hover:shadow-card-hover transition-shadow p-3 sm:p-5 flex items-start gap-2 sm:gap-4 group cursor-pointer">
      <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-normal leading-tight mb-1 truncate">{title}</p>
        <p className="text-2xl sm:text-3xl font-bold text-ink-primary leading-none">
          {value ?? '—'}
        </p>
        {sub && (
          <div className="mt-1.5 flex flex-col gap-y-0.5">
            {sub.map((s, i) => (
              <span key={i} className="text-xs text-ink-muted leading-tight">
                <span className="font-medium text-ink-secondary">{s.value}</span> {s.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (onClick) return <div onClick={onClick} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onClick()}>{inner}</div>;
  if (link)   return <Link to={link}>{inner}</Link>;
  return inner;
};

// ── Stat Pill ────────────────────────────────────────────────────────────────
const StatPill = ({ label, value, color }) => (
  <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${color}`}>
    <span className="text-xl font-bold">{value ?? 0}</span>
    <span className="text-xs font-medium opacity-80 leading-tight">{label}</span>
  </div>
);

// ── Parte Row (tabla desktop) ────────────────────────────────────────────────
const ParteRow = ({ parte, linkFn }) => (
  <tr className="hover:bg-surface-50 transition-colors">
    <td className="px-4 py-3 whitespace-nowrap text-sm text-ink-muted">
      {new Date(parte.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
    </td>
    <td className="px-4 py-3 whitespace-nowrap">
      <Link to={linkFn(parte)} className="text-sm font-medium text-primary-600 hover:text-primary-700">
        {parte.numero_parte || '—'}
      </Link>
    </td>
    <td className="px-4 py-3 text-sm text-ink-secondary truncate max-w-[160px]">
      {parte.nombre_trabajador || parte.proveedores?.razon_social || parte.razon_social || parte.empresa || '—'}
    </td>
    <td className="px-4 py-3 text-sm text-ink-secondary truncate max-w-[160px]">
      {parte.nombre_obra || '—'}
    </td>
    <td className="px-4 py-3 whitespace-nowrap">
      <Badge status={parte.estado} dot>{parte.estado}</Badge>
    </td>
    <td className="px-4 py-3 whitespace-nowrap text-right">
      <Link
        to={linkFn(parte)}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
        aria-label={`Ver parte ${parte.numero_parte}`}
      >
        Ver <ArrowRightIcon className="h-3 w-3" aria-hidden="true" />
      </Link>
    </td>
  </tr>
);

// ── Parte Card (mobile) ──────────────────────────────────────────────────────
const ParteCardMobile = ({ parte, linkFn }) => (
  <Link
    to={linkFn(parte)}
    className="block bg-surface-50 hover:bg-surface-100 border border-surface-200 rounded-card p-4 transition-colors"
  >
    <div className="flex items-start justify-between gap-2 mb-2">
      <span className="text-sm font-semibold text-ink-primary">{parte.numero_parte || '—'}</span>
      <Badge status={parte.estado} dot>{parte.estado}</Badge>
    </div>
    <p className="text-sm text-ink-secondary truncate">
      {parte.nombre_trabajador || parte.proveedores?.razon_social || parte.razon_social || parte.empresa || '—'}
    </p>
    <p className="text-xs text-ink-muted mt-0.5 truncate">{parte.nombre_obra || '—'}</p>
    <p className="text-xs text-ink-muted mt-1">
      {new Date(parte.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
    </p>
  </Link>
);

// ── Recent Partes Block ──────────────────────────────────────────────────────
const RecentPartesBlock = ({ title, partes, linkFn, listLink, loading }) => (
  <div className="bg-white rounded-card shadow-card overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200">
      <h3 className="text-sm font-semibold text-ink-primary">{title}</h3>
      <Link
        to={listLink}
        className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
      >
        Ver todos <ArrowUpRightIcon className="h-3 w-3" aria-hidden="true" />
      </Link>
    </div>

    {loading ? (
      <div className="p-5"><Skeleton type="table" rows={4} cols={5} /></div>
    ) : !partes || partes.length === 0 ? (
      <div className="p-5">
        <EmptyState
          icon={<ClipboardDocumentListIcon className="h-8 w-8" />}
          title="Sin partes recientes"
          description="Aún no hay partes registrados."
          compact
        />
      </div>
    ) : (
      <>
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200">
                {['Fecha', 'Nº Parte', 'Nombre', 'Obra', 'Estado', ''].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {partes.map(parte => (
                <ParteRow key={parte.id} parte={parte} linkFn={linkFn} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-surface-100">
          {partes.map(parte => (
            <div key={parte.id} className="p-3">
              <ParteCardMobile parte={parte} linkFn={linkFn} />
            </div>
          ))}
        </div>
      </>
    )}
  </div>
);

// ── Quick Action Button ──────────────────────────────────────────────────────
const QuickAction = ({ action }) => (
  <Link
    to={action.to || action.href}
    state={action.state}
    className="flex items-center gap-3 p-4 bg-surface-50 hover:bg-surface-100 border border-surface-200 rounded-card transition-colors group"
  >
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${action.color || 'bg-primary-500'}`}>
      <action.icon className="h-5 w-5 text-white" aria-hidden="true" />
    </div>
    <span className="text-sm font-medium text-ink-secondary group-hover:text-ink-primary transition-colors">
      {action.name}
    </span>
    <ArrowRightIcon className="h-4 w-4 text-ink-muted ml-auto opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
  </Link>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
function DashboardPersonalizado() {
  const { user, hasRole } = useAuth();
  const { updateStats } = useStats();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalPartes: 0,
    totalEmpleados: 0,
    totalObras: 0,
    totalProveedores: 0,
    partesRecientes: [],
    partesRecientesEmpleados: [],
    partesRecientesProveedores: [],
    obrasActivas: 0,
    partesAprobados: 0,
    partesPendientes: 0,
    partesCompletados: 0,
    partesHoy: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const hasFetched = useRef(false);

  const isAdmin     = useMemo(() => hasRole('administrador') || hasRole('superadmin'),  [hasRole]);
  const isSupervisor= useMemo(() => hasRole('supervisor') || hasRole('administrador') || hasRole('superadmin'), [hasRole]);
  const isEmpleado  = useMemo(() => hasRole('empleado'),   [hasRole]);
  const isProveedor = useMemo(() => hasRole('proveedor'),  [hasRole]);

  // ── Cargar estadísticas ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || hasFetched.current) return;
    hasFetched.current = true;
    let isMounted = true;

    const cargarEstadisticas = async () => {
      setLoading(true);
      setError(null);

      try {
        const estadisticas = {};

        if (isAdmin || isSupervisor) {
          try {
            const today = new Date().toISOString().split('T')[0];

            const [
              resPartesEmp, resPartesProv,
              resEmpleados, resObras, resProveedores, resObrasActivas,
              resAprobadosEmp, resPendientesEmp,
              resAprobadosProv, resPendientesProv,
              resEmpleadosHoy, resProveedoresHoy,
              resRecientesEmp, resRecientesProv,
            ] = await Promise.all([
              supabase.from('partes').select('*', { count: 'exact', head: true }),
              supabase.from('partes_proveedores').select('*', { count: 'exact', head: true }),
              supabase.from('empleados').select('*', { count: 'exact', head: true }),
              supabase.from('obras').select('*', { count: 'exact', head: true }),
              supabase.from('proveedores').select('*', { count: 'exact', head: true }),
              supabase.from('obras').select('*', { count: 'exact', head: true }).eq('estado', 'activa'),
              supabase.from('partes').select('*', { count: 'exact', head: true }).eq('estado', 'Aprobado'),
              supabase.from('partes').select('*', { count: 'exact', head: true }).eq('estado', 'Pendiente de Revisión'),
              supabase.from('partes_proveedores').select('*', { count: 'exact', head: true }).eq('estado', 'Aprobado'),
              supabase.from('partes_proveedores').select('*', { count: 'exact', head: true }).eq('estado', 'Pendiente de Revisión'),
              supabase.from('partes').select('*', { count: 'exact', head: true }).gte('created_at', today + 'T00:00:00.000Z').lt('created_at', today + 'T23:59:59.999Z'),
              supabase.from('partes_proveedores').select('*', { count: 'exact', head: true }).gte('created_at', today + 'T00:00:00.000Z').lt('created_at', today + 'T23:59:59.999Z'),
              supabase.from('partes').select('id, fecha, estado, nombre_trabajador, nombre_obra, numero_parte').order('fecha', { ascending: false }).limit(5),
              supabase.from('partes_proveedores').select('id, fecha, estado, razon_social, empresa, proveedor_id, numero_parte, obra_id, trabajos').order('fecha', { ascending: false }).limit(5),
            ]);

            estadisticas.totalPartesEmpleados  = resPartesEmp.count  || 0;
            estadisticas.totalPartesProveedores= resPartesProv.count || 0;
            estadisticas.totalPartes       = estadisticas.totalPartesEmpleados + estadisticas.totalPartesProveedores;
            estadisticas.totalEmpleados    = resEmpleados.count    || 0;
            estadisticas.totalObras        = resObras.count        || 0;
            estadisticas.totalProveedores  = resProveedores.count  || 0;
            estadisticas.obrasActivas      = resObrasActivas.count || 0;
            estadisticas.partesAprobados   = (resAprobadosEmp.count || 0) + (resAprobadosProv.count || 0);
            estadisticas.partesPendientes  = (resPendientesEmp.count || 0) + (resPendientesProv.count || 0);
            estadisticas.partesCompletados = estadisticas.partesAprobados;
            estadisticas.partesHoy         = (resEmpleadosHoy.count || 0) + (resProveedoresHoy.count || 0);

            // Procesar partes recientes de proveedores con info de proveedor
            let partesProveedoresConInfo = [];
            const partesRecientesProv = resRecientesProv.data || [];
            if (partesRecientesProv.length > 0) {
              const proveedorIds = [...new Set(partesRecientesProv.filter(p => p.proveedor_id).map(p => p.proveedor_id))];
              let proveedoresInfo = [];
              if (proveedorIds.length > 0) {
                const { data: provData } = await supabase.from('proveedores').select('id, razon_social, codigo').in('id', proveedorIds);
                proveedoresInfo = provData || [];
              }
              const provMap = new Map(proveedoresInfo.map(p => [p.id, p]));
              partesProveedoresConInfo = partesRecientesProv.map(parte => {
                let nombreObra = null;
                if (parte.trabajos && Array.isArray(parte.trabajos) && parte.trabajos.length > 0) {
                  nombreObra = parte.trabajos[0].obra || null;
                }
                return { ...parte, proveedores: provMap.get(parte.proveedor_id) || null, nombre_obra: nombreObra };
              });
            }

            const partesEmpleados  = (resRecientesEmp.data || []).map(p => ({ ...p, tipo_parte: 'empleado' }));
            const partesProveedores= partesProveedoresConInfo.map(p => ({ ...p, tipo_parte: 'proveedor' }));

            estadisticas.partesRecientesEmpleados  = partesEmpleados.slice(0, 5);
            estadisticas.partesRecientesProveedores= partesProveedores.slice(0, 5);
            estadisticas.partesRecientes = [...partesEmpleados, ...partesProveedores]
              .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
              .slice(0, 5);

          } catch (err) {
            console.error('Error al cargar estadísticas de administrador:', err);
            Object.assign(estadisticas, {
              totalPartes: 0, totalEmpleados: 0, totalObras: 0, totalProveedores: 0,
              obrasActivas: 0, partesAprobados: 0, partesPendientes: 0, partesRecientes: [],
            });
          }

        } else if (isEmpleado) {
          try {
            const { data: empleadoData, error: errorEmpleado } = await supabase
              .from('empleados').select('id').eq('email', user.email).single();
            if (errorEmpleado) throw errorEmpleado;
            if (empleadoData) {
              const [
                { count: totalPartesEmpleado },
                { count: partesAprobadosEmpleado },
                { count: partesPendientesEmpleado },
                { data: obrasEmpleado },
                { data: partesRecientesEmpleado },
              ] = await Promise.all([
                supabase.from('partes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
                supabase.from('partes').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('estado', 'aprobado'),
                supabase.from('partes').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('estado', 'pendiente'),
                supabase.from('empleados_obras').select('obras(id, nombre_obra, estado)').eq('empleado_id', empleadoData.id),
                supabase.from('partes').select('id, fecha, estado, nombre_obra, numero_parte').eq('user_id', user.id).order('fecha', { ascending: false }).limit(5),
              ]);
              estadisticas.totalPartes       = totalPartesEmpleado     || 0;
              estadisticas.partesAprobados   = partesAprobadosEmpleado || 0;
              estadisticas.partesPendientes  = partesPendientesEmpleado|| 0;
              estadisticas.obrasAsignadas    = obrasEmpleado?.length   || 0;
              estadisticas.partesRecientes   = partesRecientesEmpleado || [];
            }
          } catch (err) {
            console.error('Error al cargar estadísticas de empleado:', err);
            if (isMounted) setError('Error al cargar estadísticas');
          }

        } else if (isProveedor) {
          try {
            const { data: proveedorData, error: errorProveedor } = await supabase
              .from('proveedores').select('id').eq('email', user.email).single();
            if (errorProveedor) throw errorProveedor;
            if (proveedorData) {
              const proveedorId = proveedorData.id;
              const [
                { count: totalPartesProveedor },
                { count: partesAprobadosProveedor },
                { count: partesPendientesProveedor },
                { data: obrasProveedor },
                { data: partesRecientesProveedor },
              ] = await Promise.all([
                supabase.from('partes_proveedores').select('*', { count: 'exact', head: true }).eq('proveedor_id', proveedorId),
                supabase.from('partes_proveedores').select('*', { count: 'exact', head: true }).eq('proveedor_id', proveedorId).eq('estado', 'aprobado'),
                supabase.from('partes_proveedores').select('*', { count: 'exact', head: true }).eq('proveedor_id', proveedorId).eq('estado', 'pendiente'),
                supabase.from('proveedores_obras').select('obras(id, nombre_obra, estado)').eq('proveedor_id', proveedorId),
                supabase.from('partes_proveedores').select('id, fecha, estado, obras(nombre_obra), numero_parte').eq('proveedor_id', proveedorId).order('fecha', { ascending: false }).limit(5),
              ]);
              estadisticas.totalPartes      = totalPartesProveedor      || 0;
              estadisticas.partesAprobados  = partesAprobadosProveedor  || 0;
              estadisticas.partesPendientes = partesPendientesProveedor || 0;
              estadisticas.obrasAsignadas   = obrasProveedor?.length    || 0;
              estadisticas.partesRecientes  = partesRecientesProveedor  || [];
            }
          } catch (err) {
            console.error('Error al cargar estadísticas de proveedor:', err);
            if (isMounted) setError('Error al cargar estadísticas');
          }
        }

        if (isMounted) {
          setStats(estadisticas);
          if (isAdmin || isSupervisor) {
            updateStats({
              totalPartes:       estadisticas.totalPartes,
              partesPendientes:  estadisticas.partesPendientes,
              partesCompletados: estadisticas.partesCompletados,
              partesAprobados:   estadisticas.partesAprobados,
              partesHoy:         estadisticas.partesHoy,
              loading:           false,
            });
          }
        }
      } catch (err) {
        console.error('Error general al cargar estadísticas:', err);
        if (isMounted) setError('Error al cargar estadísticas');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    cargarEstadisticas();
    return () => { isMounted = false; };
  }, [user]);

  // ── Quick actions ────────────────────────────────────────────────────────
  const filteredQuickActions = useMemo(() => {
    const quickActions = [
      ...(hasRole('superadmin') ? [{
        id: 'importar', name: 'Importar Partes', to: '/importar-partes-trabajo',
        icon: DocumentPlusIcon, color: 'bg-violet-500',
      }] : []),
      ...((isAdmin || isSupervisor) ? [
        { id: 'crear-emp',  name: 'Crear Parte Empleado',   to: '/nuevo-parte',            state: { adminMode: true }, icon: DocumentPlusIcon, color: 'bg-primary-500' },
        { id: 'crear-prov', name: 'Crear Parte Proveedor',  to: '/parte-proveedor/nuevo',  icon: DocumentPlusIcon, color: 'bg-amber-500' },
      ] : []),
      ...(isEmpleado && !isAdmin && !isSupervisor ? [
        { id: 'emp-crear', name: 'Crear Parte', to: '/nuevo-parte', icon: DocumentPlusIcon, color: 'bg-primary-500' },
      ] : []),
      ...(isProveedor ? [
        { id: 'prov-crear', name: 'Crear Parte Proveedor', to: '/parte-proveedor/nuevo', icon: DocumentPlusIcon, color: 'bg-amber-500' },
      ] : []),
    ];
    return quickActions;
  }, [isAdmin, isSupervisor, isEmpleado, isProveedor, hasRole]);

  // ── Date greeting ────────────────────────────────────────────────────────
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }, []);

  const todayLabel = useMemo(() =>
    new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  []);

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header skeleton */}
        <div className="h-20 bg-surface-100 rounded-card animate-pulse" />
        {/* KPI grid skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-surface-100 rounded-card animate-pulse" />)}
        </div>
        {/* Tables skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1,2].map(i => <div key={i} className="h-64 bg-surface-100 rounded-card animate-pulse" />)}
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-ink-muted text-sm mb-3">{error}</p>
        <button
          onClick={() => { hasFetched.current = false; setLoading(true); setError(null); }}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN / SUPERVISOR VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  if (isAdmin || isSupervisor) {
    return (
      <div className="space-y-6 animate-fade-in">

        {/* ── Greeting Header ──────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-ink-primary">
              {greeting}, {user?.email?.split('@')[0]}
            </h1>
            <p className="text-sm text-ink-muted capitalize mt-0.5">{todayLabel}</p>
          </div>
          {/* Quick create buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/nuevo-parte"
              state={{ adminMode: true }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-input transition-colors shadow-sm"
            >
              <PlusCircleIcon className="h-4 w-4" aria-hidden="true" />
              Parte Empleado
            </Link>
            <Link
              to="/parte-proveedor/nuevo"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-surface-100 text-ink-secondary text-sm font-medium rounded-input border border-surface-200 transition-colors"
            >
              <PlusCircleIcon className="h-4 w-4" aria-hidden="true" />
              Parte Proveedor
            </Link>
          </div>
        </div>

        {/* ── KPI Cards ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Partes"
            value={stats.totalPartes}
            sub={[
              { value: stats.totalPartesEmpleados,   label: 'empleados' },
              { value: stats.totalPartesProveedores, label: 'proveedores' },
            ]}
            icon={DocumentTextIcon}
            iconBg="bg-primary-500"
            link="/partes-empleados"
          />
          <KpiCard
            title="Empleados"
            value={stats.totalEmpleados}
            icon={UserGroupIcon}
            iconBg="bg-blue-500"
            link="/empleados"
          />
          <KpiCard
            title="Obras"
            value={stats.totalObras}
            sub={[{ value: stats.obrasActivas, label: 'activas' }]}
            icon={BuildingOfficeIcon}
            iconBg="bg-emerald-500"
            link="/obras"
          />
          <KpiCard
            title="Proveedores"
            value={stats.totalProveedores}
            icon={TruckIcon}
            iconBg="bg-amber-500"
            link="/proveedores"
          />
        </div>

        {/* ── Secondary stats pills ────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3">
          <StatPill
            label="Aprobados"
            value={stats.partesAprobados}
            color="bg-status-success/10 text-status-success"
          />
          <StatPill
            label="Pendientes de revisión"
            value={stats.partesPendientes}
            color="bg-status-warning/10 text-status-warning"
          />
          <StatPill
            label="Partes hoy"
            value={stats.partesHoy}
            color="bg-primary-50 text-primary-700"
          />
        </div>

        {/* ── Quick Actions (solo superadmin o extras) ──────────────────── */}
        {hasRole('superadmin') && (
          <div>
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Acciones de sistema</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredQuickActions
                .filter(a => a.id === 'importar')
                .map(action => <QuickAction key={action.id} action={action} />)
              }
            </div>
          </div>
        )}

        {/* ── Recent Partes (2 columnas en lg) ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentPartesBlock
            title="Partes Recientes · Empleados"
            partes={stats.partesRecientesEmpleados}
            linkFn={p => `/ver-detalle/empleado/${p.id}`}
            listLink="/partes-empleados"
            loading={false}
          />
          <RecentPartesBlock
            title="Partes Recientes · Proveedores"
            partes={stats.partesRecientesProveedores}
            linkFn={p => `/parte-proveedor/ver/${p.id}`}
            listLink="/partes-proveedores"
            loading={false}
          />
        </div>

      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EMPLEADO / PROVEEDOR VIEW (fallback — DashboardEmpleado handles the main)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-bold text-ink-primary">Bienvenido</h2>

      {/* Stats pills */}
      <div className="flex flex-wrap gap-3">
        <StatPill label="Partes totales" value={stats.totalPartes} color="bg-primary-50 text-primary-700" />
        <StatPill label="Aprobados"      value={stats.partesAprobados}  color="bg-status-success/10 text-status-success" />
        <StatPill label="Pendientes"     value={stats.partesPendientes} color="bg-status-warning/10 text-status-warning" />
      </div>

      {/* Quick actions */}
      {filteredQuickActions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredQuickActions.map(action => <QuickAction key={action.id} action={action} />)}
        </div>
      )}

      {/* Recent partes */}
      <div className="bg-white rounded-card shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200">
          <h3 className="text-sm font-semibold text-ink-primary">Mis Partes Recientes</h3>
          <Link
            to={isEmpleado ? '/partes-empleados' : '/partes-proveedores'}
            className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            Ver todos <ArrowUpRightIcon className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
        {!stats.partesRecientes || stats.partesRecientes.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={<ClipboardDocumentListIcon className="h-8 w-8" />} title="Sin partes recientes" description="Todavía no has creado ningún parte." compact />
          </div>
        ) : (
          <ul className="divide-y divide-surface-100">
            {stats.partesRecientes.map(parte => (
              <li key={parte.id}>
                <Link
                  to={isEmpleado ? `/editar-parte/${parte.id}` : `/parte-proveedor/ver/${parte.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-50 transition-colors"
                >
                  <DocumentTextSolid className="h-5 w-5 text-primary-300 flex-shrink-0" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-primary truncate">
                      {parte.numero_parte || parte.obras?.nombre_obra || 'Sin obra'}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {new Date(parte.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <Badge status={parte.estado} dot>{parte.estado}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default memo(DashboardPersonalizado);
