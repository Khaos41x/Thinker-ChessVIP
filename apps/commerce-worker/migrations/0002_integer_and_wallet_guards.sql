CREATE TRIGGER staff_users_integer_insert BEFORE INSERT ON staff_users
WHEN typeof(NEW.active) <> 'integer'
  OR typeof(NEW.authz_version) <> 'integer'
  OR typeof(NEW.created_at) <> 'integer'
  OR typeof(NEW.updated_at) <> 'integer'
BEGIN SELECT RAISE(ABORT, 'staff_users: integer fields must contain integers'); END;

CREATE TRIGGER staff_users_integer_update BEFORE UPDATE OF active, authz_version, created_at, updated_at ON staff_users
WHEN typeof(NEW.active) <> 'integer'
  OR typeof(NEW.authz_version) <> 'integer'
  OR typeof(NEW.created_at) <> 'integer'
  OR typeof(NEW.updated_at) <> 'integer'
BEGIN SELECT RAISE(ABORT, 'staff_users: integer fields must contain integers'); END;

CREATE TRIGGER customers_integer_insert BEFORE INSERT ON customers
WHEN typeof(NEW.created_at) <> 'integer'
  OR typeof(NEW.updated_at) <> 'integer'
BEGIN SELECT RAISE(ABORT, 'customers: integer fields must contain integers'); END;

CREATE TRIGGER customers_integer_update BEFORE UPDATE OF created_at, updated_at ON customers
WHEN typeof(NEW.created_at) <> 'integer'
  OR typeof(NEW.updated_at) <> 'integer'
BEGIN SELECT RAISE(ABORT, 'customers: integer fields must contain integers'); END;

CREATE TRIGGER plan_versions_integer_insert BEFORE INSERT ON plan_versions
WHEN typeof(NEW.version) <> 'integer'
  OR typeof(NEW.term_days) <> 'integer'
  OR typeof(NEW.price_minor) <> 'integer'
  OR typeof(NEW.activation_window_days) <> 'integer'
  OR typeof(NEW.active) <> 'integer'
  OR typeof(NEW.created_at) <> 'integer'
BEGIN SELECT RAISE(ABORT, 'plan_versions: integer fields must contain integers'); END;

CREATE TRIGGER plan_versions_integer_update BEFORE UPDATE OF version, term_days, price_minor, activation_window_days, active, created_at ON plan_versions
WHEN typeof(NEW.version) <> 'integer'
  OR typeof(NEW.term_days) <> 'integer'
  OR typeof(NEW.price_minor) <> 'integer'
  OR typeof(NEW.activation_window_days) <> 'integer'
  OR typeof(NEW.active) <> 'integer'
  OR typeof(NEW.created_at) <> 'integer'
BEGIN SELECT RAISE(ABORT, 'plan_versions: integer fields must contain integers'); END;

CREATE TRIGGER wallet_configs_integer_insert BEFORE INSERT ON wallet_configs
WHEN typeof(NEW.next_index) <> 'integer'
  OR typeof(NEW.active) <> 'integer'
  OR typeof(NEW.created_at) <> 'integer'
  OR typeof(NEW.updated_at) <> 'integer'
BEGIN SELECT RAISE(ABORT, 'wallet_configs: integer fields must contain integers'); END;

CREATE TRIGGER wallet_configs_integer_update BEFORE UPDATE OF next_index, active, created_at, updated_at ON wallet_configs
WHEN typeof(NEW.next_index) <> 'integer'
  OR typeof(NEW.active) <> 'integer'
  OR typeof(NEW.created_at) <> 'integer'
  OR typeof(NEW.updated_at) <> 'integer'
BEGIN SELECT RAISE(ABORT, 'wallet_configs: integer fields must contain integers'); END;

CREATE TRIGGER fx_quotes_integer_insert BEFORE INSERT ON fx_quotes
WHEN typeof(NEW.provider_updated_at) <> 'integer'
  OR typeof(NEW.fetched_at) <> 'integer'
  OR typeof(NEW.expires_at) <> 'integer'
BEGIN SELECT RAISE(ABORT, 'fx_quotes: integer fields must contain integers'); END;

