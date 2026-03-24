import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { exportarEmpleados, importarEmpleados, asignarObrasAEmpleado } from '../services/importExportService';
import PlantillaDownloader from '../components/PlantillaDownloader';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { MagnifyingGlassIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

export default function Empleados() {
  const { hasRole } = useAuth();
  const { openModal, closeModal } = useModal();
  const [empleados, setEmpleados] = useState([]);
  const [filteredEmpleados, setFilteredEmpleados] = useState([]);
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentEmpleado, setCurrentEmpleado] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'codigo', direction: 'ascending' });
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    categoria: '',
    coste_hora_trabajador: '',
    coste_hora_empresa: '',
    obras_asignadas: [],
    email: '',
    password: '',
    crearUsuario: false
  });
  const [importLoading, setImportLoading] = useState(false);
  const [obrasModalOpen, setObrasModalOpen] = useState(false);
  const [obrasSearchTerm, setObrasSearchTerm] = useState('');

  useEffect(() => {
    cargarEmpleados();
    cargarObras();
  }, []);

  useEffect(() => {
    if (!empleados.length) return;
    
    let filtered = [...empleados];
    
    // Aplicar filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(empleado => 
        empleado.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        empleado.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        empleado.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Aplicar ordenación
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        // Convertir a números para campos numéricos
        if (sortConfig.key === 'coste_hora_trabajador' || sortConfig.key === 'coste_hora_empresa') {
          const aValue = parseFloat(a[sortConfig.key]) || 0;
          const bValue = parseFloat(b[sortConfig.key]) || 0;
          
          if (sortConfig.direction === 'ascending') {
            return aValue - bValue;
          } else {
            return bValue - aValue;
          }
        } else {
          // Ordenación para campos de texto
          const aValue = a[sortConfig.key]?.toString().toLowerCase() || '';
          const bValue = b[sortConfig.key]?.toString().toLowerCase() || '';
          
          if (sortConfig.direction === 'ascending') {
            return aValue.localeCompare(bValue);
          } else {
            return bValue.localeCompare(aValue);
          }
        }
      });
    }
    
    setFilteredEmpleados(filtered);
  }, [empleados, searchTerm, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const cargarEmpleados = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('empleados')
        .select('*')
        .order('codigo');

      if (error) throw error;
      setEmpleados(data || []);
    } catch (error) {
      console.error('Error al cargar empleados:', error);
      toast.error('Error al cargar los empleados');
    } finally {
      setLoading(false);
    }
  };

  const cargarObras = async () => {
    try {
      const { data, error } = await supabase
        .from('obras')
        .select('*')
        .order('nombre_obra');

      if (error) throw error;
      setObras(data || []);
    } catch (error) {
      console.error('Error al cargar obras:', error);
      toast.error('Error al cargar las obras');
    }
  };

  const cargarObrasAsignadas = async (empleadoId) => {
    try {
      const { data, error } = await supabase
        .from('empleados_obras')
        .select('obra_id')
        .eq('empleado_id', empleadoId);

      if (error) throw error;
      return data.map(item => item.obra_id.toString());
    } catch (error) {
      console.error('Error al cargar obras asignadas:', error);
      return [];
    }
  };

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      categoria: '',
      coste_hora_trabajador: '',
      coste_hora_empresa: '',
      obras_asignadas: [],
      email: '',
      password: '',
      crearUsuario: false
    });
    setCurrentEmpleado(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleObrasChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({
      ...prev,
      obras_asignadas: selectedOptions
    }));
  };

  const handleObraToggle = (obraId) => {
    setFormData(prev => {
      const obraIdStr = obraId.toString();
      const isSelected = prev.obras_asignadas.includes(obraIdStr);
      
      if (isSelected) {
        return {
          ...prev,
          obras_asignadas: prev.obras_asignadas.filter(id => id !== obraIdStr)
        };
      } else {
        return {
          ...prev,
          obras_asignadas: [...prev.obras_asignadas, obraIdStr]
        };
      }
    });
  };

  const filteredObras = obras.filter(obra => 
    obra.nombre_obra.toLowerCase().includes(obrasSearchTerm.toLowerCase()) ||
    (obra.numero_obra && obra.numero_obra.toString().includes(obrasSearchTerm)) ||
    (obra.cliente && obra.cliente.toLowerCase().includes(obrasSearchTerm.toLowerCase()))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Validar campos obligatorios
      if (!formData.codigo || !formData.nombre) {
        toast.error('El código y el nombre son obligatorios');
        return;
      }
      
      // Validar email si se va a crear usuario
      if (formData.crearUsuario && !formData.email) {
        toast.error('El email es obligatorio para crear un usuario');
        return;
      }
      
      // Validar contraseña si se va a crear usuario
      if (formData.crearUsuario && !formData.password) {
        toast.error('La contraseña es obligatoria para crear un usuario');
        return;
      }
      
      let empleadoId;
      
      // Si estamos editando, actualizar el empleado
      if (currentEmpleado) {
        const { data, error } = await supabase
          .from('empleados')
          .update({
            codigo: formData.codigo,
            nombre: formData.nombre,
            categoria: formData.categoria,
            coste_hora_trabajador: formData.coste_hora_trabajador || 0,
            coste_hora_empresa: formData.coste_hora_empresa || 0,
            email: formData.email || null
          })
          .eq('id', currentEmpleado.id)
          .select();

        if (error) throw error;
        empleadoId = currentEmpleado.id;
        toast.success('Empleado actualizado correctamente');
      } else {
        // Si estamos creando, insertar el nuevo empleado
        const { data, error } = await supabase
          .from('empleados')
          .insert([{
            codigo: formData.codigo,
            nombre: formData.nombre,
            categoria: formData.categoria,
            coste_hora_trabajador: formData.coste_hora_trabajador || 0,
            coste_hora_empresa: formData.coste_hora_empresa || 0,
            email: formData.email || null
          }])
          .select();

        if (error) throw error;
        empleadoId = data[0].id;
        toast.success('Empleado creado correctamente');
      }
      
      // Actualizar las obras asignadas
      if (empleadoId) {
        // Primero eliminamos todas las asignaciones existentes
        await supabase
          .from('empleados_obras')
          .delete()
          .eq('empleado_id', empleadoId);
        
        // Luego insertamos las nuevas asignaciones
        if (formData.obras_asignadas.length > 0) {
          const asignaciones = formData.obras_asignadas.map(obraId => ({
            empleado_id: empleadoId,
            obra_id: parseInt(obraId)
          }));
          
          const { error } = await supabase
            .from('empleados_obras')
            .insert(asignaciones);
          
          if (error) throw error;
        }
      }
      
      // Crear usuario si se ha marcado la opción
      if (formData.crearUsuario && formData.email && formData.password) {
        try {
          // Verificar si ya existe un usuario con ese email
          const { data: existingUsers, error: checkError } = await supabase
            .from('usuarios_pendientes')
            .select('*')
            .eq('email', formData.email)
            .eq('procesado', false);
          
          if (checkError) {
            console.error('Error al verificar usuario existente:', checkError);
            // Continuar en modo de emergencia a pesar del error
            const { error: insertError } = await supabase
              .from('usuarios_pendientes')
              .insert([{
                email: formData.email,
                nombre: formData.nombre,
                rol_asignar: 'empleado',
                entidad_tipo: 'empleados',
                entidad_id: empleadoId,
                password_temporal: formData.password
              }]);
            
            if (insertError) {
              console.error('Error al registrar usuario pendiente:', insertError);
              toast.warning('Usuario registrado en modo de emergencia');
            } else {
              toast.success('Usuario registrado para creación');
            }
          } else if (existingUsers && existingUsers.length > 0) {
            toast.error('Ya existe un usuario pendiente con ese email');
          } else {
            // Registrar el usuario pendiente de creación
            const { error: insertError } = await supabase
              .from('usuarios_pendientes')
              .insert([{
                email: formData.email,
                nombre: formData.nombre,
                rol_asignar: 'empleado',
                entidad_tipo: 'empleados',
                entidad_id: empleadoId,
                password_temporal: formData.password
              }]);
            
            if (insertError) {
              console.error('Error al registrar usuario pendiente:', insertError);
              toast.error('Error al registrar el usuario');
            } else {
              toast.success('Usuario registrado para creación');
            }
          }
        } catch (error) {
          console.error('Error general al crear usuario:', error);
          toast.warning('Se ha producido un error, pero el empleado se ha guardado correctamente');
        }
      }
      
      // Recargar la lista de empleados
      cargarEmpleados();
      // Cerrar el modal
      closeModal();
      setModalOpen(false);
      // Resetear el formulario
      resetForm();
    } catch (error) {
      console.error('Error al guardar empleado:', error);
      toast.error('Error al guardar el empleado');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (empleado) => {
    try {
      // Cargar las obras asignadas al empleado
      const obrasIds = await cargarObrasAsignadas(empleado.id);
      
      setCurrentEmpleado(empleado);
      setFormData({
        codigo: empleado.codigo || '',
        nombre: empleado.nombre || '',
        categoria: empleado.categoria || '',
        coste_hora_trabajador: empleado.coste_hora_trabajador || '',
        coste_hora_empresa: empleado.coste_hora_empresa || '',
        obras_asignadas: obrasIds,
        email: empleado.email || '',
        password: '',
        crearUsuario: false
      });
      openModal();
      setModalOpen(true);
    } catch (error) {
      console.error('Error al cargar datos para edición:', error);
      toast.error('Error al cargar los datos del empleado');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este empleado?')) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('empleados')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Recargar la lista de empleados
      cargarEmpleados();
      toast.success('Empleado eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar empleado:', error);
      toast.error('Error al eliminar el empleado');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    try {
      exportarEmpleados(empleados);
      toast.success('Empleados exportados correctamente');
    } catch (error) {
      console.error('Error al exportar empleados:', error);
      toast.error('Error al exportar los empleados');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setImportLoading(true);
      const resultado = await importarEmpleados(file);
      
      if (resultado.success) {
        toast.success(resultado.message);
        cargarEmpleados(); // Recargar la lista de empleados
      } else {
        toast.error(resultado.message);
        if (resultado.errores && resultado.errores.length > 0) {
          console.error('Errores de importación:', resultado.errores);
        }
      }
    } catch (error) {
      console.error('Error al importar empleados:', error);
      toast.error('Error al importar los empleados');
    } finally {
      setImportLoading(false);
      // Limpiar el input de archivo
      e.target.value = null;
    }
  };

  // Función para obtener los detalles completos de las obras asignadas
  const obtenerDetallesObrasAsignadas = () => {
    return formData.obras_asignadas.map(obraId => {
      const obra = obras.find(o => o.id === parseInt(obraId));
      return obra || null;
    }).filter(obra => obra !== null);
  };

  return (
    // Se eliminó container mx-auto px-4 py-8 para que Layout.jsx controle el contenedor
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Empleados</h1>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mt-4 md:mt-0 w-full md:w-auto">
          <button
            onClick={() => {
              setCurrentEmpleado(null);
              setFormData({
                codigo: '',
                nombre: '',
                categoria: '',
                coste_hora_trabajador: '',
                coste_hora_empresa: '',
                obras_asignadas: [],
                email: '',
                password: '',
                crearUsuario: false
              });
              openModal();
              setModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm md:text-base"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Nuevo Empleado</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm md:text-base"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Exportar
          </button>
          <PlantillaDownloader tipo="empleados" />
          <label className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer text-sm md:text-base">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Importar
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

      {loading && <p className="text-center py-4">Cargando...</p>}

      {!loading && empleados.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay empleados registrados</p>
        </div>
      ) : (
        // Se eliminó relative w-full max-w-screen-2xl mx-auto px-4
        <div>
          {/* Barra de búsqueda horizontal */}
          <div className="bg-white p-4 mb-4 border border-gray-200 rounded-lg shadow-sm">
            <div className="flex flex-col gap-4">
              {/* Búsqueda */}
              <div className="w-full">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar por código, nombre o categoría..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mobile-search-empleados block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              
              {/* Resultados y ordenación */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center text-sm text-gray-500">
                  {filteredEmpleados.length} {filteredEmpleados.length === 1 ? 'resultado' : 'resultados'} encontrados
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-sm text-gray-500 hidden sm:inline">Ordenar por:</span>
                  <select 
                    value={sortConfig.key}
                    onChange={(e) => setSortConfig({ key: e.target.value, direction: sortConfig.direction })}
                    className="flex-1 sm:flex-none border border-gray-300 rounded-md text-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="codigo">Código</option>
                    <option value="nombre">Nombre</option>
                    <option value="categoria">Categoría</option>
                    <option value="coste_hora_trabajador">Coste Hora Trabajador</option>
                    <option value="coste_hora_empresa">Coste Hora Empresa</option>
                  </select>
                  <button 
                    onClick={() => setSortConfig({ ...sortConfig, direction: sortConfig.direction === 'ascending' ? 'descending' : 'ascending' })}
                    className="p-2 rounded-md hover:bg-gray-100 border border-gray-300"
                  >
                    {sortConfig.direction === 'ascending' ? (
                      <ArrowUpIcon className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ArrowDownIcon className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Vista de tabla para desktop */}
          <div className="hidden md:block border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full w-full divide-y divide-gray-200">
                <colgroup>
                  <col className="w-[15%]" />
                  <col className="w-[25%]" />
                  <col className="w-[15%]" />
                  <col className="w-[15%]" />
                  <col className="w-[15%]" />
                  <col className="w-[15%] sticky right-0 bg-white border-l-2 border-gray-100 shadow-[4px_0_6px_-1px_rgba(0,0,0,0.05)] z-30" />
                </colgroup>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('codigo')}>
                      Código
                      {sortConfig.key === 'codigo' ? (
                        sortConfig.direction === 'ascending' ? (
                          <ArrowUpIcon className="w-4 h-4 ml-1" />
                        ) : (
                          <ArrowDownIcon className="w-4 h-4 ml-1" />
                        )
                      ) : (
                        <></>
                      )}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('nombre')}>
                      Nombre
                      {sortConfig.key === 'nombre' ? (
                        sortConfig.direction === 'ascending' ? (
                          <ArrowUpIcon className="w-4 h-4 ml-1" />
                        ) : (
                          <ArrowDownIcon className="w-4 h-4 ml-1" />
                        )
                      ) : (
                        <></>
                      )}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('categoria')}>
                      Categoría
                      {sortConfig.key === 'categoria' ? (
                        sortConfig.direction === 'ascending' ? (
                          <ArrowUpIcon className="w-4 h-4 ml-1" />
                        ) : (
                          <ArrowDownIcon className="w-4 h-4 ml-1" />
                        )
                      ) : (
                        <></>
                      )}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('coste_hora_trabajador')}>
                      Coste Hora Trabajador
                      {sortConfig.key === 'coste_hora_trabajador' ? (
                        sortConfig.direction === 'ascending' ? (
                          <ArrowUpIcon className="w-4 h-4 ml-1" />
                        ) : (
                          <ArrowDownIcon className="w-4 h-4 ml-1" />
                        )
                      ) : (
                        <></>
                      )}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('coste_hora_empresa')}>
                      Coste Hora Empresa
                      {sortConfig.key === 'coste_hora_empresa' ? (
                        sortConfig.direction === 'ascending' ? (
                          <ArrowUpIcon className="w-4 h-4 ml-1" />
                        ) : (
                          <ArrowDownIcon className="w-4 h-4 ml-1" />
                        )
                      ) : (
                        <></>
                      )}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-white z-30">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmpleados.map((empleado) => (
                    <tr key={empleado.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{empleado.codigo}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{empleado.nombre}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{empleado.categoria || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{empleado.coste_hora_trabajador || '0'} €</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 pr-12">{empleado.coste_hora_empresa || '0'} €</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium sticky right-0 bg-white z-30">
                        <div className="flex space-x-2 justify-end">
                          <button
                            onClick={() => handleEdit(empleado)}
                            className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md shadow-sm transition-colors min-w-[85px]"
                          >
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(empleado.id)}
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
                {filteredEmpleados.length} {filteredEmpleados.length === 1 ? 'empleado' : 'empleados'} encontrado{filteredEmpleados.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="space-y-4">
              {filteredEmpleados.map((empleado) => (
                <div key={empleado.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  {/* Header con nombre y código */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 break-words leading-tight">
                      {empleado.nombre}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Código: {empleado.codigo}</p>
                  </div>
                  
                  {/* Información del empleado */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm">Categoría:</span>
                      <span className="font-medium text-sm">{empleado.categoria || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm">Coste Trabajador:</span>
                      <span className="font-medium text-sm">{empleado.coste_hora_trabajador || '0'} €</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm">Coste Empresa:</span>
                      <span className="font-medium text-sm">{empleado.coste_hora_empresa || '0'} €</span>
                    </div>
                  </div>
                  
                  {/* Botones de acción */}
                  <div className="flex space-x-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleEdit(empleado)}
                      className="flex-1 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md shadow-sm transition-colors text-sm"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(empleado.id)}
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
      {/* Modal para crear/editar empleado */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {currentEmpleado ? 'Editar Empleado' : 'Nuevo Empleado'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
              <div className="px-6 py-4 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="codigo" className="block text-sm font-medium text-gray-700 mb-1">
                      Código *
                    </label>
                    <input
                      type="text"
                      name="codigo"
                      id="codigo"
                      required
                      value={formData.codigo}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      id="nombre"
                      required
                      value={formData.nombre}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría
                    </label>
                    <input
                      type="text"
                      name="categoria"
                      id="categoria"
                      value={formData.categoria}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="coste_hora_trabajador" className="block text-sm font-medium text-gray-700 mb-1">
                      Coste Hora Trabajador (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="coste_hora_trabajador"
                      id="coste_hora_trabajador"
                      value={formData.coste_hora_trabajador}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="coste_hora_empresa" className="block text-sm font-medium text-gray-700 mb-1">
                      Coste Hora Empresa (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="coste_hora_empresa"
                      id="coste_hora_empresa"
                      value={formData.coste_hora_empresa}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="crearUsuario" className="block text-sm font-medium text-gray-700 mb-1">
                      Crear usuario
                    </label>
                    <input
                      type="checkbox"
                      name="crearUsuario"
                      id="crearUsuario"
                      checked={formData.crearUsuario}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Listado de Obras</label>
                  
                  {/* Selector para desktop */}
                  <div className="hidden md:block">
                    <select
                      name="obras_asignadas"
                      id="obras_asignadas"
                      multiple
                      value={formData.obras_asignadas}
                      onChange={handleObrasChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      size={5}
                    >
                      {obras.map((obra) => (
                        <option key={obra.id} value={obra.id}>
                          {obra.nombre_obra}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Mantén presionada la tecla Ctrl (o Cmd en Mac) para seleccionar múltiples obras
                    </p>
                  </div>

                  {/* Botón para abrir modal en móvil */}
                  <div className="md:hidden">
                    <button
                      type="button"
                      onClick={() => setObrasModalOpen(true)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">
                          {formData.obras_asignadas.length > 0 
                            ? `${formData.obras_asignadas.length} obra${formData.obras_asignadas.length !== 1 ? 's' : ''} seleccionada${formData.obras_asignadas.length !== 1 ? 's' : ''}`
                            : 'Seleccionar obras'
                          }
                        </span>
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    <p className="mt-1 text-xs text-gray-500">
                      Toca para seleccionar obras
                    </p>
                  </div>
                </div>

                {/* Visualización mejorada de obras asignadas */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resumen de Obras Asignadas ({formData.obras_asignadas.length})
                  </label>
                  <div className="border border-gray-200 rounded-md p-3 bg-gray-50 max-h-48 overflow-y-auto">
                    {formData.obras_asignadas.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        {obtenerDetallesObrasAsignadas().map(obra => (
                          <div key={obra.id} className="flex items-center justify-between bg-white p-2 rounded-md border border-gray-200 shadow-sm">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{obra.nombre_obra}</div>
                              <div className="text-sm text-gray-500 flex flex-col sm:flex-row sm:gap-4">
                                <span>Nº Obra: {obra.numero_obra || '-'}</span>
                                <span>Cliente: {obra.cliente || '-'}</span>
                              </div>
                            </div>
                            <div>
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                obra.estado === 'Pendiente' ? 'bg-orange-100 text-orange-800' :
                                obra.estado === 'En Curso' ? 'bg-green-100 text-green-800' : 
                                obra.estado === 'Finalizada' ? 'bg-blue-100 text-blue-800' : 
                                obra.estado === 'Garantía' ? 'bg-yellow-100 text-yellow-800' : 
                                obra.estado === 'Cerrada' ? 'bg-gray-100 text-gray-800' : 
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {obra.estado || '-'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No hay obras asignadas
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
                <button
                  type="button"
                  onClick={() => {
                    closeModal();
                    setModalOpen(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para seleccionar obras en móvil */}
      {obrasModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center p-4 z-50 md:hidden">
          <div className="bg-white rounded-t-xl shadow-xl w-full max-h-[80vh] flex flex-col">
            {/* Header del modal */}
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Seleccionar Obras ({formData.obras_asignadas.length} seleccionadas)
              </h3>
              <button
                onClick={() => setObrasModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Barra de búsqueda */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar obras por nombre, número o cliente..."
                  value={obrasSearchTerm}
                  onChange={(e) => setObrasSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Lista de obras */}
            <div className="flex-1 overflow-y-auto">
              {filteredObras.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No se encontraron obras
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredObras.map((obra) => {
                    const isSelected = formData.obras_asignadas.includes(obra.id.toString());
                    return (
                      <div
                        key={obra.id}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleObraToggle(obra.id)}
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleObraToggle(obra.id)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {obra.nombre_obra}
                            </div>
                            <div className="text-sm text-gray-500">
                              Nº: {obra.numero_obra || '-'} | Cliente: {obra.cliente || '-'}
                            </div>
                            <div className="mt-1">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                obra.estado === 'En Curso' ? 'bg-green-100 text-green-800' : 
                                obra.estado === 'Finalizada' ? 'bg-blue-100 text-blue-800' : 
                                obra.estado === 'Garantía' ? 'bg-yellow-100 text-yellow-800' : 
                                obra.estado === 'Cerrada' ? 'bg-gray-100 text-gray-800' : 
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {obra.estado || '-'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setObrasModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, obras_asignadas: [] }));
                    setObrasModalOpen(false);
                  }}
                  className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
