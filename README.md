
# Beatpass Frontend SPA (React)

Este proyecto es una Aplicación de Página Única (SPA) desarrollada con **React** que consume la API RESTful de **Beatpass**. Proporciona las interfaces de usuario para los paneles de Administrador y Promotor, así como las vistas públicas para la nominación de entradas.

## Características

- **Autenticación Segura**: Login que obtiene un token JWT desde la API y lo almacena de forma segura.
- **Contexto de Autenticación**: Usa `AuthContext` de React para gestionar usuario, rol y token globalmente.
- **Rutas Protegidas**: Acceso restringido según rol (ADMIN o PROMOTOR).
- **Forzar Cambio de Contraseña**: Redirección automática al cambio de contraseña tras primer login.

## Panel de Administrador (`/admin`)

- **Gestión de Usuarios**: Crear, listar, editar y activar/desactivar PROMOTOR y CAJERO.
- **Gestión de Festivales**: Crear, listar y cambiar estado de festivales.
- **Gestión de Clientes**: Ver y buscar compradores y asistentes.

## Panel de Promotor (`/promotor`)

- **Dashboard Principal**: Lista de festivales del promotor.
- **Gestión de Festivales**: Crear y editar festivales propios.
- **Gestión de Tipos de Entrada**: Crear, editar y eliminar tipos por festival (precio, stock, nominación).
- **Gestión de Entradas y Pulseras**:
  - **Nominación**: Asignar entrada a asistente.
  - **Pulseras NFC**: Asociar pulsera a entrada.
- **Reportes**:
  - **Asistentes**: Listado por festival.
  - **Compras**: Listado de compras por festival.

## Vistas Públicas

- **Nominación de Entradas** (`/public/nominar-entrada/:qr`): Página pública para nominar una entrada mediante su código QR.

## Tecnologías Utilizadas

- **Framework**: React.js
- **Enrutamiento**: React Router DOM
- **Estilos**: Tailwind CSS
- **Comunicación con API**: Fetch API (nativo del navegador)

## Configuración y Puesta en Marcha Local

### Prerrequisitos

- Node.js y npm (o yarn)
- Backend de Beatpass en ejecución

### Pasos

1. **Clonar el repositorio**:

```bash
git clone https://github.com/EduOlalde/DAW2-TFG-Beatpass.git
cd DAW2-TFG-Beatpass
```

2. **Instalar dependencias**:

```bash
npm install
```

3. **Configurar variables de entorno**:

Crear archivo `.env.development` en la raíz y añadir:

```
REACT_APP_API_URL=http://localhost:8080/api
```

4. **Ejecutar la aplicación**:

```bash
npm start
```

La aplicación se abrirá automáticamente en `http://localhost:3000`.

## Despliegue

Este proyecto está preparado para desplegarse en **GitHub Pages**, **Vercel** o **Netlify**.

Para generar una versión de producción:

```bash
npm run build
```

Esto generará la carpeta `build` con los archivos listos para desplegar.

## Autor

Eduardo Olalde Cruz
