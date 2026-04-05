-- Unificar en whatsapp_e164: si el número guardado solo estaba en whatsapp_numero, copiarlo.
UPDATE "configuracion"
SET "whatsapp_e164" = NULLIF(regexp_replace(COALESCE("whatsapp_numero", ''), '\D', '', 'g'), '')
WHERE length(regexp_replace(COALESCE("whatsapp_e164", ''), '\D', '', 'g')) < 8
  AND length(regexp_replace(COALESCE("whatsapp_numero", ''), '\D', '', 'g')) >= 8;

ALTER TABLE "configuracion" DROP COLUMN IF EXISTS "whatsapp_numero";
