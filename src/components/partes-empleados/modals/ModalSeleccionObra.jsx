import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Building, Search, MapPin, Calendar } from 'lucide-react';

const ModalSeleccionObra = ({ isOpen, onClose, obras, onSeleccionar }) => {
  const [busqueda, setBusqueda] = useState('');
  const [obraSeleccionada, setObraSeleccionada] = useState(null);

  const obrasFiltradas = obras.filter(obra =>
    obra.nombre_obra.toLowerCase().includes(busqueda.toLowerCase()) ||
    obra.direccion.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleSeleccionar = () => {
    if (obraSeleccionada) {
      onSeleccionar(obraSeleccionada);
      onClose();
      setObraSeleccionada(null);
      setBusqueda('');
    }
  };

  const handleClose = () => {
    onClose();
    setObraSeleccionada(null);
    setBusqueda('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Seleccionar Obra</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre de obra o dirección..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Lista de obras */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {obrasFiltradas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No se encontraron obras</p>
                <p className="text-sm">Intenta con otros términos de búsqueda</p>
              </div>
            ) : (
              obrasFiltradas.map((obra) => (
                <div
                  key={obra.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    obraSeleccionada?.id === obra.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setObraSeleccionada(obra)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Building className="h-4 w-4 text-blue-600" />
                        <h3 className="font-medium">{obra.nombre_obra}</h3>
                        <Badge 
                          variant={obra.estado === 'activa' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {obra.estado}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                        <MapPin className="h-3 w-3" />
                        <span>{obra.direccion}</span>
                      </div>
                      
                      {obra.fecha_inicio && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="h-3 w-3" />
                          <span>Inicio: {new Date(obra.fecha_inicio).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {obra.descripcion && (
                        <p className="text-sm text-gray-600 mt-2">{obra.descripcion}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSeleccionar}
              disabled={!obraSeleccionada}
            >
              Seleccionar Obra
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalSeleccionObra;
