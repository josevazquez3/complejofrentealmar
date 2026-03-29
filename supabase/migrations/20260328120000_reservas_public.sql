-- Reservas: columnas públicas, noches generado, RLS, RPC disponibilidad
-- Ejecutar en Supabase SQL Editor o con CLI.

ALTER TABLE reservas ADD COLUMN IF NOT EXISTS nombre TEXT;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS apellido TEXT;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS telefono TEXT;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS mensaje TEXT;

ALTER TABLE reservas ADD COLUMN IF NOT EXISTS estado TEXT;

UPDATE reservas SET estado = 'confirmada' WHERE estado IS NULL;

ALTER TABLE reservas ALTER COLUMN estado SET DEFAULT 'confirmada';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reservas_estado_check'
  ) THEN
    ALTER TABLE reservas ADD CONSTRAINT reservas_estado_check
      CHECK (estado IN ('pendiente', 'confirmada', 'cancelada'));
  END IF;
END $$;

ALTER TABLE reservas ALTER COLUMN estado SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reservas' AND column_name = 'noches'
  ) THEN
    ALTER TABLE reservas ADD COLUMN noches integer
      GENERATED ALWAYS AS (fecha_hasta - fecha_desde) STORED;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_fechas_bloqueadas(p_casa_id uuid)
RETURNS TABLE (fecha_desde date, fecha_hasta date)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.fecha_desde, r.fecha_hasta
  FROM reservas r
  WHERE r.casa_id = p_casa_id
    AND r.estado IN ('pendiente', 'confirmada')
    AND r.fecha_hasta >= (CURRENT_DATE AT TIME ZONE 'UTC')::date;
$$;

REVOKE ALL ON FUNCTION public.get_fechas_bloqueadas(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_fechas_bloqueadas(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_fechas_bloqueadas(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_fechas_bloqueadas(uuid) TO service_role;

CREATE INDEX IF NOT EXISTS reservas_casa_fechas ON reservas (casa_id, fecha_desde, fecha_hasta);

DROP POLICY IF EXISTS "reservas_select_auth" ON reservas;
DROP POLICY IF EXISTS "reservas_insert_auth" ON reservas;
DROP POLICY IF EXISTS "reservas_update_auth" ON reservas;
DROP POLICY IF EXISTS "reservas_delete_auth" ON reservas;
DROP POLICY IF EXISTS "insert_publico" ON reservas;
DROP POLICY IF EXISTS "admin_all" ON reservas;

ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_publico" ON reservas
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "admin_all" ON reservas
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
