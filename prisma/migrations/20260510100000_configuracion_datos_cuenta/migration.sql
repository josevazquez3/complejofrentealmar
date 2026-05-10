-- AlterTable
ALTER TABLE "configuracion"
  ADD COLUMN IF NOT EXISTS "cuenta_alias" TEXT,
  ADD COLUMN IF NOT EXISTS "cuenta_cbu" TEXT,
  ADD COLUMN IF NOT EXISTS "cuenta_texto" TEXT;

