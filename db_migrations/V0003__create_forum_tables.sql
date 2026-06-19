CREATE TABLE IF NOT EXISTS t_p46767792_registration_website.forum_topics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p46767792_registration_website.users(id),
  category VARCHAR(50) NOT NULL DEFAULT 'Общее',
  title VARCHAR(300) NOT NULL,
  body TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  replies_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p46767792_registration_website.forum_replies (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER NOT NULL REFERENCES t_p46767792_registration_website.forum_topics(id),
  user_id INTEGER NOT NULL REFERENCES t_p46767792_registration_website.users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
