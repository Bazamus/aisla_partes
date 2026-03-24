import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Badge } from '../../ui/badge';
import { 
  Clock, 
  MapPin, 
  Home, 
  Edit2, 
  Save,
  AlertCircle,
  Calculator
} from 'lucide-react';

const ModalEditarTrabajo = ({ isOpen, onClose, trabajo, onGuardar }) => {
  const [formData, setFormData] = useState({
    tiempo_empleado: '',
    cantidad: '',
    observaciones: '',
    portal: '',
    vivienda: ''
  });
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  // Inicializar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen && trabajo) {
      setFormData({
        tiempo_empleado: trabajo.tiempo_empleado || '',
        cantidad: trabajo.cantidad || 1,
        observaciones: trabajo.observaciones || '',
        portal: trabajo.portal || '',
        vivienda: trabajo.vivienda || ''
      });
      setErrores({});
    }
  }, [isOpen, trabajo]);

  const handleChange = (campo, valor) => {
    setFormData(prev => ({
      ...prev,
      [campo]: valor
    }));

    // Limpiar error si existe
    if (errores[campo]) {
      setErrores(prev => {
        const nuevos = { ...prev };
        delete nuevos[campo];
        return nuevos;
      });
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {};
    let esValido = true;

    // Validar tiempo empleado
    const tiempo = parseFloat(formData.tiempo_empleado);
    if (isNaN(tiempo) || tiempo <= 0) {
      nuevosErrores.tiempo_empleado = 'El tiempo debe ser mayor que 0';
      esValido = false;
    }

    // Validar cantidad
    const cantidad = parseFloat(formData.cantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      nuevosErrores.cantidad = 'La cantidad debe ser mayor que 0';
      esValido = false;
    }

    // Validar portal y vivienda para trabajos de catálogo
    if (trabajo?.tipo_trabajo === 'catalogo') {
      if (!formData.portal.trim()) {
        nuevosErrores.portal = 'Portal es obligatorio para trabajos del catálogo';
        esValido = false;
      }
      if (!formData.vivienda.trim()) {
        nuevosErrores.vivienda = 'Vivienda es obligatoria para trabajos del catálogo';
        esValido = false;
      }
    }

    setErrores(nuevosErrores);
    return esValido;
  };

  const handleGuardar = async () => {
    if (!validarFormulario()) {
      return;
    }

    setGuardando(true);
    try {
      const trabajoActualizado = {
        ...trabajo,
        ...formData,
        tiempo_empleado: parseFloat(formData.tiempo_empleado),
        cantidad: parseFloat(formData.cantidad)
      };

      await onGuardar(trabajoActualizado);
      handleClose();
    } catch (error) {
      console.error('Error guardando trabajo:', error);
    } finally {
      setGuardando(false);
    }
  };

  const handleClose = () => {
    onClose();
    setFormData({
      tiempo_empleado: '',
      cantidad: '',
      observaciones: '',
      portal: '',
      vivienda: ''
    });
    setErrores({});
  };

  if (!isOpen || !trabajo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit2 className="h-5 w-5" />
            <span>Editar Trabajo</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del trabajo */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium">{trabajo.descripcion}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                  {trabajo.grupo_nombre && (
                    <>
                      <span>{trabajo.grupo_nombre}</span>
                      {trabajo.subgrupo_nombre && (
                        <>
                          <span>•</span>
                          <span>{trabajo.subgrupo_nombre}</span>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant={trabajo.tipo_trabajo === 'manual' ? 'outline' : 'default'}>
                  {trabajo.tipo_trabajo === 'manual' ? 'Manual' : 'Catálogo'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Formulario de edición */}
          <div className="space-y-4">
            {/* Tiempo empleado y cantidad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tiempo_empleado" className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Horas Empleadas *</span>
                </Label>
                <Input
                  id="tiempo_empleado"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.tiempo_empleado}
                  onChange={(e) => handleChange('tiempo_empleado', e.target.value)}
                  className={errores.tiempo_empleado ? 'border-red-500' : ''}
                  disabled={guardando}
                />
                {errores.tiempo_empleado && (
                  <p className="text-xs text-red-600 flex items-center space-x-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errores.tiempo_empleado}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cantidad" className="flex items-center space-x-2">
                  <Calculator className="h-4 w-4" />
                  <span>Cantidad *</span>
                </Label>
                <Input
                  id="cantidad"
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={formData.cantidad}
                  onChange={(e) => handleChange('cantidad', e.target.value)}
                  className={errores.cantidad ? 'border-red-500' : ''}
                  disabled={guardando}
                />
                {errores.cantidad && (
                  <p className="text-xs text-red-600 flex items-center space-x-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errores.cantidad}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Portal y vivienda (solo para trabajos de catálogo) */}
            {trabajo.tipo_trabajo === 'catalogo' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="portal" className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>Portal *</span>
                  </Label>
                  <Input
                    id="portal"
                    value={formData.portal}
                    onChange={(e) => handleChange('portal', e.target.value)}
                    placeholder="Ej: Portal 1, Portal A"
                    className={errores.portal ? 'border-red-500' : ''}
                    disabled={guardando}
                  />
                  {errores.portal && (
                    <p className="text-xs text-red-600 flex items-center space-x-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errores.portal}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vivienda" className="flex items-center space-x-2">
                    <Home className="h-4 w-4" />
                    <span>Vivienda *</span>
                  </Label>
                  <Input
                    id="vivienda"
                    value={formData.vivienda}
                    onChange={(e) => handleChange('vivienda', e.target.value)}
                    placeholder="Ej: 1ºA, 2ºB, Bajo C"
                    className={errores.vivienda ? 'border-red-500' : ''}
                    disabled={guardando}
                  />
                  {errores.vivienda && (
                    <p className="text-xs text-red-600 flex items-center space-x-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{errores.vivienda}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Observaciones */}
            <div className="space-y-2">
              <Label htmlFor="observaciones" className="flex items-center space-x-2">
                <Edit2 className="h-4 w-4" />
                <span>Observaciones</span>
              </Label>
              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) => handleChange('observaciones', e.target.value)}
                placeholder="Observaciones adicionales (opcional)..."
                rows={3}
                disabled={guardando}
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={guardando}>
              Cancelar
            </Button>
            <Button 
              onClick={handleGuardar}
              disabled={guardando}
              className="flex items-center space-x-2"
            >
              {guardando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalEditarTrabajo;
