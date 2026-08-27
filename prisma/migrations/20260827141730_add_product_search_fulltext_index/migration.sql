-- Adds a MySQL FULLTEXT index on Product.name + Product.shortDescription
-- so product search (currently a LIKE '%term%' scan that can't use a
-- normal B-tree index) can use MATCH...AGAINST instead, which stays fast
-- as the catalog grows into the thousands of rows.
ALTER TABLE `products` ADD FULLTEXT INDEX `Product_name_shortDescription_idx`(`name`, `shortDescription`);
