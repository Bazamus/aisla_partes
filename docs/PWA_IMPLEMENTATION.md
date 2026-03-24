# Implementación Progressive Web App (PWA) - Aisla Partes

**Fecha:** 20 de octubre de 2025  
**Versión:** 2.0 - Implementación Profesional

---

## 📱 **¿Qué es una PWA?**

Una **Progressive Web App (PWA)** es una aplicación web que utiliza tecnologías modernas para ofrecer una experiencia similar a la de una aplicación nativa:

- ✅ **Instalable** en dispositivos móviles y desktop
- ✅ **Funciona offline** gracias a Service Workers
- ✅ **Actualizaciones automáticas** en segundo plano
- ✅ **Push notifications** (futuro)
- ✅ **Acceso rápido** desde pantalla de inicio
- ✅ **Rendimiento optimizado** con caching estratégico

---

## 🏗️ **Arquitectura PWA de AISLA**

### **1. Configuración Principal (`vite.config.js`)**

```javascript
VitePWA({
  registerType: 'prompt',  // Usuario controla actualizaciones
  manifest: { /* ... */ }, // Configuración de la app
  workbox: { /* ... */ },  // Estrategias de caching
  devOptions: { /* ... */ } // Habilitar PWA en desarrollo
})
```

**Características clave:**
- **registerType: 'prompt'** - Control manual de actualizaciones
- **Workbox** - Caching inteligente con estrategias específicas
- **devOptions** - Testing PWA en desarrollo sin build

### **2. Manifest (`manifest.json`)**

Define los metadatos de la aplicación:

```json
{
  "name": "Aisla Partes de Trabajo",
  "short_name": "AISLA Gestor",
  "theme_color": "#0d9488",
  "background_color": "#ffffff",
  "display": "standalone",
  "icons": [/* 11 tamaños diferentes */]
}
```

**Iconos disponibles:**
- 48x48, 72x72, 96x96, 128x128, 144x144, 152x152
- 192x192, 256x256, 384x384, 512x512
- Iconos `maskable` para Android adaptativo

---

## 🔧 **Componentes PWA**

### **1. InstallPrompt.jsx** ⭐ NUEVO

Componente profesional que informa al usuario sobre la instalación:

**Características:**
- ✅ Diseño adaptado a AISLA (colores corporativos)
- ✅ Delay de 3 segundos para mejor UX
- ✅ Persistencia de decisión del usuario
- ✅ Opciones: "Instalar ahora", "Más tarde", "No volver a mostrar"
- ✅ Lista de beneficios visuales
- ✅ Responsive (móvil y desktop)
- ✅ Animación de entrada suave

**Funcionamiento:**
```
1. Detecta evento `beforeinstallprompt`
2. Espera 3 segundos después de cargar
3. Muestra prompt personalizado
4. Usuario decide: Instalar / Más tarde / No mostrar
5. Guarda decisión en localStorage
```

**UX Profesional:**
- No molesta inmediatamente
- Explica beneficios claramente
- Respeta decisión del usuario
- No se muestra si ya está instalada

### **2. ReloadPrompt.jsx**

Gestiona actualizaciones de la aplicación:

**Características:**
- ✅ Notifica cuando hay nueva versión
- ✅ Botón "Actualizar" para aplicar cambios
- ✅ Notifica cuando app está lista offline
- ✅ Diseño moderno con iconos animados

**Estados:**
- **offlineReady**: App lista para funcionar sin conexión
- **needRefresh**: Nueva versión disponible

### **3. OfflineBanner.jsx**

Banner superior que informa estado offline:

**Características:**
- ✅ Se muestra solo cuando no hay conexión
- ✅ Color ámbar para llamar la atención
- ✅ Mensaje informativo sobre sincronización
- ✅ Hook personalizado `useOnlineStatus`

---

## 💾 **Estrategias de Caching (Workbox)**

### **1. NetworkFirst - API de Supabase**

```javascript
{
  urlPattern: /^https:\/\/jhfyxgzsandolhbufvrb\.supabase\.co\/.*/i,
  handler: 'NetworkFirst',
  options: {
    cacheName: 'supabase-api-cache',
    expiration: {
      maxEntries: 100,
      maxAgeSeconds: 60 * 60 * 24 // 24 horas
    }
  }
}
```

**¿Por qué NetworkFirst?**
- Prioriza datos frescos de la red
- Fallback a cache si no hay conexión
- Ideal para APIs con datos cambiantes
- Cache de 24 horas para emergencias offline

### **2. CacheFirst - Imágenes de Supabase Storage**

