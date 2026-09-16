# Publicar Eurban en Render

## 1. Subir el proyecto a GitHub

Crea un repositorio y sube la carpeta `tienda` junto con `render.yaml`.
No subas `.env` ni contrasenas.

## 2. Crear la base de datos MySQL

Usa un proveedor MySQL externo y crea una base llamada `eurban_db`. Ejecuta `database.sql` para crear la tabla `productos`.

Guarda estos datos del proveedor:

- Host
- Puerto
- Usuario
- Contrasena
- Nombre de base de datos

## 3. Crear el servicio web

1. Entra a Render y selecciona **New > Blueprint**.
2. Conecta el repositorio de GitHub.
3. Render detectara `render.yaml`.
4. En las variables `DB_HOST`, `DB_USER` y `DB_PASSWORD`, introduce los datos de MySQL.
5. Define `ADMIN_PASSWORD` con una contraseña larga y única de al menos 12 caracteres.
6. Define `NODE_ENV=production` para activar cookies seguras.
7. Pulsa **Apply**.

Render instalara las dependencias y ejecutara `npm start` dentro de `tienda/backend`.

## 4. Abrir la tienda

Render entregara una URL similar a:

`https://eurban-store.onrender.com/index.html`

El panel quedara en:

`https://eurban-store.onrender.com/login-admin.html`

La pagina y la API se sirven desde el mismo dominio, por lo que el catalogo puede cargar las imagenes guardadas en MySQL.
