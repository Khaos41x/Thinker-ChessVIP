import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.resolve("wrangler"));
const { Miniflare, convertV4MiniflareOptions } = require("miniflare");
const { build } = require("esbuild");
const { privateKey, publicKey } = generateKeyPairSync("ed25519");
const discordPublicKey = publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
const userA = "123456789012345678";
const userB = "223456789012345678";
const messageA = "323456789012345678";
const messageB = "423456789012345678";
const interactionA = "523456789012345678";
const interactionB = "623456789012345678";

async function bundleWorker() {
  const { outputFiles } = await build({
    entryPoints: [fileURLToPath(new URL("../src/index.ts", import.meta.url))],
    bundle: true,
    write: false,
    format: "esm",
    platform: "browser",
    target: "es2022",
  });
  return outputFiles[0].text;
}

function signedRequest(payload, options = {}) {
  const raw = typeof payload === "string" ? payload : JSON.stringify(payload);
  const timestamp = options.timestamp ?? String(Math.floor(Date.now() / 1000));
  const signature = sign(null, Buffer.from(timestamp + raw), privateKey).toString("hex");
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Signature-Ed25519": signature,
      "X-Signature-Timestamp": timestamp,
      ...options.headers,
    },
    body: options.body ?? raw,
  };
}

function button(id = interactionA, user = userA, message = messageA, guild = true) {
  return {
    id,
    type: 3,
    data: { component_type: 2, custom_id: "btn_generate_checkout" },
    message: { id: message },
    ...(guild ? { member: { user: { id: user } }, guild_id: "723456789012345678" } : { user: { id: user } }),
  };
}

function assertPrivateReply(body) {
  assert.equal(body.type, 4);
  assert.equal(body.data?.flags, 64);
  assert.ok(body.data.content || body.data.embeds?.length);
}

