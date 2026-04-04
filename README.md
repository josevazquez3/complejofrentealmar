# complejofrentealmar

Sitio y backoffice del complejo **Frente al Mar** (Costa Atlántica, Argentina).

- **Next.js 14** (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Neon** (PostgreSQL) + **Prisma** para datos
- **NextAuth** (credenciales) para el panel admin
- **Vercel Blob** para archivos e imágenes

Variables de entorno: copiá `.env.example` a `.env.local` y completá `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (local), `BLOB_READ_WRITE_TOKEN` y las públicas que uses.

## Desarrollo

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). Panel admin: `/admin/login`.

## Scripts útiles

- `npm run build` — compilación de producción
- `npm run clean` — borra `.next` y caché (si falla el dev server)
- `npm run dev:clean` — limpia y arranca el dev server
- `npm run create-admin` — crea o actualiza un usuario en la tabla `users` (requiere `DATABASE_URL`)

## Base de datos

El esquema está en `prisma/schema.prisma` y solo usa **`DATABASE_URL`**. Los scripts `db:*` cargan **`.env` y `.env.local`**. Si corrés **`npx prisma` a mano**, Prisma no lee `.env.local`: usá **`npm run db:*`** o un archivo **`.env`** en la raíz con `DATABASE_URL`.

```bash
npx prisma generate
npm run db:push
npm run db:migrate:dev
npm run db:migrate
```

Si `migrate` falla: en `.env.local` tenés que tener **URI reales** `postgresql://...` desde Neon (no líneas con `********`). Guía de formato: `database.env.example` en la raíz del repo.
