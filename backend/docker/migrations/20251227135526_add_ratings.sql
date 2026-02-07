-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS ratings (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  attraction_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_attraction FOREIGN KEY (attraction_id) REFERENCES attractions(id) ON DELETE CASCADE,
  UNIQUE(user_id, attraction_id)
);

CREATE INDEX idx_ratings_user_id ON ratings(user_id);
CREATE INDEX idx_ratings_attraction_id ON ratings(attraction_id);
CREATE INDEX idx_ratings_rating ON ratings(rating);
CREATE INDEX idx_ratings_created_at ON ratings(created_at DESC);

-- Add rating stats to attractions table
ALTER TABLE attractions ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE attractions ADD COLUMN IF NOT EXISTS total_ratings INT DEFAULT 0;

-- Function to update attraction stats when rating is added/updated
CREATE OR REPLACE FUNCTION update_attraction_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE attractions
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM ratings
      WHERE attraction_id = COALESCE(NEW.attraction_id, OLD.attraction_id)
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM ratings
      WHERE attraction_id = COALESCE(NEW.attraction_id, OLD.attraction_id)
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = COALESCE(NEW.attraction_id, OLD.attraction_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_stats_on_insert
AFTER INSERT ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_attraction_rating_stats();

CREATE TRIGGER update_rating_stats_on_update
AFTER UPDATE ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_attraction_rating_stats();

CREATE TRIGGER update_rating_stats_on_delete
AFTER DELETE ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_attraction_rating_stats();
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS ratings;
-- +goose StatementEnd
