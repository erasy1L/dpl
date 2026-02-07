-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS users (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
	email VARCHAR UNIQUE, name VARCHAR NOT NULL,
	password VARCHAR NOT NULL,
	created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, 
	updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP 
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL UNIQUE,
  icon VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attractions (
  id SERIAL PRIMARY KEY,
  category_id INT NOT NULL,
  name_en VARCHAR NOT NULL,
  name_kz VARCHAR NOT NULL,
  name_ru VARCHAR NOT NULL,
  description TEXT,
  city VARCHAR(50) NOT NULL,
  popularity REAL NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_category FOREIGN KEY (category_id) 
    REFERENCES categories(id) 
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

CREATE INDEX idx_attractions_category_id ON attractions(category_id);
CREATE INDEX idx_attractions_city ON attractions(city);

CREATE INDEX idx_attractions_popularity ON attractions(popularity DESC);

CREATE INDEX idx_attractions_name_en_lower ON attractions(LOWER(name_en));
CREATE INDEX idx_attractions_name_kz_lower ON attractions(LOWER(name_kz));
CREATE INDEX idx_attractions_name_ru_lower ON attractions(LOWER(name_ru));

CREATE INDEX idx_attractions_city_popularity ON attractions(city, popularity DESC);
-- +goose StatementEnd


-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS attractions;
DROP TABLE IF EXISTS categories;
-- +goose StatementEnd
