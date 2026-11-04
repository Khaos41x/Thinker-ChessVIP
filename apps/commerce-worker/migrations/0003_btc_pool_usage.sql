ALTER TABLE btc_pool ADD COLUMN is_used INTEGER NOT NULL DEFAULT 0 CHECK (typeof(is_used) = 'integer' AND is_used IN (0, 1));

UPDATE btc_pool SET is_used = (state <> 'available');

CREATE TRIGGER btc_pool_usage_insert_guard BEFORE INSERT ON btc_pool
WHEN NEW.state = 'available' AND NEW.is_used <> 0
BEGIN SELECT RAISE(ABORT, 'Available addresses cannot be marked used'); END;

CREATE TRIGGER btc_pool_usage_update_guard BEFORE UPDATE OF is_used ON btc_pool
WHEN NEW.is_used <> (NEW.state <> 'available')
BEGIN SELECT RAISE(ABORT, 'Address usage must match canonical state'); END;

CREATE TRIGGER btc_pool_usage_after_insert AFTER INSERT ON btc_pool
WHEN NEW.is_used <> (NEW.state <> 'available')
BEGIN UPDATE btc_pool SET is_used = (NEW.state <> 'available') WHERE id = NEW.id; END;

CREATE TRIGGER btc_pool_usage_after_state AFTER UPDATE OF state ON btc_pool
WHEN NEW.is_used <> (NEW.state <> 'available')
BEGIN UPDATE btc_pool SET is_used = (NEW.state <> 'available') WHERE id = NEW.id; END;
