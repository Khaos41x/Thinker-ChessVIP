import assert from "node:assert/strict";
import { test } from "node:test";
import worker from "../src/index.ts";

function fixture(result, error) {
  const state = { queries: 0, reads: 0 };
  const env = {
    DB: {
      prepare(sql) {
        state.queries++;
        assert.match(sql, /sqlite_schema/);
        assert.match(sql, /pragma_table_info/);
        return {
          async first() {
            state.reads++;
            if (error) throw error;
            return result;
          },
        };
      },
    },
  };
  return { state, env };
}

test("health reads the DB before reporting ready", async () => {
  const { state, env } = fixture({ connected: 1, required_tables: 3, ready_columns: 1 });
  const response = await worker.fetch(new Request("https://commerce.test/health"), env);
  assert.equal(response.status, 200);
  assert.equal(state.queries, 1);
  assert.equal(state.reads, 1);
  assert.deepEqual(await response.json(), { status: "ok", service: "commerce", database: "ready" });
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});

test("missing tables, usage column, or query result returns unavailable", async () => {
  for (const result of [null, { connected: 1, required_tables: 2, ready_columns: 1 }, { connected: 1, required_tables: 3, ready_columns: 0 }]) {
    const { env } = fixture(result);
    const response = await worker.fetch(new Request("https://commerce.test/health"), env);
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.deepEqual(await response.json(), { status: "unavailable", service: "commerce", database: "unavailable" });
  }
});

test("database errors are contained and never leaked", async () => {
  const { env } = fixture(null, new Error("private upstream detail"));
  const response = await worker.fetch(new Request("https://commerce.test/health"), env);
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /private|upstream|detail/);
  const unbound = await worker.fetch(new Request("https://commerce.test/health"), {});
  assert.equal(unbound.status, 503);
});

test("wrong methods and business routes remain unavailable without DB access", async () => {
  const { state, env } = fixture(null, new Error("must not query"));
  for (const [method, path] of [["POST", "/health"], ["GET", "/orders"], ["POST", "/orders"], ["POST", "/orders/x/pay"], ["GET", "/vault"]]) {
    const response = await worker.fetch(new Request(`https://commerce.test${path}`, { method }), env);
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: "not_found" });
  }
  assert.equal(state.queries, 0);
});
