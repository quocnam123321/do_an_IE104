CREATE TABLE account_profiles (
  account_id uuid PRIMARY KEY REFERENCES accounts (id) ON DELETE CASCADE,
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 100),
  contact_email text NOT NULL CHECK (char_length(contact_email) <= 254),
  phone text NOT NULL CHECK (phone = '' OR phone ~ '^\+?[0-9]{7,15}$'),
  expertise text NOT NULL CHECK (char_length(expertise) <= 500),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0)
);
