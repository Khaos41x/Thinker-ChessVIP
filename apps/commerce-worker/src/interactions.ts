import { checkout, type CheckoutEnv } from "./checkout.ts";

export interface InteractionsEnv extends CheckoutEnv {
  DISCORD_PUBLIC_KEY?: string;
  DISCORD_APPLICATION_ID?: string;
}

interface DiscordInteraction {
  id?: string;
  application_id?: string;
  token?: string;
  type?: number;
  guild_id?: string;
  channel_id?: string;
  data?: {
    custom_id?: string; component_type?: number; name?: string; type?: number;
    options?: { name?: string; type?: number; value?: unknown }[];
  };
  member?: { user?: { id?: string } };
  user?: { id?: string };
  message?: { id?: string };
}

interface CheckoutContext {
  ticket_id: string;
  plan_version_id: string;
  expected_btc_sats: number;
}

interface MessageData {
  flags: number;
  allowed_mentions: { parse: string[] };
  content?: string;
  embeds?: object[];
}

const encoder = new TextEncoder();
const snowflake = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9]{16,22}$/.test(value);

const privateMessage = (content: string): MessageData => ({
  flags: 64, content, allowed_mentions: { parse: [] },
});

function hexBytes(value: string): Uint8Array {
  return Uint8Array.from(value.match(/../g) ?? [], part => Number.parseInt(part, 16));
}

async function signedBody(request: Request): Promise<Uint8Array | null> {
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > 65536) {
        await reader.cancel();
        return null;
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

async function buttonCheckout(
  interaction: DiscordInteraction, env: InteractionsEnv, headers: HeadersInit,
): Promise<MessageData> {
  const userId = interaction.member?.user?.id ?? interaction.user?.id;
  const messageId = interaction.message?.id;
  if (!snowflake(interaction.id) || !snowflake(userId) || !snowflake(messageId)) {
    return privateMessage("Não foi possível identificar este atendimento.");
  }
  try {
    const context = await env.DB.prepare(`
      SELECT ticket_id, plan_version_id, expected_btc_sats
      FROM discord_checkout_contexts
      WHERE discord_user_id = ? AND discord_message_id = ? AND active = 1
    `).bind(userId, messageId).first<CheckoutContext>();
    if (!context || context.expected_btc_sats !== 310000) {
      return privateMessage("Este botão ainda não está vinculado ao seu atendimento. Fale com a equipe Thinker.");
    }
    if (!env.DISCORD_CHECKOUT_TOKEN) {
      return privateMessage("O checkout está temporariamente indisponível. Tente novamente em instantes.");
    }
    const request = new Request("https://commerce.internal/checkout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.DISCORD_CHECKOUT_TOKEN}`,
        "Content-Type": "application/json",
        "Idempotency-Key": interaction.id,
      },
      body: JSON.stringify({ ticketId: context.ticket_id, planVersionId: context.plan_version_id }),
    });
    const response = await checkout(request, env, headers, context.expected_btc_sats);
    if (!response.ok) {
      return privateMessage(response.status === 409
        ? "Não foi possível reservar seu checkout. Peça à equipe para conferir o atendimento e a disponibilidade."
        : "O checkout está temporariamente indisponível. Tente novamente em instantes.");
    }
    const order = await response.json<{ orderId: string; btcAddress: string }>();
    return {
      flags: 64,
      allowed_mentions: { parse: [] },
      embeds: [{
        title: "✦ THINKER CHESS · ELITE",
        description: "Aguardando confirmação na rede",
        color: 0xd4af37,
        fields: [
          { name: "Valor", value: "**0.0031 BTC**", inline: true },
          { name: "Rede", value: "Bitcoin · Mainnet", inline: true },
          { name: "Endereço BTC", value: `\`${order.btcAddress}\`` },
          { name: "Order ID", value: `\`${order.orderId}\`` },
        ],
        footer: { text: "Thinker Atlas · Pagamento em Bitcoin" },
      }],
    };
  } catch {
    return privateMessage("O checkout está temporariamente indisponível. Tente novamente em instantes.");
  }
}

async function finishResponse(
  interaction: DiscordInteraction, result: Promise<MessageData>, flags = 64,
): Promise<void> {
  const data = await result;
  const url = `https://discord.com/api/v10/webhooks/${interaction.application_id}/${encodeURIComponent(interaction.token!)}/messages/@original`;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise(resolve => setTimeout(resolve, attempt * 400));
    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, flags, content: data.content ?? "" }),
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) return;
      if (![404, 429, 500, 502, 503, 504].includes(response.status)) break;
    } catch {
      continue;
    }
  }
  console.error("Discord checkout response delivery failed");
}

