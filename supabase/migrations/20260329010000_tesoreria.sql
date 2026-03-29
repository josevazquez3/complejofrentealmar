-- Tesorería admin: categorías y movimientos (ingresos/egresos)
-- Coexiste con la tabla legacy `tesoreria` si existe.

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS tesoreria_categorias (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text NOT NULL UNIQUE,
  tipo       text NOT NULL CHECK (tipo IN ('ingreso', 'egreso', 'ambos')),
  icono      text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tesoreria_movimientos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha        date NOT NULL DEFAULT CURRENT_DATE,
  tipo         text NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  categoria_id uuid REFERENCES tesoreria_categorias(id) ON DELETE SET NULL,
  casa_id      uuid REFERENCES casas(id) ON DELETE SET NULL,
  reserva_id   uuid REFERENCES reservas(id) ON DELETE SET NULL,
  concepto     text NOT NULL,
  monto        numeric(12, 2) NOT NULL CHECK (monto > 0),
  metodo_pago  text NOT NULL DEFAULT 'efectivo' CHECK (
    metodo_pago IN ('efectivo', 'transferencia', 'tarjeta', 'cheque', 'otro')
  ),
  comprobante  text,
  notas        text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tes_mov_fecha ON tesoreria_movimientos(fecha DESC);
CREATE INDEX IF NOT EXISTS tes_mov_tipo ON tesoreria_movimientos(tipo);
CREATE INDEX IF NOT EXISTS tes_mov_casa ON tesoreria_movimientos(casa_id);
CREATE INDEX IF NOT EXISTS tes_mov_reserva ON tesoreria_movimientos(reserva_id);

DROP TRIGGER IF EXISTS tes_mov_updated_at ON tesoreria_movimientos;
CREATE TRIGGER tes_mov_updated_at
  BEFORE UPDATE ON tesoreria_movimientos
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_updated_at();

ALTER TABLE tesoreria_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE tesoreria_movimientos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all" ON tesoreria_categorias;
CREATE POLICY "admin_all" ON tesoreria_categorias
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "admin_all" ON tesoreria_movimientos;
CREATE POLICY "admin_all" ON tesoreria_movimientos
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

INSERT INTO tesoreria_categorias (nombre, tipo, icono) VALUES
  ('Alquiler / Reserva', 'ingreso', 'Home'),
  ('Servicios (luz/gas/agua)', 'egreso', 'Zap'),
  ('Limpieza', 'egreso', 'Sparkles'),
  ('Mantenimiento', 'egreso', 'Wrench'),
  ('Sueldos', 'egreso', 'Users'),
  ('Compras / Suministros', 'egreso', 'ShoppingCart'),
  ('Impuestos y tasas', 'egreso', 'Receipt'),
  ('Publicidad', 'egreso', 'Megaphone'),
  ('Otros ingresos', 'ingreso', 'PlusCircle'),
  ('Otros egresos', 'egreso', 'MinusCircle')
ON CONFLICT (nombre) DO NOTHING;
