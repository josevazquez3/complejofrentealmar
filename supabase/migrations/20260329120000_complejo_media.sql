-- Carrusel hero, bloque Inicio y unidades de marketing + bucket complejo-media

-- Carrusel
CREATE TABLE IF NOT EXISTS carousel_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  orden INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carousel_images_orden ON carousel_images (orden ASC);

-- Inicio (singleton lógico: una fila)
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

-- Unidades de marketing (sección pública)
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

-- Lectura pública carrusel e inicio
CREATE POLICY "carousel_select_public" ON carousel_images FOR SELECT USING (true);
CREATE POLICY "inicio_select_public" ON inicio_config FOR SELECT USING (true);

-- Unidades: público solo habilitadas; autenticados ven todas
CREATE POLICY "unidades_select_public" ON unidades FOR SELECT USING (habilitada = TRUE);
CREATE POLICY "unidades_select_auth" ON unidades FOR SELECT TO authenticated USING (true);

-- Escritura solo autenticados
CREATE POLICY "carousel_insert_auth" ON carousel_images FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "carousel_update_auth" ON carousel_images FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "carousel_delete_auth" ON carousel_images FOR DELETE TO authenticated USING (true);

CREATE POLICY "inicio_insert_auth" ON inicio_config FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "inicio_update_auth" ON inicio_config FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "inicio_delete_auth" ON inicio_config FOR DELETE TO authenticated USING (true);

CREATE POLICY "unidades_insert_auth" ON unidades FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "unidades_update_auth" ON unidades FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "unidades_delete_auth" ON unidades FOR DELETE TO authenticated USING (true);

-- Bucket público complejo-media
INSERT INTO storage.buckets (id, name, public)
VALUES ('complejo-media', 'complejo-media', true)
ON CONFLICT (id) DO NOTHING;

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
