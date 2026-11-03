from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REQUIRED = {
    'staff_users': 'active authz_version created_at updated_at',
    'customers': 'created_at updated_at',
    'plan_versions': 'version term_days price_minor activation_window_days active created_at',
    'wallet_configs': 'next_index active created_at updated_at',
    'fx_quotes': 'provider_updated_at fetched_at expires_at',
    'tickets': 'version created_at updated_at',
    'ticket_messages': 'created_at',
    'orders': 'fiat_total_minor required_confirmations version created_at updated_at',
    'btc_pool': 'branch derivation_index created_at',
    'payment_outputs': 'vout value_sats first_seen_at last_verified_at',
    'payment_settlements': 'generation qualified_sats required_confirmations verified_at policy_version',
    'settlement_outputs': '',
    'license_projection': 'source_version synced_at',
    'outbox_events': 'schema_version attempts next_attempt_at created_at',
    'processed_commands': 'processed_at',
    'audit_events': 'created_at',
    'refund_cases': 'amount_sats created_at updated_at',
    'lost_sale_analyses': 'created_at',
}
OPTIONAL = {
    'tickets': 'closed_at',
    'orders': 'btc_due_sats invoice_expires_at paid_at completed_at',
    'btc_pool': 'assigned_at',
    'payment_outputs': 'block_height',
    'license_projection': 'expires_at',
    'outbox_events': 'lease_until published_at',
}


def generate():
    statements = []
    for table, required_text in REQUIRED.items():
        required = required_text.split()
        optional = OPTIONAL.get(table, '').split()
        if not required and not optional:
            continue
        checks = [f"typeof(NEW.{column}) <> 'integer'" for column in required]
        checks += [f"(NEW.{column} IS NOT NULL AND typeof(NEW.{column}) <> 'integer')" for column in optional]
        condition = '\n  OR '.join(checks)
        for action in ('INSERT', 'UPDATE'):
            update_columns = f" OF {', '.join(required + optional)}" if action == 'UPDATE' else ''
            statements.append(
                f"CREATE TRIGGER {table}_integer_{action.lower()} BEFORE {action}{update_columns} ON {table}\n"
                f"WHEN {condition}\n"
                f"BEGIN SELECT RAISE(ABORT, '{table}: integer fields must contain integers'); END;"
            )
    statements.append("""CREATE TRIGGER wallet_configs_preserve_provenance BEFORE UPDATE ON wallet_configs
WHEN NEW.id <> OLD.id OR NEW.network <> OLD.network OR NEW.script_type <> OLD.script_type OR NEW.account_path <> OLD.account_path OR NEW.descriptor_hash <> OLD.descriptor_hash OR NEW.xpub_secret_ref <> OLD.xpub_secret_ref
BEGIN SELECT RAISE(ABORT, 'Wallet provenance is immutable; rotation requires a new wallet'); END;""")
    statements.append("""CREATE TRIGGER wallet_configs_monotonic_index BEFORE UPDATE OF next_index ON wallet_configs
WHEN NEW.next_index < OLD.next_index
BEGIN SELECT RAISE(ABORT, 'Wallet derivation index cannot decrease'); END;""")
    return '\n\n'.join(statements) + '\n'


if __name__ == '__main__':
    target = ROOT / 'apps/commerce-worker/migrations/0002_integer_and_wallet_guards.sql'
    target.write_text(generate(), encoding='utf-8')
    print(target)
