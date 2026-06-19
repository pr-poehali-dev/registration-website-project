CREATE TABLE IF NOT EXISTS t_p46767792_registration_website.photos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p46767792_registration_website.users(id),
  title VARCHAR(200) NOT NULL DEFAULT '',
  url TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
