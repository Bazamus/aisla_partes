/**
 * Script para generar iconos PWA desde la imagen original de Aisla Partes
 * Genera los tamaños requeridos para PWA: 192x192, 512x512, etc.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Verificar que existe el logo original
const logoPath = path.join(__dirname, '../PWA/LOGO.jpg');
const publicDir = path.join(__dirname, '../public');

if (!fs.existsSync(logoPath)) {
  console.error('❌ No se encontró el archivo LOGO.jpg en la carpeta PWA');
  process.exit(1);
}

// Asegurar que existe el directorio public
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('📱 Generando iconos PWA para Aisla Partes...');
console.log('');
console.log('⚠️  NOTA IMPORTANTE:');
console.log('Este script requiere una herramienta externa para redimensionar imágenes.');
console.log('');
console.log('💡 Opciones recomendadas:');
console.log('1. Usar una herramienta online como https://favicon.io/favicon-converter/');
console.log('2. Usar ImageMagick: convert LOGO.jpg -resize 192x192 aisla-192x192.png');
console.log('3. Usar Photoshop, GIMP o cualquier editor de imágenes');
console.log('');
console.log('📋 Iconos necesarios a generar desde PWA/LOGO.jpg:');
console.log('');

const requiredIcons = [
  { size: '192x192', name: 'aisla-192x192.png', desc: 'Icono básico PWA (requerido)' },
  { size: '512x512', name: 'aisla-512x512.png', desc: 'Icono grande PWA (requerido)' },
  { size: '144x144', name: 'aisla-144x144.png', desc: 'Icono para Windows' },
  { size: '152x152', name: 'aisla-152x152.png', desc: 'Icono para iOS' },
  { size: '384x384', name: 'aisla-384x384.png', desc: 'Icono intermedio' },
  { size: '96x96', name: 'aisla-96x96.png', desc: 'Icono pequeño' },
  { size: '72x72', name: 'aisla-72x72.png', desc: 'Icono muy pequeño' },
  { size: '48x48', name: 'favicon.ico', desc: 'Favicon tradicional' },
  { size: '180x180', name: 'apple-touch-icon.png', desc: 'Icono Apple Touch' }
];

requiredIcons.forEach((icon, index) => {
  console.log(`${index + 1}. ${icon.name} (${icon.size}) - ${icon.desc}`);
});

console.log('');
console.log('🎯 Destino: Copiar todos los iconos generados a la carpeta public/');
console.log('');
console.log('✅ Una vez generados los iconos, ejecuta: npm run dev para probar');

// Copiar el logo original a public para referencia
const destLogo = path.join(publicDir, 'aisla-logo-original.jpg');
try {
  fs.copyFileSync(logoPath, destLogo);
  console.log('✅ Logo original copiado a public/aisla-logo-original.jpg');
} catch (error) {
  console.error('❌ Error copiando logo:', error.message);
}

console.log('');
console.log('🔧 Próximos pasos:');
console.log('1. Genera los iconos usando una de las herramientas mencionadas');
console.log('2. Coloca todos los iconos en la carpeta public/');
console.log('3. Verifica que los nombres coincidan exactamente con los listados arriba');
console.log('4. Ejecuta npm run dev para probar la PWA');
