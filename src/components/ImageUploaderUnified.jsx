import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

/**
 * COMPONENTE UNIFICADO DE IMÁGENES
 * Funciona en TODOS los viewports usando CSS responsive
 * NO hay montaje/desmontaje al cambiar viewport
 */
function ImageUploaderUnified({ onImageUpload, onRemoveImage, images = [], parteId, readOnly = false, isTemporary = false }) {
  const [uploading, setUploading] = useState(false)

  // Log para debugging
  useEffect(() => {
    console.log('[ImageUploaderUnified] Props cambió:', { 
      imagesLength: images.length, 
      parteId,
      images: images 
    })
  }, [images.length, parteId])

  // Función para comprimir imagen
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1920;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Error al comprimir la imagen'));
              }
            },
            'image/jpeg',
            0.8
          );
        };
        img.onerror = () => reject(new Error('Error al cargar la imagen'));
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
    });
  };

  // Constante para el límite máximo de imágenes
  const MAX_IMAGES = 3;

  const handleFileUpload = async (event) => {
    try {
      setUploading(true)
      const file = event.target.files[0]
      if (!file) return

      // Validar límite de imágenes
      if (images.length >= MAX_IMAGES) {
        toast.error(`Máximo ${MAX_IMAGES} imágenes por parte de trabajo`, {
          duration: 4000,
          icon: '📸'
        });
        return;
      }

      if (!parteId) {
        toast.error('Error: No se puede subir la imagen sin un ID de parte válido');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Por favor selecciona un archivo de imagen válido');
        return;
      }

      const MAX_FILE_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        toast.error('La imagen es demasiado grande. Máximo 10MB');
        return;
      }

      toast.loading('Procesando imagen...');

      const compressedBlob = await compressImage(file);

      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const folder = isTemporary ? 'temp-partes-images' : 'partes-images'
      const filePath = `${folder}/${parteId}/${fileName}`

      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, compressedBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        })

      if (error) {
        toast.dismiss();
        toast.error(`Error al subir la imagen: ${error.message}`);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      toast.dismiss();
      toast.success('Imagen subida correctamente');

      if (onImageUpload) {
        onImageUpload(publicUrl);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(`Error: ${error.message}`);
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  // Calcular imágenes restantes y si se alcanzó el límite
  const remainingImages = MAX_IMAGES - images.length;
  const isLimitReached = images.length >= MAX_IMAGES;
  
  return (
    <div className="image-uploader-unified w-full space-y-3">
      {/* Indicador de total - Mismo estilo que los botones */}
      <div className={`flex items-center justify-center gap-2 w-full px-6 py-3 rounded-lg font-semibold text-base transition-colors text-white ${
        isLimitReached ? 'bg-orange-600' : images.length > 0 ? 'bg-green-600' : 'bg-red-600'
      }`}>
        <span>Imágenes: {images.length} / {MAX_IMAGES}</span>
        {remainingImages > 0 && (
          <span className="text-xs font-normal">
            ({remainingImages} {remainingImages === 1 ? 'restante' : 'restantes'})
          </span>
        )}
        {isLimitReached && (
          <span className="text-xs font-normal">
            ⚠️ Límite alcanzado
          </span>
        )}
      </div>

      {/* Lista de imágenes - Visible solo si hay imágenes */}
      {images.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
          <h3 className="flex items-center gap-2 text-lg font-bold text-blue-700 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            📸 LISTA DE IMÁGENES ({images.length}):
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {images.map((imageUrl, index) => (
              <div key={index} className="bg-white border-2 border-blue-300 rounded-lg p-4">
                <div className="text-sm font-semibold text-blue-700 mb-2">
                  Imagen #{index + 1}
                </div>
                <img
                  src={imageUrl}
                  alt={`Imagen ${index + 1}`}
                  className="w-full h-auto rounded border-2 border-blue-200 mb-3"
                  loading="lazy"
                />
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => onRemoveImage(index)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botones de subida - Proporciones iguales y texto centrado */}
      {!readOnly && (
        <div className="space-y-3">
          <label
            htmlFor="image-upload-camera-unified"
            className={`flex items-center justify-center gap-2 w-full px-6 py-3 rounded-lg font-semibold text-base text-white transition-colors ${
              isLimitReached || uploading
                ? 'bg-gray-400 cursor-not-allowed opacity-60'
                : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{uploading ? 'Subiendo...' : isLimitReached ? 'Límite Alcanzado' : 'Tomar Foto'}</span>
          </label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            disabled={uploading || isLimitReached}
            className="hidden"
            id="image-upload-camera-unified"
          />

          <label
            htmlFor="image-upload-gallery-unified"
            className={`flex items-center justify-center gap-2 w-full px-6 py-3 rounded-lg font-semibold text-base text-white transition-colors ${
              isLimitReached || uploading
                ? 'bg-gray-400 cursor-not-allowed opacity-60'
                : 'bg-purple-600 hover:bg-purple-700 cursor-pointer'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{uploading ? 'Subiendo...' : isLimitReached ? 'Límite Alcanzado' : 'Desde Galería'}</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading || isLimitReached}
            className="hidden"
            id="image-upload-gallery-unified"
          />

          <p className="text-xs text-gray-600 text-center mt-2">
            {isLimitReached ? (
              <span className="text-orange-600 font-semibold">
                ⚠️ Máximo {MAX_IMAGES} imágenes por parte de trabajo
              </span>
            ) : (
              'Toma una foto o selecciona desde tu galería'
            )}
          </p>
        </div>
      )}
    </div>
  )
}

export default ImageUploaderUnified

