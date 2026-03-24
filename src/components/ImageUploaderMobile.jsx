import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

/**
 * COMPONENTE ESPECÍFICO PARA MÓVIL
 * Diseñado para funcionar EXCLUSIVAMENTE en viewports < 768px
 * Sin dependencias de CSS externo - Todo inline para máxima compatibilidad
 */
function ImageUploaderMobile({ onImageUpload, onRemoveImage, images = [], parteId, readOnly = false, isTemporary = false }) {
  const [uploading, setUploading] = useState(false)

  // Constante para el límite máximo de imágenes
  const MAX_IMAGES = 3;

  // Log para debugging
  useEffect(() => {
    console.log('[ImageUploaderMobile] Renderizado con:', { imagesLength: images.length, parteId })
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

  // Estilos inline para MÁXIMA compatibilidad
  const containerStyle = {
    display: 'block',
    width: '100%',
    padding: '16px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    marginBottom: '16px'
  }

  const indicatorStyle = {
    display: 'block',
    width: '100%',
    padding: '16px',
    backgroundColor: isLimitReached ? '#ea580c' : images.length > 0 ? '#16a34a' : '#dc2626',
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: '18px',
    borderRadius: '8px',
    marginBottom: '16px'
  }

  const listContainerStyle = {
    display: images.length > 0 ? 'block' : 'none',
    width: '100%',
    backgroundColor: '#eff6ff',
    border: '2px solid #93c5fd',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px'
  }

  const titleStyle = {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1d4ed8',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }

  const imageCardStyle = {
    display: 'block',
    width: '100%',
    backgroundColor: '#ffffff',
    border: '2px solid #93c5fd',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px'
  }

  const imageStyle = {
    display: 'block',
    width: '100%',
    height: 'auto',
    borderRadius: '4px',
    border: '2px solid #bfdbfe',
    marginBottom: '12px'
  }

  const buttonStyle = {
    display: 'block',
    width: '100%',
    padding: '16px',
    backgroundColor: isLimitReached || uploading ? '#9ca3af' : '#2563eb',
    color: '#ffffff',
    textAlign: 'center',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '16px',
    cursor: isLimitReached || uploading ? 'not-allowed' : 'pointer',
    opacity: isLimitReached || uploading ? 0.6 : 1,
    marginBottom: '12px',
    border: 'none'
  }

  const buttonGalleryStyle = {
    ...buttonStyle,
    backgroundColor: isLimitReached || uploading ? '#9ca3af' : '#7c3aed'
  }

  const deleteButtonStyle = {
    display: 'block',
    width: '100%',
    padding: '12px',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    textAlign: 'center',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    border: 'none'
  }

  return (
    <div style={containerStyle}>
      {/* Indicador de total */}
      <div style={indicatorStyle}>
        <div>IMÁGENES: {images.length} / {MAX_IMAGES}</div>
        {remainingImages > 0 && (
          <div style={{ fontSize: '14px', fontWeight: '400', marginTop: '4px' }}>
            ({remainingImages} {remainingImages === 1 ? 'restante' : 'restantes'})
          </div>
        )}
        {isLimitReached && (
          <div style={{ fontSize: '14px', fontWeight: '400', marginTop: '4px' }}>
            ⚠️ Límite alcanzado
          </div>
        )}
      </div>

      {/* Lista de imágenes */}
      {images.length > 0 && (
        <div style={listContainerStyle}>
          <div style={titleStyle}>
            📸 LISTA DE IMÁGENES ({images.length}):
          </div>

          {images.map((imageUrl, index) => (
            <div key={index} style={imageCardStyle}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1d4ed8', marginBottom: '8px' }}>
                Imagen #{index + 1}
              </div>
              <img
                src={imageUrl}
                alt={`Imagen ${index + 1}`}
                style={imageStyle}
              />
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onRemoveImage(index)}
                  style={deleteButtonStyle}
                >
                  🗑️ Eliminar
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Botones de subida */}
      {!readOnly && (
        <div>
          <label htmlFor="image-upload-camera-mobile" style={buttonStyle}>
            📷 {uploading ? 'Subiendo...' : isLimitReached ? 'Límite Alcanzado' : 'Tomar Foto'}
          </label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            disabled={uploading || isLimitReached}
            style={{ display: 'none' }}
            id="image-upload-camera-mobile"
          />

          <label htmlFor="image-upload-gallery-mobile" style={buttonGalleryStyle}>
            🖼️ {uploading ? 'Subiendo...' : isLimitReached ? 'Límite Alcanzado' : 'Desde Galería'}
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading || isLimitReached}
            style={{ display: 'none' }}
            id="image-upload-gallery-mobile"
          />

          <p style={{ fontSize: '12px', color: isLimitReached ? '#ea580c' : '#6b7280', textAlign: 'center', marginTop: '8px', fontWeight: isLimitReached ? '600' : '400' }}>
            {isLimitReached ? `⚠️ Máximo ${MAX_IMAGES} imágenes por parte de trabajo` : '📸 Puedes tomar una foto directamente o seleccionar desde tu galería'}
          </p>
        </div>
      )}
    </div>
  )
}

export default ImageUploaderMobile
