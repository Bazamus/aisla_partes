import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const ImagenesCard = ({ imagenes, setImagenes, readOnly = false }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Debug: Log del estado de imágenes
  console.log('[ImagenesCard] Estado actual de imágenes:', imagenes);

  // Manejar la subida de imágenes - Optimizado para móviles
  const handleImageUpload = async (e) => {
    console.log('[ImageUpload] Evento onChange disparado');
    console.log('[ImageUpload] Target:', e.target);
    console.log('[ImageUpload] Files:', e.target.files);
    
    // Verificación robusta de archivos para móviles
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) {
      console.warn('[ImageUpload] No hay archivos seleccionados');
      return;
    }

    // Convertir FileList a Array de manera segura
    let files;
    try {
      files = Array.from(fileList);
    } catch (error) {
      console.error('[ImageUpload] Error convirtiendo FileList:', error);
      // Fallback para navegadores que no soportan Array.from
      files = [];
      for (let i = 0; i < fileList.length; i++) {
        files.push(fileList[i]);
      }
    }
    
    console.log('[ImageUpload] Archivos procesados:', files.length);
    
    if (files.length === 0) {
      console.warn('[ImageUpload] No se pudieron procesar los archivos');
      return;
    }

    setUploading(true);
    setError(null);

    // Procesar y subir archivos uno por uno para mayor compatibilidad móvil
    const nuevasImagenes = [];
    let hasErrors = false;
    
    // Validar todos los archivos primero
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`[ImageUpload] Validando archivo ${i + 1}:`, file.name, file.type, file.size);
      
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        console.warn(`[ImageUpload] Archivo ${file.name} no es una imagen válida`);
        setError(`El archivo ${file.name} no es una imagen válida`);
        hasErrors = true;
        continue;
      }
      
      // Validar tamaño (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        console.warn(`[ImageUpload] Archivo ${file.name} es demasiado grande`);
        setError(`El archivo ${file.name} es demasiado grande (máximo 10MB)`);
        hasErrors = true;
        continue;
      }
    }

    if (hasErrors && files.length === 1) {
      setUploading(false);
      return;
    }

    // Subir archivos válidos a Supabase
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Saltar archivos inválidos
        if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
          continue;
        }

        console.log(`[ImageUpload] Subiendo archivo ${i + 1}:`, file.name);
        
        try {
          // Crear URL de previsualización
          const previewUrl = URL.createObjectURL(file);
          
          // Agregar imagen con estado de "subiendo"
          const tempImage = {
            file,
            previewUrl,
            uploading: true,
            name: file.name,
            id: `${Date.now()}_${Math.random().toString(36).slice(2)}` // ID único para identificar la imagen
          };
          
          setImagenes(prev => {
            const newState = [...prev, tempImage];
            console.log('[ImageUpload] Agregando imagen al estado:', tempImage);
            console.log('[ImageUpload] Nuevo estado completo:', newState);
            return newState;
          });
          
          // Generar nombre único para el archivo
          const fileExt = file.name.split('.').pop();
          const fileName = `proveedor/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
          const filePath = `partes-images/${fileName}`;

          console.log(`[ImageUpload] Subiendo a Supabase:`, filePath);

          // Subir archivo a Supabase Storage
          const { data, error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, file);

          if (uploadError) {
            console.error(`[ImageUpload] Error subiendo ${file.name}:`, uploadError);
            throw uploadError;
          }

          // Obtener URL pública
          const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(filePath);

          console.log(`[ImageUpload] URL pública obtenida para ${file.name}:`, publicUrl);

          // Actualizar imagen con URL real y quitar estado de carga
          setImagenes(prev => {
            console.log('[ImageUpload] Estado previo antes de actualizar:', prev);
            const updated = prev.map(img => 
              img.name === file.name && img.uploading 
                ? { 
                    ...img, 
                    url: publicUrl, 
                    uploading: false,
                    // Mantener previewUrl para mostrar la imagen inmediatamente
                    previewUrl: img.previewUrl
                  }
                : img
            );
            console.log('[ImageUpload] Estado actualizado:', updated);
            return updated;
          });

          console.log(`[ImageUpload] Imagen ${file.name} subida exitosamente`);

        } catch (fileError) {
          console.error(`[ImageUpload] Error procesando ${file.name}:`, fileError);
          
          // Remover imagen fallida del estado
          setImagenes(prev => 
            prev.filter(img => !(img.name === file.name && img.uploading))
          );
          
          setError(`Error subiendo ${file.name}: ${fileError.message}`);
        }
      }

      // Mostrar mensaje de éxito si se subió al menos una imagen
      const validFiles = files.filter(f => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024);
      if (validFiles.length > 0) {
        toast.success(`${validFiles.length} imagen(es) subida(s) correctamente`);
      }

    } catch (error) {
      console.error('[ImageUpload] Error general:', error);
      setError('Error general subiendo imágenes');
    } finally {
      setUploading(false);
    }
    
    // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
    setTimeout(() => {
      if (e.target) {
        e.target.value = '';
      }
    }, 100);
  };

  // Eliminar una imagen
  const handleDeleteImage = (index) => {
    setImagenes(prev => {
      const nuevasImagenes = [...prev];
      // Liberar URL de objeto si existe
      if (nuevasImagenes[index].previewUrl) {
        URL.revokeObjectURL(nuevasImagenes[index].previewUrl);
      }
      nuevasImagenes.splice(index, 1);
      return nuevasImagenes;
    });
  };

  // Versión de solo lectura
  if (readOnly) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Imágenes</h2>
        
        {imagenes && imagenes.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {imagenes.map((imagen, index) => (
              <div key={index} className="relative">
                <a href={imagen.url || imagen} target="_blank" rel="noopener noreferrer" className="block">
                  <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200">
                    <img
                      src={imagen.url || imagen}
                      alt={`Imagen ${index + 1}`}
                      className="h-full w-full object-cover object-center hover:opacity-75 transition-opacity"
                    />
                  </div>
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            No hay imágenes adjuntas.
          </div>
        )}
      </div>
    );
  }
  
  // Versión de edición
  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Imágenes</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subir imágenes
        </label>
        <div className="flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
              >
                <span>Subir archivos</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  multiple
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  aria-label="Subir imágenes"
                  key={uploading ? 'uploading' : 'ready'}
                />
              </label>
              <p className="pl-1">o arrastrar y soltar</p>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB</p>
          </div>
        </div>
      </div>

      {imagenes.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-3">Imágenes Subidas ({imagenes.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {imagenes.map((imagen, index) => {
              console.log(`[ImageRender] Renderizando imagen ${index}:`, {
                name: imagen.name,
                url: imagen.url,
                previewUrl: imagen.previewUrl,
                uploading: imagen.uploading
              });
              return (
              <div key={index} className="relative">
                <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200">
                  <img
                    src={imagen.previewUrl || imagen.url}
                    alt={`Imagen ${index + 1}`}
                    className="h-full w-full object-cover object-center"
                  />
                  {imagen.uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteImage(index)}
                  className="absolute top-2 right-2 inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  disabled={imagen.uploading}
                  aria-label="Eliminar imagen"
                >
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImagenesCard;