CREATE TRIGGER fx_quotes_integer_update BEFORE UPDATE OF provider_updated_at, fetched_at, expires_at ON fx_quotes
WHEN typeof(NEW.provider_updated_at) <> 'integer'
  OR typeof(NEW.fetched_at) <> 'integer'
  OR typeof(NEW.expires_at) <> 'integer'
BEGIN SELECT RAISE(ABORT, 'fx_quotes: integer fields must contain integers'); END;

CREATE TRIGGER tickets_integer_insert BEFORE INSERT ON tickets
WHEN typeof(NEW.version) <> 'integer'
  OR typeof(NEW.created_at) <> 'integer'
  OR typeof(NEW.updated_at) <> 'integer'
  OR (NEW.closed_at IS NOT NULL AND typeof(NEW.closed_at) <> 'integer')
BEGIN SELECT RAISE(ABORT, 'tickets: integer fields must contain integers'); END;

CREATE TRIGGER tickets_integer_update BEFORE UPDATE OF version, created_at, updated_at, closed_at ON tickets
WHEN typeof(NEW.version) <> 'integer'
  OR typeof(NEW.created_at) <> 'integer'
  OR typeof(NEW.updated_at) <> 'integer'
  OR (NEW.closed_at IS NOT NULL AND typeof(NEW.closed_at) <> 'integer')
BEGIN SELECT RAISE(ABORT, 'tickets: integer fields must contain integers'); END;

CREATE TRIGGER ticket_messages_integer_insert BEFORE INSERT ON ticket_messages
WHEN typeof(NEW.created_at) <> 'integer'
BEGIN SELECT RAISE(ABORT, 'ticket_messages: integer fields must contain integers'); END;

CREATE TRIGGER ticket_messages_integer_update BEFORE UPDATE OF created_at ON ticket_messages
WHEN typeof(NEW.created_at) <> 'integer'
BEGIN SELECT RAISE(ABORT, 'ticket_messages: integer fields must contain integers'); END;

CREATE TRIGGER orders_integer_insert BEFORE INSERT ON orders
WHEN typeof(NEW.fiat_total_minor) <> 'integer'
  OR typeof(NEW.required_confirmations) <> 'integer'
  OR typeof(NEW.version) <> 'integer'
  OR typeof(NEW.created_at) <> 'integer'
  OR typeof(NEW.updated_at) <> 'integer'
  OR (NEW.btc_due_sats IS NOT NULL AND typeof(NEW.btc_due_sats) <> 'integer')
  OR (NEW.invoice_expires_at IS NOT NULL AND typeof(NEW.invoice_expires_at) <> 'integer')
  OR (NEW.paid_at IS NOT NULL AND typeof(NEW.paid_at) <> 'integer')
  OR (NEW.completed_at IS NOT NULL AND typeof(NEW.completed_at) <> 'integer')
BEGIN SELECT RAISE(ABORT, 'orders: integer fields must contain integers'); END;

CREATE TRIGGER orders_integer_update BEFORE UPDATE OF fiat_total_minor, required_confirmations, version, created_at, updated_at, btc_due_sats, invoice_expires_at, paid_at, completed_at ON orders
WHEN typeof(NEW.fiat_total_minor) <> 'integer'
  OR typeof(NEW.required_confirmations) <> 'integer'
  OR typeof(NEW.version) <> 'integer'
  OR typeof(NEW.created_at) <> 'integer'
  OR typeof(NEW.updated_at) <> 'integer'
  OR (NEW.btc_due_sats IS NOT NULL AND typeof(NEW.btc_due_sats) <> 'integer')
  OR (NEW.invoice_expires_at IS NOT NULL AND typeof(NEW.invoice_expires_at) <> 'integer')
  OR (NEW.paid_at IS NOT NULL AND typeof(NEW.paid_at) <> 'integer')
  OR (NEW.completed_at IS NOT NULL AND typeof(NEW.completed_at) <> 'integer')
BEGIN SELECT RAISE(ABORT, 'orders: integer fields must contain integers'); END;

CREATE TRIGGER btc_pool_integer_insert BEFORE INSERT ON btc_pool
WHEN typeof(NEW.branch) <> 'integer'
  OR typeof(NEW.derivation_index) <> 'integer'
  OR typeof(NEW.created_at) <> 'integer'
  OR (NEW.assigned_at IS NOT NULL AND typeof(NEW.assigned_at) <> 'integer')
