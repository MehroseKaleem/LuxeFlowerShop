-- CreateTable
CREATE TABLE `product_categories` (
    `productId` INTEGER NOT NULL,
    `categoryId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `product_categories_categoryId_idx`(`categoryId`),
    PRIMARY KEY (`productId`, `categoryId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `product_categories` ADD CONSTRAINT `product_categories_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_categories` ADD CONSTRAINT `product_categories_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve existing single-category assignments as the product's first
-- category link before the old column is dropped.
INSERT INTO `product_categories` (`productId`, `categoryId`, `createdAt`)
SELECT `id`, `categoryId`, NOW(3) FROM `products` WHERE `categoryId` IS NOT NULL;

-- DropForeignKey
ALTER TABLE `products` DROP FOREIGN KEY `products_categoryId_fkey`;

-- AlterTable
ALTER TABLE `products` DROP COLUMN `categoryId`;
