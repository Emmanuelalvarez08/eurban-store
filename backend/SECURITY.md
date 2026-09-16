# Seguridad de Eurban

## Ya aplicado en el backend

- Contraseña de admin fuera del código fuente.
- Sesiones aleatorias en memoria con cookie `HttpOnly`, `SameSite=Strict` y `Secure` en producción.
- Rate limiting general y límite estricto para el login.
- Cabeceras de seguridad con Helmet y CSP sin scripts inline.
- CORS desactivado por defecto para orígenes externos.
- Protección de operaciones mutables por sesión y mismo origen.
- Consultas MySQL parametrizadas.
- Validación de nombre, categoría, precio y descripción.
- Límite de 8 MB por imagen.
- Validación del contenido binario de la imagen, no solo de su extensión.
- Solo JPEG, PNG y WebP.
- Errores internos no se devuelven al visitante.
- No se almacenan rutas ni nombres originales de archivos.

## Obligatorio antes de publicar

- Usa HTTPS en Render o en el proveedor elegido.
- Define `NODE_ENV=production`.
- Define `ADMIN_PASSWORD` con al menos 12 caracteres aleatorios y únicos.
- Nunca subas `.env` al repositorio.
- Usa un usuario MySQL exclusivo para Eurban, sin permisos de administración global.
- Activa copias de seguridad de la base de datos.
- Actualiza dependencias con `npm audit` y revisa los cambios antes de desplegar.
- Rota la contraseña de admin si alguien más tuvo acceso al repositorio o al panel.

La sesión se guarda en memoria del proceso. Si el proveedor reinicia el servidor, las sesiones activas se cierran y el administrador debe iniciar sesión de nuevo.