```javascript
{
  urlPattern: /^https:\/\/jhfyxgzsandolhbufvrb\.supabase\.co\/storage\/.*/i,
  handler: 'CacheFirst',
  options: {
    cacheName: 'supabase-images-cache',
    expiration: {
      maxEntries: 60,
      maxAgeSeconds: 60 * 60 * 24 * 30 // 30 días
    }
  }
}
```

**¿Por qué CacheFirst?**
- Las imágenes no cambian frecuentemente
- Respuesta instantánea desde cache
- Ahorra ancho de banda móvil
- Cache de 30 días (imágenes son estáticas)

### **3. Precaching Automático**

```javascript
globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,woff,woff2}']
```

**Assets precacheados:**
- Todos los archivos JS, CSS, HTML
- Iconos y logos
- Fuentes web
- Imágenes estáticas

---

## 🚀 **Flujo de Instalación**

```
Usuario abre Aisla Partes por primera vez
           ↓
Service Worker se registra automáticamente
           ↓
Assets se precachean en segundo plano
           ↓
Después de 3 segundos → InstallPrompt aparece
           ↓
Usuario hace clic en "Instalar ahora"
           ↓
Prompt nativo del navegador se muestra
           ↓
Usuario confirma instalación
           ↓
¡App instalada en pantalla de inicio! 🎉
```

---

## 📊 **Beneficios para el Usuario**

### **1. Acceso Rápido**
- Icono en pantalla de inicio
- Sin abrir navegador
- Inicio instantáneo

### **2. Modo Offline**
- Consulta partes sin conexión
- Ve imágenes cacheadas
- Sincroniza cuando hay red

### **3. Experiencia Nativa**
- Pantalla completa (sin barra URL)
- Orientación portrait bloqueada
- Splash screen con colores AISLA

### **4. Actualizaciones Transparentes**
- Sin App Store
- Automáticas en segundo plano
- Notificación cuando hay cambios

---

## 🧪 **Testing de PWA**

### **1. En Desarrollo**

```bash
npm run dev
```

- PWA habilitada gracias a `devOptions.enabled: true`
- Service Worker se registra incluso en localhost
- InstallPrompt se muestra (delay 3s)

### **2. En Producción**

```bash
npm run build
npm run preview
```

- Build genera Service Worker optimizado
- Assets se precachean automáticamente
- Testing de install prompt y offline

### **3. Lighthouse Audit**

En Chrome DevTools:
1. F12 → Pestaña "Lighthouse"
2. Seleccionar "Progressive Web App"
3. Click "Generate report"

**Criterios evaluados:**
- ✅ Manifest válido
- ✅ Service Worker registrado
- ✅ HTTPS (en producción)
- ✅ Iconos correctos
- ✅ Splash screen
- ✅ Orientación
- ✅ Theme color

### **4. Testing en Dispositivos Reales**

**Android Chrome:**
1. Abrir app en Chrome
2. Menú → "Instalar aplicación"
3. Confirmar instalación
4. Verificar icono en home

**iOS Safari:**
1. Abrir app en Safari
2. Botón "Compartir"
3. "Añadir a pantalla de inicio"
4. Verificar icono

---

## 🔒 **Seguridad y Privacidad**

### **Datos en Cache**

- **API responses**: 24 horas máximo
- **Imágenes**: 30 días máximo
- **Assets estáticos**: Hasta nueva versión

### **Storage**

- localStorage para preferencias de instalación
- Service Worker cache para assets
- No se cachean datos sensibles

### **HTTPS Requerido**

- PWA solo funciona en HTTPS
- Vercel proporciona HTTPS automático
- Localhost excluido para desarrollo

---

## 📱 **Navegadores Soportados**

| Navegador | Versión | Soporte PWA | Install Prompt | Offline |
|-----------|---------|-------------|----------------|---------|
| Chrome (Android) | 90+ | ✅ | ✅ | ✅ |
| Edge | 90+ | ✅ | ✅ | ✅ |
| Safari (iOS) | 15+ | ✅ | ⚠️ Manual | ✅ |
| Firefox | 95+ | ✅ | ❌ | ✅ |
| Samsung Internet | 14+ | ✅ | ✅ | ✅ |

**Notas:**
- ⚠️ iOS Safari no soporta `beforeinstallprompt`
- ❌ Firefox no muestra prompt automático aún
- ✅ Funcionalidad offline disponible en todos

---

## 🔄 **Actualización de la App**

### **Flujo de Actualización**

