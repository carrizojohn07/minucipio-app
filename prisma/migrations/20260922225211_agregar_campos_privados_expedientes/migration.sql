/*
  Warnings:

  - Added the required column `caratula` to the `Expediente` table without a default value. This is not possible if the table is not empty.
  - Added the required column `extracto` to the `Expediente` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "MovimientoExpediente" DROP CONSTRAINT "MovimientoExpediente_expedienteId_fkey";

-- AlterTable
ALTER TABLE "Expediente" ADD COLUMN     "caratula" TEXT NOT NULL,
ADD COLUMN     "esPrivado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "extracto" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MovimientoExpediente" ADD COLUMN     "esConfidencial" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "MovimientoExpediente" ADD CONSTRAINT "MovimientoExpediente_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "Expediente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