test("Discord interactions verify signatures and isolate mapped checkouts", async (t) => {
  const code = await bundleWorker();
  const runtime = new Miniflare(convertV4MiniflareOptions({
    modules: true,
    script: code,
    compatibilityDate: "2026-10-29",
    d1Databases: { DB: "discord-interactions-fixture" },
    bindings: { DISCORD_PUBLIC_KEY: discordPublicKey, DISCORD_CHECKOUT_TOKEN: "fixture-checkout-token" },
  }));
  t.after(() => runtime.dispose());
  const db = await runtime.getD1Database("DB");
  const migrations = new URL("../migrations/", import.meta.url);
  for (const name of (await readdir(migrations)).filter(name => name.endsWith(".sql")).sort()) {
    const sql = await readFile(new URL(name, migrations), "utf8");
    const statements = sql.trim().split(/;\s*\r?\n(?=\s*(?:CREATE|ALTER|UPDATE|INSERT)\s)/);
    await db.batch(statements.map(statement => db.prepare(statement)));
  }
  await db.batch([
    "INSERT INTO staff_users (id,access_subject,email,role,created_at,updated_at) VALUES ('staff','discord-staff','staff@example.test','sales',1,1)",
    "INSERT INTO customers (id,email,created_at,updated_at) VALUES ('customer-a','a@example.test',1,1),('customer-b','b@example.test',1,1)",
    "INSERT INTO tickets (id,customer_id,assigned_sales_id,subject,created_at,updated_at) VALUES ('ticket-a','customer-a','staff','Fixture A',1,1),('ticket-b','customer-b','staff','Fixture B',1,1)",
    "INSERT INTO plan_versions (id,plan_code,version,billing_kind,term_days,price_minor,currency,activation_window_days,created_at) VALUES ('plan','fixture-plan',1,'one_time',30,1000,'USD',30,1)",
    "INSERT INTO wallet_configs (id,network,script_type,account_path,descriptor_hash,xpub_secret_ref,active,created_at,updated_at) VALUES ('wallet','mainnet','p2wpkh','fixture','fixture-descriptor','fixture-reference',1,1,1)",
    "INSERT INTO btc_pool (id,wallet_config_id,derivation_index,address,script_pubkey_hex,created_at) VALUES ('address-a','wallet',0,'fixture-address-a','00',1),('address-b','wallet',1,'fixture-address-b','01',1)",
    `INSERT INTO discord_checkout_contexts (discord_user_id,discord_message_id,ticket_id,plan_version_id,active,created_at) VALUES ('${userA}','${messageA}','ticket-a','plan',1,1),('${userB}','${messageB}','ticket-b','plan',1,1)`,
  ].map(sql => db.prepare(sql)));

  const dispatch = (payload, options) => runtime.dispatchFetch("https://commerce.test/interactions", signedRequest(payload, options));
  const orders = () => db.prepare("SELECT COUNT(*) AS total FROM orders").first("total");
  const used = () => db.prepare("SELECT COUNT(*) AS total FROM btc_pool WHERE is_used = 1").first("total");

  await t.test("signed PING returns the Discord handshake without writes", async () => {
    const response = await dispatch({ type: 1 });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { type: 1 });
    assert.equal(await orders(), 0);
  });

  await t.test("raw-body tampering, invalid signatures and invalid timestamps are rejected", async () => {
    const cases = [
      signedRequest({ type: 1 }, { body: '{"type":1,"tampered":true}' }),
      signedRequest({ type: 1 }, { headers: { "X-Signature-Ed25519": "00".repeat(64) } }),
      signedRequest({ type: 1 }, { headers: { "X-Signature-Ed25519": "bad" } }),
      signedRequest({ type: 1 }, { headers: { "X-Signature-Timestamp": "" } }),
      signedRequest({ type: 1 }, { timestamp: String(Math.floor(Date.now() / 1000) - 301) }),
      signedRequest({ type: 1 }, { timestamp: String(Math.floor(Date.now() / 1000) + 60) }),
    ];
    for (const request of cases) {
      const response = await runtime.dispatchFetch("https://commerce.test/interactions", request);
      assert.equal(response.status, 401);
    }
    assert.equal(await orders(), 0);
  });

  await t.test("signed malformed JSON and oversized bodies receive bounded failures", async () => {
    const malformed = await dispatch('{"type":');
    assert.equal(malformed.status, 400);
    const oversized = await dispatch(JSON.stringify({ type: 1, padding: "x".repeat(65537) }));
    assert.equal(oversized.status, 413);
    assert.equal(await orders(), 0);
  });

  await t.test("unsupported buttons, missing mappings and wrong users/messages cannot create orders", async () => {
    const unsupported = button();
    unsupported.data.custom_id = "other-button";
    const wrongComponent = button();
    wrongComponent.data.component_type = 3;
    const invalidIdentity = button();
    invalidIdentity.member.user.id = "not-a-snowflake";
    const invalidMessage = button();
    invalidMessage.message.id = "not-a-snowflake";
    const invalidInteraction = button("not-a-snowflake");
    for (const payload of [unsupported, wrongComponent, invalidIdentity, invalidMessage, invalidInteraction, button(interactionA, userB, messageA), button(interactionA, userA, messageB)]) {
      const response = await dispatch(payload);
      assert.equal(response.status, 200);
      assertPrivateReply(await response.json());
      assert.equal(await orders(), 0);
    }
    await db.prepare("UPDATE discord_checkout_contexts SET active = 0 WHERE discord_user_id = ?").bind(userA).run();
    const inactive = await dispatch(button());
    assert.equal(inactive.status, 200);
    assertPrivateReply(await inactive.json());
    assert.equal(await orders(), 0);
    await db.prepare("UPDATE discord_checkout_contexts SET active = 1 WHERE discord_user_id = ?").bind(userA).run();
  });

  await t.test("guild button generates a private payment embed and repeated delivery reuses its order", async () => {
    const response = await dispatch(button());
    assert.equal(response.status, 200);
    const body = await response.json();
    assertPrivateReply(body);
    const embed = body.data.embeds?.[0];
    assert.ok(embed);
    assert.equal(embed.color, 0xd4af37);
    const rendered = JSON.stringify(embed);
    assert.match(rendered, /fixture-address-a/);
    assert.match(rendered, /0\.0031\s*BTC/);
    assert.match(rendered, /Aguardando confirmação na rede/);
    const orderField = embed.fields?.find(field => field.name.toLowerCase().replace(/\s/g, "") === "orderid");
    assert.ok(orderField?.value);
    const order = await db.prepare("SELECT id,ticket_id,plan_version_id,btc_due_sats FROM orders").first();
    assert.equal(order.id, orderField.value.replaceAll("`", ""));
    assert.equal(order.ticket_id, "ticket-a");
    assert.equal(order.plan_version_id, "plan");
    assert.equal(order.btc_due_sats, 310000);
    assert.equal(await used(), 1);
    const replay = await dispatch(button());
    assert.equal(replay.status, 200);
    assert.deepEqual(await replay.json(), body);
    assert.equal(await orders(), 1);
    assert.equal(await used(), 1);
  });

  await t.test("DM button uses its own mapped user and message", async () => {
    const response = await dispatch(button(interactionB, userB, messageB, false));
    assert.equal(response.status, 200);
    const body = await response.json();
    assertPrivateReply(body);
    assert.match(JSON.stringify(body.data.embeds), /fixture-address-b/);
    assert.equal(await db.prepare("SELECT COUNT(*) AS total FROM orders WHERE ticket_id = 'ticket-b'").first("total"), 1);
    assert.equal(await orders(), 2);
    assert.equal(await used(), 2);
  });
});

