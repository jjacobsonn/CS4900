-- Replace legacy placeholder seed hashes with a real bcrypt hash.
-- Password for seeded accounts remains: TestPass123!

UPDATE users
SET password_hash = '$2b$10$e50BR7WpS2TDQeiZPzwVI.AwvTKItNzI2H8n9gzQDphR3tbfFdqQa'
WHERE email IN ('admin@vellum.test', 'designer@vellum.test', 'reviewer@vellum.test')
  AND password_hash = '$2b$10$example_hash_replace_in_production';
