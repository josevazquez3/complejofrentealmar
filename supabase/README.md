# Supabase — Complejo Frente al Mar

## Orden de ejecución

1. **`schema.sql`** — Crear tablas, RLS, políticas de Storage y bucket `archivos` (ejecutar una vez por proyecto o entorno nuevo).
2. **`seed.sql`** — Datos de demostración: añade columnas `facebook_url` / `instagram_url` si no existen, vacía tablas de negocio y reinserta casas, reservas, inventario y tesorería, y actualiza la fila de `configuracion`.

Ejecutá ambos en el **SQL Editor** de Supabase (pestaña SQL), en ese orden.

## Resetear solo datos demo

Para volver al estado del seed sin reejecutar `schema.sql`:

```sql
TRUNCATE TABLE tesoreria, inventario, reservas, casas CASCADE;
```

Luego volvé a ejecutar desde el `INSERT INTO casas` en adelante en `seed.sql`, o ejecutá el archivo `seed.sql` completo (incluye `TRUNCATE`).

**Nota:** `TRUNCATE` elimina todas las filas de esas tablas. No lo uses en producción con datos reales sin backup.

## Storage

- Carpeta **`fotos/`**: imágenes públicas de casas.
- Carpeta **`comprobantes/`**: archivos privados; el admin usa URLs firmadas.

## Auth

### Opción A — script (recomendado en local)

1. En `.env.local`: `NEXT_PUBLIC_SUPABASE_URL` y **`SUPABASE_SERVICE_ROLE_KEY`** (Settings → API; no la subas a git).
2. Ejecutá: `npm run create-admin`

Por defecto crea:

- **Email:** `admin@complejofrentealmar.local`
- **Contraseña:** `ComplejoMar2026!Admin`

Personalizá con `ADMIN_EMAIL` y `ADMIN_PASSWORD` en el entorno si querés.

### Opción B — a mano

Creá un usuario en **Authentication → Users** e iniciá sesión en `/admin/login`.