test("Discord authentication is checked before the database binding is touched", async (t) => {
  const code = await bundleWorker();
  const configured = new Miniflare(convertV4MiniflareOptions({
    modules: true, script: code, compatibilityDate: "2026-10-29", bindings: { DISCORD_PUBLIC_KEY: discordPublicKey },
  }));
  const unconfigured = new Miniflare(convertV4MiniflareOptions({
    modules: true, script: code, compatibilityDate: "2026-10-29",
  }));
  t.after(async () => { await configured.dispose(); await unconfigured.dispose(); });
  const noKey = await unconfigured.dispatchFetch("https://commerce.test/interactions", signedRequest(button()));
  assert.equal(noKey.status, 503);
  const invalid = await configured.dispatchFetch("https://commerce.test/interactions", signedRequest(button(), { headers: { "X-Signature-Ed25519": "00".repeat(64) } }));
  assert.equal(invalid.status, 401);
  const missing = await configured.dispatchFetch("https://commerce.test/interactions", { method: "POST", body: JSON.stringify(button()) });
  assert.equal(missing.status, 401);
  const ping = await configured.dispatchFetch("https://commerce.test/interactions", signedRequest({ type: 1 }));
  assert.equal(ping.status, 200);
  assert.deepEqual(await ping.json(), { type: 1 });
});

