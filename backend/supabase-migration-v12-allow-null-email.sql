-- Allow email to be null for walk-in customers
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
