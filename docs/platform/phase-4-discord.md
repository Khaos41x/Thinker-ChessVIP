# Phase 4 — Discord interactions

Public endpoint: `POST https://thinker-commerce-worker.kkdealface.workers.dev/interactions`.

## Configuration

1. In Discord Developer Portal, open Applications → the bot application → General Information. Copy Public Key (64 hexadecimal characters).
2. From `apps/commerce-worker`, run `pnpm exec wrangler secret put DISCORD_PUBLIC_KEY` and paste that public key. The existing `DISCORD_CHECKOUT_TOKEN` remains required for checkout allocation.
3. Save the public endpoint in **Interactions Endpoint URL** in the Discord application. Discord sends a signed PING; the Worker returns `{"type":1}`. An unconfigured key returns 503; invalid signatures return 401.

Signature verification uses native Ed25519 over the timestamp followed by the original body bytes, before parsing JSON or querying D1. Bodies are limited to 64 KiB; timestamps older than 300 seconds or over 30 seconds in the future are rejected.

## Trusted checkout context

The button must have `custom_id: btn_generate_checkout` and component type 2. A trusted bot/backend must register the buyer's Discord user ID and the ID of the message containing the button in `discord_checkout_contexts`, linked to the corresponding valid ticket and active plan version. Both Discord IDs must match the signed interaction. No client-supplied ticket, price, or plan is trusted.

The following SQL is a template. Replace all four placeholders with the actual identifiers before execution; do not use the shared mock ticket for live buyers.

```sql
INSERT INTO discord_checkout_contexts (
  discord_user_id, discord_message_id, ticket_id, plan_version_id,
  expected_btc_sats, active, created_at
) VALUES (
  '<BUYER_DISCORD_USER_ID>', '<BUTTON_MESSAGE_ID>', '<TICKET_ID>', '<PLAN_VERSION_ID>',
  310000, 1, CAST(strftime('%s', 'now') AS INTEGER) * 1000
);
```

An unknown or inactive context receives a private explanation without allocating an address. Context registration is currently an administrative D1 operation; this phase does not implement the bot that creates tickets or posts buttons.

## Response and allocation

The interaction ID is the checkout idempotency key. The shared checkout function atomically creates the order and reserves one active mainnet address. It rejects empty addresses and persists `btc_due_sats = 310000`, matching the displayed **0.0031 BTC**. Replay returns the same order; distinct clicks have distinct interaction IDs and can create separate orders.

The response is a private type 4 message with a gold embed, BTC address, amount, order ID, and **Aguardando confirmação na rede**. This text describes the pending payment; it does not confirm a payment or grant a license.

If checkout takes longer than 1.8 seconds from handler entry, the Worker first replies privately that checkout is being generated. It completes work with `waitUntil` and PATCHes the original interaction message using the signed payload's application ID and interaction token. Logs exclude the token and response bodies.

## Validation

Run `pnpm --filter @thinker/commerce-worker typecheck`, `test`, and `build`. Miniflare tests use generated local Ed25519 keys and isolated D1 fixtures, including signature tampering, timestamps, PING, context isolation, private embeds, BTC amount persistence, idempotency, concurrency, and slow-response delivery. Tests do not contact real Discord webhooks or allocate production addresses.

Protocol references: [Discord interaction overview](https://github.com/discord/discord-api-docs/blob/main/developers/interactions/overview.mdx) and [receiving/responding](https://github.com/discord/discord-api-docs/blob/main/developers/interactions/receiving-and-responding.mdx).

## Initial rollout

Migration `0004_discord_checkout_contexts.sql` was applied to remote D1. Worker version `d3f836ac-c6ec-43d9-bb78-1439f767bc97` was published. Production checks returned 200 from `/health`, 401 from an unauthenticated `/checkout`, and 503 from `/interactions` while the real Discord public key was still pending. The production pool remained at 20 addresses, 19 available; no live Discord contexts had been registered. The signed PING handshake must be completed in the Discord Portal after configuring the real public key.

The real application public key was subsequently configured through the `DISCORD_PUBLIC_KEY` Worker secret. Production checks then returned 200 from `/health` and 401 from an unsigned `/interactions` request. Saving the endpoint in the Discord Portal is still required to verify a genuinely Discord-signed PING.

## Thinker Ops activation

Application **Thinker Ops** (`1568055047852662937`) replaces the initial Thinker Chess application for this Worker. Its public key and application ID are stored in the ignored `apps/commerce-worker/.env` and in the Worker configuration as `DISCORD_PUBLIC_KEY` and `DISCORD_APPLICATION_ID` secrets. The application ID is recorded for integration setup; the handler currently validates requests through the public key.

The installation link was set to **None**, as required by Discord for private applications, and **Public Bot** was disabled and saved successfully. The bot user already existed on opening the Bot page, so no token reset was needed.

Worker version `9cd41b18-de95-43eb-8a80-5402bf0b2860` was deployed with the new public key. Saving the `/interactions` URL in the Thinker Ops General Information page succeeded: Discord accepted its signed PING/PONG handshake and displayed the success notice that all edits were recorded. No live button message or buyer checkout context was created in this setup step.