test("slow mapping returns a private acknowledgement then updates the original Discord message", async (t) => {
  const { outputFiles } = await build({
    stdin: {
      contents: `
        import { interactions } from "./interactions.ts";
        export default {
          fetch(request, env, ctx) {
            const delayedEnv = {
              ...env,
              DB: {
                prepare() {
                  return {
                    bind() {
                      return {
                        async first() {
                          await new Promise(resolve => setTimeout(resolve, 2100));
                          return null;
                        }
                      };
                    }
                  };
                }
              }
            };
            return interactions(request, delayedEnv, {}, ctx);
          }
        };
      `,
      resolveDir: fileURLToPath(new URL("../src/", import.meta.url)),
      loader: "ts",
    },
    bundle: true, write: false, format: "esm", platform: "browser", target: "es2022",
  });
  let resolveDelivery;
  const delivered = new Promise(resolve => { resolveDelivery = resolve; });
  const runtime = new Miniflare(convertV4MiniflareOptions({
    modules: true,
    script: outputFiles[0].text,
    compatibilityDate: "2026-10-29",
    bindings: { DISCORD_PUBLIC_KEY: discordPublicKey },
    outboundService: async request => {
      resolveDelivery({ url: request.url, method: request.method, body: await request.json() });
      return new Response("{}", { status: 200 });
    },
  }));
  t.after(() => runtime.dispose());
  const payload = { ...button(), application_id: "823456789012345678", token: "fixture-webhook-token" };
  const started = performance.now();
  const response = await runtime.dispatchFetch("https://commerce.test/interactions", signedRequest(payload));
  const elapsed = performance.now() - started;
  assert.equal(response.status, 200);
  const body = await response.json();
  assertPrivateReply(body);
  assert.match(body.data.content, /Gerando seu checkout/);
  assert.ok(elapsed < 3000, `Acknowledgement took ${elapsed}ms`);
  let timeout;
  const delivery = await Promise.race([
    delivered,
    new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error("Discord update was not delivered")), 5000); }),
  ]).finally(() => clearTimeout(timeout));
  assert.equal(delivery.method, "PATCH");
  assert.equal(delivery.url, "https://discord.com/api/v10/webhooks/823456789012345678/fixture-webhook-token/messages/@original");
  assert.equal(delivery.body.flags, 64);
  assert.deepEqual(delivery.body.allowed_mentions, { parse: [] });
  assert.match(delivery.body.content, /vinculado ao seu atendimento/);
});

