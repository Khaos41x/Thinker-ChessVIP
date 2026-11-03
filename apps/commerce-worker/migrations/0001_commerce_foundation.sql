CREATE TABLE staff_users (
  id TEXT PRIMARY KEY NOT NULL,
  access_subject TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('sales', 'founder')),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  authz_version INTEGER NOT NULL DEFAULT 1 CHECK (authz_version > 0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE customers (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE plan_versions (
  id TEXT PRIMARY KEY NOT NULL,
  plan_code TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0),
  billing_kind TEXT NOT NULL CHECK (billing_kind IN ('recurring', 'one_time')),
  term_days INTEGER NOT NULL CHECK (term_days > 0),
  price_minor INTEGER NOT NULL CHECK (price_minor > 0),
  currency TEXT NOT NULL CHECK (length(currency) = 3 AND currency = upper(currency)),
  activation_window_days INTEGER NOT NULL CHECK (activation_window_days > 0),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at INTEGER NOT NULL,
  UNIQUE (plan_code, version)
);

CREATE TABLE wallet_configs (
  id TEXT PRIMARY KEY NOT NULL,
  network TEXT NOT NULL CHECK (network IN ('mainnet', 'testnet', 'signet', 'regtest')),
  script_type TEXT NOT NULL CHECK (script_type = 'p2wpkh'),
  account_path TEXT NOT NULL,
  descriptor_hash TEXT NOT NULL UNIQUE,
  xpub_secret_ref TEXT NOT NULL,
  next_index INTEGER NOT NULL DEFAULT 0 CHECK (next_index BETWEEN 0 AND 2147483648),
  active INTEGER NOT NULL DEFAULT 0 CHECK (active IN (0, 1)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (id, network)
);
CREATE UNIQUE INDEX wallet_configs_active_network ON wallet_configs (network) WHERE active = 1;

CREATE TABLE fx_quotes (
  id TEXT PRIMARY KEY NOT NULL,
  provider TEXT NOT NULL,
  base_asset TEXT NOT NULL CHECK (base_asset = 'BTC'),
  quote_currency TEXT NOT NULL CHECK (length(quote_currency) = 3),
  price_decimal TEXT NOT NULL CHECK (length(price_decimal) > 0),
  provider_updated_at INTEGER NOT NULL,
  fetched_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL CHECK (expires_at > fetched_at),
  UNIQUE (id, quote_currency)
);

CREATE TABLE tickets (
  id TEXT PRIMARY KEY NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customers (id) ON DELETE RESTRICT,
  assigned_sales_id TEXT REFERENCES staff_users (id) ON DELETE RESTRICT,
  created_by_staff_id TEXT REFERENCES staff_users (id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'qualified', 'awaiting_payment', 'won', 'lost', 'closed')),
  subject TEXT NOT NULL CHECK (length(subject) BETWEEN 1 AND 240),
  loss_reason_code TEXT,
  closed_at INTEGER,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CHECK (status <> 'lost' OR (loss_reason_code IS NOT NULL AND length(loss_reason_code) > 0)),
  CHECK ((status IN ('won', 'lost', 'closed') AND closed_at IS NOT NULL) OR (status IN ('open', 'qualified', 'awaiting_payment') AND closed_at IS NULL)),
  UNIQUE (id, customer_id)
);
CREATE INDEX tickets_sales_status ON tickets (assigned_sales_id, status, updated_at);
CREATE INDEX tickets_customer ON tickets (customer_id, created_at);

CREATE TABLE ticket_messages (
  id TEXT PRIMARY KEY NOT NULL,
  ticket_id TEXT NOT NULL REFERENCES tickets (id) ON DELETE RESTRICT,
  author_staff_id TEXT REFERENCES staff_users (id) ON DELETE RESTRICT,
  author_kind TEXT NOT NULL CHECK (author_kind IN ('customer', 'staff', 'system')),
  source TEXT NOT NULL,
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 100000),
  created_at INTEGER NOT NULL,
  CHECK ((author_kind = 'staff' AND author_staff_id IS NOT NULL) OR (author_kind <> 'staff' AND author_staff_id IS NULL))
);
CREATE INDEX ticket_messages_ticket ON ticket_messages (ticket_id, created_at);

