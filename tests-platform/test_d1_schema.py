from pathlib import Path
import sqlite3
import unittest


ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "apps/commerce-worker/migrations/0001_commerce_foundation.sql"
HARDENING = ROOT / "apps/commerce-worker/migrations/0002_integer_and_wallet_guards.sql"


class CommerceSchemaTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.db.execute("PRAGMA foreign_keys = ON")
        self.db.executescript(MIGRATION.read_text(encoding="utf-8"))
        self.db.executescript(HARDENING.read_text(encoding="utf-8"))
        self.db.executescript("""
            INSERT INTO staff_users VALUES ('sales', 'access-sales', 'sales@example.test', 'sales', 1, 1, 1, 1);
            INSERT INTO customers VALUES ('customer', 'customer@example.test', NULL, 1, 1);
            INSERT INTO customers VALUES ('other', 'other@example.test', NULL, 1, 1);
            INSERT INTO plan_versions VALUES ('plan', 'monthly', 1, 'recurring', 30, 10000, 'BRL', 30, 1, 1);
            INSERT INTO wallet_configs VALUES ('wallet', 'regtest', 'p2wpkh', 'account', 'descriptor', 'XPUB_REFERENCE', 0, 1, 1, 1);
            INSERT INTO fx_quotes VALUES ('quote', 'fixture', 'BTC', 'BRL', '500000.00', 1, 1, 10000);
            INSERT INTO tickets (id, customer_id, assigned_sales_id, subject, created_at, updated_at)
              VALUES ('ticket', 'customer', 'sales', 'Purchase', 1, 1);
            INSERT INTO orders (id, ticket_id, customer_id, sales_owner_id, plan_version_id, fiat_currency, fiat_total_minor, client_request_id, created_at, updated_at)
              VALUES ('order', 'ticket', 'customer', 'sales', 'plan', 'BRL', 10000, 'request', 1, 1);
            INSERT INTO btc_pool (id, wallet_config_id, derivation_index, address, script_pubkey_hex, created_at)
              VALUES ('address', 'wallet', 0, 'bcrt-fixture', '0014fixture', 1);
        """)

    def tearDown(self):
        self.db.close()

    def reject(self, sql, params=()):
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute(sql, params)

    def assign(self):
        self.db.execute("UPDATE btc_pool SET order_id = 'order', state = 'assigned', assigned_at = 2 WHERE id = 'address'")

    def invoice(self):
        self.assign()
        self.db.execute("UPDATE orders SET commercial_status = 'open', btc_due_sats = 20000, fx_quote_id = 'quote', invoice_expires_at = 10000 WHERE id = 'order'")

    def output(self):
        self.db.execute("""INSERT INTO payment_outputs
          (id, btc_pool_id, network, txid, vout, value_sats, chain_state, first_seen_at, last_verified_at)
          VALUES ('output', 'address', 'regtest', ?, 0, 20000, 'mempool', 1, 1)""", ("a" * 64,))

    def test_schema_and_foreign_keys(self):
        tables = self.db.execute("SELECT name FROM sqlite_master WHERE type = 'table'").fetchall()
        self.assertEqual({name for (name,) in tables}, {
            'staff_users', 'customers', 'plan_versions', 'wallet_configs', 'fx_quotes',
            'tickets', 'ticket_messages', 'orders', 'btc_pool', 'payment_outputs',
            'payment_settlements', 'settlement_outputs', 'license_projection',
            'outbox_events', 'processed_commands', 'audit_events', 'refund_cases',
            'lost_sale_analyses',
        })
        self.assertEqual(self.db.execute("PRAGMA foreign_key_check").fetchall(), [])

    def test_invoice_requires_complete_quote(self):
        self.reject("UPDATE orders SET commercial_status = 'open' WHERE id = 'order'")
        self.reject("UPDATE orders SET payment_status = 'paid' WHERE id = 'order'")
        self.invoice()
        self.reject("UPDATE orders SET btc_due_sats = 1 WHERE id = 'order'")
        self.reject("UPDATE orders SET fx_quote_id = NULL WHERE id = 'order'")
        self.reject("UPDATE orders SET required_confirmations = 1 WHERE id = 'order'")

    def test_customer_must_match_ticket(self):
        self.reject("UPDATE orders SET customer_id = 'other' WHERE id = 'order'")

    def test_assigned_address_cannot_be_recycled_or_repointed(self):
        self.assign()
        self.reject("UPDATE btc_pool SET state = 'available', order_id = NULL, assigned_at = NULL WHERE id = 'address'")
        self.reject("UPDATE btc_pool SET address = 'attacker' WHERE id = 'address'")
        self.reject("UPDATE btc_pool SET assigned_at = 3 WHERE id = 'address'")
        self.db.execute("UPDATE btc_pool SET state = 'retired' WHERE id = 'address'")

    def test_derivation_and_order_unique(self):
        self.reject("INSERT INTO btc_pool (id, wallet_config_id, derivation_index, address, script_pubkey_hex, created_at) VALUES ('dup', 'wallet', 0, 'other', 'other', 1)")
        self.reject("UPDATE btc_pool SET derivation_index = 2147483648 WHERE id = 'address'")
        self.assign()
        self.reject("INSERT INTO btc_pool (id, wallet_config_id, derivation_index, address, script_pubkey_hex, order_id, state, assigned_at, created_at) VALUES ('dup', 'wallet', 1, 'other', 'other', 'order', 'assigned', 1, 1)")

    def test_output_identity_and_network(self):
        self.output()
        self.reject("UPDATE payment_outputs SET value_sats = 999999 WHERE id = 'output'")
        self.reject("UPDATE payment_outputs SET chain_state = 'confirmed' WHERE id = 'output'")
        self.reject("INSERT INTO payment_outputs (id, btc_pool_id, network, txid, vout, value_sats, chain_state, first_seen_at, last_verified_at) VALUES ('bad', 'address', 'mainnet', ?, 1, 1, 'mempool', 1, 1)", ("b" * 64,))
        self.db.execute("UPDATE payment_outputs SET chain_state = 'confirmed', block_hash = ?, block_height = 1 WHERE id = 'output'", ("c" * 64,))
        self.db.execute("UPDATE payment_outputs SET chain_state = 'orphaned' WHERE id = 'output'")

    def test_current_settlement_and_output_ownership(self):
        self.assign()
        self.output()
        values = ("settlement", "order", 1, "confirmed", 20000, 3, "a" * 64, 1, 1)
        self.db.execute("INSERT INTO payment_settlements VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", values)
        self.reject("INSERT INTO payment_settlements VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", ("second", "order", 2, "confirmed", 20000, 3, "b" * 64, 2, 1))
        self.db.execute("INSERT INTO settlement_outputs VALUES ('settlement', 'output')")
        self.reject("INSERT INTO settlement_outputs VALUES ('settlement', 'output')")
        self.db.execute("UPDATE payment_settlements SET state = 'invalidated' WHERE id = 'settlement'")
        self.db.execute("INSERT INTO payment_settlements VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", ("second", "order", 2, "confirmed", 20000, 3, "b" * 64, 2, 1))

    def test_referenced_plans_and_audit_json(self):
        self.reject("UPDATE plan_versions SET price_minor = 1 WHERE id = 'plan'")
        self.db.execute("UPDATE plan_versions SET active = 0 WHERE id = 'plan'")
        self.reject("INSERT INTO outbox_events (id, event_type, aggregate_id, payload_json, next_attempt_at, created_at) VALUES ('event', 'paid', 'order', 'invalid', 1, 1)")
        self.reject("DELETE FROM customers WHERE id = 'customer'")

    def test_fractional_money_and_derivation_are_rejected(self):
        self.reject("UPDATE orders SET fiat_total_minor = 0.5 WHERE id = 'order'")
        self.reject("UPDATE orders SET btc_due_sats = 1.5 WHERE id = 'order'")
        self.reject("INSERT INTO btc_pool (id, wallet_config_id, derivation_index, address, script_pubkey_hex, created_at) VALUES ('fractional', 'wallet', 0.5, 'fractional', 'fractional', 1)")
        self.reject("INSERT INTO plan_versions VALUES ('fractional', 'fractional', 1, 'recurring', 30, 0.5, 'BRL', 30, 1, 1)")
        self.reject("INSERT INTO payment_outputs (id, btc_pool_id, network, txid, vout, value_sats, chain_state, first_seen_at, last_verified_at) VALUES ('fractional', 'address', 'regtest', ?, 0, 1.5, 'mempool', 1, 1)", ('d' * 64,))

    def test_fractional_metadata_is_rejected_and_nullable_fields_allowed(self):
        for table, column, row_id in (
            ('staff_users', 'authz_version', 'sales'),
            ('staff_users', 'active', 'sales'),
            ('orders', 'required_confirmations', 'order'),
            ('orders', 'created_at', 'order'),
            ('tickets', 'version', 'ticket'),
            ('tickets', 'closed_at', 'ticket'),
            ('wallet_configs', 'next_index', 'wallet'),
        ):
            with self.subTest(table=table, column=column):
                self.reject(f"UPDATE {table} SET {column} = 1.5 WHERE id = ?", (row_id,))
        self.db.execute("UPDATE orders SET btc_due_sats = NULL, paid_at = NULL WHERE id = 'order'")

    def test_wallet_provenance_is_immutable_and_index_is_monotonic(self):
        for column, value in (
            ('id', 'new-wallet'),
            ('network', 'mainnet'),
            ('account_path', 'another-account'),
            ('descriptor_hash', 'another-descriptor'),
            ('xpub_secret_ref', 'another-reference'),
        ):
            with self.subTest(column=column):
                self.reject(f"UPDATE wallet_configs SET {column} = ? WHERE id = 'wallet'", (value,))
        self.db.execute("UPDATE wallet_configs SET next_index = 10, active = 0 WHERE id = 'wallet'")
        self.reject("UPDATE wallet_configs SET next_index = 9 WHERE id = 'wallet'")
        self.db.execute("UPDATE wallet_configs SET next_index = 10, active = 1 WHERE id = 'wallet'")

    def test_integer_guard_coverage_matches_schema(self):
        from importlib.util import module_from_spec, spec_from_file_location
        spec = spec_from_file_location('guards', ROOT / 'scripts/generate_d1_integer_guards.py')
        module = module_from_spec(spec)
        spec.loader.exec_module(module)
        self.assertEqual(HARDENING.read_text(encoding='utf-8'), module.generate())
        for table, required in module.REQUIRED.items():
            optional = module.OPTIONAL.get(table, '').split()
            expected = set(required.split() + optional)
            actual = {row[1] for row in self.db.execute(f'PRAGMA table_info({table})') if row[2] == 'INTEGER'}
            self.assertEqual(expected, actual, table)


if __name__ == "__main__":
    unittest.main(verbosity=2)
