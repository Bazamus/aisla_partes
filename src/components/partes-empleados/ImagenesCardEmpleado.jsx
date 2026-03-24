import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const ImagenesCardEmpleado = ({ imagenes, setImagenes, readOnly = false }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Debug: Log del estado de imágenes
  console.log('[ImagenesCardEmpleado] Estado actual de imágenes:', imagenes);

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
          const fileName = `empleado/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
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

  const handleDeleteImage = (index) => {
    setImagenes(prev => {
      const nuevasImagenes = [...prev];
      if (nuevasImagenes[index].previewUrl) {
        URL.revokeObjectURL(nuevasImagenes[index].previewUrl);
      }
      nuevasImagenes.splice(index, 1);
      return nuevasImagenes;
    });
  };

  if (readOnly) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Imágenes Adjuntas</h2>
        
        {imagenes && imagenes.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {imagenes.map((imagen, index) => (
              <div key={index} className="relative group">
                <a href={typeof imagen === 'string' ? imagen : imagen.url || imagen.previewUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 shadow-sm">
                    <img
                      src={typeof imagen === 'string' ? imagen : imagen.url || imagen.previewUrl}
                      alt={`Imagen ${index + 1}`}
                      className="h-full w-full object-cover object-center group-hover:opacity-75 transition-opacity duration-300 ease-in-out"
                      loading="lazy"
                    />
                  </div>
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">
            No hay imágenes adjuntas a este parte.
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Imágenes</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subir nuevas imágenes (PNG, JPG, GIF)
        </label>
        <div className="flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-500 transition-colors">
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
                htmlFor="file-upload-empleado"
                className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                tabIndex="0"
                onKeyDown={(e) => e.key === 'Enter' && document.getElementById('file-upload-empleado').click()}
              >
                <span>Seleccionar archivos</span>
                <input
                  id="file-upload-empleado"
                  name="file-upload-empleado"
                  type="file"
                  className="sr-only"
                  multiple
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  aria-label="Subir imágenes para empleado"
                  key={uploading ? 'uploading' : 'ready'}
                />
              </label>
              <p className="pl-1">o arrastrar y soltar</p>
            </div>
            <p className="text-xs text-gray-500">Hasta 10MB por archivo</p>
          </div>
        </div>
      </div>

      {imagenes.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-3">Imágenes actuales</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {imagenes.map((imagen, index) => (
              <div key={index} className="relative group">
                <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 shadow-sm">
                  <img
                    src={imagen.previewUrl || (typeof imagen === 'string' ? imagen : imagen.url)}
                    alt={`Imagen ${index + 1}`}
                    className="h-full w-full object-cover object-center"
                    loading="lazy"
                  />
                  {imagen.uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-lg">
                      <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-white text-xs ml-2">Subiendo...</span>
                    </div>
                  )}
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(index)}
                    className="absolute top-1 right-1 p-1.5 bg-red-600 text-white rounded-full shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-150 ease-in-out opacity-0 group-hover:opacity-100"
                    disabled={imagen.uploading}
                    aria-label={`Eliminar imagen ${index + 1}`}
                  >
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {uploading && <p className="text-sm text-indigo-600 mt-2">Procesando imágenes...</p>}
    </div>
  );
};

export default ImagenesCardEmpleado;
