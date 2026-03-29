-- Complejo Frente al Mar — esquema PostgreSQL + RLS + Storage
-- Ejecutar en Supabase SQL Editor (orden sugerido: tablas → RLS → storage)

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configuración del sitio (texto editable desde admin)
CREATE TABLE IF NOT EXISTS configuracion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complejo_nombre TEXT NOT NULL DEFAULT 'Frente al Mar',
  tagline TEXT DEFAULT 'Exclusividad frente al mar',
  descripcion_home TEXT,
  ubicacion_direccion TEXT,
  mapa_query TEXT DEFAULT 'Mar del Plata, Buenos Aires, Argentina',
  whatsapp_e164 TEXT DEFAULT '5492235551234',
  email_contacto TEXT DEFAULT 'hola@frentealmar.com',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO configuracion (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM configuracion LIMIT 1);

-- Casas
CREATE TABLE IF NOT EXISTS casas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  capacidad_personas INT NOT NULL,
  fotos TEXT[],
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reservas
CREATE TABLE IF NOT EXISTS reservas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  casa_id UUID REFERENCES casas(id) ON DELETE CASCADE,
  fecha_desde DATE NOT NULL,
  fecha_hasta DATE NOT NULL,
  cant_personas INT NOT NULL,
  mascotas INT DEFAULT 0,
  comprobante_url TEXT,
  saldo_reserva NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventario
CREATE TABLE IF NOT EXISTS inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  casa_id UUID REFERENCES casas(id) ON DELETE CASCADE,
  elemento TEXT NOT NULL,
  descripcion TEXT,
  cantidad INT DEFAULT 1,
  estado TEXT CHECK (estado IN ('Bueno', 'Roto', 'Faltante', 'Baja')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tesorería
CREATE TABLE IF NOT EXISTS tesoreria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  casa_id UUID REFERENCES casas(id),
  reserva_id UUID REFERENCES reservas(id),
  diferencia NUMERIC(10,2),
  comprobante_url TEXT,
  saldo NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE casas ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE tesoreria ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

-- Casas: lectura pública; escritura solo autenticados
CREATE POLICY "casas_select_public" ON casas FOR SELECT USING (true);
CREATE POLICY "casas_insert_auth" ON casas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "casas_update_auth" ON casas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "casas_delete_auth" ON casas FOR DELETE TO authenticated USING (true);

-- Reservas: solo autenticados
CREATE POLICY "reservas_select_auth" ON reservas FOR SELECT TO authenticated USING (true);
CREATE POLICY "reservas_insert_auth" ON reservas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "reservas_update_auth" ON reservas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "reservas_delete_auth" ON reservas FOR DELETE TO authenticated USING (true);

-- Inventario: lectura pública; escritura autenticados
CREATE POLICY "inventario_select_public" ON inventario FOR SELECT USING (true);
CREATE POLICY "inventario_insert_auth" ON inventario FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "inventario_update_auth" ON inventario FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "inventario_delete_auth" ON inventario FOR DELETE TO authenticated USING (true);

-- Tesorería: solo autenticados
CREATE POLICY "tesoreria_select_auth" ON tesoreria FOR SELECT TO authenticated USING (true);
CREATE POLICY "tesoreria_insert_auth" ON tesoreria FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tesoreria_update_auth" ON tesoreria FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tesoreria_delete_auth" ON tesoreria FOR DELETE TO authenticated USING (true);

-- Configuración: lectura pública (home); actualización autenticados
CREATE POLICY "config_select_public" ON configuracion FOR SELECT USING (true);
CREATE POLICY "config_update_auth" ON configuracion FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "config_insert_auth" ON configuracion FOR INSERT TO authenticated WITH CHECK (true);

-- Bucket Storage (crear también desde Dashboard si hace falta)
INSERT INTO storage.buckets (id, name, public)
VALUES ('archivos', 'archivos', true)
ON CONFLICT (id) DO NOTHING;

-- Fotos públicas bajo carpeta fotos/
CREATE POLICY "storage_fotos_select_public"
ON storage.objects FOR SELECT
USING (bucket_id = 'archivos' AND (storage.foldername(name))[1] = 'fotos');

-- Comprobantes: solo usuarios autenticados
CREATE POLICY "storage_comprobantes_select_auth"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'archivos'
  AND (storage.foldername(name))[1] = 'comprobantes'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "storage_comprobantes_insert_auth"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'archivos' AND (storage.foldername(name))[1] = 'comprobantes');

CREATE POLICY "storage_comprobantes_update_auth"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'archivos' AND (storage.foldername(name))[1] = 'comprobantes');

CREATE POLICY "storage_comprobantes_delete_auth"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'archivos' AND (storage.foldername(name))[1] = 'comprobantes');

CREATE POLICY "storage_fotos_insert_auth"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'archivos' AND (storage.foldername(name))[1] = 'fotos');

CREATE POLICY "storage_fotos_update_auth"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'archivos' AND (storage.foldername(name))[1] = 'fotos');

CREATE POLICY "storage_fotos_delete_auth"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'archivos' AND (storage.foldername(name))[1] = 'fotos');
