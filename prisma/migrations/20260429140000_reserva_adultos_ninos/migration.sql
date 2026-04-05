-- AlterTable: reemplazar cant_personas por adultos + ninos (mascotas ya existía)
ALTER TABLE "reservas" ADD COLUMN "adultos" INTEGER;
ALTER TABLE "reservas" ADD COLUMN "ninos" INTEGER NOT NULL DEFAULT 0;

UPDATE "reservas" SET "adultos" = GREATEST(1, "cant_personas"), "ninos" = 0 WHERE "adultos" IS NULL;

ALTER TABLE "reservas" ALTER COLUMN "adultos" SET NOT NULL;
ALTER TABLE "reservas" ALTER COLUMN "adultos" SET DEFAULT 1;

ALTER TABLE "reservas" DROP COLUMN "cant_personas";
