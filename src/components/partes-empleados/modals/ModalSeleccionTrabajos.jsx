import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Checkbox } from '../../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Search, Users, Filter, CheckCircle } from 'lucide-react';
import { buscarTrabajos } from '../../../services/trabajosService';
import { obtenerSubgrupos } from '../../../services/subgruposService';

const ModalSeleccionTrabajos = ({ isOpen, onClose, grupos, onSeleccionar }) => {
  const [busqueda, setBusqueda] = useState('');
  const [grupoSeleccionado, setGrupoSeleccionado] = useState('');
  const [subgrupoSeleccionado, setSubgrupoSeleccionado] = useState('');
  const [subgrupos, setSubgrupos] = useState([]);
  const [trabajos, setTrabajos] = useState([]);
  const [trabajosSeleccionados, setTrabajosSeleccionados] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar subgrupos cuando cambia el grupo
  useEffect(() => {
    if (grupoSeleccionado) {
      cargarSubgrupos(grupoSeleccionado);
    } else {
      setSubgrupos([]);
      setSubgrupoSeleccionado('');
    }
  }, [grupoSeleccionado]);

  // Buscar trabajos cuando cambian los filtros
  useEffect(() => {
    if (busqueda.length >= 2 || grupoSeleccionado) {
      buscarTrabajosConFiltros();
    } else {
      setTrabajos([]);
    }
  }, [busqueda, grupoSeleccionado, subgrupoSeleccionado]);

  const cargarSubgrupos = async (grupoId) => {
    try {
      const subgruposData = await obtenerSubgrupos(grupoId);
      setSubgrupos(subgruposData || []);
    } catch (error) {
      console.error('Error cargando subgrupos:', error);
    }
  };

  const buscarTrabajosConFiltros = async () => {
    setLoading(true);
    try {
      const filtros = {
        texto: busqueda,
        grupo_id: grupoSeleccionado || null,
        subgrupo_id: subgrupoSeleccionado || null,
        limite: 50
      };

      const resultados = await buscarTrabajos(filtros);
      setTrabajos(resultados || []);
    } catch (error) {
      console.error('Error buscando trabajos:', error);
      setTrabajos([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleTrabajoSeleccionado = (trabajo) => {
    setTrabajosSeleccionados(prev => {
      const existe = prev.find(t => t.id === trabajo.id);
      if (existe) {
        return prev.filter(t => t.id !== trabajo.id);
      } else {
        return [...prev, trabajo];
      }
    });
  };

  const handleSeleccionar = () => {
    if (trabajosSeleccionados.length > 0) {
      onSeleccionar(trabajosSeleccionados);
      handleClose();
    }
  };

  const handleClose = () => {
    onClose();
    setBusqueda('');
    setGrupoSeleccionado('');
    setSubgrupoSeleccionado('');
    setTrabajos([]);
    setTrabajosSeleccionados([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Seleccionar Trabajos</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda por texto */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar trabajos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Selector de grupo */}
            <Select value={grupoSeleccionado} onValueChange={setGrupoSeleccionado}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los grupos</SelectItem>
                {grupos.map((grupo) => (
                  <SelectItem key={grupo.id} value={grupo.id}>
                    {grupo.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Selector de subgrupo */}
            <Select 
              value={subgrupoSeleccionado} 
              onValueChange={setSubgrupoSeleccionado}
              disabled={!grupoSeleccionado}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar subgrupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los subgrupos</SelectItem>
                {subgrupos.map((subgrupo) => (
                  <SelectItem key={subgrupo.id} value={subgrupo.id}>
                    {subgrupo.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contador de seleccionados */}
          {trabajosSeleccionados.length > 0 && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span className="text-blue-900 font-medium">
                {trabajosSeleccionados.length} trabajos seleccionados
              </span>
            </div>
          )}

          {/* Lista de trabajos */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2">Buscando trabajos...</span>
              </div>
            ) : trabajos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron trabajos</p>
                <p className="text-sm">
                  {busqueda.length < 2 && !grupoSeleccionado 
                    ? 'Escribe al menos 2 caracteres o selecciona un grupo'
                    : 'Intenta con otros términos de búsqueda'
                  }
                </p>
              </div>
            ) : (
              trabajos.map((trabajo) => {
                const isSelected = trabajosSeleccionados.some(t => t.id === trabajo.id);
                return (
                  <div
                    key={trabajo.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleTrabajoSeleccionado(trabajo)}
                  >
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleTrabajoSeleccionado(trabajo)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-sm">{trabajo.trabajo}</h3>
                          {trabajo.precio_personalizado && (
                            <Badge variant="outline" className="text-xs">
                              Precio personalizado
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-600">
                          <span>{trabajo.grupo_nombre}</span>
                          {trabajo.subgrupo_nombre && (
                            <>
                              <span>•</span>
                              <span>{trabajo.subgrupo_nombre}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{trabajo.unidad}</span>
                        </div>
                        
                        {trabajo.descripcion && (
                          <p className="text-xs text-gray-600 mt-1">{trabajo.descripcion}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSeleccionar}
              disabled={trabajosSeleccionados.length === 0}
            >
              Continuar con {trabajosSeleccionados.length} trabajos
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalSeleccionTrabajos;