function commandOption(interaction: DiscordInteraction, name: string): string | null {
  const options = interaction.data?.options;
  if (!Array.isArray(options) || options.length !== 1) return null;
  const option = options[0];
  return option?.name === name && option.type === 3 && typeof option.value === "string" ? option.value : null;
}

async function slashCommand(
  interaction: DiscordInteraction, env: InteractionsEnv, headers: HeadersInit,
): Promise<MessageData> {
  const { guild_id: guildId, channel_id: channelId } = interaction;
  const userId = interaction.member?.user?.id;
  if (!snowflake(interaction.id) || !snowflake(guildId) || !snowflake(channelId) || !snowflake(userId) ||
      interaction.data?.type !== 1) return privateMessage("Use this command in your authorized sales server.");
  if (!["demo", "checkout"].includes(interaction.data.name ?? "")) return privateMessage("Unknown command.");
  try {
    const staff = await env.DB.prepare(`
      SELECT s.id, s.role FROM discord_staff_members dm
      JOIN staff_users s ON s.id = dm.staff_user_id AND s.active = 1
      WHERE dm.guild_id = ? AND dm.discord_user_id = ? AND dm.active = 1
    `).bind(guildId, userId).first<{ id: string; role: string }>();
    if (!staff) return privateMessage("Your sales access is not configured for this server. Contact the founder.");
    if (interaction.data.name === "demo") {
      const value = commandOption(interaction, "url");
      let meet: URL;
      try {
        meet = new URL(value ?? "");
        if (meet.protocol !== "https:" || meet.hostname !== "meet.google.com" || meet.username || meet.password ||
            meet.port || !/^\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(meet.pathname) || meet.search || meet.hash) throw new Error();
      } catch {
        return privateMessage("Provide a Google Meet link such as https://meet.google.com/abc-defg-hij.");
      }
      return {
        flags: 0, allowed_mentions: { parse: [] },
        embeds: [{
          title: "🚨 SECURITY PROTOCOL - READ BEFORE THE DEMO",
          description: "The specialist will demonstrate the software. Sending BTC wallet addresses during calls is STRICTLY PROHIBITED. If the salesperson requests payment during the call, report it to @Miguel to receive a lifetime Elite License and have the employee dismissed immediately.",
          color: 0xe5484d,
          fields: [{ name: "Join the demo", value: meet.href }],
          footer: { text: "Thinker Ops · Bounty Shield" },
        }],
      };
    }
    const plan = commandOption(interaction, "plano");
    if (!plan || !["starter", "pro", "elite"].includes(plan)) return privateMessage("Choose Starter, Pro, or Elite.");
    const context = await env.DB.prepare(`
      SELECT t.id AS ticket_id, dp.plan_version_id, dp.btc_due_sats
      FROM discord_ticket_channels dc
      JOIN tickets t ON t.id = dc.ticket_id AND t.status IN ('open', 'qualified', 'awaiting_payment')
      JOIN discord_checkout_plans dp ON dp.plan_key = ? AND dp.active = 1
      JOIN plan_versions p ON p.id = dp.plan_version_id AND p.active = 1
      WHERE dc.guild_id = ? AND dc.channel_id = ? AND dc.active = 1
        AND (? = 'founder' OR t.assigned_sales_id = ?)
    `).bind(plan, guildId, channelId, staff.role, staff.id)
      .first<{ ticket_id: string; plan_version_id: string; btc_due_sats: number }>();
    if (!context || !Number.isSafeInteger(context.btc_due_sats) || context.btc_due_sats <= 0 ||
        context.btc_due_sats > 2100000000000000) {
      return privateMessage("Checkout is not configured for this ticket and plan, or the ticket belongs to another salesperson. Contact the founder.");
    }
    if (!env.DISCORD_CHECKOUT_TOKEN) return privateMessage("Checkout is temporarily unavailable.");
    const response = await checkout(new Request("https://commerce.internal/checkout", {
      method: "POST", headers: {
        Authorization: `Bearer ${env.DISCORD_CHECKOUT_TOKEN}`,
        "Content-Type": "application/json", "Idempotency-Key": interaction.id,
      },
      body: JSON.stringify({ ticketId: context.ticket_id, planVersionId: context.plan_version_id }),
    }), env, headers, context.btc_due_sats, { guildId, channelId, userId, planKey: plan });
    if (!response.ok) return privateMessage(response.status === 409
      ? "Checkout could not be reserved. Check ticket eligibility and address availability."
      : "Checkout is temporarily unavailable. Please try again shortly.");
    const order = await response.json<{ orderId: string; btcAddress: string }>();
    const amount = `${Math.floor(context.btc_due_sats / 100000000)}.${String(context.btc_due_sats % 100000000).padStart(8, "0")}`;
    return {
      flags: 0, allowed_mentions: { parse: [] },
      embeds: [{
        title: `Order #${order.orderId}`,
        description: `Send exactly **${amount} BTC** to this address:\n\`${order.btcAddress}\`\n\nWaiting for blockchain confirmation... ⏳`,
        color: 0xd4af37,
        fields: [{ name: "Plan", value: plan[0]!.toUpperCase() + plan.slice(1), inline: true },
          { name: "Network", value: "Bitcoin · Mainnet", inline: true }],
        footer: { text: "Thinker Ops · Payment in Bitcoin" },
      }],
    };
  } catch {
    return privateMessage("This operation is temporarily unavailable. Please try again shortly.");
  }
}

