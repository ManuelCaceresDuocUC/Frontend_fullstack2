/*
  Warnings:

  - You are about to alter the column `estadoSii` on the `Dte` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.
  - A unique constraint covering the columns `[tipo,folio]` on the table `Dte` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Dte` MODIFY `estadoSii` ENUM('ENVIADO', 'ACEPTADO', 'RECHAZADO', 'REPARO') NOT NULL DEFAULT 'ENVIADO';

-- CreateIndex
CREATE INDEX `Dte_trackId_idx` ON `Dte`(`trackId`);

-- CreateIndex
CREATE INDEX `Dte_estadoSii_createdAt_idx` ON `Dte`(`estadoSii`, `createdAt`);

-- CreateIndex
CREATE UNIQUE INDEX `Dte_tipo_folio_key` ON `Dte`(`tipo`, `folio`);

-- AddForeignKey
ALTER TABLE `Dte` ADD CONSTRAINT `Dte_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
