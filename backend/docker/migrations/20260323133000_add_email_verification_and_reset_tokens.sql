-- +goose Up
-- +goose StatementBegin
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMPTZ;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS reset_password_sent_at TIMESTAMPTZ;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE users DROP COLUMN IF EXISTS reset_password_sent_at;
ALTER TABLE users DROP COLUMN IF EXISTS reset_password_token;
ALTER TABLE users DROP COLUMN IF EXISTS email_verification_sent_at;
ALTER TABLE users DROP COLUMN IF EXISTS email_verification_token;
ALTER TABLE users DROP COLUMN IF EXISTS email_verified;
-- +goose StatementEnd

