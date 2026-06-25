CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS pending_pr_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sport VARCHAR(50) NOT NULL,
  event VARCHAR(50) NOT NULL,
  value VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  previous_value VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (owner_id, sport, event)
);
