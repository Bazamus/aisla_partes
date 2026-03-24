import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { exportarObras, importarObras } from '../services/importExportService';
import PlantillaDownloader from '../components/PlantillaDownloader';
import DebugPanel from '../components/DebugPanel';
import { useAuth } from '../contexts/AuthContext';
import ModalSeleccionEmpleados from '../components/obras/ModalSeleccionEmpleados';
import { UserGroupIcon } from '@heroicons/react/24/outline';

export default function Obras() {
  const { userRoles } = useAuth();
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentObra, setCurrentObra] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});
  const [formData, setFormData] = useState({
    numero_obra: '',
    nombre_obra: '',
    cliente: '',
    estado: '',
    direccion_obra: ''
  });
  const [importLoading, setImportLoading] = useState(false);

  // Estados para asignación de empleados a obra recién creada
  const [showModalAsignarEmpleados, setShowModalAsignarEmpleados] = useState(false);
  const [obraRecienCreada, setObraRecienCreada] = useState(null);

  // Estados para asignación de empleados a obra existente
  const [showModalAsignarEmpleadosEdit, setShowModalAsignarEmpleadosEdit] = useState(false);
  const [obraSeleccionadaEdit, setObraSeleccionadaEdit] = useState(null);
  const [empleadosPreseleccionados, setEmpleadosPreseleccionados] = useState([]);
  const [empleadosPorObra, setEmpleadosPorObra] = useState({});

  // Verificar si el usuario es SuperAdmin
  const isSuperAdmin = userRoles?.some(role => role.nombre === 'SuperAdmin');

  useEffect(() => {
    console.log('Componente Obras montado, iniciando carga...');
    cargarObras();
    // Actualizar registros con estado "Activa" a "En Curso"
    updateActivaToEnCurso();
  }, []);

  // Función para actualizar registros con estado "Activa" a "En Curso"
  const updateActivaToEnCurso = async () => {
    try {
      const { error } = await supabase
        .from('obras')
        .update({ estado: 'En Curso' })
        .eq('estado', 'Activa');
      
      if (error) {
        console.error('Error al actualizar estados:', error);
      } else {
        console.log('Estados actualizados correctamente');
      }
    } catch (error) {
      console.error('Error al actualizar estados:', error);
    }
  };

  const cargarObras = async () => {
    try {
      setLoading(true);
      console.log('Iniciando carga de obras...');
      
      const { data, error } = await supabase
        .from('obras')
        .select('*')
        .order('nombre_obra');

      if (error) {
        console.error('Error al cargar obras:', error);
        toast.error(`Error al cargar las obras: ${error.message}`);
        return;
      }
      
      console.log('Obras cargadas exitosamente:', data?.length || 0, 'obras');
      setObras(data || []);

      // Cargar conteo de empleados por obra
      await cargarEmpleadosPorObra(data || []);
    } catch (error) {
      console.error('Error inesperado al cargar obras:', error);
      toast.error('Error inesperado al cargar las obras');
    } finally {
      setLoading(false);
    }
  };

  // Cargar empleados asignados por obra (conteo y nombres para tooltip)
  const cargarEmpleadosPorObra = async (obrasData) => {
    try {
      const obraIds = obrasData.map(o => o.id);
      if (obraIds.length === 0) return;

      const { data, error } = await supabase
        .from('empleados_obras')
        .select('obra_id, empleado_id, empleados(id, nombre)')
        .in('obra_id', obraIds);

      if (error) {
        console.error('Error al cargar empleados por obra:', error);
        return;
      }

      // Agrupar empleados por obra_id
      const empleadosMap = {};
      (data || []).forEach(item => {
        if (!empleadosMap[item.obra_id]) {
          empleadosMap[item.obra_id] = [];
        }
        if (item.empleados) {
          empleadosMap[item.obra_id].push({
            id: item.empleado_id,
            nombre: item.empleados.nombre
          });
        }
      });

      setEmpleadosPorObra(empleadosMap);
    } catch (error) {
      console.error('Error al procesar empleados por obra:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validar campos obligatorios
      if (!formData.numero_obra || !formData.nombre_obra) {
        toast.error('El número de obra y nombre son obligatorios');
        return;
      }
      
      // Si estamos editando, actualizar la obra (sin cambios en el flujo)
      if (currentObra) {
        const { error } = await supabase
          .from('obras')
          .update({
            numero_obra: formData.numero_obra,
            nombre_obra: formData.nombre_obra,
            cliente: formData.cliente || '',
            estado: formData.estado || '',
            direccion_obra: formData.direccion_obra || ''
          })
          .eq('id', currentObra.id);

        if (error) throw error;
        toast.success('Obra actualizada correctamente');

        // Recargar la lista de obras
        cargarObras();
        // Cerrar el modal
        setModalOpen(false);
        // Resetear el formulario
        resetForm();
      } else {
        // CREAR NUEVA OBRA - Flujo modificado para asignar empleados

        // Verificar si ya existe una obra con el mismo número
        const { data: existingObra } = await supabase
          .from('obras')
          .select('id')
          .eq('numero_obra', formData.numero_obra)
          .maybeSingle();

        if (existingObra) {
          toast.error('Ya existe una obra con ese número');
          return;
        }

        // Insertar la nueva obra y obtener el ID
        const { data: nuevaObra, error } = await supabase
          .from('obras')
          .insert([{
            numero_obra: formData.numero_obra,
            nombre_obra: formData.nombre_obra,
            cliente: formData.cliente || '',
            estado: formData.estado || '',
            direccion_obra: formData.direccion_obra || ''
          }])
          .select()
          .single();

        if (error) throw error;

        // Guardar la obra recién creada para la asignación
        setObraRecienCreada(nuevaObra);

        // Cerrar el modal de obra
        setModalOpen(false);

        // Resetear el formulario
        resetForm();

        // Mostrar mensaje de éxito
        toast.success('Obra creada correctamente');

        // Abrir el modal de asignación de empleados
        setShowModalAsignarEmpleados(true);
      }
    } catch (error) {
      console.error('Error al guardar obra:', error);
      toast.error('Error al guardar la obra');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (obra) => {
    setCurrentObra(obra);
    setFormData({
      numero_obra: obra.numero_obra || '',
      nombre_obra: obra.nombre_obra || '',
      cliente: obra.cliente || '',
      estado: obra.estado || '',
      direccion_obra: obra.direccion_obra || ''
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta obra?')) return;
    
    try {
      setLoading(true);
      
      // Verificar si hay empleados asignados a esta obra
      const { data: empleadosAsignados, error: errorEmpleados } = await supabase
        .from('empleados_obras')
        .select('empleado_id')
        .eq('obra_id', id);
      
      if (errorEmpleados) throw errorEmpleados;
      
      if (empleadosAsignados && empleadosAsignados.length > 0) {
        toast.error('No se puede eliminar la obra porque tiene empleados asignados');
        return;
      }
      
      // Verificar si hay partes asociados a esta obra
      const { data: partesAsociados, error: errorPartes } = await supabase
        .from('partes')
        .select('id')
        .eq('nombre_obra', obras.find(o => o.id === id)?.nombre_obra || '');
      
      if (errorPartes) throw errorPartes;
      
      if (partesAsociados && partesAsociados.length > 0) {
        toast.error('No se puede eliminar la obra porque tiene partes de trabajo asociados');
        return;
      }
      
      // Si no hay dependencias, eliminar la obra
      const { error } = await supabase
        .from('obras')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Recargar la lista de obras
      cargarObras();
      toast.success('Obra eliminada correctamente');
    } catch (error) {
      console.error('Error al eliminar obra:', error);
      toast.error('Error al eliminar la obra');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentObra(null);
    setFormData({
      numero_obra: '',
      nombre_obra: '',
      cliente: '',
      estado: '',
      direccion_obra: ''
    });
  };

  // Manejador para confirmar asignación de empleados a obra recién creada
  const handleConfirmarAsignacion = async (empleadosIds) => {
    if (!obraRecienCreada) {
      toast.error('Error: no hay obra para asignar');
      return;
    }

    try {
      setLoading(true);

      if (empleadosIds.length > 0) {
        const asignaciones = empleadosIds.map(empId => ({
          empleado_id: parseInt(empId),
          obra_id: obraRecienCreada.id
        }));

        const { error } = await supabase
          .from('empleados_obras')
          .insert(asignaciones);

        if (error) {
          console.error('Error al asignar empleados:', error);
          toast.error('La obra se creó correctamente, pero hubo un error al asignar empleados. Puedes asignarlos manualmente desde la página de Empleados.');

          setShowModalAsignarEmpleados(false);
          setObraRecienCreada(null);
          cargarObras();
          return;
        }

        toast.success(`Obra creada y asignada a ${empleadosIds.length} empleado(s)`);
      }

      setShowModalAsignarEmpleados(false);
      setObraRecienCreada(null);
      cargarObras();

    } catch (error) {
      console.error('Error al procesar la asignación:', error);
      toast.error('Error al procesar la asignación');
    } finally {
      setLoading(false);
    }
  };

  // Manejador para cancelar asignación de empleados
  const handleCancelarAsignacion = () => {
    setShowModalAsignarEmpleados(false);
    setObraRecienCreada(null);
    cargarObras();
  };

  // Manejador para abrir modal de asignación de empleados en obra existente
  const handleAbrirAsignacionEmpleadosEdit = async (obra) => {
    try {
      setLoading(true);
      
      // Cargar empleados actualmente asignados a esta obra
      const { data, error } = await supabase
        .from('empleados_obras')
        .select('empleado_id')
        .eq('obra_id', obra.id);

      if (error) {
        console.error('Error al cargar empleados asignados:', error);
        toast.error('Error al cargar empleados asignados');
        return;
      }

      const empleadosIds = (data || []).map(item => item.empleado_id.toString());
      
      setObraSeleccionadaEdit(obra);
      setEmpleadosPreseleccionados(empleadosIds);
      setShowModalAsignarEmpleadosEdit(true);
    } catch (error) {
      console.error('Error al preparar asignación:', error);
      toast.error('Error al preparar asignación');
    } finally {
      setLoading(false);
    }
  };

  // Manejador para confirmar asignación de empleados en obra existente (DELETE+INSERT)
  const handleConfirmarAsignacionEdit = async (empleadosIds) => {
    if (!obraSeleccionadaEdit) {
      toast.error('Error: no hay obra seleccionada');
      return;
    }

    try {
      setLoading(true);

      // DELETE: Eliminar todas las asignaciones existentes
      const { error: deleteError } = await supabase
        .from('empleados_obras')
        .delete()
        .eq('obra_id', obraSeleccionadaEdit.id);

      if (deleteError) {
        console.error('Error al eliminar asignaciones:', deleteError);
        toast.error('Error al actualizar asignaciones');
        return;
      }

      // INSERT: Insertar las nuevas asignaciones
      if (empleadosIds.length > 0) {
        const asignaciones = empleadosIds.map(empId => ({
          empleado_id: parseInt(empId),
          obra_id: obraSeleccionadaEdit.id
        }));

        const { error: insertError } = await supabase
          .from('empleados_obras')
          .insert(asignaciones);

        if (insertError) {
          console.error('Error al insertar asignaciones:', insertError);
          toast.error('Error al guardar asignaciones');
          return;
        }

        toast.success(`${empleadosIds.length} empleado(s) asignado(s) a la obra`);
      } else {
        toast.success('Se han eliminado todas las asignaciones de la obra');
      }

      setShowModalAsignarEmpleadosEdit(false);
      setObraSeleccionadaEdit(null);
      setEmpleadosPreseleccionados([]);
      cargarObras();

    } catch (error) {
      console.error('Error al procesar la asignación:', error);
      toast.error('Error al procesar la asignación');
    } finally {
      setLoading(false);
    }
  };

  // Manejador para cancelar asignación de empleados en obra existente
  const handleCancelarAsignacionEdit = () => {
    setShowModalAsignarEmpleadosEdit(false);
    setObraSeleccionadaEdit(null);
    setEmpleadosPreseleccionados([]);
  };

  // Generar tooltip con nombres de empleados
  const getEmpleadosTooltip = (obraId) => {
    const empleados = empleadosPorObra[obraId] || [];
    if (empleados.length === 0) return 'Sin empleados asignados';
    if (empleados.length <= 5) {
      return empleados.map(e => e.nombre).join(', ');
    }
    return `${empleados.slice(0, 5).map(e => e.nombre).join(', ')} y ${empleados.length - 5} más`;
  };

  const handleExport = () => {
    try {
      exportarObras(obras);
      toast.success('Obras exportadas correctamente');
    } catch (error) {
      console.error('Error al exportar obras:', error);
      toast.error('Error al exportar las obras');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setImportLoading(true);
      const resultado = await importarObras(file);
      
      if (resultado.success) {
        toast.success(resultado.message);
        cargarObras(); // Recargar la lista de obras
      } else {
        toast.error(resultado.message);
        if (resultado.errores && resultado.errores.length > 0) {
          console.error('Errores de importación:', resultado.errores);
        }
      }
    } catch (error) {
      console.error('Error al importar obras:', error);
      toast.error('Error al importar las obras');
    } finally {
      setImportLoading(false);
      // Limpiar el input de archivo
      e.target.value = null;
    }
  };

  return (
    // Se eliminó container mx-auto px-4 py-8 para que Layout.jsx controle el contenedor
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Gestión de Obras</h1>
        
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full md:w-auto">
          {/* Botón de debugging temporal - Solo visible para SuperAdmin */}
          {isSuperAdmin && (
            <button
              onClick={async () => {
                console.log('=== DEBUG INFO ===');
                console.log('Estado actual de obras:', obras);
                console.log('Estado de loading:', loading);
                console.log('Debug info:', debugInfo);
                
                // Probar conexión directa
                try {
                  const { data, error } = await supabase
                    .from('obras')
                    .select('count')
                    .single();
                  console.log('Test directo - count:', data?.count, 'error:', error);
                  setDebugInfo({ lastTest: new Date().toISOString(), count: data?.count, error: error?.message });
                } catch (e) {
                  console.error('Error en test directo:', e);
                  setDebugInfo({ lastTest: new Date().toISOString(), error: e.message });
                }
              }}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm md:text-base"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">Debug</span>
              <span className="sm:hidden">Debug</span>
            </button>
          )}
          
          <button
            onClick={() => {
              setCurrentObra(null);
              setFormData({
                numero_obra: '',
                nombre_obra: '',
                cliente: '',
                estado: '',
                direccion_obra: ''
              });
              setModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm md:text-base"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Nueva Obra</span>
            <span className="sm:hidden">Nueva</span>
          </button>
          
          <button
            onClick={() => exportarObras(obras)}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm md:text-base"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="hidden sm:inline">Exportar</span>
            <span className="sm:hidden">Exportar</span>
          </button>
          
          <PlantillaDownloader tipo="obras" />
          
          <label className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer text-sm md:text-base">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="hidden sm:inline">Importar</span>
            <span className="sm:hidden">Importar</span>
            <input
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleImport}
              disabled={importLoading}
            />
          </label>
        </div>
      </div>

      {/* Información de debugging temporal - Solo visible para SuperAdmin */}
      {isSuperAdmin && Object.keys(debugInfo).length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">Debug Info:</h4>
          <pre className="text-xs text-yellow-700 overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}

      {loading && <p className="text-center py-4">Cargando...</p>}

      {!loading && obras.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay obras registradas</p>
          <p className="text-sm text-gray-400 mt-2">Estado de loading: {loading.toString()}</p>
          <p className="text-sm text-gray-400">Número de obras en estado: {obras.length}</p>
        </div>
      ) : (
        // Se eliminó relative w-full max-w-screen-2xl mx-auto px-4
        <div>
          {/* Vista de tabla para desktop */}
          <div className="hidden md:block border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full w-full divide-y divide-gray-200">
                <colgroup>
                  <col className="w-[15%]" />
                  <col className="w-[22%]" />
                  <col className="w-[18%]" />
                  <col className="w-[12%]" />
                  <col className="w-[10%]" />
                  <col className="w-[23%] sticky right-0 bg-white border-l-2 border-gray-100 shadow-[4px_0_6px_-1px_rgba(0,0,0,0.05)] z-30" />
                </colgroup>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nº Obra</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Empleados</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {obras.map((obra) => (
                    <tr key={obra.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{obra.numero_obra || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{obra.nombre_obra}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{obra.cliente || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {obra.estado ? (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            obra.estado === 'Pendiente' ? 'bg-orange-100 text-orange-800' :
                            obra.estado === 'En Curso' ? 'bg-green-100 text-green-800' : 
                            obra.estado === 'Finalizada' ? 'bg-blue-100 text-blue-800' : 
                            obra.estado === 'Garantía' ? 'bg-yellow-100 text-yellow-800' : 
                            obra.estado === 'Cerrada' ? 'bg-gray-100 text-gray-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {obra.estado}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        <span 
                          className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold cursor-help ${
                            (empleadosPorObra[obra.id]?.length || 0) > 0 
                              ? 'bg-indigo-100 text-indigo-800' 
                              : 'bg-gray-100 text-gray-500'
                          }`}
                          title={getEmpleadosTooltip(obra.id)}
                        >
                          <UserGroupIcon className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                          {empleadosPorObra[obra.id]?.length || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium sticky right-0 bg-white z-30">
                        <div className="flex space-x-2 justify-end">
                          <button
                            onClick={() => handleAbrirAsignacionEmpleadosEdit(obra)}
                            className="flex items-center bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-md shadow-sm transition-colors"
                            title="Gestionar empleados asignados"
                          >
                            <UserGroupIcon className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => handleEdit(obra)}
                            className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md shadow-sm transition-colors min-w-[85px]"
                          >
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(obra.id)}
                            className="flex items-center bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md shadow-sm transition-colors min-w-[85px]"
                          >
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vista de tarjetas para móvil */}
          <div className="md:hidden">
            {/* Indicador de resultados para móvil */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                {obras.length} {obras.length === 1 ? 'obra' : 'obras'} encontrada{obras.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="space-y-4">
              {obras.map((obra) => (
                <div key={obra.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  {/* Header con número y nombre */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 break-words leading-tight">
                      {obra.nombre_obra}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Nº: {obra.numero_obra || '-'}</p>
                  </div>
                  
                  {/* Información de la obra */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm">Cliente:</span>
                      <span className="font-medium text-sm">{obra.cliente || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm">Estado:</span>
                      <span className="font-medium text-sm">
                        {obra.estado ? (
                          <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                            obra.estado === 'Pendiente' ? 'bg-orange-100 text-orange-800' :
                            obra.estado === 'En Curso' ? 'bg-green-100 text-green-800' : 
                            obra.estado === 'Finalizada' ? 'bg-blue-100 text-blue-800' : 
                            obra.estado === 'Garantía' ? 'bg-yellow-100 text-yellow-800' : 
                            obra.estado === 'Cerrada' ? 'bg-gray-100 text-gray-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {obra.estado}
                          </span>
                        ) : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm">Empleados:</span>
                      <span 
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          (empleadosPorObra[obra.id]?.length || 0) > 0 
                            ? 'bg-indigo-100 text-indigo-800' 
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <UserGroupIcon className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                        {empleadosPorObra[obra.id]?.length || 0} asignado(s)
                      </span>
                    </div>
                    {obra.direccion_obra && (
                      <div className="flex justify-between items-start">
                        <span className="text-gray-500 text-sm">Dirección:</span>
                        <span className="font-medium text-sm break-words text-right">{obra.direccion_obra}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Botones de acción */}
                  <div className="flex space-x-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleAbrirAsignacionEmpleadosEdit(obra)}
                      className="flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded-md shadow-sm transition-colors text-sm"
                      aria-label="Gestionar empleados"
                    >
                      <UserGroupIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleEdit(obra)}
                      className="flex-1 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md shadow-sm transition-colors text-sm"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(obra.id)}
                      className="flex-1 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md shadow-sm transition-colors text-sm"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear/editar obra */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {currentObra ? 'Editar Obra' : 'Nueva Obra'}
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="numero_obra" className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Obra
                    </label>
                    <input
                      type="text"
                      name="numero_obra"
                      id="numero_obra"
                      value={formData.numero_obra}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="nombre_obra" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de Obra
                    </label>
                    <input
                      type="text"
                      name="nombre_obra"
                      id="nombre_obra"
                      value={formData.nombre_obra}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="cliente" className="block text-sm font-medium text-gray-700 mb-1">
                      Cliente
                    </label>
                    <input
                      type="text"
                      name="cliente"
                      id="cliente"
                      value={formData.cliente}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      name="estado"
                      id="estado"
                      value={formData.estado}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Seleccionar estado</option>
                      <option value="Pendiente">Pendiente</option>
                      <option value="En Curso">En Curso</option>
                      <option value="Finalizada">Finalizada</option>
                      <option value="Garantía">Garantía</option>
                      <option value="Cerrada">Cerrada</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="direccion_obra" className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <textarea
                    name="direccion_obra"
                    id="direccion_obra"
                    value={formData.direccion_obra}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  ></textarea>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de asignación de empleados a obra recién creada */}
      {showModalAsignarEmpleados && obraRecienCreada && (
        <ModalSeleccionEmpleados
          isOpen={showModalAsignarEmpleados}
          onClose={handleCancelarAsignacion}
          onConfirmar={handleConfirmarAsignacion}
          obraNombre={obraRecienCreada.nombre_obra}
        />
      )}

      {/* Modal de asignación de empleados a obra existente */}
      {showModalAsignarEmpleadosEdit && obraSeleccionadaEdit && (
        <ModalSeleccionEmpleados
          isOpen={showModalAsignarEmpleadosEdit}
          onClose={handleCancelarAsignacionEdit}
          onConfirmar={handleConfirmarAsignacionEdit}
          obraNombre={obraSeleccionadaEdit.nombre_obra}
          empleadosPreseleccionados={empleadosPreseleccionados}
          modoEdicion={true}
        />
      )}

      {/* Debug Panel - Solo visible para SuperAdmin */}
      {isSuperAdmin && <DebugPanel />}
    </div>
  );
}
