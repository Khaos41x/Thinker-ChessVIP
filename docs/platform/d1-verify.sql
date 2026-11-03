SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name;
PRAGMA foreign_key_check;
SELECT name FROM sqlite_master WHERE type = 'trigger' ORDER BY name;
