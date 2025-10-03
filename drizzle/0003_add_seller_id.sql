-- Add seller_id to products and offers with FKs and indexes

-- Products: add column + FK + index
ALTER TABLE products
ADD COLUMN IF NOT EXISTS seller_id uuid;

ALTER TABLE products
ADD CONSTRAINT IF NOT EXISTS products_seller_id_fkey
FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);

-- Offers: add column + FK + index
ALTER TABLE offers
ADD COLUMN IF NOT EXISTS seller_id uuid;

ALTER TABLE offers
ADD CONSTRAINT IF NOT EXISTS offers_seller_id_fkey
FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_offers_seller_id ON offers(seller_id);
