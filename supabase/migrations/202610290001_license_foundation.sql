BEGIN;

CREATE SCHEMA thinker_private;
REVOKE ALL ON SCHEMA thinker_private FROM PUBLIC, anon, authenticated, service_role;

CREATE TABLE thinker_private.paid_grants (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  plan_version_id uuid NOT NULL,
  settlement_generation bigint NOT NULL CHECK (settlement_generation > 0),
  paid_sats bigint NOT NULL CHECK (paid_sats > 0 AND paid_sats <= 2100000000000000),
  term_days integer NOT NULL CHECK (term_days > 0),
  activation_deadline timestamptz NOT NULL,
  state text NOT NULL CHECK (state IN ('valid', 'invalidated')),
  payload_hash text NOT NULL CHECK (length(payload_hash) = 64),
  created_at timestamptz NOT NULL DEFAULT now(),
  invalidated_at timestamptz,
  UNIQUE (order_id, settlement_generation),
  UNIQUE (id, order_id, customer_id, plan_version_id, term_days, activation_deadline),
  CHECK ((state = 'valid' AND invalidated_at IS NULL) OR (state = 'invalidated' AND invalidated_at IS NOT NULL)),
  CHECK (activation_deadline > created_at)
);
CREATE UNIQUE INDEX paid_grants_valid_order ON thinker_private.paid_grants (order_id) WHERE state = 'valid';

CREATE TABLE thinker_private.licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE,
  paid_grant_id uuid NOT NULL UNIQUE,
  customer_id uuid NOT NULL,
  plan_version_id uuid NOT NULL,
  key_digest bytea NOT NULL UNIQUE CHECK (octet_length(key_digest) = 32),
  key_hint text NOT NULL CHECK (length(key_hint) BETWEEN 1 AND 12),
  key_hash_version smallint NOT NULL CHECK (key_hash_version > 0),
  status text NOT NULL CHECK (status IN ('pending_activation', 'active', 'suspended', 'revoked', 'expired')),
  term_days integer NOT NULL CHECK (term_days > 0),
  activation_deadline timestamptz NOT NULL,
  first_activated_at timestamptz,
  expires_at timestamptz,
  hwid_digest bytea CHECK (hwid_digest IS NULL OR octet_length(hwid_digest) = 32),
  hwid_hash_version smallint NOT NULL CHECK (hwid_hash_version > 0),
  hwid_reset_count integer NOT NULL DEFAULT 0 CHECK (hwid_reset_count >= 0),
  session_epoch bigint NOT NULL DEFAULT 1 CHECK (session_epoch > 0),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (paid_grant_id, order_id, customer_id, plan_version_id, term_days, activation_deadline)
    REFERENCES thinker_private.paid_grants (id, order_id, customer_id, plan_version_id, term_days, activation_deadline) ON DELETE RESTRICT,
  CHECK ((first_activated_at IS NULL AND expires_at IS NULL) OR (first_activated_at IS NOT NULL AND expires_at IS NOT NULL AND expires_at > first_activated_at)),
  CHECK (status <> 'active' OR (first_activated_at IS NOT NULL AND expires_at IS NOT NULL AND hwid_digest IS NOT NULL)),
  CHECK (status <> 'pending_activation' OR first_activated_at IS NULL)
);

CREATE TABLE thinker_private.license_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid NOT NULL REFERENCES thinker_private.licenses (id) ON DELETE RESTRICT,
  token_digest bytea NOT NULL UNIQUE CHECK (octet_length(token_digest) = 32),
  session_epoch bigint NOT NULL CHECK (session_epoch > 0),
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CHECK (expires_at > issued_at),
  CHECK (revoked_at IS NULL OR revoked_at >= issued_at)
);
CREATE UNIQUE INDEX license_sessions_one_current ON thinker_private.license_sessions (license_id) WHERE revoked_at IS NULL;

CREATE TABLE thinker_private.license_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid NOT NULL REFERENCES thinker_private.licenses (id) ON DELETE RESTRICT,
  event_type text NOT NULL,
  actor_subject text NOT NULL,
  actor_kind text NOT NULL CHECK (actor_kind IN ('staff', 'service', 'customer')),
  command_id uuid NOT NULL UNIQUE,
  reason text NOT NULL CHECK (length(reason) > 0),
  before_version bigint,
  after_version bigint NOT NULL CHECK (after_version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (before_version IS NULL OR after_version > before_version)
);
CREATE INDEX license_events_license_date ON thinker_private.license_events (license_id, created_at);

ALTER TABLE thinker_private.paid_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE thinker_private.paid_grants FORCE ROW LEVEL SECURITY;
ALTER TABLE thinker_private.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE thinker_private.licenses FORCE ROW LEVEL SECURITY;
ALTER TABLE thinker_private.license_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE thinker_private.license_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE thinker_private.license_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE thinker_private.license_events FORCE ROW LEVEL SECURITY;

REVOKE ALL ON ALL TABLES IN SCHEMA thinker_private FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA thinker_private FROM PUBLIC, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA thinker_private REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA thinker_private REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated, service_role;

CREATE ROLE thinker_settlement NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
CREATE ROLE thinker_issuer NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
CREATE ROLE thinker_gateway NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
CREATE ROLE thinker_license_admin NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;

REVOKE ALL ON SCHEMA thinker_private FROM thinker_settlement, thinker_issuer, thinker_gateway, thinker_license_admin;
REVOKE ALL ON ALL TABLES IN SCHEMA thinker_private FROM thinker_settlement, thinker_issuer, thinker_gateway, thinker_license_admin;

COMMIT;
