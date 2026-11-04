# Phase 2 — D1-backed readiness and address usage

The current increment adds a physical `btc_pool.is_used` INTEGER NOT NULL DEFAULT 0 column through additive migration `0003_btc_pool_usage.sql`. The `state` column remains canonical: available means unused; assigned or retired means used. Existing rows are backfilled. Database triggers synchronize allocation and retirement, including assigned/retired insertion with the default value, and reject inconsistent direct toggles. Retired addresses are never available for reuse. This increment inserts no Bitcoin address, xPub, wallet configuration, order, or payment into the remote database.

After applying the complete migration, record `0003_btc_pool_usage.sql` in the D1 migration ledger. Do not change or replay the already-applied 0001 and 0002 baselines.

`GET /health` executes a read through `env.DB`. It returns HTTP 200 with `{"status":"ok","service":"commerce","database":"ready"}` only when `tickets`, `orders`, and `btc_pool` are present and `is_used` is INTEGER NOT NULL with default 0. Query failure, missing binding, or incomplete schema returns HTTP 503 with a generic unavailable response. Responses prohibit caching and contain no database diagnostics. All business paths and non-GET health requests remain HTTP 404.

Workers.dev is enabled for the specifically authorized initial health deployment; preview URLs remain disabled. The public health endpoint performs a small metadata query per request and has no business mutation or credential-management capability. The coordinating agent owns publication and remote verification. A local test or build is not evidence of remote deployment.

Validation commands: `pnpm test`, `pnpm typecheck`, `pnpm --filter @thinker/commerce-worker build`, and `pnpm db:local`. The Worker test uses Node's test runner and built-in TypeScript stripping to execute the source with controlled D1 mocks. SQLite tests exercise the actual migrations, and the local Wrangler integration must validate metadata query compatibility before publication.

## Remote status

The Cloudflare dashboard confirmed the existing `thinker-ops-db` with all three commercial tables. Migration 0003 was applied through its SQL console and registered in `d1_migrations`. Remote checks returned three required tables, four required pool columns, default `is_used = 0`, zero pool rows, zero foreign-key errors, and one applied 0003 ledger entry. Evidence: `evidence/d1-phase2-pool-verified.png`.

Local validation passed 16 SQLite tests, four Worker tests, TypeScript, bundle dry-run, local migration and an actual emulated D1-backed health request. The dashboard wizard only offered a Hello World initial deployment; automatic review rejected publishing that placeholder without the reviewed code and binding. No placeholder was published. The user completed Wrangler OAuth consent with account read, user read, Workers scripts write and D1 write, plus Cloudflare's required background access. No runtime database or license secret was supplied to the Worker.

## Published deployment

Wrangler published the reviewed source and configured binding together. Worker: `thinker-commerce-worker`. URL: `https://thinker-commerce-worker.kkdealface.workers.dev`. Version: `3385ede6-62d6-491d-93b3-c995ac8b8355`. Startup time reported by Cloudflare: 1 ms. The deploy output confirmed `env.DB (thinker-ops-db)` as a D1 binding.

The live `/health` route returned `{"status":"ok","service":"commerce","database":"ready"}` in the integrated browser. The live `/orders` route returned `{"error":"not_found"}`. Evidence: `evidence/commerce-worker-health-live.png`. A Python urllib probe received Cloudflare edge error 1010/HTTP 403 before reaching the application; no Cloudflare security protections were changed. The successful public verification used the browser rather than that blocked client.

A separate read-only Wrangler query against remote D1 returned `pool_rows = 0`, `foreign_key_errors = 0`, and `migration_applied = 1`, with zero rows written. Real treasury addresses, xPub configuration and pool injection remain pending the user's explicit next command. This finishes the current publication/readiness increment, not the full order/payment/license implementation from the broader Phase 2 plan.
