-- +goose Up
-- +goose StatementBegin
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to attractions table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attractions' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE attractions ADD COLUMN embedding vector(384);
  END IF;
END $$;

-- Add additional fields to attractions if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attractions' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE attractions ADD COLUMN latitude DOUBLE PRECISION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attractions' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE attractions ADD COLUMN longitude DOUBLE PRECISION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attractions' AND column_name = 'address'
  ) THEN
    ALTER TABLE attractions ADD COLUMN address VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attractions' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE attractions ADD COLUMN image_url VARCHAR(500);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attractions' AND column_name = 'tags'
  ) THEN
    ALTER TABLE attractions ADD COLUMN tags TEXT[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attractions' AND column_name = 'rating'
  ) THEN
    ALTER TABLE attractions ADD COLUMN rating REAL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attractions' AND column_name = 'review_count'
  ) THEN
    ALTER TABLE attractions ADD COLUMN review_count INT DEFAULT 0;
  END IF;
END $$;

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_attractions_embedding ON attractions USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_attractions_location ON attractions(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create index for tags
CREATE INDEX IF NOT EXISTS idx_attractions_tags ON attractions USING GIN(tags);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS idx_attractions_tags;
DROP INDEX IF EXISTS idx_attractions_location;
DROP INDEX IF EXISTS idx_attractions_embedding;

ALTER TABLE attractions DROP COLUMN IF EXISTS review_count;
ALTER TABLE attractions DROP COLUMN IF EXISTS rating;
ALTER TABLE attractions DROP COLUMN IF EXISTS tags;
ALTER TABLE attractions DROP COLUMN IF EXISTS image_url;
ALTER TABLE attractions DROP COLUMN IF EXISTS address;
ALTER TABLE attractions DROP COLUMN IF EXISTS longitude;
ALTER TABLE attractions DROP COLUMN IF EXISTS latitude;
ALTER TABLE attractions DROP COLUMN IF EXISTS embedding;

DROP EXTENSION IF EXISTS vector;
-- +goose StatementEnd