CREATE TABLE orders (
  id TEXT PRIMARY KEY NOT NULL,
  ticket_id TEXT NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customers (id) ON DELETE RESTRICT,
  sales_owner_id TEXT NOT NULL REFERENCES staff_users (id) ON DELETE RESTRICT,
  plan_version_id TEXT NOT NULL REFERENCES plan_versions (id) ON DELETE RESTRICT,
  commercial_status TEXT NOT NULL DEFAULT 'draft' CHECK (commercial_status IN ('draft', 'open', 'expired', 'canceled', 'completed')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'confirming', 'paid', 'review', 'reorg_hold', 'refunded')),
  fulfillment_status TEXT NOT NULL DEFAULT 'not_requested' CHECK (fulfillment_status IN ('not_requested', 'queued', 'issued', 'suspended', 'failed')),
  fiat_currency TEXT NOT NULL CHECK (length(fiat_currency) = 3 AND fiat_currency = upper(fiat_currency)),
  fiat_total_minor INTEGER NOT NULL CHECK (fiat_total_minor > 0),
  btc_due_sats INTEGER CHECK (btc_due_sats > 0 AND btc_due_sats <= 2100000000000000),
  fx_quote_id TEXT,
  required_confirmations INTEGER NOT NULL DEFAULT 3 CHECK (required_confirmations >= 1),
  invoice_expires_at INTEGER,
  paid_at INTEGER,
  completed_at INTEGER,
  client_request_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (ticket_id, customer_id) REFERENCES tickets (id, customer_id) ON DELETE RESTRICT,
  FOREIGN KEY (fx_quote_id, fiat_currency) REFERENCES fx_quotes (id, quote_currency) ON DELETE RESTRICT,
  UNIQUE (sales_owner_id, client_request_id),
  CHECK (commercial_status IN ('draft', 'canceled') OR (btc_due_sats IS NOT NULL AND fx_quote_id IS NOT NULL AND invoice_expires_at IS NOT NULL)),
  CHECK (payment_status <> 'paid' OR paid_at IS NOT NULL),
  CHECK (commercial_status <> 'completed' OR (completed_at IS NOT NULL AND fulfillment_status = 'issued'))
);
CREATE INDEX orders_sales ON orders (sales_owner_id, created_at);
CREATE INDEX orders_payment ON orders (payment_status, invoice_expires_at);
CREATE INDEX orders_customer ON orders (customer_id, created_at);

CREATE TABLE btc_pool (
  id TEXT PRIMARY KEY NOT NULL,
  wallet_config_id TEXT NOT NULL REFERENCES wallet_configs (id) ON DELETE RESTRICT,
  branch INTEGER NOT NULL DEFAULT 0 CHECK (branch = 0),
  derivation_index INTEGER NOT NULL CHECK (derivation_index BETWEEN 0 AND 2147483647),
  address TEXT NOT NULL UNIQUE,
  script_pubkey_hex TEXT NOT NULL UNIQUE,
  order_id TEXT UNIQUE REFERENCES orders (id) ON DELETE RESTRICT,
  state TEXT NOT NULL DEFAULT 'available' CHECK (state IN ('available', 'assigned', 'retired')),
  assigned_at INTEGER,
  created_at INTEGER NOT NULL,
  UNIQUE (wallet_config_id, branch, derivation_index),
  CHECK ((state = 'available' AND order_id IS NULL AND assigned_at IS NULL) OR (state = 'assigned' AND order_id IS NOT NULL AND assigned_at IS NOT NULL) OR (state = 'retired' AND ((order_id IS NULL AND assigned_at IS NULL) OR (order_id IS NOT NULL AND assigned_at IS NOT NULL))))
);
CREATE INDEX btc_pool_available ON btc_pool (wallet_config_id, state, derivation_index);

