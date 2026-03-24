import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useStats } from '../../contexts/StatsContext';
import { supabase } from '../../lib/supabase';
import {
  DocumentTextIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  TruckIcon,
  DocumentPlusIcon,
} from '@heroicons/react/24/outline';

function DashboardPersonalizado() {
  const { user, hasRole } = useAuth();
  const { updateStats } = useStats();
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
    partesHoy: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  // Memoizar los booleanos de rol (no funciones) para evitar re-renders
  const isAdmin = useMemo(() => hasRole('administrador') || hasRole('superadmin'), [hasRole]);
  const isSupervisor = useMemo(() => hasRole('supervisor') || hasRole('administrador') || hasRole('superadmin'), [hasRole]);
  const isEmpleado = useMemo(() => hasRole('empleado'), [hasRole]);
  const isProveedor = useMemo(() => hasRole('proveedor'), [hasRole]);

  // Cargar estadísticas una sola vez al montar
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

            // BATCH 1: Todas las queries de conteo en paralelo
            const [
              resPartesEmp, resPartesProv,
              resEmpleados, resObras, resProveedores, resObrasActivas,
              resAprobadosEmp, resPendientesEmp,
              resAprobadosProv, resPendientesProv,
              resEmpleadosHoy, resProveedoresHoy,
              resRecientesEmp, resRecientesProv
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
              supabase.from('partes_proveedores').select('id, fecha, estado, razon_social, empresa, proveedor_id, numero_parte, obra_id, trabajos').order('fecha', { ascending: false }).limit(5)
            ]);

            // Procesar conteos
            estadisticas.totalPartesEmpleados = resPartesEmp.count || 0;
            estadisticas.totalPartesProveedores = resPartesProv.count || 0;
            estadisticas.totalPartes = estadisticas.totalPartesEmpleados + estadisticas.totalPartesProveedores;
            estadisticas.totalEmpleados = resEmpleados.count || 0;
            estadisticas.totalObras = resObras.count || 0;
            estadisticas.totalProveedores = resProveedores.count || 0;
            estadisticas.obrasActivas = resObrasActivas.count || 0;
            estadisticas.partesAprobados = (resAprobadosEmp.count || 0) + (resAprobadosProv.count || 0);
            estadisticas.partesPendientes = (resPendientesEmp.count || 0) + (resPendientesProv.count || 0);
            estadisticas.partesCompletados = estadisticas.partesAprobados;
            estadisticas.partesHoy = (resEmpleadosHoy.count || 0) + (resProveedoresHoy.count || 0);

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

            const partesEmpleados = (resRecientesEmp.data || []).map(p => ({ ...p, tipo_parte: 'empleado' }));
            const partesProveedores = partesProveedoresConInfo.map(p => ({ ...p, tipo_parte: 'proveedor' }));

            estadisticas.partesRecientesEmpleados = partesEmpleados.slice(0, 5);
            estadisticas.partesRecientesProveedores = partesProveedores.slice(0, 5);
            estadisticas.partesRecientes = [...partesEmpleados, ...partesProveedores]
              .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
              .slice(0, 5);

          } catch (error) {
            console.error('Error al cargar estadísticas de administrador:', error);
            Object.assign(estadisticas, {
              totalPartes: 0, totalEmpleados: 0, totalObras: 0, totalProveedores: 0,
              obrasActivas: 0, partesAprobados: 0, partesPendientes: 0, partesRecientes: []
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
                { data: partesRecientesEmpleado }
              ] = await Promise.all([
                supabase.from('partes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
                supabase.from('partes').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('estado', 'aprobado'),
                supabase.from('partes').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('estado', 'pendiente'),
                supabase.from('empleados_obras').select('obras(id, nombre_obra, estado)').eq('empleado_id', empleadoData.id),
                supabase.from('partes').select('id, fecha, estado, nombre_obra, numero_parte').eq('user_id', user.id).order('fecha', { ascending: false }).limit(5)
              ]);
              estadisticas.totalPartes = totalPartesEmpleado || 0;
              estadisticas.partesAprobados = partesAprobadosEmpleado || 0;
              estadisticas.partesPendientes = partesPendientesEmpleado || 0;
              estadisticas.obrasAsignadas = obrasEmpleado?.length || 0;
              estadisticas.partesRecientes = partesRecientesEmpleado || [];
            }
          } catch (error) {
            console.error('Error al cargar estadísticas de empleado:', error);
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
                { data: partesRecientesProveedor }
              ] = await Promise.all([
                supabase.from('partes_proveedores').select('*', { count: 'exact', head: true }).eq('proveedor_id', proveedorId),
                supabase.from('partes_proveedores').select('*', { count: 'exact', head: true }).eq('proveedor_id', proveedorId).eq('estado', 'aprobado'),
                supabase.from('partes_proveedores').select('*', { count: 'exact', head: true }).eq('proveedor_id', proveedorId).eq('estado', 'pendiente'),
                supabase.from('proveedores_obras').select('obras(id, nombre_obra, estado)').eq('proveedor_id', proveedorId),
                supabase.from('partes_proveedores').select('id, fecha, estado, obras(nombre_obra), numero_parte').eq('proveedor_id', proveedorId).order('fecha', { ascending: false }).limit(5)
              ]);
              estadisticas.totalPartes = totalPartesProveedor || 0;
              estadisticas.partesAprobados = partesAprobadosProveedor || 0;
              estadisticas.partesPendientes = partesPendientesProveedor || 0;
              estadisticas.obrasAsignadas = obrasProveedor?.length || 0;
              estadisticas.partesRecientes = partesRecientesProveedor || [];
            }
          } catch (error) {
            console.error('Error al cargar estadísticas de proveedor:', error);
            if (isMounted) setError('Error al cargar estadísticas');
          }
        }

        if (isMounted) {
          setStats(estadisticas);
          if (isAdmin || isSupervisor) {
            updateStats({
              totalPartes: estadisticas.totalPartes,
              partesPendientes: estadisticas.partesPendientes,
              partesCompletados: estadisticas.partesCompletados,
              partesAprobados: estadisticas.partesAprobados,
              partesHoy: estadisticas.partesHoy,
              loading: false
            });
          }
        }
      } catch (error) {
        console.error('Error general al cargar estadísticas:', error);
        if (isMounted) setError('Error al cargar estadísticas');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    cargarEstadisticas();
    return () => { isMounted = false; };
  }, [user]); // Solo depende de user - los roles se resuelven dentro

  // Tarjetas para administradores y supervisores
  // Función para hacer scroll al bloque de partes de trabajo
  const scrollToPartesSection = () => {
    console.log('[ScrollDebug] Iniciando función scrollToPartesSection');
    
    // Intentar encontrar el elemento con el ID específico primero
    let partesSection = document.getElementById('partes-trabajo-section');
    console.log('[ScrollDebug] Elemento encontrado por ID:', !!partesSection);
    
    // Si no se encuentra, buscar por selector más general
    if (!partesSection) {
      // Buscar por texto del título (incluyendo H2 para dashboards específicos)
      const headers = document.querySelectorAll('h1, h2');
      console.log('[ScrollDebug] Buscando en', headers.length, 'headers');
      
      for (const header of headers) {
        if (header.textContent?.includes('Partes de Trabajo') || 
            header.textContent?.includes('Mis Partes de Trabajo')) {
          partesSection = header;
          console.log('[ScrollDebug] Elemento encontrado por texto:', header.textContent);
          break;
        }
      }
    }
    
    // Como último recurso, buscar cualquier contenedor con filtros de partes
    if (!partesSection) {
      partesSection = document.querySelector('[class*="bg-white"][class*="rounded"]');
      console.log('[ScrollDebug] Elemento encontrado por fallback:', !!partesSection);
    }
    
    if (partesSection) {
      // Detectar si es móvil para ajustar el offset
      const isMobile = window.innerWidth <= 768;
      console.log('[ScrollDebug] Es móvil:', isMobile, 'Ancho:', window.innerWidth);
      
      // Obtener las dimensiones actuales
      const rect = partesSection.getBoundingClientRect();
      const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
      
      // Calcular la posición absoluta del elemento
      const elementTop = rect.top + currentScrollY;
      
      // Calcular offset dinámicamente basado en elementos visibles
      let mobileOffset = 80; // Offset base para desktop
      
      if (isMobile) {
        // Header móvil fijo tiene 64px de altura según mobile-optimizations.css
        const mobileHeaderHeight = 64;
        
        // Buscar elementos adicionales que puedan afectar la posición
        const mobileHeader = document.querySelector('.mobile-header-improved');
        const dashboardElements = document.querySelectorAll('[class*="dashboard"]');
        
        // Calcular offset móvil considerando:
        // 1. Header móvil fijo (64px)
        // 2. Padding adicional para separación visual (20px)
        // 3. Posibles elementos del dashboard que estén arriba (InstallPWA, etc.)
        mobileOffset = mobileHeaderHeight + 20;
        
        // Si hay elementos del dashboard visibles arriba, agregar más espacio
        if (dashboardElements.length > 0) {
          mobileOffset += 40; // Espacio adicional para componentes del dashboard
        }
        
        console.log('[ScrollDebug] Offset móvil calculado:', {
          headerHeight: mobileHeaderHeight,
          totalOffset: mobileOffset,
          dashboardElements: dashboardElements.length
        });
      }
      
      const targetPosition = Math.max(0, elementTop - mobileOffset);
      
      console.log('[ScrollDebug] Datos de scroll:', {
        elementTop,
        currentScrollY,
        offset: mobileOffset,
        targetPosition,
        rect
      });
      
      // Usar scrollTo con comportamiento suave
      // En móvil, usar un pequeño delay para asegurar que el DOM esté completamente renderizado
      if (isMobile) {
        setTimeout(() => {
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
          console.log('[ScrollDebug] Scroll móvil ejecutado con delay a posición:', targetPosition);
        }, 100);
      } else {
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
        console.log('[ScrollDebug] Scroll desktop ejecutado a posición:', targetPosition);
      }
    } else {
      console.warn('[ScrollDebug] No se encontró la sección de partes de trabajo para hacer scroll');
    }
  };

  const adminCards = [
    {
      id: 'admin-partes',
      title: 'Partes de Trabajo',
      value: stats.totalPartes,
      detailItems: [
        { label: 'Empleados', value: stats.totalPartesEmpleados },
        { label: 'Proveedores', value: stats.totalPartesProveedores }
      ],
      icon: <DocumentTextIcon className="h-12 w-12 text-indigo-600" />,
      onClick: scrollToPartesSection,
      permission: 'administrador'
    },
    {
      id: 'admin-empleados',
      title: 'Empleados',
      value: stats.totalEmpleados,
      icon: <UserGroupIcon className="h-12 w-12 text-blue-600" />,
      link: '/empleados',
      permission: 'administrador'
    },
    {
      id: 'admin-obras',
      title: 'Obras',
      value: stats.totalObras,
      icon: <BuildingOfficeIcon className="h-12 w-12 text-green-600" />,
      link: '/obras',
      permission: 'administrador'
    },
    {
      id: 'admin-proveedores',
      title: 'Proveedores',
      value: stats.totalProveedores,
      icon: <TruckIcon className="h-12 w-12 text-yellow-600" />,
      link: '/proveedores',
      permission: 'administrador'
    }
  ];

  // Tarjetas para empleados
  const empleadoCards = [
    {
      id: 'empleado-mis-partes',
      title: 'Mis Partes',
      value: stats.totalPartes,
      icon: <DocumentTextIcon className="h-12 w-12 text-indigo-600" />,
      link: '/partes-empleados',
      permission: 'empleado'
    },
    {
      id: 'empleado-nuevo-parte',
      title: 'Nuevo Parte',
      icon: <DocumentPlusIcon className="h-12 w-12 text-green-600" />,
      link: '/nuevo-parte',
      permission: 'empleado'
    },
    {
      id: 'empleado-obras-asignadas',
      title: 'Obras Asignadas',
      value: stats.obrasAsignadas,
      icon: <BuildingOfficeIcon className="h-12 w-12 text-blue-600" />,
      link: '/obras',
      permission: 'empleado'
    }
  ];

  // Tarjetas para proveedores
  const proveedorCards = [
    {
      id: 'proveedor-mis-partes',
      title: 'Mis Partes',
      value: stats.totalPartes,
      icon: <DocumentTextIcon className="h-12 w-12 text-indigo-600" />,
      link: '/partes-proveedores',
      permission: 'proveedor'
    },
    {
      id: 'proveedor-nuevo-parte',
      title: 'Nuevo Parte',
      icon: <DocumentPlusIcon className="h-12 w-12 text-green-600" />,
      link: '/parte-proveedor/nuevo',
      permission: 'proveedor'
    },
    {
      id: 'proveedor-obras-asignadas',
      title: 'Obras Asignadas',
      value: stats.obrasAsignadas,
      icon: <BuildingOfficeIcon className="h-12 w-12 text-blue-600" />,
      link: '/obras',
      permission: 'proveedor'
    }
  ];

  // Determinar qué tarjetas mostrar según el rol
  const cards = (isAdmin || isSupervisor)
    ? adminCards
    : isEmpleado
      ? empleadoCards
      : proveedorCards;

  // Acciones rápidas memoizadas
  const filteredQuickActions = useMemo(() => {
    const quickActions = [
      ...(hasRole('superadmin') ? [{
        id: 'importar-partes-trabajo', name: 'Importar Partes', to: '/importar-partes-trabajo',
        icon: DocumentPlusIcon, color: 'bg-purple-500', permission: 'superadmin'
      }] : []),
      ...((isAdmin || isSupervisor) ? [{
        id: 'crear-parte-empleado', name: 'Crear Parte Empleado', to: '/nuevo-parte',
        state: { adminMode: true }, icon: DocumentPlusIcon, color: 'bg-blue-500', permission: 'administrador'
      }] : []),
      ...((isAdmin || isSupervisor) ? [{
        id: 'crear-parte-proveedor', name: 'Crear Parte Proveedor', to: '/parte-proveedor/nuevo',
        icon: DocumentPlusIcon, color: 'bg-amber-500', permission: 'administrador'
      }] : []),
      ...(isEmpleado && !isAdmin && !isSupervisor ? [{
        id: 'empleado-crear-parte', name: 'Crear Parte', href: '/nuevo-parte',
        icon: DocumentPlusIcon, color: 'bg-blue-500', permission: 'empleado'
      }] : []),
      ...(isProveedor ? [{
        id: 'proveedor-crear-parte', name: 'Crear Parte Proveedor', href: '/parte-proveedor/nuevo',
        icon: DocumentPlusIcon, color: 'bg-amber-500', permission: 'proveedor'
      }] : [])
    ];

    return quickActions.filter(action => {
      if (!action.permission) return true;
      if (action.permission === 'administrador') return isAdmin;
      if (action.permission === 'empleado') return isEmpleado;
      if (action.permission === 'proveedor') return isProveedor;
      if (action.permission === 'superadmin') return hasRole('superadmin');
      return false;
    });
  }, [isAdmin, isSupervisor, isEmpleado, isProveedor, hasRole]);

