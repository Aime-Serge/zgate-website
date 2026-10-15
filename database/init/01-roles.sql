-- Website database: roles and the database itself (ADR-008).
--
-- Two roles:
--   zgate_website_owner  owns the database and every table; runs Payload
--                        migrations (deploy-time only).
--   zgate_website_app    what the running CMS connects as: read and write
--                        rows, nothing else - no DDL, no TRUNCATE.
-- The public site (website/frontend) has no database role at all.
--
-- Local development: Postgres runs this once, when the data volume is first
-- created (deploy/compose.yml). The passwords below are dev-only throwaway
-- values. Production: a DBA runs the same statements on the data host with
-- generated passwords (docs/runbooks/WEBSITE_DEPLOY.md).

CREATE ROLE zgate_website_owner WITH LOGIN PASSWORD 'zgate_website_owner_dev';
CREATE ROLE zgate_website_app WITH LOGIN PASSWORD 'zgate_website_app_dev';

-- Migrations may legitimately run longer than the server-wide statement
-- timeout (postgresql.conf).
ALTER ROLE zgate_website_owner SET statement_timeout = 0;

CREATE DATABASE zgate_website OWNER zgate_website_owner;
REVOKE ALL ON DATABASE zgate_website FROM PUBLIC;
GRANT CONNECT, TEMPORARY ON DATABASE zgate_website TO zgate_website_app;

\connect zgate_website

-- Only the owner creates objects; the app role just uses them.
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO zgate_website_app;

-- Every table and sequence the owner creates later (i.e. by migrations).
ALTER DEFAULT PRIVILEGES FOR ROLE zgate_website_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO zgate_website_app;
ALTER DEFAULT PRIVILEGES FOR ROLE zgate_website_owner IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO zgate_website_app;
