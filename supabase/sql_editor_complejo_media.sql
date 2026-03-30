-- =============================================================================
-- COMPLEJO MEDIA — Ejecutar en Supabase → SQL Editor (una vez por proyecto)
-- =============================================================================
-- Antes:
-- 1) Opcional: Storage → New bucket → nombre: complejo-media → Public ON
--    Si creás el bucket a mano, el INSERT en storage.buckets puede fallar por duplicado: ignorá el error.
-- 2) Las políticas de storage de abajo equivalen a:
--    - Lectura pública
--    - INSERT/UPDATE/DELETE solo usuarios autenticados (misma idea que auth.role() = 'authenticated')
--
-- NO hace falta SUPABASE_SERVICE_ROLE_KEY en .env para estos uploads: el admin usa sesión + RLS.
-- La service_role sigue siendo solo para scripts como npm run create-admin.
-- =============================================================================

-- Extensiones (por si schema.sql no corrió antes)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tablas
CREATE TABLE IF NOT EXISTS carousel_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  orden INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carousel_images_orden ON carousel_images (orden ASC);

CREATE TABLE IF NOT EXISTS inicio_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL DEFAULT '',
  descripcion TEXT NOT NULL DEFAULT '',
  fotos TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO inicio_config (titulo, descripcion, fotos)
SELECT 'INICIO - COMPLEJO FRENTE AL MAR AZUL.', '', ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM inicio_config LIMIT 1);

CREATE TABLE IF NOT EXISTS unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  fotos TEXT[] NOT NULL DEFAULT '{}',
  habilitada BOOLEAN NOT NULL DEFAULT TRUE,
  orden INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_unidades_habilitada_orden ON unidades (habilitada, orden);

ALTER TABLE carousel_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE inicio_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE unidades ENABLE ROW LEVEL SECURITY;

-- RLS tablas (idempotente: borrar y recrear)
DROP POLICY IF EXISTS "carousel_select_public" ON carousel_images;
DROP POLICY IF EXISTS "inicio_select_public" ON inicio_config;
DROP POLICY IF EXISTS "unidades_select_public" ON unidades;
DROP POLICY IF EXISTS "unidades_select_auth" ON unidades;
DROP POLICY IF EXISTS "carousel_insert_auth" ON carousel_images;
DROP POLICY IF EXISTS "carousel_update_auth" ON carousel_images;
DROP POLICY IF EXISTS "carousel_delete_auth" ON carousel_images;
DROP POLICY IF EXISTS "inicio_insert_auth" ON inicio_config;
DROP POLICY IF EXISTS "inicio_update_auth" ON inicio_config;
DROP POLICY IF EXISTS "inicio_delete_auth" ON inicio_config;
DROP POLICY IF EXISTS "unidades_insert_auth" ON unidades;
DROP POLICY IF EXISTS "unidades_update_auth" ON unidades;
DROP POLICY IF EXISTS "unidades_delete_auth" ON unidades;

CREATE POLICY "carousel_select_public" ON carousel_images FOR SELECT USING (true);
CREATE POLICY "inicio_select_public" ON inicio_config FOR SELECT USING (true);
CREATE POLICY "unidades_select_public" ON unidades FOR SELECT USING (habilitada = TRUE);
CREATE POLICY "unidades_select_auth" ON unidades FOR SELECT TO authenticated USING (true);

CREATE POLICY "carousel_insert_auth" ON carousel_images FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "carousel_update_auth" ON carousel_images FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "carousel_delete_auth" ON carousel_images FOR DELETE TO authenticated USING (true);

CREATE POLICY "inicio_insert_auth" ON inicio_config FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "inicio_update_auth" ON inicio_config FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "inicio_delete_auth" ON inicio_config FOR DELETE TO authenticated USING (true);

CREATE POLICY "unidades_insert_auth" ON unidades FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "unidades_update_auth" ON unidades FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "unidades_delete_auth" ON unidades FOR DELETE TO authenticated USING (true);

-- Bucket (si ya existe por UI, ON CONFLICT no actualiza; está bien)
INSERT INTO storage.buckets (id, name, public)
VALUES ('complejo-media', 'complejo-media', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas storage (equivalente a "Public read" + solo autenticados para escribir/borrar)
DROP POLICY IF EXISTS "complejo_media_select_public" ON storage.objects;
DROP POLICY IF EXISTS "complejo_media_insert_auth" ON storage.objects;
DROP POLICY IF EXISTS "complejo_media_update_auth" ON storage.objects;
DROP POLICY IF EXISTS "complejo_media_delete_auth" ON storage.objects;
-- Por si ejecutaste políticas con otros nombres (manual):
DROP POLICY IF EXISTS "Public read" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete" ON storage.objects;

CREATE POLICY "complejo_media_select_public"
ON storage.objects FOR SELECT
USING (bucket_id = 'complejo-media');

CREATE POLICY "complejo_media_insert_auth"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'complejo-media');

CREATE POLICY "complejo_media_update_auth"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'complejo-media');

CREATE POLICY "complejo_media_delete_auth"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'complejo-media');
