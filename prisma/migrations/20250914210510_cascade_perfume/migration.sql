-- DropForeignKey
ALTER TABLE `Stock` DROP FOREIGN KEY `Stock_perfumeId_fkey`;

-- DropForeignKey
ALTER TABLE `order_items` DROP FOREIGN KEY `order_items_perfumeId_fkey`;

-- DropIndex
DROP INDEX `order_items_perfumeId_fkey` ON `order_items`;

-- AddForeignKey
ALTER TABLE `Stock` ADD CONSTRAINT `Stock_perfumeId_fkey` FOREIGN KEY (`perfumeId`) REFERENCES `Perfume`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_perfumeId_fkey` FOREIGN KEY (`perfumeId`) REFERENCES `Perfume`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
