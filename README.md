# complejofrentealmar

Sitio y backoffice del complejo **Frente al Mar** (Costa Atlántica, Argentina).

- **Next.js 14** (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Neon** (PostgreSQL) + **Prisma** para datos
- **NextAuth** (credenciales) para el panel admin
- **Vercel Blob** para archivos e imágenes

Variables de entorno: copiá `.env.example` a `.env.local` y completá `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (local), `BLOB_READ_WRITE_TOKEN` y las públicas que uses.

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

El esquema está en `prisma/schema.prisma`. Para alinear la base en Neon:

```bash
npx prisma generate
npx prisma db push
```

O usá migraciones versionadas con `prisma migrate` según tu flujo de despliegue.
