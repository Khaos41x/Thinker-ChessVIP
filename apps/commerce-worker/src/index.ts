interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, _env: Env): Promise<Response> {
    const path = new URL(request.url).pathname;
    const headers = {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    };

    if (request.method === "GET" && path === "/health") {
      return new Response(JSON.stringify({ status: "bootstrap", service: "commerce" }), {
        status: 200,
        headers,
      });
    }

    return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers });
  },
} satisfies ExportedHandler<Env>;