CREATE TABLE payment_outputs (
  id TEXT PRIMARY KEY NOT NULL,
  btc_pool_id TEXT NOT NULL REFERENCES btc_pool (id) ON DELETE RESTRICT,
  network TEXT NOT NULL CHECK (network IN ('mainnet', 'testnet', 'signet', 'regtest')),
  txid TEXT NOT NULL CHECK (length(txid) = 64 AND txid NOT GLOB '*[^0-9a-f]*'),
  vout INTEGER NOT NULL CHECK (vout >= 0),
  value_sats INTEGER NOT NULL CHECK (value_sats > 0 AND value_sats <= 2100000000000000),
  block_hash TEXT,
  block_height INTEGER CHECK (block_height >= 0),
  chain_state TEXT NOT NULL CHECK (chain_state IN ('mempool', 'confirmed', 'orphaned', 'conflicted')),
  first_seen_at INTEGER NOT NULL,
  last_verified_at INTEGER NOT NULL,
  UNIQUE (network, txid, vout),
  CHECK (chain_state <> 'confirmed' OR (block_hash IS NOT NULL AND length(block_hash) = 64 AND block_height IS NOT NULL))
);
CREATE INDEX payment_outputs_address ON payment_outputs (btc_pool_id, chain_state);

CREATE TABLE payment_settlements (
  id TEXT PRIMARY KEY NOT NULL,
  order_id TEXT NOT NULL REFERENCES orders (id) ON DELETE RESTRICT,
  generation INTEGER NOT NULL CHECK (generation > 0),
  state TEXT NOT NULL CHECK (state IN ('confirmed', 'invalidated')),
  qualified_sats INTEGER NOT NULL CHECK (qualified_sats > 0),
  required_confirmations INTEGER NOT NULL CHECK (required_confirmations >= 1),
  chain_tip_hash TEXT NOT NULL CHECK (length(chain_tip_hash) = 64),
  verified_at INTEGER NOT NULL,
  policy_version INTEGER NOT NULL CHECK (policy_version > 0),
  UNIQUE (order_id, generation)
);
CREATE UNIQUE INDEX payment_settlements_current ON payment_settlements (order_id) WHERE state = 'confirmed';

CREATE TABLE settlement_outputs (
  settlement_id TEXT NOT NULL REFERENCES payment_settlements (id) ON DELETE RESTRICT,
  payment_output_id TEXT NOT NULL REFERENCES payment_outputs (id) ON DELETE RESTRICT,
  PRIMARY KEY (settlement_id, payment_output_id)
);

CREATE TABLE license_projection (
  order_id TEXT PRIMARY KEY NOT NULL REFERENCES orders (id) ON DELETE RESTRICT,
  supabase_license_id TEXT NOT NULL UNIQUE,
  license_status TEXT NOT NULL CHECK (license_status IN ('pending_activation', 'active', 'suspended', 'revoked', 'expired')),
  masked_key_hint TEXT NOT NULL,
  expires_at INTEGER,
  source_version INTEGER NOT NULL CHECK (source_version > 0),
  synced_at INTEGER NOT NULL
);

CREATE TABLE outbox_events (
  id TEXT PRIMARY KEY NOT NULL,
  event_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1 CHECK (schema_version > 0),
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'processing', 'published', 'dead')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at INTEGER NOT NULL,
  lease_until INTEGER,
  published_at INTEGER,
  created_at INTEGER NOT NULL,
  CHECK (state <> 'published' OR published_at IS NOT NULL)
);
CREATE INDEX outbox_events_pending ON outbox_events (state, next_attempt_at);

CREATE TABLE processed_commands (
  consumer TEXT NOT NULL,
  command_id TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  result_json TEXT CHECK (result_json IS NULL OR json_valid(result_json)),
  processed_at INTEGER NOT NULL,
  PRIMARY KEY (consumer, command_id)
);

CREATE TABLE audit_events (
  id TEXT PRIMARY KEY NOT NULL,
  actor_kind TEXT NOT NULL CHECK (actor_kind IN ('staff', 'service', 'customer')),
  actor_subject TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('success', 'denied', 'failed')),
  correlation_id TEXT NOT NULL,
  details_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(details_json)),
  created_at INTEGER NOT NULL
);
CREATE INDEX audit_events_entity ON audit_events (entity_type, entity_id, created_at);

