-- Add location column to sellers table
ALTER TABLE sellers
ADD COLUMN IF NOT EXISTS location varchar(255);

-- Optional: create index on location if needed
-- CREATE INDEX IF NOT EXISTS idx_sellers_location ON sellers(location);
