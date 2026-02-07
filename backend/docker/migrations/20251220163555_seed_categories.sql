-- +goose Up
-- +goose StatementBegin
INSERT INTO categories (name, icon)
VALUES
  ('nature', 'leaf'),
  ('sports', 'activity'),
  ('history', 'landmark'),
  ('market', 'shopping-bag'),
  ('museum', 'museum'),
  ('wellness', 'spa'),
  ('religious', 'pray'),
  ('culture', 'theater'),
  ('zoo', 'paw'),
  ('park', 'tree'),
  ('city', 'city'),
  ('food', 'utensils'),
  ('viewpoint', 'mountain'),
  ('shopping', 'shopping-cart'),
  ('architecture', 'building'),
  ('monument', 'monument'),
  ('family', 'users'),
  ('civic', 'flag'),
  ('arts', 'palette')
ON CONFLICT (name) DO NOTHING;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
TRUNCATE categories;
-- +goose StatementEnd
