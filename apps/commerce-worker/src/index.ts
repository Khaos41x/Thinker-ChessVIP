interface Env {
  DB: D1Database;
}

interface DatabaseReadiness {
  connected: number;
  required_tables: number;
  ready_columns: number;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname;
    const headers = {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    };

    if (request.method === "GET" && path === "/health") {
      try {
        const readiness = await env.DB.prepare(`
          SELECT 1 AS connected,
            (SELECT COUNT(*) FROM sqlite_schema
             WHERE type = 'table' AND name IN ('tickets', 'orders', 'btc_pool')) AS required_tables,
            (SELECT COUNT(*) FROM pragma_table_info('btc_pool')
             WHERE name = 'is_used' AND type = 'INTEGER' AND "notnull" = 1 AND dflt_value = '0') AS ready_columns
        `).first<DatabaseReadiness>();

        if (readiness?.connected !== 1 || readiness.required_tables !== 3 || readiness.ready_columns !== 1) {
          throw new Error("Database schema is not ready");
        }

        return new Response(JSON.stringify({ status: "ok", service: "commerce", database: "ready" }), {
          status: 200,
          headers,
        });
      } catch {
        return new Response(JSON.stringify({ status: "unavailable", service: "commerce", database: "unavailable" }), {
          status: 503,
          headers,
        });
      }
    }

    return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers });
  },
} satisfies ExportedHandler<Env>;
