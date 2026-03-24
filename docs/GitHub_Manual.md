# Manual de GitHub para Aisla Partes

Este documento proporciona instrucciones detalladas sobre cómo gestionar el repositorio de GitHub para el proyecto Aisla Partes.

## Índice

1. [Configuración inicial](#configuración-inicial)
2. [Flujo de trabajo diario](#flujo-de-trabajo-diario)
3. [Gestión de ramas](#gestión-de-ramas)
4. [Resolución de conflictos](#resolución-de-conflictos)
5. [Actualización del repositorio](#actualización-del-repositorio)

## Configuración inicial

### Clonar el repositorio

Para obtener una copia local del proyecto:

```bash
git clone https://github.com/Bazamus/aclimar_partes.git
cd aclimar_partes
```

### Configurar usuario de Git

Configura tu nombre de usuario y correo electrónico para los commits:

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu.email@ejemplo.com"
```

## Flujo de trabajo diario

### 1. Actualizar tu copia local

Antes de comenzar a trabajar, asegúrate de tener la última versión:

```bash
git pull origin main
```

### 2. Crear una rama para tu tarea

Crea una rama específica para la funcionalidad en la que vas a trabajar:

```bash
git checkout -b feature/nombre-de-la-funcionalidad
```

### 3. Realizar cambios

Trabaja en tus archivos y realiza los cambios necesarios.

### 4. Revisar los cambios

Verifica qué archivos has modificado:

```bash
git status
```

### 5. Añadir cambios

Añade los archivos modificados al área de preparación:

```bash
git add .  # Añade todos los archivos modificados
# O añade archivos específicos:
git add ruta/al/archivo
```

### 6. Confirmar cambios

Crea un commit con un mensaje descriptivo:

```bash
git commit -m "Descripción clara de los cambios realizados"
```

### 7. Subir cambios

Sube tu rama al repositorio remoto:

```bash
git push origin feature/nombre-de-la-funcionalidad
```

### 8. Crear Pull Request

1. Ve a [https://github.com/Bazamus/aclimar_partes](https://github.com/Bazamus/aclimar_partes)
2. Haz clic en "Pull Requests" y luego en "New Pull Request"
3. Selecciona tu rama como "compare" y main como "base"
4. Haz clic en "Create Pull Request"
5. Añade un título y descripción detallada
6. Haz clic en "Create Pull Request"

## Gestión de ramas

### Ver todas las ramas

```bash
git branch -a  # Muestra todas las ramas (locales y remotas)
```

### Cambiar de rama

```bash
git checkout nombre-de-la-rama
```

### Eliminar una rama local

```bash
git branch -d nombre-de-la-rama  # Solo si ya ha sido fusionada
git branch -D nombre-de-la-rama  # Forzar eliminación aunque no esté fusionada
```

### Eliminar una rama remota

```bash
git push origin --delete nombre-de-la-rama
```

## Resolución de conflictos

Si Git no puede fusionar automáticamente los cambios, se producirán conflictos que deberás resolver manualmente:

1. Git marcará los archivos con conflictos
2. Abre los archivos y busca las secciones marcadas con `<<<<<<<`, `=======` y `>>>>>>>`
3. Edita el archivo para resolver el conflicto (elige qué cambios mantener)
4. Guarda el archivo
5. Añade el archivo resuelto con `git add ruta/al/archivo`
6. Completa el merge con `git commit`

## Actualización del repositorio

### Actualizar desde el repositorio remoto

```bash
git fetch origin
git pull origin main
```

### Fusionar una rama con main

```bash
git checkout main
git merge nombre-de-la-rama
git push origin main
```

## Buenas prácticas

1. **Commits frecuentes**: Realiza commits pequeños y frecuentes con mensajes descriptivos
2. **Pull antes de Push**: Siempre actualiza tu repositorio local antes de subir cambios
3. **Ramas específicas**: Crea ramas para funcionalidades específicas, no mezcles diferentes características
4. **Mensajes claros**: Escribe mensajes de commit descriptivos que expliquen el "qué" y el "por qué"
5. **No subir archivos sensibles**: Asegúrate de que los archivos con información sensible estén en `.gitignore`

## Comandos útiles adicionales

### Ver historial de commits

```bash
git log
git log --oneline  # Versión resumida
```

### Deshacer cambios no confirmados

```bash
git checkout -- ruta/al/archivo  # Descartar cambios en un archivo
git reset --hard  # Descartar todos los cambios no confirmados (¡cuidado!)
```

### Guardar cambios temporalmente

```bash
git stash  # Guarda cambios sin hacer commit
git stash pop  # Recupera los cambios guardados
```

### Etiquetar versiones

```bash
git tag -a v1.0.0 -m "Versión 1.0.0"
git push origin v1.0.0
```

---

Para cualquier duda o problema con Git o GitHub, consulta la [documentación oficial de Git](https://git-scm.com/doc) o contacta al administrador del repositorio.
