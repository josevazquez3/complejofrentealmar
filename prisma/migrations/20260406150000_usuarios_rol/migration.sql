-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EMPLEADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'EMPLEADO',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- Migrar filas desde la tabla legacy `users` (migración inicial) y eliminarla
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    INSERT INTO "usuarios" ("id", "nombre", "email", "password", "rol", "activo", "creado_en", "updated_at")
    SELECT
      "id"::text,
      COALESCE(NULLIF(trim(split_part(lower("email"), '@', 1)), ''), 'Usuario'),
      lower(trim("email")),
      "password",
      CASE upper(COALESCE("role", 'ADMIN'))
        WHEN 'SUPER_ADMIN' THEN 'SUPER_ADMIN'::"Rol"
        WHEN 'EMPLEADO' THEN 'EMPLEADO'::"Rol"
        ELSE 'ADMIN'::"Rol"
      END,
      true,
      "created_at",
      "created_at"
    FROM "users"
    ON CONFLICT ("email") DO NOTHING;

    DROP TABLE "users";
  END IF;
END $$;
