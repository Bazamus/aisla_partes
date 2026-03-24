# Manual de Despliegue en Vercel para Aisla Partes

Este documento proporciona instrucciones detalladas sobre cómo desplegar el proyecto Aisla Partes en la plataforma Vercel, incluyendo la configuración de variables de entorno y archivos protegidos.

## Índice

1. [Requisitos previos](#requisitos-previos)
2. [Preparación del proyecto](#preparación-del-proyecto)
3. [Despliegue en Vercel](#despliegue-en-vercel)
4. [Configuración de variables de entorno](#configuración-de-variables-de-entorno)
5. [Actualización del despliegue](#actualización-del-despliegue)
6. [Solución de problemas comunes](#solución-de-problemas-comunes)

## Requisitos previos

Antes de comenzar, asegúrate de tener:

1. Una cuenta en [Vercel](https://vercel.com/)
2. El repositorio del proyecto en GitHub
3. Node.js y npm instalados en tu máquina local
4. Acceso a las variables de entorno necesarias para el proyecto

## Preparación del proyecto

### 1. Verificar la configuración de Vercel

Asegúrate de que el archivo `vercel.json` esté correctamente configurado en la raíz del proyecto:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### 2. Verificar el archivo `.gitignore`

Confirma que el archivo `.gitignore` incluya las entradas para los archivos de variables de entorno:

```
# Environment variables
.env
.env.local
.env.development
.env.production
```

## Despliegue en Vercel

### 1. Importar el proyecto desde GitHub

1. Inicia sesión en tu cuenta de [Vercel](https://vercel.com/)
2. Haz clic en "Add New" > "Project"
3. Conecta tu cuenta de GitHub si aún no lo has hecho
4. Selecciona el repositorio `aclimar_partes`
5. Haz clic en "Import"

### 2. Configurar el proyecto

En la pantalla de configuración del proyecto:

1. **Framework Preset**: Selecciona "Vite"
2. **Build Command**: Verifica que sea `npm run build` (debería detectarse automáticamente)
3. **Output Directory**: Verifica que sea `dist` (debería detectarse automáticamente)
4. **Install Command**: Deja el valor predeterminado `npm install`

## Configuración de variables de entorno

### 1. Preparar las variables de entorno

Crea un archivo de texto con todas las variables de entorno necesarias para el proyecto. Estas son las variables que normalmente estarían en tu archivo `.env` local:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-de-supabase
VITE_API_URL=https://tu-api-url.com
# Otras variables necesarias
```

### 2. Añadir variables de entorno en Vercel

1. En la configuración de tu proyecto en Vercel, ve a la pestaña "Settings"
2. Desplázate hasta la sección "Environment Variables"
3. Añade cada variable de entorno con su valor correspondiente:
   - **NAME**: Nombre de la variable (ej. `VITE_SUPABASE_URL`)
   - **VALUE**: Valor de la variable
4. Selecciona los entornos donde aplicar esta variable (Production, Preview, Development)
5. Haz clic en "Save" para guardar cada variable

### 3. Variables de entorno por entorno

Puedes configurar diferentes valores para cada entorno:

1. En la sección "Environment Variables", haz clic en "Add New"
2. Ingresa el nombre y valor de la variable
3. Selecciona específicamente los entornos donde debe aplicarse (Production, Preview, o Development)
4. Esto te permite tener, por ejemplo, diferentes URLs de API para producción y desarrollo

## Actualización del despliegue

Vercel se integra con GitHub y despliega automáticamente cuando hay cambios en la rama principal. Sin embargo, también puedes forzar un nuevo despliegue:

### Despliegue automático

1. Realiza cambios en tu código local
2. Haz commit y push a la rama principal (main) en GitHub
3. Vercel detectará los cambios y comenzará un nuevo despliegue automáticamente

### Despliegue manual

1. Ve al dashboard de tu proyecto en Vercel
2. Haz clic en "Deployments" en el menú lateral
3. Haz clic en el botón "Redeploy" en el despliegue que deseas volver a ejecutar
4. O haz clic en "Deploy" > "Deploy" para crear un nuevo despliegue desde la rama actual

## Dominios personalizados

### Añadir un dominio personalizado

1. Ve a la configuración de tu proyecto en Vercel
2. Haz clic en "Domains" en el menú lateral
3. Ingresa tu dominio y haz clic en "Add"
4. Sigue las instrucciones para configurar los registros DNS

## Solución de problemas comunes

### Error en la compilación

Si el despliegue falla durante la compilación:

1. Revisa los logs de compilación en Vercel
2. Asegúrate de que el proyecto se compile correctamente en local con `npm run build`
3. Verifica que todas las dependencias estén correctamente instaladas y listadas en `package.json`

### Variables de entorno no disponibles

Si tu aplicación no puede acceder a las variables de entorno:

1. Asegúrate de que los nombres de las variables en Vercel coincidan exactamente con los que usa tu aplicación
2. Para variables de entorno utilizadas en tiempo de compilación, asegúrate de que estén disponibles durante la fase de construcción
3. Recuerda que en Vite, las variables de entorno accesibles desde el cliente deben comenzar con `VITE_`

### Problemas con rutas en SPA

Si tienes problemas con las rutas en tu aplicación de página única (SPA):

1. Verifica que el archivo `vercel.json` esté correctamente configurado con las reglas de reescritura
2. Asegúrate de que tu router (React Router, Vue Router, etc.) esté configurado correctamente

### Caché de navegador

Si los cambios no aparecen después de un despliegue:

1. Intenta hacer una actualización forzada en tu navegador (Ctrl+F5 o Cmd+Shift+R)
2. Vercel puede mantener en caché algunos recursos; puedes invalidar la caché desde la configuración del proyecto

## Comandos útiles para depuración local

Antes de desplegar, puedes simular el entorno de producción localmente:

```bash
# Construir el proyecto como lo haría Vercel
npm run build

# Servir la versión de producción localmente
npm run preview
```

---

Para más información, consulta la [documentación oficial de Vercel](https://vercel.com/docs) o contacta al administrador del proyecto.