CREATE TABLE refund_cases (
  id TEXT PRIMARY KEY NOT NULL,
  order_id TEXT NOT NULL REFERENCES orders (id) ON DELETE RESTRICT,
  requested_by_staff_id TEXT NOT NULL REFERENCES staff_users (id) ON DELETE RESTRICT,
  amount_sats INTEGER NOT NULL CHECK (amount_sats > 0),
  reason TEXT NOT NULL CHECK (length(reason) > 0),
  state TEXT NOT NULL CHECK (state IN ('requested', 'approved', 'rejected', 'externally_paid')),
  external_txid TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CHECK (state <> 'externally_paid' OR (external_txid IS NOT NULL AND length(external_txid) = 64))
);

CREATE TABLE lost_sale_analyses (
  id TEXT PRIMARY KEY NOT NULL,
  ticket_id TEXT NOT NULL REFERENCES tickets (id) ON DELETE RESTRICT,
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  result_json TEXT NOT NULL CHECK (json_valid(result_json)),
  evidence_json TEXT NOT NULL CHECK (json_valid(evidence_json)),
  created_at INTEGER NOT NULL,
  UNIQUE (ticket_id, model, prompt_version, input_hash)
);

CREATE TRIGGER plan_versions_preserve_contract BEFORE UPDATE OF plan_code, version, billing_kind, term_days, price_minor, currency, activation_window_days ON plan_versions
WHEN EXISTS (SELECT 1 FROM orders WHERE plan_version_id = OLD.id)
BEGIN SELECT RAISE(ABORT, 'Referenced plan version is immutable'); END;

CREATE TRIGGER btc_pool_preserve_assignment BEFORE UPDATE ON btc_pool
WHEN NEW.wallet_config_id <> OLD.wallet_config_id OR NEW.branch <> OLD.branch OR NEW.derivation_index <> OLD.derivation_index OR NEW.address <> OLD.address OR NEW.script_pubkey_hex <> OLD.script_pubkey_hex OR (OLD.order_id IS NOT NULL AND (NEW.order_id IS NOT OLD.order_id OR NEW.assigned_at IS NOT OLD.assigned_at)) OR (OLD.state <> 'available' AND NEW.state = 'available')
BEGIN SELECT RAISE(ABORT, 'Address identity and assignment are immutable'); END;

CREATE TRIGGER orders_preserve_invoice BEFORE UPDATE ON orders
WHEN OLD.invoice_expires_at IS NOT NULL AND (NEW.ticket_id <> OLD.ticket_id OR NEW.customer_id <> OLD.customer_id OR NEW.sales_owner_id <> OLD.sales_owner_id OR NEW.plan_version_id <> OLD.plan_version_id OR NEW.fiat_currency <> OLD.fiat_currency OR NEW.fiat_total_minor <> OLD.fiat_total_minor OR NEW.btc_due_sats IS NOT OLD.btc_due_sats OR NEW.fx_quote_id IS NOT OLD.fx_quote_id OR NEW.required_confirmations <> OLD.required_confirmations OR NEW.invoice_expires_at IS NOT OLD.invoice_expires_at)
BEGIN SELECT RAISE(ABORT, 'Issued invoice contract is immutable'); END;

CREATE TRIGGER payment_outputs_network_insert BEFORE INSERT ON payment_outputs
WHEN NOT EXISTS (SELECT 1 FROM btc_pool b JOIN wallet_configs w ON w.id = b.wallet_config_id WHERE b.id = NEW.btc_pool_id AND w.network = NEW.network)
BEGIN SELECT RAISE(ABORT, 'Output network does not match wallet'); END;

CREATE TRIGGER payment_outputs_preserve_identity BEFORE UPDATE ON payment_outputs
WHEN NEW.btc_pool_id <> OLD.btc_pool_id OR NEW.network <> OLD.network OR NEW.txid <> OLD.txid OR NEW.vout <> OLD.vout OR NEW.value_sats <> OLD.value_sats
BEGIN SELECT RAISE(ABORT, 'Payment output identity is immutable'); END;

CREATE TRIGGER settlement_outputs_same_order BEFORE INSERT ON settlement_outputs
WHEN NOT EXISTS (SELECT 1 FROM payment_settlements s JOIN btc_pool b ON b.order_id = s.order_id JOIN payment_outputs p ON p.btc_pool_id = b.id WHERE s.id = NEW.settlement_id AND p.id = NEW.payment_output_id)
BEGIN SELECT RAISE(ABORT, 'Settlement output belongs to another order'); END;
