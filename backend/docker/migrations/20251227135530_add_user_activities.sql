-- +goose Up
-- +goose StatementBegin
-- User activities (views, favorites, etc.)
CREATE TABLE IF NOT EXISTS user_activities (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  attraction_id INT NOT NULL,
  activity_type VARCHAR(20) NOT NULL CHECK (activity_type IN ('view', 'favorite', 'share')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_attraction FOREIGN KEY (attraction_id) REFERENCES attractions(id) ON DELETE CASCADE
);

CREATE INDEX idx_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_activities_attraction_id ON user_activities(attraction_id);
CREATE INDEX idx_activities_type ON user_activities(activity_type);
CREATE INDEX idx_activities_created_at ON user_activities(created_at DESC);
CREATE INDEX idx_activities_user_attraction ON user_activities(user_id, attraction_id);

-- Add view count and trending score to attractions
ALTER TABLE attractions ADD COLUMN IF NOT EXISTS total_views INT DEFAULT 0;
ALTER TABLE attractions ADD COLUMN IF NOT EXISTS trending_score DECIMAL(10,2) DEFAULT 0;

-- Materialized view for attraction stats
CREATE MATERIALIZED VIEW IF NOT EXISTS attraction_stats AS
SELECT 
  a.id as attraction_id,
  COUNT(DISTINCT CASE WHEN ua.activity_type = 'view' THEN ua.user_id END) as unique_viewers,
  COUNT(CASE WHEN ua.activity_type = 'view' THEN 1 END) as total_views,
  COUNT(CASE WHEN ua.activity_type = 'favorite' THEN 1 END) as total_favorites,
  COUNT(CASE WHEN ua.activity_type = 'view' AND ua.created_at > NOW() - INTERVAL '7 days' THEN 1 END) as views_last_7_days,
  COUNT(CASE WHEN ua.activity_type = 'view' AND ua.created_at > NOW() - INTERVAL '30 days' THEN 1 END) as views_last_30_days,
  a.total_ratings,
  a.average_rating
FROM attractions a
LEFT JOIN user_activities ua ON a.id = ua.attraction_id
GROUP BY a.id;

CREATE UNIQUE INDEX idx_attraction_stats_id ON attraction_stats(attraction_id);

-- Function to refresh stats (call periodically)
CREATE OR REPLACE FUNCTION refresh_attraction_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY attraction_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate trending score
CREATE OR REPLACE FUNCTION update_trending_scores()
RETURNS void AS $$
BEGIN
  UPDATE attractions a
  SET 
    trending_score = (
      SELECT 
        (COALESCE(s.views_last_7_days, 0) * 0.6 + 
         COALESCE(s.total_favorites, 0) * 0.3 + 
         COALESCE(s.total_ratings, 0) * 0.1) /
        NULLIF(EXTRACT(EPOCH FROM (NOW() - a.created_at)) / 86400, 0) -- days since created
      FROM attraction_stats s
      WHERE s.attraction_id = a.id
    ),
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY,
  preferred_categories INT[],
  preferred_cities VARCHAR[],
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS user_activities;
-- +goose StatementEnd
