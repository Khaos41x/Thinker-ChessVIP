SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'thinker_private'
ORDER BY table_name;

SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity,
  has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE') AS anon_access,
  has_table_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,DELETE') AS authenticated_access,
  has_table_privilege('service_role', c.oid, 'SELECT,INSERT,UPDATE,DELETE') AS service_role_access
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'thinker_private' AND c.relkind = 'r'
ORDER BY c.relname;

SELECT rolname, rolcanlogin, rolsuper, rolcreaterole, rolbypassrls
FROM pg_roles
WHERE rolname IN ('thinker_settlement', 'thinker_issuer', 'thinker_gateway', 'thinker_license_admin')
ORDER BY rolname;

SELECT policyname, tablename, roles, cmd
FROM pg_policies
WHERE schemaname = 'thinker_private';
