/*
  Warnings:

  - You are about to drop the `Stock` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Stock` DROP FOREIGN KEY `Stock_perfumeId_fkey`;

-- AlterTable
ALTER TABLE `order_items` ADD COLUMN `variantId` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `Stock`;

-- CreateTable
CREATE TABLE `PerfumeVariant` (
    `id` VARCHAR(191) NOT NULL,
    `perfumeId` VARCHAR(191) NOT NULL,
    `ml` INTEGER NOT NULL,
    `price` INTEGER NOT NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `sku` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PerfumeVariant_sku_key`(`sku`),
    INDEX `PerfumeVariant_active_ml_idx`(`active`, `ml`),
    UNIQUE INDEX `PerfumeVariant_perfumeId_ml_key`(`perfumeId`, `ml`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `order_items_variantId_idx` ON `order_items`(`variantId`);

-- AddForeignKey
ALTER TABLE `PerfumeVariant` ADD CONSTRAINT `PerfumeVariant_perfumeId_fkey` FOREIGN KEY (`perfumeId`) REFERENCES `Perfume`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `PerfumeVariant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
