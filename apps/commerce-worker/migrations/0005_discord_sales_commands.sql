CREATE TABLE discord_staff_members (
  guild_id TEXT NOT NULL CHECK (length(guild_id) BETWEEN 16 AND 22 AND guild_id NOT GLOB '*[^0-9]*'),
  discord_user_id TEXT NOT NULL CHECK (length(discord_user_id) BETWEEN 16 AND 22 AND discord_user_id NOT GLOB '*[^0-9]*'),
  staff_user_id TEXT NOT NULL REFERENCES staff_users (id) ON DELETE RESTRICT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (typeof(active) = 'integer' AND active IN (0, 1)),
  PRIMARY KEY (guild_id, discord_user_id),
  UNIQUE (guild_id, staff_user_id)
);

CREATE TABLE discord_ticket_channels (
  guild_id TEXT NOT NULL CHECK (length(guild_id) BETWEEN 16 AND 22 AND guild_id NOT GLOB '*[^0-9]*'),
  channel_id TEXT NOT NULL CHECK (length(channel_id) BETWEEN 16 AND 22 AND channel_id NOT GLOB '*[^0-9]*'),
  ticket_id TEXT NOT NULL UNIQUE REFERENCES tickets (id) ON DELETE RESTRICT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (typeof(active) = 'integer' AND active IN (0, 1)),
  PRIMARY KEY (guild_id, channel_id)
);

CREATE TABLE discord_checkout_plans (
  plan_key TEXT PRIMARY KEY NOT NULL CHECK (plan_key IN ('starter', 'pro', 'elite')),
  plan_version_id TEXT NOT NULL REFERENCES plan_versions (id) ON DELETE RESTRICT,
  btc_due_sats INTEGER NOT NULL CHECK (typeof(btc_due_sats) = 'integer' AND btc_due_sats BETWEEN 1 AND 2100000000000000),
  active INTEGER NOT NULL DEFAULT 1 CHECK (typeof(active) = 'integer' AND active IN (0, 1))
);
