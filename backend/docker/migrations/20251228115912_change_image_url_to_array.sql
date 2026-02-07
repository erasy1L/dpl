-- +goose Up
-- +goose StatementBegin
ALTER TABLE attractions ADD COLUMN IF NOT EXISTS image_urls TEXT[];

-- Migrate existing data: convert single image_url to array
UPDATE attractions 
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL AND image_url != '';

-- For attractions without image_url, set empty array
UPDATE attractions 
SET image_urls = ARRAY[]::TEXT[]
WHERE image_url IS NULL OR image_url = '';

ALTER TABLE attractions DROP COLUMN IF EXISTS image_url;

CREATE INDEX IF NOT EXISTS idx_attractions_image_urls ON attractions USING GIN(image_urls);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- Recreate the image_url column
ALTER TABLE attractions ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Migrate data back: take first element from array if exists
UPDATE attractions 
SET image_url = image_urls[1]
WHERE array_length(image_urls, 1) > 0;

-- Drop the array column and its index
DROP INDEX IF EXISTS idx_attractions_image_urls;
ALTER TABLE attractions DROP COLUMN IF EXISTS image_urls;
-- +goose StatementEnd
