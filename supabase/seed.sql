-- Datos semilla — ejecutar DESPUÉS de schema.sql
-- Amplía configuracion con redes (no está en schema.sql original)
ALTER TABLE configuracion ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE configuracion ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- Limpiar datos demo previos (respeta FKs)
TRUNCATE TABLE tesoreria, inventario, reservas, casas CASCADE;

-- Configuración (una sola fila)
UPDATE configuracion SET
  complejo_nombre = 'Complejo Frente al Mar',
  tagline = 'Tu refugio en la Costa Atlántica Argentina',
  descripcion_home = 'Descubrí la magia de la costa bonaerense en nuestro complejo de casas exclusivas. A metros del mar, rodeado de naturaleza y con todo el confort que necesitás para unas vacaciones inolvidables. Ideal para familias, parejas y grupos de amigos.',
  ubicacion_direccion = 'Av. Costanera 1234, Villa Gesell, Buenos Aires, Argentina',
  mapa_query = '-37.2636,-56.9789',
  whatsapp_e164 = '5492255000000',
  email_contacto = 'info@complejofrentealmar.com.ar',
  facebook_url = 'https://facebook.com/complejofrentealmar',
  instagram_url = 'https://instagram.com/complejofrentealmar',
  updated_at = NOW();

-- Casas (4 propiedades)
INSERT INTO casas (id, nombre, descripcion, capacidad_personas, fotos, activa) VALUES
(
  'a1b2c3d4-0001-0001-0001-000000000001',
  'Casa 1 — Brisa Marina',
  'Casa de 3 ambientes con vista al mar, equipada con todo lo necesario para una estadía perfecta. Cocina completa, living con smart TV, dos habitaciones y baño completo. Deck privado con reposeras y parrilla. A 50 metros de la playa.',
  6,
  ARRAY[
    'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800',
    'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=800',
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800'
  ],
  true
),
(
  'a1b2c3d4-0002-0002-0002-000000000002',
  'Casa 2 — Dunas del Sur',
  'Amplia casa familiar con jardín propio y parrilla techada. Ideal para grupos grandes. Cuenta con 3 habitaciones, 2 baños, living-comedor amplio y cocina equipada. WiFi de alta velocidad y estacionamiento para 2 vehículos.',
  8,
  ARRAY[
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
    'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'
  ],
  true
),
(
  'a1b2c3d4-0003-0003-0003-000000000003',
  'Casa 3 — Rincón del Faro',
  'Casa tipo cabaña con estilo rústico-moderno. Techos de madera, chimenea y una atmósfera acogedora única. Perfecta para parejas o familia pequeña. Terraza superior con vista panorámica a las dunas y el océano.',
  4,
  ARRAY[
    'https://images.unsplash.com/photo-1464146072230-91cabc968266?w=800',
    'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800',
    'https://images.unsplash.com/photo-1482192505345-5852310cde5c?w=800'
  ],
  true
),
(
  'a1b2c3d4-0004-0004-0004-000000000004',
  'Casa 4 — Horizonte Azul',
  'La joya del complejo. Casa premium de 4 habitaciones con jacuzzi exterior, piscina privada y acceso directo a la playa. Decoración contemporánea, Smart TVs en cada habitación, cocina gourmet y servicio de conserjería.',
  10,
  ARRAY[
    'https://images.unsplash.com/photo-1505873242700-f289a29e1e0f?w=800',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
    'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800'
  ],
  true
);

-- Reservas de ejemplo
INSERT INTO reservas (casa_id, fecha_desde, fecha_hasta, cant_personas, mascotas, saldo_reserva) VALUES
(
  'a1b2c3d4-0001-0001-0001-000000000001',
  CURRENT_DATE + 5,
  CURRENT_DATE + 12,
  4, 1, 45000.00
),
(
  'a1b2c3d4-0002-0002-0002-000000000002',
  CURRENT_DATE + 10,
  CURRENT_DATE + 17,
  7, 0, 72000.00
),
(
  'a1b2c3d4-0003-0003-0003-000000000003',
  CURRENT_DATE - 3,
  CURRENT_DATE + 4,
  2, 0, 38000.00
);

INSERT INTO inventario (casa_id, elemento, descripcion, cantidad, estado) VALUES
('a1b2c3d4-0001-0001-0001-000000000001', 'Smart TV', 'Samsung 55" 4K', 1, 'Bueno'),
('a1b2c3d4-0001-0001-0001-000000000001', 'Heladera', 'No frost 320L', 1, 'Bueno'),
('a1b2c3d4-0001-0001-0001-000000000001', 'Silla de playa', 'Con apoyabrazos', 4, 'Bueno'),
('a1b2c3d4-0001-0001-0001-000000000001', 'Sombrilla', 'Grande, resistente UV', 2, 'Roto'),
('a1b2c3d4-0002-0002-0002-000000000002', 'Smart TV', 'LG 65" 4K', 2, 'Bueno'),
('a1b2c3d4-0002-0002-0002-000000000002', 'Parrilla', 'De hierro fundido', 1, 'Bueno'),
('a1b2c3d4-0002-0002-0002-000000000002', 'Juego de sillas', 'Mesa + 8 sillas jardín', 1, 'Faltante'),
('a1b2c3d4-0003-0003-0003-000000000003', 'Chimenea', 'De leña, tiro balanceado', 1, 'Bueno'),
('a1b2c3d4-0003-0003-0003-000000000003', 'Cafetera', 'Nespresso', 1, 'Baja');

INSERT INTO tesoreria (casa_id, reserva_id, diferencia, saldo)
SELECT
  r.casa_id,
  r.id,
  ROUND((r.saldo_reserva * 0.3)::numeric, 2),
  ROUND((r.saldo_reserva * 0.7)::numeric, 2)
FROM reservas r
LIMIT 3;
