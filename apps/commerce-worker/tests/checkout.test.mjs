import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.resolve("wrangler"));
const { Miniflare, convertV4MiniflareOptions } = require("miniflare");
const { build } = require("esbuild");

test("D1 checkout is authenticated, atomic, exclusive and idempotent", async (t) => {
  const bundle = await build({
    entryPoints: [fileURLToPath(new URL("../src/index.ts", import.meta.url))],
    bundle: true, format: "esm", write: false, platform: "browser",
  });
  const code = bundle.outputFiles[0].text;
  const token = "local-fixture-token";
  const runtime = new Miniflare(convertV4MiniflareOptions({
    modules: true, script: code, compatibilityDate: "2026-10-29",
    d1Databases: { DB: "checkout-fixture" }, bindings: { DISCORD_CHECKOUT_TOKEN: token },
  }));
  t.after(() => runtime.dispose());
  const db = await runtime.getD1Database("DB");
  const migrations = new URL("../migrations/", import.meta.url);
  for (const name of (await readdir(migrations)).sort()) {
    const sql = await readFile(new URL(name, migrations), "utf8");
    const statements = sql.trim().split(/;\s*\r?\n(?=\s*(?:CREATE|ALTER|UPDATE|INSERT)\s)/);
    await db.batch(statements.map((statement) => db.prepare(statement)));
  }
  await db.batch([
    "INSERT INTO staff_users (id, access_subject, email, role, created_at, updated_at) VALUES ('staff','subject','staff@example.test','sales',1,1)",
    "INSERT INTO customers (id,email,created_at,updated_at) VALUES ('customer','customer@example.test',1,1)",
    "INSERT INTO tickets (id,customer_id,assigned_sales_id,subject,created_at,updated_at) VALUES ('ticket','customer','staff','Fixture',1,1)",
    "INSERT INTO plan_versions (id,plan_code,version,billing_kind,term_days,price_minor,currency,activation_window_days,created_at) VALUES ('plan','plan',1,'one_time',30,1000,'USD',30,1)",
    "INSERT INTO wallet_configs (id,network,script_type,account_path,descriptor_hash,xpub_secret_ref,active,created_at,updated_at) VALUES ('wallet','mainnet','p2wpkh','fixture','hash','fixture-ref',1,1,1)",
    "INSERT INTO btc_pool (id,wallet_config_id,derivation_index,address,script_pubkey_hex,created_at) VALUES ('empty','wallet',0,'','empty',1),('spaces','wallet',1,'   ','spaces',1),('a','wallet',2,'fixture-a','00',1),('b','wallet',3,'fixture-b','01',1)",
  ].map((sql) => db.prepare(sql)));

  const checkout = (key, auth = token, body = { ticketId: "ticket", planVersionId: "plan" }) =>
    runtime.dispatchFetch("https://commerce.test/checkout", {
      method: "POST",
      headers: { Authorization: `Bearer ${auth}`, "Idempotency-Key": key, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  assert.equal((await checkout("denied", "wrong")).status, 401);
  assert.equal((await checkout("malformed", token, {})).status, 400);
  assert.equal((await checkout("missing-ticket", token, { ticketId: "missing", planVersionId: "plan" })).status, 409);
  const results = await Promise.all(["interaction-1", "interaction-2", "interaction-3"].map(async (key) => {
    const response = await checkout(key);
    return { key, status: response.status, body: await response.json() };
  }));
  const created = results.filter(({ status }) => status === 201);
  assert.equal(created.length, 2);
  assert.equal(results.filter(({ status }) => status === 409).length, 1);
  assert.equal(new Set(created.map(({ body }) => body.btcAddress)).size, 2);
  assert.equal(new Set(created.map(({ body }) => body.orderId)).size, 2);
  assert.equal(await db.prepare("SELECT COUNT(*) AS total FROM btc_pool WHERE id IN ('empty','spaces') AND is_used = 0 AND order_id IS NULL").first("total"), 2);
  for (const { key, body } of created) {
    const retry = await checkout(key);
    assert.equal(retry.status, 200);
    assert.deepEqual(await retry.json(), body);
    const mismatch = await checkout(key, token, { ticketId: "different", planVersionId: "plan" });
    assert.equal(mismatch.status, 409);
    assert.deepEqual(await mismatch.json(), { error: "idempotency_conflict" });
  }
  await db.batch([
    db.prepare("INSERT INTO btc_pool (id,wallet_config_id,derivation_index,address,script_pubkey_hex,created_at) VALUES ('c','wallet',4,'fixture-c','02',1)"),
    db.prepare("CREATE TRIGGER fixture_reject_assignment BEFORE UPDATE ON btc_pool WHEN NEW.id = 'c' BEGIN SELECT RAISE(ABORT, 'test rollback'); END;"),
  ]);
  assert.equal((await checkout("rolled-back")).status, 503);
  assert.equal(await db.prepare("SELECT COUNT(*) AS total FROM orders").first("total"), 2);
  assert.equal(await db.prepare("SELECT COUNT(*) AS total FROM btc_pool WHERE is_used = 1 AND state = 'assigned' AND order_id IS NOT NULL").first("total"), 2);
  assert.equal(await db.prepare("SELECT is_used FROM btc_pool WHERE id = 'c'").first("is_used"), 0);
});
