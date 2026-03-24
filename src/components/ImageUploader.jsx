import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

function ImageUploader({ onImageUpload, onRemoveImage, images = [], parteId, readOnly = false, isTemporary = false }) {
  const [uploading, setUploading] = useState(false)
  const [localImages, setLocalImages] = useState(images)

  // Sincronizar localImages con el prop images cuando cambie
  useEffect(() => {
    console.log('[ImageUploader] Props images cambió:', {
      length: images.length,
      images: images,
      parteId: parteId,
      isTemporary: isTemporary
    })
    setLocalImages(images)
  }, [images, parteId, isTemporary])

  // Log adicional para debugging en móvil
  useEffect(() => {
    console.log('[ImageUploader RENDER] Estado actual:', {
      localImagesLength: localImages.length,
      localImages: localImages,
      propsImagesLength: images.length
    })
  })

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

  const handleFileUpload = async (event) => {
    try {
      setUploading(true)
      const file = event.target.files[0]
      if (!file) return

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

  return (
    <div className="w-full space-y-4" key={`image-uploader-${localImages.length}`}>
      {/* Indicador de total de imágenes */}
      <div className={`w-full p-4 md:p-5 rounded-lg text-center font-bold text-base md:text-lg ${
        localImages.length > 0 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
      }`}>
        TOTAL IMÁGENES: {localImages.length}
      </div>

      {/* Lista de imágenes */}
      {localImages.length > 0 && (
        <div className="w-full bg-blue-50 border-2 border-blue-300 rounded-lg p-4 md:p-6 space-y-4">
          <h3 className="text-lg md:text-xl font-bold text-blue-700 flex items-center gap-2">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            📸 LISTA DE IMÁGENES ({localImages.length}):
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {localImages.map((imageUrl, index) => (
              <div key={index} className="bg-white border-2 border-blue-300 rounded-lg p-3 md:p-4 space-y-3">
                <div className="font-semibold text-sm md:text-base text-blue-700">
                  Imagen #{index + 1}
                </div>
                <img
                  src={imageUrl}
                  alt={`Imagen ${index + 1}`}
                  className="w-full h-auto max-w-full rounded border-2 border-blue-200"
                />
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => onRemoveImage(index)}
                    className="w-full px-4 py-2 md:py-3 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm md:text-base rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botones de subida */}
      {!readOnly && (
        <div className="w-full space-y-3">
          {/* Botón Tomar Foto */}
          <label
            htmlFor="image-upload-camera"
            className={`block w-full px-4 py-4 md:py-3 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg font-semibold text-base md:text-lg cursor-pointer transition-colors duration-200 flex items-center justify-center gap-2 ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {uploading ? 'Subiendo...' : 'Tomar Foto'}
          </label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            id="image-upload-camera"
          />

          {/* Botón Desde Galería */}
          <label
            htmlFor="image-upload-gallery"
            className={`block w-full px-4 py-4 md:py-3 bg-purple-600 hover:bg-purple-700 text-white text-center rounded-lg font-semibold text-base md:text-lg cursor-pointer transition-colors duration-200 flex items-center justify-center gap-2 ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {uploading ? 'Subiendo...' : 'Desde Galería'}
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            id="image-upload-gallery"
          />

          {/* Texto informativo */}
          <p className="text-xs md:text-sm text-gray-600 text-center px-2">
            📸 Puedes tomar una foto directamente o seleccionar desde tu galería
          </p>
        </div>
      )}
    </div>
  )
}

export default ImageUploader
