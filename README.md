# Redmine API Helpers

Este repositorio contiene scripts de Node.js para trabajar con la API de Redmine.

## Requisitos

- Node.js
- npm

## Instalación

1. Clona el repositorio.
2. Instala dependencias:

```bash
npm install
```

3. Crea un archivo `.env` en la raíz del proyecto con las variables necesarias. Puedes usar `.env.example` como referencia.

### `.env`

```env
API_KEY=tu_api_key
URL=https://redmine.tu-dominio.com
```

- `API_KEY`: la clave de API de Redmine.
- `URL`: la URL base de tu instancia de Redmine.

## Scripts disponibles

### Listar proyectos

```bash
node get-projects.js
```

Muestra los proyectos a los que el usuario autenticado tiene acceso.

### Listar tipos de ticket (trackers)

```bash
node list-trackers.js
```

Muestra los trackers definidos en Redmine.

### Listar miembros de un proyecto

```bash
node list-project-members.js <project_id>
```

Ejemplo:

```bash
node list-project-members.js 123
```

### Crear un ticket de forma interactiva

```bash
node create-issue-interactive.js
```

Este script solicita:

- proyecto
- miembro asignado (opcional)
- tracker
- prioridad (opcional)
- asunto
- descripción (opcional)
- fecha de inicio (opcional)
- fecha de vencimiento (opcional)

## Comportamiento

Todos los scripts usan el archivo `.env` ubicado en la raíz del proyecto y realizan llamadas a la API de Redmine con el encabezado `X-Redmine-API-Key`.

Si faltan `URL` o `API_KEY`, el script terminará con un error.

## Notas

- Asegúrate de que la URL no contenga una barra final en el archivo `.env` o que el script la procese correctamente.
- Si necesitas cambiar la ruta del archivo `.env`, actualiza el `require('dotenv').config({ path: path.resolve(__dirname, '.env') });` en los scripts.
