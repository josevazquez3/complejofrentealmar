-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion" (
    "id" UUID NOT NULL,
    "complejo_nombre" TEXT NOT NULL DEFAULT 'Frente al Mar',
    "tagline" TEXT,
    "descripcion_home" TEXT,
    "ubicacion_direccion" TEXT,
    "mapa_query" TEXT,
    "whatsapp_e164" TEXT,
    "email_contacto" TEXT,
    "facebook_url" TEXT,
    "instagram_url" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "casas" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "capacidad_personas" INTEGER NOT NULL,
    "fotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "casas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas" (
    "id" UUID NOT NULL,
    "casa_id" UUID NOT NULL,
    "fecha_desde" DATE NOT NULL,
    "fecha_hasta" DATE NOT NULL,
    "cant_personas" INTEGER NOT NULL,
    "mascotas" INTEGER NOT NULL DEFAULT 0,
    "comprobante_url" TEXT,
    "saldo_reserva" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nombre" TEXT,
    "apellido" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "mensaje" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tesoreria" (
    "id" UUID NOT NULL,
    "casa_id" UUID,
    "reserva_id" UUID,
    "diferencia" DECIMAL(10,2),
    "comprobante_url" TEXT,
    "saldo" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tesoreria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventario_categorias" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "icono" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventario_categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventario_items" (
    "id" UUID NOT NULL,
    "casa_id" UUID NOT NULL,
    "categoria_id" UUID,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "cantidad_min" INTEGER NOT NULL DEFAULT 1,
    "unidad" TEXT NOT NULL DEFAULT 'unidad',
    "estado" TEXT NOT NULL DEFAULT 'bueno',
    "ubicacion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventario_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventario_movimientos" (
    "id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "tipo" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "cantidad_anterior" INTEGER NOT NULL,
    "cantidad_nueva" INTEGER NOT NULL,
    "motivo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventario_movimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tesoreria_categorias" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "icono" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tesoreria_categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tesoreria_movimientos" (
    "id" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoria_id" UUID,
    "casa_id" UUID,
    "reserva_id" UUID,
    "concepto" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "metodo_pago" TEXT NOT NULL DEFAULT 'efectivo',
    "comprobante" TEXT,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tesoreria_movimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carousel_images" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carousel_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inicio_config" (
    "id" UUID NOT NULL,
    "titulo" TEXT NOT NULL DEFAULT '',
    "descripcion" TEXT NOT NULL DEFAULT '',
    "fotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inicio_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades" (
    "id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "fotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "habilitada" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secciones_texto" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL DEFAULT '',
    "descripcion" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secciones_texto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "reservas_casa_id_fecha_desde_fecha_hasta_idx" ON "reservas"("casa_id", "fecha_desde", "fecha_hasta");

-- CreateIndex
CREATE UNIQUE INDEX "inventario_categorias_nombre_key" ON "inventario_categorias"("nombre");

-- CreateIndex
CREATE INDEX "inventario_items_casa_id_idx" ON "inventario_items"("casa_id");

-- CreateIndex
CREATE INDEX "inventario_items_categoria_id_idx" ON "inventario_items"("categoria_id");

-- CreateIndex
CREATE INDEX "inventario_movimientos_item_id_created_at_idx" ON "inventario_movimientos"("item_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "tesoreria_categorias_nombre_key" ON "tesoreria_categorias"("nombre");

-- CreateIndex
CREATE INDEX "tesoreria_movimientos_fecha_idx" ON "tesoreria_movimientos"("fecha" DESC);

-- CreateIndex
CREATE INDEX "tesoreria_movimientos_tipo_idx" ON "tesoreria_movimientos"("tipo");

-- CreateIndex
CREATE INDEX "carousel_images_orden_idx" ON "carousel_images"("orden");

-- CreateIndex
CREATE INDEX "unidades_habilitada_orden_idx" ON "unidades"("habilitada", "orden");

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_casa_id_fkey" FOREIGN KEY ("casa_id") REFERENCES "casas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tesoreria" ADD CONSTRAINT "tesoreria_casa_id_fkey" FOREIGN KEY ("casa_id") REFERENCES "casas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tesoreria" ADD CONSTRAINT "tesoreria_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_items" ADD CONSTRAINT "inventario_items_casa_id_fkey" FOREIGN KEY ("casa_id") REFERENCES "casas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_items" ADD CONSTRAINT "inventario_items_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "inventario_categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_movimientos" ADD CONSTRAINT "inventario_movimientos_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventario_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tesoreria_movimientos" ADD CONSTRAINT "tesoreria_movimientos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "tesoreria_categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tesoreria_movimientos" ADD CONSTRAINT "tesoreria_movimientos_casa_id_fkey" FOREIGN KEY ("casa_id") REFERENCES "casas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tesoreria_movimientos" ADD CONSTRAINT "tesoreria_movimientos_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