if (loading) {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      <span className="ml-3 text-gray-700">Cargando estadísticas...</span>
    </div>
  );
}

return (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-gray-900">
      Bienvenido, {user?.email}
    </h2>

      {/* Acciones rápidas */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="flex flex-row items-stretch gap-4 overflow-x-auto">
          {/* Renderizar acciones rápidas dinámicamente desde el array quickActions */}
          {filteredQuickActions.map((action) => (
            <Link
              key={action.id}
              to={action.to || action.href}
              state={action.state}
              className={`flex flex-col items-center justify-center p-4 ${action.color ? action.color.replace('bg-', 'bg-') + '/10' : 'bg-indigo-50'} rounded-lg hover:${action.color ? action.color.replace('bg-', 'bg-') + '/20' : 'bg-indigo-100'} transition-colors min-w-24`}
            >
              {action.icon && <action.icon className={`h-8 w-8 ${action.color ? action.color.replace('bg-', 'text-') : 'text-indigo-600'} mb-2`} />}
              <span className="text-sm text-center font-medium text-gray-900">{action.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cards.map((card, index) => {
          const CardWrapper = card.onClick ? 'div' : Link;
          const cardProps = card.onClick 
            ? { 
                onClick: card.onClick, 
                className: "bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer" 
              }
            : { 
                to: card.link, 
                className: "bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow" 
              };

          return (
            <CardWrapper
              key={card.id}
              {...cardProps}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{card.title}</h3>
                  {card.value !== undefined && (
                    <p className="text-3xl font-bold text-gray-800 mt-2">{card.value}</p>
                  )}
                  {card.detailItems && card.detailItems.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {card.detailItems.map((item, idx) => (
                        <div key={idx} className="flex items-center text-sm">
                          <span className="text-gray-600">{item.label}:</span>
                          <span className="ml-2 font-medium text-gray-800">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-indigo-50 p-3 rounded-full">{card.icon}</div>
              </div>
            </CardWrapper>
          );
        })}
      </div>

      {/* Bloques de Partes Recientes rediseñado para una columna horizontal */}
      {(isAdmin || isSupervisor) && (
        <div className="mb-8 space-y-6">
          {/* Bloque Partes Recientes Empleados */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Partes Recientes Empleados</h3>
            
            {/* Vista Desktop - Tabla completa */}
            <div className="hidden md:block overflow-x-auto -mx-4 md:mx-0">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nº Parte</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trabajador</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Obra</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.partesRecientesEmpleados && stats.partesRecientesEmpleados.length > 0 ? (
                        stats.partesRecientesEmpleados.map((parte) => (
                          <tr key={parte.id} className="hover:bg-gray-50 cursor-pointer">
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                              <Link to={`/ver-detalle/empleado/${parte.id}`} className="block">
                                {new Date(parte.fecha).toLocaleDateString()}
                              </Link>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                              <Link to={`/ver-detalle/empleado/${parte.id}`} className="block">
                                {parte.numero_parte || 'N/A'}
                              </Link>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                              <Link to={`/ver-detalle/empleado/${parte.id}`} className="block">
                                {parte.nombre_trabajador || 'Sin empleado'}
                              </Link>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                              <Link to={`/ver-detalle/empleado/${parte.id}`} className="block">
                                {parte.nombre_obra || 'Sin obra'}
                              </Link>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <Link to={`/ver-detalle/empleado/${parte.id}`} className="block">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  parte.estado === 'Aprobado' || parte.estado === 'aprobado' ? 'bg-green-100 text-green-800' :
                                  parte.estado === 'Pendiente de Revisión' || parte.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                  parte.estado === 'Rechazado' || parte.estado === 'rechazado' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {parte.estado}
                                </span>
                              </Link>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-3 py-4 text-center text-sm text-gray-500">
                            No hay partes recientes de empleados
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Vista Móvil - Cards responsivas */}
            <div className="md:hidden space-y-3">
              {stats.partesRecientesEmpleados && stats.partesRecientesEmpleados.length > 0 ? (
                stats.partesRecientesEmpleados.map((parte) => (
                  <Link 
                    key={parte.id} 
                    to={`/ver-detalle/empleado/${parte.id}`}
                    className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {parte.numero_parte || 'N/A'}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            parte.estado === 'Aprobado' || parte.estado === 'aprobado' ? 'bg-green-100 text-green-800' :
                            parte.estado === 'Pendiente de Revisión' || parte.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                            parte.estado === 'Rechazado' || parte.estado === 'rechazado' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {parte.estado}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Trabajador:</span> {parte.nombre_trabajador || 'Sin empleado'}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Obra:</span> {parte.nombre_obra || 'Sin obra'}
                        </p>
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">Fecha:</span> {new Date(parte.fecha).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center text-sm text-gray-500 py-4">
                  No hay partes recientes de empleados
                </div>
              )}
            </div>
          </div>

          {/* Bloque Partes Recientes Proveedores */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Partes Recientes Proveedores</h3>
            
            {/* Vista Desktop - Tabla completa */}
            <div className="hidden md:block overflow-x-auto -mx-4 md:mx-0">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nº Parte</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Razón Social</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Obra</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.partesRecientesProveedores && stats.partesRecientesProveedores.length > 0 ? (
                        stats.partesRecientesProveedores.map((parte) => (
                          <tr key={parte.id} className="hover:bg-gray-50 cursor-pointer">
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                              <Link to={`/parte-proveedor/ver/${parte.id}`} className="block">
                                {new Date(parte.fecha).toLocaleDateString()}
                              </Link>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                              <Link to={`/parte-proveedor/ver/${parte.id}`} className="block">
                                {parte.numero_parte || 'N/A'}
                              </Link>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                              <Link to={`/parte-proveedor/ver/${parte.id}`} className="block">
                                {parte.proveedores?.razon_social || parte.razon_social || parte.empresa || 'Sin proveedor'}
                              </Link>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                              <Link to={`/parte-proveedor/ver/${parte.id}`} className="block">
                                {parte.nombre_obra || 'Sin obra'}
                              </Link>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap">
                              <Link to={`/parte-proveedor/ver/${parte.id}`} className="block">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  parte.estado === 'Aprobado' || parte.estado === 'aprobado' ? 'bg-green-100 text-green-800' :
                                  parte.estado === 'Pendiente de Revisión' || parte.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                  parte.estado === 'Rechazado' || parte.estado === 'rechazado' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {parte.estado}
                                </span>
                              </Link>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-3 py-4 text-center text-sm text-gray-500">
                            No hay partes recientes de proveedores
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Vista Móvil - Cards responsivas */}
            <div className="md:hidden space-y-3">
              {stats.partesRecientesProveedores && stats.partesRecientesProveedores.length > 0 ? (
                stats.partesRecientesProveedores.map((parte) => (
                  <Link 
                    key={parte.id} 
                    to={`/parte-proveedor/ver/${parte.id}`}
                    className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {parte.numero_parte || 'N/A'}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            parte.estado === 'Aprobado' || parte.estado === 'aprobado' ? 'bg-green-100 text-green-800' :
                            parte.estado === 'Pendiente de Revisión' || parte.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                            parte.estado === 'Rechazado' || parte.estado === 'rechazado' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {parte.estado}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Razón Social:</span> {parte.proveedores?.razon_social || parte.razon_social || parte.empresa || 'Sin proveedor'}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Obra:</span> {parte.nombre_obra || 'Sin obra'}
                        </p>
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">Fecha:</span> {new Date(parte.fecha).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center text-sm text-gray-500 py-4">
                  No hay partes recientes de proveedores
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas para empleados y proveedores */}
      {(isEmpleado || isProveedor) && !isAdmin && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Mis Partes Recientes</h3>
          <div className="overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {stats.partesRecientes && stats.partesRecientes.length > 0 ? (
                stats.partesRecientes.map((parte) => (
                  <li key={parte.id} className="py-3">
                    <Link 
                      to={isEmpleado ? `/editar-parte/${parte.id}` : `/parte-proveedor/ver/${parte.id}`} 
                      className="flex justify-between hover:bg-gray-50 p-2 rounded"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {parte.obras?.nombre_obra || 'Sin obra'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(parte.fecha).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        parte.estado === 'aprobado' ? 'bg-green-100 text-green-800' :
                        parte.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                        parte.estado === 'rechazado' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {parte.estado}
                      </span>
                    </Link>
                  </li>
                ))
              ) : (
                <li className="py-3 text-center text-gray-500">No hay partes recientes</li>
              )}
            </ul>
          </div>
          
          {/* Resumen de estados para empleados y proveedores */}
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-800 mb-3">Resumen de Estados</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-800">Aprobados</p>
                <p className="text-2xl font-bold text-green-700">{stats.partesAprobados}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.partesPendientes}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(DashboardPersonalizado);
