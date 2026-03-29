-- Inventario admin: categorías, ítems por casa, movimientos de stock
-- Tabla legacy `inventario` (si existe) no se modifica.

CREATE TABLE IF NOT EXISTS inventario_categorias (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text NOT NULL UNIQUE,
  icono       text,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventario_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  casa_id      uuid NOT NULL REFERENCES casas(id) ON DELETE CASCADE,
  categoria_id uuid REFERENCES inventario_categorias(id) ON DELETE SET NULL,
  nombre       text NOT NULL,
  descripcion  text,
  cantidad     int NOT NULL DEFAULT 1 CHECK (cantidad >= 0),
  cantidad_min int NOT NULL DEFAULT 1,
  unidad       text NOT NULL DEFAULT 'unidad',
  estado       text NOT NULL DEFAULT 'bueno',
  ubicacion    text,
  activo       boolean NOT NULL DEFAULT true,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  CONSTRAINT inventario_items_unidad_check CHECK (
    unidad IN ('unidad', 'juego', 'par', 'set', 'rollo', 'litro')
  ),
  CONSTRAINT inventario_items_estado_check CHECK (
    estado IN ('bueno', 'regular', 'malo', 'dado_de_baja')
  )
);

CREATE TABLE IF NOT EXISTS inventario_movimientos (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id           uuid NOT NULL REFERENCES inventario_items(id) ON DELETE CASCADE,
  tipo              text NOT NULL,
  cantidad          int NOT NULL,
  cantidad_anterior int NOT NULL,
  cantidad_nueva    int NOT NULL,
  motivo            text,
  created_at        timestamptz DEFAULT now(),
  CONSTRAINT inventario_movimientos_tipo_check CHECK (
    tipo IN ('entrada', 'salida', 'ajuste', 'baja')
  )
);

CREATE INDEX IF NOT EXISTS inv_items_casa ON inventario_items(casa_id);
CREATE INDEX IF NOT EXISTS inv_items_categoria ON inventario_items(categoria_id);
CREATE INDEX IF NOT EXISTS inv_mov_item ON inventario_movimientos(item_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS inv_items_updated_at ON inventario_items;
CREATE TRIGGER inv_items_updated_at
  BEFORE UPDATE ON inventario_items
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_updated_at();

ALTER TABLE inventario_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario_movimientos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all" ON inventario_categorias;
CREATE POLICY "admin_all" ON inventario_categorias
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "admin_all" ON inventario_items;
CREATE POLICY "admin_all" ON inventario_items
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "admin_all" ON inventario_movimientos;
CREATE POLICY "admin_all" ON inventario_movimientos
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

INSERT INTO inventario_categorias (nombre, icono) VALUES
  ('Muebles', 'Sofa'),
  ('Electrodomésticos', 'Tv'),
  ('Cocina', 'UtensilsCrossed'),
  ('Ropa de cama', 'Bed'),
  ('Baño', 'ShowerHead'),
  ('Limpieza', 'Sparkles'),
  ('Electrónica', 'Plug'),
  ('Exterior', 'Umbrella'),
  ('Otros', 'Package')
ON CONFLICT (nombre) DO NOTHING;
