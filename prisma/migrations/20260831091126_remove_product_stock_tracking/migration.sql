-- Bouquets are made to order with no fixed inventory, so stock tracking
-- never reflected real availability. Removing it everywhere rather than
-- just hiding it in the UI, per explicit request.
ALTER TABLE `products` DROP COLUMN `stock`;
ALTER TABLE `products` DROP COLUMN `lowStockThreshold`;
ALTER TABLE `product_variants` DROP COLUMN `stock`;