BEGIN SELECT RAISE(ABORT, 'btc_pool: integer fields must contain integers'); END;

CREATE TRIGGER btc_pool_integer_update BEFORE UPDATE OF branch, derivation_index, created_at, assigned_at ON btc_pool
WHEN typeof(NEW.branch) <> 'integer'
  OR typeof(NEW.derivation_index) <> 'integer'
  OR typeof(NEW.created_at) <> 'integer'
  OR (NEW.assigned_at IS NOT NULL AND typeof(NEW.assigned_at) <> 'integer')
BEGIN SELECT RAISE(ABORT, 'btc_pool: integer fields must contain integers'); END;

CREATE TRIGGER payment_outputs_integer_insert BEFORE INSERT ON payment_outputs
WHEN typeof(NEW.vout) <> 'integer'
  OR typeof(NEW.value_sats) <> 'integer'
  OR typeof(NEW.first_seen_at) <> 'integer'
  OR typeof(NEW.last_verified_at) <> 'integer'
  OR (NEW.block_height IS NOT NULL AND typeof(NEW.block_height) <> 'integer')
BEGIN SELECT RAISE(ABORT, 'payment_outputs: integer fields must contain integers'); END;

CREATE TRIGGER payment_outputs_integer_update BEFORE UPDATE OF vout, value_sats, first_seen_at, last_verified_at, block_height ON payment_outputs
WHEN typeof(NEW.vout) <> 'integer'
  OR typeof(NEW.value_sats) <> 'integer'
  OR typeof(NEW.first_seen_at) <> 'integer'
  OR typeof(NEW.last_verified_at) <> 'integer'
  OR (NEW.block_height IS NOT NULL AND typeof(NEW.block_height) <> 'integer')
BEGIN SELECT RAISE(ABORT, 'payment_outputs: integer fields must contain integers'); END;

CREATE TRIGGER payment_settlements_integer_insert BEFORE INSERT ON payment_settlements
WHEN typeof(NEW.generation) <> 'integer'
  OR typeof(NEW.qualified_sats) <> 'integer'
  OR typeof(NEW.required_confirmations) <> 'integer'
  OR typeof(NEW.verified_at) <> 'integer'
  OR typeof(NEW.policy_version) <> 'integer'
BEGIN SELECT RAISE(ABORT, 'payment_settlements: integer fields must contain integers'); END;

CREATE TRIGGER payment_settlements_integer_update BEFORE UPDATE OF generation, qualified_sats, required_confirmations, verified_at, policy_version ON payment_settlements
WHEN typeof(NEW.generation) <> 'integer'
  OR typeof(NEW.qualified_sats) <> 'integer'
  OR typeof(NEW.required_confirmations) <> 'integer'
  OR typeof(NEW.verified_at) <> 'integer'
  OR typeof(NEW.policy_version) <> 'integer'
BEGIN SELECT RAISE(ABORT, 'payment_settlements: integer fields must contain integers'); END;

CREATE TRIGGER license_projection_integer_insert BEFORE INSERT ON license_projection
WHEN typeof(NEW.source_version) <> 'integer'
  OR typeof(NEW.synced_at) <> 'integer'
  OR (NEW.expires_at IS NOT NULL AND typeof(NEW.expires_at) <> 'integer')
BEGIN SELECT RAISE(ABORT, 'license_projection: integer fields must contain integers'); END;

CREATE TRIGGER license_projection_integer_update BEFORE UPDATE OF source_version, synced_at, expires_at ON license_projection
WHEN typeof(NEW.source_version) <> 'integer'
  OR typeof(NEW.synced_at) <> 'integer'
  OR (NEW.expires_at IS NOT NULL AND typeof(NEW.expires_at) <> 'integer')
BEGIN SELECT RAISE(ABORT, 'license_projection: integer fields must contain integers'); END;

CREATE TRIGGER outbox_events_integer_insert BEFORE INSERT ON outbox_events
WHEN typeof(NEW.schema_version) <> 'integer'
  OR typeof(NEW.attempts) <> 'integer'
  OR typeof(NEW.next_attempt_at) <> 'integer'
  OR typeof(NEW.created_at) <> 'integer'
  OR (NEW.lease_until IS NOT NULL AND typeof(NEW.lease_until) <> 'integer')
  OR (NEW.published_at IS NOT NULL AND typeof(NEW.published_at) <> 'integer')
