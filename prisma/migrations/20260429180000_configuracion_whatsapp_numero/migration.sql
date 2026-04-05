-- AlterTable
ALTER TABLE "configuracion" ADD COLUMN "whatsapp_numero" TEXT NOT NULL DEFAULT '';

-- Opcional: copiar el número de contacto existente para no dejar el flujo vacío
UPDATE "configuracion"
SET "whatsapp_numero" = regexp_replace(COALESCE("whatsapp_e164", ''), '\D', '', 'g')
WHERE "whatsapp_numero" = ''
  AND "whatsapp_e164" IS NOT NULL
  AND length(regexp_replace(COALESCE("whatsapp_e164", ''), '\D', '', 'g')) >= 8;
