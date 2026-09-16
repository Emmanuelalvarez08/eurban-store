# Backend de Eurban

Este backend guarda las prendas y sus imagenes en MySQL. Las imagenes se almacenan como `MEDIUMBLOB` y se sirven desde `/api/productos/:id/imagen`.

## Requisitos

- Node.js 18 o superior
- MySQL 8 o superior

## Configuracion

1. Instala Node.js desde https://nodejs.org/.
2. Crea la base de datos ejecutando `database.sql` en MySQL Workbench o con el cliente de MySQL.
3. Copia `.env.example` como `.env` y completa la contrasena de MySQL.
4. En `.env`, define `ADMIN_PASSWORD` con una contrasena larga y unica de al menos 12 caracteres.
5. Abre PowerShell en `tienda/backend` y ejecuta:

```powershell
npm install
npm start
```

6. Abre la tienda desde:

`http://localhost:3001/index.html`

El admin continuara en:

`http://localhost:3001/login-admin.html`

La API publica el catalogo en `GET /api/productos`. El panel usa `POST /api/productos` para subir imagenes y `DELETE /api/productos/:id` para eliminarlas.

No abras los HTML con doble clic cuando quieras usar la base de datos: deben cargarse desde el servidor en `localhost:3001`.