export async function interactions(
  request: Request, env: InteractionsEnv, headers: HeadersInit, ctx?: ExecutionContext,
): Promise<Response> {
  const started = Date.now();
  const json = (body: object, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (!env.DISCORD_PUBLIC_KEY || !/^[a-f0-9]{64}$/i.test(env.DISCORD_PUBLIC_KEY)) {
    return json({ error: "interactions_unavailable" }, 503);
  }
  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");
  if (!signature || !/^[a-f0-9]{128}$/i.test(signature) || !timestamp || !/^[0-9]{1,12}$/.test(timestamp)) {
    return json({ error: "invalid_signature" }, 401);
  }
  const age = Date.now() / 1000 - Number(timestamp);
  if (age > 300 || age < -30) return json({ error: "invalid_signature" }, 401);
  const body = await signedBody(request);
  if (!body) return json({ error: "request_too_large" }, 413);
  try {
    const key = await crypto.subtle.importKey("raw", hexBytes(env.DISCORD_PUBLIC_KEY), "Ed25519", false, ["verify"]);
    const prefix = encoder.encode(timestamp);
    const message = new Uint8Array(prefix.byteLength + body.byteLength);
    message.set(prefix);
    message.set(body, prefix.byteLength);
    if (!await crypto.subtle.verify("Ed25519", key, hexBytes(signature), message)) {
      return json({ error: "invalid_signature" }, 401);
    }
  } catch {
    return json({ error: "invalid_signature" }, 401);
  }
  let interaction: DiscordInteraction;
  try {
    const parsed: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(body));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid interaction");
    interaction = parsed as DiscordInteraction;
  } catch {
    return json({ error: "invalid_interaction" }, 400);
  }
  if (interaction.type === 1) return json({ type: 1 });
  if (env.DISCORD_APPLICATION_ID && interaction.application_id !== env.DISCORD_APPLICATION_ID) {
    return json({ error: "invalid_application" }, 401);
  }
  const isSlash = interaction.type === 2;
  if (!isSlash && (interaction.type !== 3 || interaction.data?.component_type !== 2 ||
      interaction.data.custom_id !== "btn_generate_checkout")) {
    return json({ type: 4, data: privateMessage("Esta interação não está disponível.") });
  }
  const result = isSlash ? slashCommand(interaction, env, headers) : buttonCheckout(interaction, env, headers);
  if (ctx && snowflake(interaction.application_id) && typeof interaction.token === "string" &&
      interaction.token.length > 0 && interaction.token.length <= 2048) {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const response = await Promise.race([
      result,
      new Promise<null>(resolve => { timeout = setTimeout(() => resolve(null), Math.max(0, 1800 - (Date.now() - started))); }),
    ]);
    if (timeout !== undefined) clearTimeout(timeout);
    if (response) return json({ type: 4, data: response });
    ctx.waitUntil(finishResponse(interaction, result, isSlash ? 0 : 64));
    return json({ type: 4, data: isSlash
      ? { flags: 0, allowed_mentions: { parse: [] }, content: "Preparing your response. Please wait…" }
      : privateMessage("Gerando seu checkout. Aguarde um instante…") });
  }
  return json({ type: 4, data: await result });
}
