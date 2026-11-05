export interface CheckoutEnv {
  DB: D1Database;
  DISCORD_CHECKOUT_TOKEN?: string;
}

interface CheckoutOrder {
  id: string;
  address: string | null;
  ticket_id: string;
  plan_version_id: string;
  btc_due_sats: number | null;
}

const availableAddress = `
  SELECT b.id FROM btc_pool b
  JOIN wallet_configs w ON w.id = b.wallet_config_id
  WHERE b.is_used = 0 AND b.state = 'available' AND b.order_id IS NULL
    AND length(trim(b.address)) > 0
    AND w.active = 1 AND w.network = 'mainnet'
  ORDER BY b.derivation_index
  LIMIT 1
`;

export async function checkout(
  request: Request, env: CheckoutEnv, headers: HeadersInit, expectedBtcSats?: number,
): Promise<Response> {
  const json = (body: object, status: number) => new Response(JSON.stringify(body), { status, headers });
  if (!env.DISCORD_CHECKOUT_TOKEN) return json({ error: "checkout_unavailable" }, 503);

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ") || authorization.length > 256) {
    return json({ error: "unauthorized" }, 401);
  }
  const encoder = new TextEncoder();
  const [expected, received] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(env.DISCORD_CHECKOUT_TOKEN)),
    crypto.subtle.digest("SHA-256", encoder.encode(authorization.slice(7))),
  ]);
  if (!crypto.subtle.timingSafeEqual(expected, received)) return json({ error: "unauthorized" }, 401);

  const input = await request.json<unknown>().catch(() => null);
  const key = request.headers.get("Idempotency-Key");
  const validId = (value: unknown): value is string =>
    typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value);
  if (!input || typeof input !== "object" || !("ticketId" in input) || !("planVersionId" in input) ||
      !validId(input.ticketId) || !validId(input.planVersionId) || !validId(key)) {
    return json({ error: "invalid_checkout_request" }, 400);
  }
  const { ticketId, planVersionId } = input;
  const orderId = crypto.randomUUID();
  const requestId = `discord:${key}`;
  const now = Date.now();
  try {
    const results = await env.DB.batch<CheckoutOrder>([
      env.DB.prepare(`
        INSERT INTO orders (
          id, ticket_id, customer_id, sales_owner_id, plan_version_id,
          fiat_currency, fiat_total_minor, btc_due_sats, client_request_id, created_at, updated_at
        )
        SELECT ?, t.id, t.customer_id, s.id, p.id, p.currency, p.price_minor, ?, ?, ?, ?
        FROM tickets t
        JOIN staff_users s ON s.id = t.assigned_sales_id AND s.active = 1
        JOIN plan_versions p ON p.id = ? AND p.active = 1
        WHERE t.id = ? AND t.status IN ('open', 'qualified', 'awaiting_payment')
          AND EXISTS (${availableAddress})
          AND NOT EXISTS (SELECT 1 FROM orders WHERE client_request_id = ?)
      `).bind(orderId, expectedBtcSats ?? null, requestId, now, now, planVersionId, ticketId, requestId),
      env.DB.prepare(`
        UPDATE btc_pool
        SET is_used = 1, state = 'assigned', order_id = ?, assigned_at = ?
        WHERE id = (${availableAddress})
          AND EXISTS (SELECT 1 FROM orders WHERE id = ?)
      `).bind(orderId, now, orderId),
      env.DB.prepare(`
        SELECT o.id, o.ticket_id, o.plan_version_id, o.btc_due_sats, b.address
        FROM orders o LEFT JOIN btc_pool b ON b.order_id = o.id
        WHERE o.client_request_id = ?
      `).bind(requestId),
    ]);
    const orders = results[2]?.results;
    if (results.some(result => !result.success) || !orders || orders.length > 1) {
      return json({ error: "checkout_unavailable" }, 503);
    }
    const order = orders[0];
    if (!order) return json({ error: "checkout_not_available" }, 409);
    if (order.ticket_id !== ticketId || order.plan_version_id !== planVersionId) {
      return json({ error: "idempotency_conflict" }, 409);
    }
    if (expectedBtcSats !== undefined && order.btc_due_sats !== expectedBtcSats) {
      return json({ error: "idempotency_conflict" }, 409);
    }
    if (!order.address) return json({ error: "checkout_unavailable" }, 503);
    return json({ orderId: order.id, btcAddress: order.address }, order.id === orderId ? 201 : 200);
  } catch {
    return json({ error: "checkout_unavailable" }, 503);
  }
}
