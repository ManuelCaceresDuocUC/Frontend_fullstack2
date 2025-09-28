-- CreateTable
CREATE TABLE `Dte` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `tipo` INTEGER NOT NULL,
    `folio` INTEGER NOT NULL,
    `ted` VARCHAR(191) NOT NULL,
    `xml` LONGBLOB NOT NULL,
    `trackId` VARCHAR(191) NULL,
    `estadoSii` VARCHAR(191) NOT NULL,
    `pdfUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Dte_orderId_key`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
