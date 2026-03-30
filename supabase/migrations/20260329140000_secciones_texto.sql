-- Textos editables: Equipamiento y Servicios (sitio público)

CREATE TABLE IF NOT EXISTS secciones_texto (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO secciones_texto (id, titulo, descripcion) VALUES
(
  'equipamiento',
  'EQUIPAMIENTO',
  'Nuestras unidades cuentan con decoración cuidada, cocina equipada, climatización en dormitorios principales, TV, ropa de cama, parrilla individual en terrazas o balcones y espacios pensados para el descanso frente al mar.'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO secciones_texto (id, titulo, descripcion) VALUES
(
  'servicios',
  'SERVICIOS',
  'Servicios de mucama, desayuno en temporada alta, seguridad nocturna, reposeras y atención personalizada para que su estadía sea tranquila durante las cuatro estaciones. Consulte disponibilidad y condiciones según época del año.'
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE secciones_texto ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "secciones_texto_select_public" ON secciones_texto;
DROP POLICY IF EXISTS "secciones_texto_insert_auth" ON secciones_texto;
DROP POLICY IF EXISTS "secciones_texto_update_auth" ON secciones_texto;

CREATE POLICY "secciones_texto_select_public" ON secciones_texto FOR SELECT USING (true);
CREATE POLICY "secciones_texto_insert_auth" ON secciones_texto FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "secciones_texto_update_auth" ON secciones_texto FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
