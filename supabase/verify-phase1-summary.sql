WITH private_tables AS (
  SELECT c.oid, c.relname, c.relrowsecurity, c.relforcerowsecurity
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'thinker_private' AND c.relkind = 'r'
), api_roles AS (
  SELECT unnest(ARRAY['anon', 'authenticated', 'service_role']) AS role_name
), workload_roles AS (
  SELECT * FROM pg_roles
  WHERE rolname IN ('thinker_settlement', 'thinker_issuer', 'thinker_gateway', 'thinker_license_admin')
)
SELECT '01_private_tables' AS check_name, count(*) AS actual, 4 AS expected FROM private_tables
UNION ALL SELECT '02_expected_tables', count(*), 4 FROM private_tables WHERE relname IN ('paid_grants', 'licenses', 'license_sessions', 'license_events')
UNION ALL SELECT '03_rls_enabled', count(*), 4 FROM private_tables WHERE relrowsecurity
UNION ALL SELECT '04_rls_forced', count(*), 4 FROM private_tables WHERE relforcerowsecurity
UNION ALL SELECT '05_api_schema_access', count(*), 0 FROM api_roles WHERE has_schema_privilege(role_name, 'thinker_private', 'USAGE')
UNION ALL SELECT '06_api_table_access', count(*), 0 FROM api_roles CROSS JOIN private_tables WHERE has_table_privilege(role_name, oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
UNION ALL SELECT '07_workload_roles', count(*), 4 FROM workload_roles
UNION ALL SELECT '08_unsafe_workload_roles', count(*), 0 FROM workload_roles WHERE rolcanlogin OR rolsuper OR rolcreatedb OR rolcreaterole OR rolinherit OR rolbypassrls OR rolreplication
UNION ALL SELECT '09_workload_schema_access', count(*), 0 FROM workload_roles WHERE has_schema_privilege(rolname, 'thinker_private', 'USAGE')
UNION ALL SELECT '10_workload_table_access', count(*), 0 FROM workload_roles w CROSS JOIN private_tables t WHERE has_table_privilege(w.rolname, t.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
UNION ALL SELECT '11_rls_policies', count(*), 0 FROM pg_policies WHERE schemaname = 'thinker_private'
ORDER BY check_name;
