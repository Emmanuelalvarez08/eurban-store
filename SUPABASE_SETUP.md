# Configuracion gratuita con Supabase

1. Crea un proyecto gratuito en https://supabase.com/.
2. En **SQL Editor**, ejecuta `supabase.sql`.
3. En **Authentication > Users**, crea el usuario que usara el panel admin.
4. Copia la URL del proyecto y la clave publica `anon` desde **Project Settings > API**.
5. Reemplaza los valores de `supabase-config.js`:

```js
window.EURBAN_SUPABASE = {
    url: 'https://tu-proyecto.supabase.co',
    anonKey: 'tu-clave-anon'
};
```

La clave `anon` puede estar en el frontend. La seguridad depende de las politicas RLS incluidas en `supabase.sql`; nunca publiques una `service_role` key.

## Publicar gratis

Sube la carpeta `tienda` a GitHub y activa **Settings > Pages > Deploy from branch > main > / (root)**.

La tienda publica quedara en:

`https://emmanuelalvarez08.github.io/eurban-store/`

El admin quedara en:

`https://emmanuelalvarez08.github.io/eurban-store/login-admin.html`
