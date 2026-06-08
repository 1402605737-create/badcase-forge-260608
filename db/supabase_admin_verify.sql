-- Run manually as a Supabase administrator after supabase_init.template.sql.
-- Read-only verification for badcase-forge-260608 only.

SELECT
  rolname,
  rolcanlogin,
  rolsuper,
  rolcreaterole,
  rolcreatedb,
  rolreplication,
  rolbypassrls
FROM pg_roles
WHERE rolname = 'badcase_forge_260608_app';

SELECT
  n.nspname AS schema_name,
  c.relname AS object_name,
  c.relkind AS object_kind,
  pg_get_userbyid(c.relowner) AS owner
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'badcase_forge_260608'
ORDER BY c.relkind, c.relname;

SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'badcase_forge_260608'
ORDER BY tablename;

SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'badcase_forge_260608'
ORDER BY tablename, policyname;

SELECT count(*) AS demo_case_count
FROM badcase_forge_260608.bad_cases;
