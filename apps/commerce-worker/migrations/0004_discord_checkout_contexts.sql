CREATE TABLE discord_checkout_contexts (
  discord_user_id TEXT NOT NULL CHECK (length(discord_user_id) BETWEEN 16 AND 22 AND discord_user_id NOT GLOB '*[^0-9]*'),
  discord_message_id TEXT NOT NULL CHECK (length(discord_message_id) BETWEEN 16 AND 22 AND discord_message_id NOT GLOB '*[^0-9]*'),
  ticket_id TEXT NOT NULL REFERENCES tickets (id) ON DELETE RESTRICT,
  plan_version_id TEXT NOT NULL REFERENCES plan_versions (id) ON DELETE RESTRICT,
  expected_btc_sats INTEGER NOT NULL DEFAULT 310000 CHECK (typeof(expected_btc_sats) = 'integer' AND expected_btc_sats = 310000),
  active INTEGER NOT NULL DEFAULT 1 CHECK (typeof(active) = 'integer' AND active IN (0, 1)),
  created_at INTEGER NOT NULL CHECK (typeof(created_at) = 'integer'),
  PRIMARY KEY (discord_user_id, discord_message_id)
);
