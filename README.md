# complejofrentealmar

Sitio y backoffice del complejo **Frente al Mar** (Costa Atlántica, Argentina).

- **Next.js 14** (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Supabase**: datos públicos, auth y panel admin (reservas, inventario, tesorería)
- Variables de entorno: copiá `.env.example` a `.env.local` y completá las claves de Supabase

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

## Base de datos

Las migraciones SQL están en `supabase/migrations/`. Revisá `supabase/README.md` para el flujo con Supabase.