```
Nueva versión desplegada en Vercel
           ↓
Service Worker detecta cambios
           ↓
ReloadPrompt se muestra al usuario
           ↓
Usuario hace clic en "Actualizar"
           ↓
Nueva versión se instala
           ↓
Página se recarga automáticamente
           ↓
¡Usuario tiene última versión! 🎉
```

### **Control del Usuario**

- **registerType: 'prompt'** da control al usuario
- No se fuerza actualización sin permiso
- Usuario decide cuándo actualizar
- Notificación no intrusiva

---

## 🛠️ **Mantenimiento**

### **Actualizar Iconos**

1. Colocar nuevos iconos en `public/icons/`
2. Mantener los 11 tamaños requeridos
3. Actualizar `manifest.json` si cambia ruta
4. Rebuild y deploy

### **Cambiar Colores**

En `vite.config.js`:
```javascript
manifest: {
  theme_color: '#0d9488',      // Color de barra superior
  background_color: '#ffffff'  // Color de splash screen
}
```

### **Modificar Caching**

En `vite.config.js` → `workbox`:
- Añadir nuevos patrones URL
- Cambiar estrategias (NetworkFirst, CacheFirst, etc.)
- Ajustar tiempos de expiración

### **Deshabilitar PWA (temporal)**

```javascript
// vite.config.js
VitePWA({
  registerType: 'prompt',
  injectRegister: false,  // Deshabilitar registro
  // ...
})
```

---

## 📈 **Métricas y Monitoreo**

### **Consola del Navegador**

Logs de PWA:
```
✅ Service Worker registrado
🔄 Aplicación lista para trabajar offline
🆕 Nueva versión disponible
🎯 [InstallPrompt] beforeinstallprompt detectado
👤 [InstallPrompt] Decisión del usuario: accepted
```

### **Chrome DevTools**

**Application Tab:**
- Service Workers activos
- Cache Storage (ver contenido)
- Manifest
- Storage (localStorage, etc.)

**Network Tab:**
- Ver requests desde cache (⚡ icono)
- Ver requests desde red
- Simular offline

---

## ⚠️ **Troubleshooting**

### **PWA no se instala**

1. ✅ Verificar HTTPS (localhost OK)
2. ✅ Verificar manifest.json válido
3. ✅ Verificar iconos 192x192 y 512x512
4. ✅ Service Worker registrado
5. ✅ No hay errores en consola

### **InstallPrompt no aparece**

1. ✅ Usuario ya instaló la app
2. ✅ Usuario rechazó antes (localStorage)
3. ✅ Navegador no soporta `beforeinstallprompt`
4. ✅ App no cumple criterios PWA

### **Offline no funciona**

1. ✅ Service Worker registrado correctamente
2. ✅ Assets precacheados
3. ✅ Estrategias de caching configuradas
4. ✅ No hay errores CORS

### **Actualización no se muestra**

1. ✅ `registerType` es `'prompt'` no `'autoUpdate'`
2. ✅ Nueva versión realmente desplegada
3. ✅ Cache del navegador limpiado
4. ✅ ReloadPrompt incluido en App.jsx

---

## 🎯 **Mejores Prácticas Implementadas**

✅ **registerType: 'prompt'** - Control del usuario  
✅ **Workbox optimizado** - Caching inteligente por tipo  
✅ **InstallPrompt profesional** - UX de clase mundial  
✅ **Delay de 3s** - No molestar inmediatamente  
✅ **Persistencia de decisiones** - Respeto al usuario  
✅ **Iconos completos** - 11 tamaños + maskable  
✅ **Estrategias diferenciadas** - NetworkFirst API, CacheFirst imágenes  
✅ **DevOptions habilitado** - Testing sin build  
✅ **Documentación completa** - Este documento  

---

## 🚀 **Próximas Mejoras**

### **Fase 1 - Implementado ✅**
- [x] Instalación PWA
- [x] Offline básico
- [x] Actualizaciones manuales
- [x] InstallPrompt profesional

### **Fase 2 - Futuro**
- [ ] Push Notifications
- [ ] Background Sync
- [ ] Share API
- [ ] Shortcuts en icono

### **Fase 3 - Avanzado**
- [ ] Periodic Background Sync
- [ ] Badge API
- [ ] Web Share Target
- [ ] File System Access

---

## 📚 **Referencias**

- [vite-plugin-pwa Documentation](https://vite-pwa-org.netlify.app/)
- [Workbox Strategies](https://developer.chrome.com/docs/workbox/modules/workbox-strategies/)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [MDN - PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

---

**Implementación completada:** 20 de octubre de 2025  
**Versión:** 2.0 Profesional  
**Estado:** ✅ Producción Ready