test("slow successful checkout updates its private message and replay never reserves another address", async (t) => {
  const { outputFiles } = await build({
    stdin: {
      contents: `
        import { interactions } from "./interactions.ts";
        export default {
          fetch(request, env, ctx) {
            const delayedEnv = {
              ...env,
              DB: {
                prepare(sql) {
                  const statement = env.DB.prepare(sql);
                  if (!sql.includes("FROM discord_checkout_contexts")) return statement;
                  return {
                    bind(...values) {
                      const bound = statement.bind(...values);
                      return {
                        async first() {
                          await new Promise(resolve => setTimeout(resolve, 2100));
                          return bound.first();
                        }
                      };
                    }
                  };
                },
                batch(statements) {
                  return env.DB.batch(statements);
                }
              }
            };
            return interactions(request, delayedEnv, {}, ctx);
          }
        };
      `,
      resolveDir: fileURLToPath(new URL("../src/", import.meta.url)),
      loader: "ts",
    },
    bundle: true, write: false, format: "esm", platform: "browser", target: "es2022",
  });
  const deliveries = [];
  const listeners = new Map();
  const runtime = new Miniflare(convertV4MiniflareOptions({
    modules: true,
    script: outputFiles[0].text,
    compatibilityDate: "2026-10-29",
    d1Databases: { DB: "discord-slow-success-fixture" },
    bindings: { DISCORD_PUBLIC_KEY: discordPublicKey, DISCORD_CHECKOUT_TOKEN: "fixture-checkout-token" },
    outboundService: async request => {
      const delivery = { url: request.url, method: request.method, body: await request.json() };
      const index = deliveries.length;
      deliveries.push(delivery);
      listeners.get(index)?.(delivery);
      return new Response("{}", { status: 200 });
    },
  }));
  t.after(() => runtime.dispose());
  const db = await runtime.getD1Database("DB");
  const migrations = new URL("../migrations/", import.meta.url);
  for (const name of (await readdir(migrations)).filter(name => name.endsWith(".sql")).sort()) {
    const sql = await readFile(new URL(name, migrations), "utf8");
    const statements = sql.trim().split(/;\s*\r?\n(?=\s*(?:CREATE|ALTER|UPDATE|INSERT)\s)/);
    await db.batch(statements.map(statement => db.prepare(statement)));
  }
  await db.batch([
    "INSERT INTO staff_users (id,access_subject,email,role,created_at,updated_at) VALUES ('staff','slow-staff','slow@example.test','sales',1,1)",
    "INSERT INTO customers (id,email,created_at,updated_at) VALUES ('customer','slow-customer@example.test',1,1)",
    "INSERT INTO tickets (id,customer_id,assigned_sales_id,subject,created_at,updated_at) VALUES ('ticket','customer','staff','Slow fixture',1,1)",
    "INSERT INTO plan_versions (id,plan_code,version,billing_kind,term_days,price_minor,currency,activation_window_days,created_at) VALUES ('plan','slow-plan',1,'one_time',30,1000,'USD',30,1)",
    "INSERT INTO wallet_configs (id,network,script_type,account_path,descriptor_hash,xpub_secret_ref,active,created_at,updated_at) VALUES ('wallet','mainnet','p2wpkh','fixture','slow-descriptor','fixture-reference',1,1,1)",
    "INSERT INTO btc_pool (id,wallet_config_id,derivation_index,address,script_pubkey_hex,created_at) VALUES ('address-a','wallet',0,'fixture-slow-address-a','00',1),('address-b','wallet',1,'fixture-slow-address-b','01',1)",
    `INSERT INTO discord_checkout_contexts (discord_user_id,discord_message_id,ticket_id,plan_version_id,created_at) VALUES ('${userA}','${messageA}','ticket','plan',1)`,
  ].map(sql => db.prepare(sql)));
  const payload = { ...button(), application_id: "823456789012345678", token: "fixture-success-token" };

  async function clickAndWait(index) {
    const started = performance.now();
    const response = await runtime.dispatchFetch("https://commerce.test/interactions", signedRequest(payload));
    const elapsed = performance.now() - started;
    assert.equal(response.status, 200);
    const acknowledgement = await response.json();
    assertPrivateReply(acknowledgement);
    assert.match(acknowledgement.data.content, /Gerando seu checkout/);
    assert.ok(elapsed < 3000, `Acknowledgement took ${elapsed}ms`);
    let timeout;
    const result = deliveries[index] ?? await Promise.race([
      new Promise(resolve => listeners.set(index, resolve)),
      new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error("Successful checkout update was not delivered")), 5000); }),
    ]).finally(() => clearTimeout(timeout));
    assert.equal(result.method, "PATCH");
    assert.equal(result.url, "https://discord.com/api/v10/webhooks/823456789012345678/fixture-success-token/messages/@original");
    assert.equal(result.body.flags, 64);
    assert.deepEqual(result.body.allowed_mentions, { parse: [] });
    return result.body;
  }

  const first = await clickAndWait(0);
  assert.match(JSON.stringify(first.embeds), /fixture-slow-address-a/);
  assert.match(JSON.stringify(first.embeds), /0\.0031\s*BTC/);
  assert.match(JSON.stringify(first.embeds), /Aguardando confirmação na rede/);
  const storedOrder = await db.prepare("SELECT id,btc_due_sats FROM orders").first();
  assert.equal(storedOrder.btc_due_sats, 310000);
  assert.match(JSON.stringify(first.embeds), new RegExp(storedOrder.id));
  assert.equal(await db.prepare("SELECT COUNT(*) AS total FROM orders").first("total"), 1);
  assert.equal(await db.prepare("SELECT COUNT(*) AS total FROM btc_pool WHERE is_used = 1 AND order_id = ?").bind(storedOrder.id).first("total"), 1);

  const replay = await clickAndWait(1);
  assert.deepEqual(replay, first);
  assert.equal(await db.prepare("SELECT COUNT(*) AS total FROM orders").first("total"), 1);
  assert.equal(await db.prepare("SELECT COUNT(*) AS total FROM btc_pool WHERE is_used = 1").first("total"), 1);
  assert.equal(await db.prepare("SELECT is_used FROM btc_pool WHERE id = 'address-b'").first("is_used"), 0);
});