BEGIN SELECT RAISE(ABORT, 'outbox_events: integer fields must contain integers'); END;

CREATE TRIGGER outbox_events_integer_update BEFORE UPDATE OF schema_version, attempts, next_attempt_at, created_at, lease_until, published_at ON outbox_events
WHEN typeof(NEW.schema_version) <> 'integer'
  OR typeof(NEW.attempts) <> 'integer'
  OR typeof(NEW.next_attempt_at) <> 'integer'
  OR typeof(NEW.created_at) <> 'integer'
  OR (NEW.lease_until IS NOT NULL AND typeof(NEW.lease_until) <> 'integer')
  OR (NEW.published_at IS NOT NULL AND typeof(NEW.published_at) <> 'integer')
BEGIN SELECT RAISE(ABORT, 'outbox_events: integer fields must contain integers'); END;

CREATE TRIGGER processed_commands_integer_insert BEFORE INSERT ON processed_commands
WHEN typeof(NEW.processed_at) <> 'integer'
BEGIN SELECT RAISE(ABORT, 'processed_commands: integer fields must contain integers'); END;

CREATE TRIGGER processed_commands_integer_update BEFORE UPDATE OF processed_at ON processed_commands
WHEN typeof(NEW.processed_at) <> 'integer'
BEGIN SELECT RAISE(ABORT, 'processed_commands: integer fields must contain integers'); END;

CREATE TRIGGER audit_events_integer_insert BEFORE INSERT ON audit_events
WHEN typeof(NEW.created_at) <> 'integer'
BEGIN SELECT RAISE(ABORT, 'audit_events: integer fields must contain integers'); END;

CREATE TRIGGER audit_events_integer_update BEFORE UPDATE OF created_at ON audit_events
WHEN typeof(NEW.created_at) <> 'integer'
BEGIN SELECT RAISE(ABORT, 'audit_events: integer fields must contain integers'); END;

CREATE TRIGGER refund_cases_integer_insert BEFORE INSERT ON refund_cases
WHEN typeof(NEW.amount_sats) <> 'integer'
  OR typeof(NEW.created_at) <> 'integer'
  OR typeof(NEW.updated_at) <> 'integer'
BEGIN SELECT RAISE(ABORT, 'refund_cases: integer fields must contain integers'); END;

CREATE TRIGGER refund_cases_integer_update BEFORE UPDATE OF amount_sats, created_at, updated_at ON refund_cases
WHEN typeof(NEW.amount_sats) <> 'integer'
  OR typeof(NEW.created_at) <> 'integer'
  OR typeof(NEW.updated_at) <> 'integer'
BEGIN SELECT RAISE(ABORT, 'refund_cases: integer fields must contain integers'); END;

CREATE TRIGGER lost_sale_analyses_integer_insert BEFORE INSERT ON lost_sale_analyses
WHEN typeof(NEW.created_at) <> 'integer'
BEGIN SELECT RAISE(ABORT, 'lost_sale_analyses: integer fields must contain integers'); END;

CREATE TRIGGER lost_sale_analyses_integer_update BEFORE UPDATE OF created_at ON lost_sale_analyses
WHEN typeof(NEW.created_at) <> 'integer'
BEGIN SELECT RAISE(ABORT, 'lost_sale_analyses: integer fields must contain integers'); END;

CREATE TRIGGER wallet_configs_preserve_provenance BEFORE UPDATE ON wallet_configs
WHEN NEW.id <> OLD.id OR NEW.network <> OLD.network OR NEW.script_type <> OLD.script_type OR NEW.account_path <> OLD.account_path OR NEW.descriptor_hash <> OLD.descriptor_hash OR NEW.xpub_secret_ref <> OLD.xpub_secret_ref
BEGIN SELECT RAISE(ABORT, 'Wallet provenance is immutable; rotation requires a new wallet'); END;

CREATE TRIGGER wallet_configs_monotonic_index BEFORE UPDATE OF next_index ON wallet_configs
WHEN NEW.next_index < OLD.next_index
BEGIN SELECT RAISE(ABORT, 'Wallet derivation index cannot decrease'); END;
