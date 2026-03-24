import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { 
  Clock, 
  MapPin, 
  Home, 
  CheckCircle, 
  AlertCircle,
  Calculator,
  Edit2
} from 'lucide-react';

const ModalConfirmacionTrabajos = ({ 
  isOpen, 
  onClose, 
  trabajos, 
  portal, 
  vivienda, 
  onConfirmar, 
  procesando 
}) => {
  const [trabajosConHoras, setTrabajosConHoras] = useState([]);
  const [tiempoTotal, setTiempoTotal] = useState(0);
  const [errores, setErrores] = useState({});

  // Inicializar trabajos con horas cuando se abre el modal
  useEffect(() => {
    if (isOpen && trabajos.length > 0) {
      const trabajosIniciales = trabajos.map(trabajo => ({
        ...trabajo,
        tiempo_empleado: 1.0, // Valor por defecto
        observaciones: '',
        tipo_trabajo: 'catalogo',
        cantidad: 1.0
      }));
      setTrabajosConHoras(trabajosIniciales);
    }
  }, [isOpen, trabajos]);

  // Calcular tiempo total cuando cambian las horas
  useEffect(() => {
    const total = trabajosConHoras.reduce((sum, trabajo) => 
      sum + (parseFloat(trabajo.tiempo_empleado) || 0), 0
    );
    setTiempoTotal(total);
  }, [trabajosConHoras]);

  const actualizarTrabajo = (index, campo, valor) => {
    setTrabajosConHoras(prev => {
      const nuevos = [...prev];
      nuevos[index] = { ...nuevos[index], [campo]: valor };
      return nuevos;
    });

    // Limpiar error si existe
    if (errores[`${index}_${campo}`]) {
      setErrores(prev => {
        const nuevos = { ...prev };
        delete nuevos[`${index}_${campo}`];
        return nuevos;
      });
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {};
    let esValido = true;

    trabajosConHoras.forEach((trabajo, index) => {
      // Validar tiempo empleado
      const tiempo = parseFloat(trabajo.tiempo_empleado);
      if (isNaN(tiempo) || tiempo <= 0) {
        nuevosErrores[`${index}_tiempo_empleado`] = 'El tiempo debe ser mayor que 0';
        esValido = false;
      }

      // Validar cantidad
      const cantidad = parseFloat(trabajo.cantidad);
      if (isNaN(cantidad) || cantidad <= 0) {
        nuevosErrores[`${index}_cantidad`] = 'La cantidad debe ser mayor que 0';
        esValido = false;
      }
    });

    setErrores(nuevosErrores);
    return esValido;
  };

  const handleConfirmar = () => {
    if (validarFormulario()) {
      onConfirmar(trabajosConHoras);
    }
  };

  const handleClose = () => {
    onClose();
    setTrabajosConHoras([]);
    setTiempoTotal(0);
    setErrores({});
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>Confirmar Trabajos</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información de ubicación */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Portal: {portal}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Home className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-900">Vivienda: {vivienda}</span>
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-gray-600" />
              <span className="font-medium">Resumen:</span>
              <span>{trabajosConHoras.length} trabajos</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">
                Total: {tiempoTotal.toFixed(1)} horas
              </span>
            </div>
          </div>

          {/* Lista de trabajos para confirmar */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Especificar Horas por Trabajo</h3>
            
            <div className="space-y-3">
              {trabajosConHoras.map((trabajo, index) => (
                <div key={trabajo.id} className="border rounded-lg p-4 space-y-3">
                  {/* Información del trabajo */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{trabajo.trabajo}</h4>
                      <div className="flex items-center space-x-4 text-xs text-gray-600 mt-1">
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
                    </div>
                    
                    {trabajo.precio_personalizado && (
                      <Badge variant="outline" className="text-xs">
                        Precio personalizado
                      </Badge>
                    )}
                  </div>

                  {/* Campos de entrada */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Tiempo empleado */}
                    <div className="space-y-2">
                      <Label htmlFor={`tiempo_${index}`} className="flex items-center space-x-2">
                        <Clock className="h-3 w-3" />
                        <span>Horas *</span>
                      </Label>
                      <Input
                        id={`tiempo_${index}`}
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={trabajo.tiempo_empleado}
                        onChange={(e) => actualizarTrabajo(index, 'tiempo_empleado', e.target.value)}
                        className={errores[`${index}_tiempo_empleado`] ? 'border-red-500' : ''}
                        disabled={procesando}
                      />
                      {errores[`${index}_tiempo_empleado`] && (
                        <p className="text-xs text-red-600 flex items-center space-x-1">
                          <AlertCircle className="h-3 w-3" />
                          <span>{errores[`${index}_tiempo_empleado`]}</span>
                        </p>
                      )}
                    </div>

                    {/* Cantidad */}
                    <div className="space-y-2">
                      <Label htmlFor={`cantidad_${index}`} className="flex items-center space-x-2">
                        <Calculator className="h-3 w-3" />
                        <span>Cantidad</span>
                      </Label>
                      <Input
                        id={`cantidad_${index}`}
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={trabajo.cantidad}
                        onChange={(e) => actualizarTrabajo(index, 'cantidad', e.target.value)}
                        className={errores[`${index}_cantidad`] ? 'border-red-500' : ''}
                        disabled={procesando}
                      />
                      {errores[`${index}_cantidad`] && (
                        <p className="text-xs text-red-600 flex items-center space-x-1">
                          <AlertCircle className="h-3 w-3" />
                          <span>{errores[`${index}_cantidad`]}</span>
                        </p>
                      )}
                    </div>

                    {/* Observaciones */}
                    <div className="space-y-2">
                      <Label htmlFor={`obs_${index}`} className="flex items-center space-x-2">
                        <Edit2 className="h-3 w-3" />
                        <span>Observaciones</span>
                      </Label>
                      <Input
                        id={`obs_${index}`}
                        placeholder="Opcional..."
                        value={trabajo.observaciones}
                        onChange={(e) => actualizarTrabajo(index, 'observaciones', e.target.value)}
                        disabled={procesando}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Botones */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose} disabled={procesando}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmar}
              disabled={procesando || tiempoTotal === 0}
              className="flex items-center space-x-2"
            >
              {procesando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Confirmar {trabajosConHoras.length} Trabajos</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalConfirmacionTrabajos;
