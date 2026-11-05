# Phase 3 checkout

The Discord bot calls `POST /checkout` from its backend. Send `Authorization: Bearer <DISCORD_CHECKOUT_TOKEN>`, `Content-Type: application/json`, and the Discord interaction ID as `Idempotency-Key`. The body is `{"ticketId":"…","planVersionId":"…"}`. Retries of the same interaction must keep the same key and body.

A new reservation returns HTTP 201 and `{"orderId":"<uuid>","btcAddress":"<address>"}`. An identical retry returns the same data with HTTP 200. A reused key with a different body returns HTTP 409. A checkout requires an eligible ticket with an active assigned sales owner, an active plan version, and an unused address in the active mainnet wallet. Missing eligibility or inventory returns HTTP 409. Invalid input returns HTTP 400, invalid credentials return HTTP 401, and internal or configuration errors return HTTP 503.

The order stays in `draft`. Its fiat amount comes from the plan in D1. Quote, amount in satoshis, and payment instructions belong to invoice creation. Keep the bearer token in the bot's secret store and omit it from Discord messages and logs.

The deployment uses a Worker secret named `DISCORD_CHECKOUT_TOKEN`. Its handoff copy is encrypted for the deploying Windows user in `%LOCALAPPDATA%\ThinkerAtlas\discord-checkout-token.clixml`. Import it with `Import-Clixml` from that Windows account when provisioning the Discord bot's secret store.

The pool selector excludes empty and space-only addresses before creating an order. Regression coverage places both malformed rows ahead of valid addresses and verifies they remain unused while valid reservations succeed.

The approved remote D1 smoke test uses plan `mock-elite-v1-20261105`, ticket `mock-checkout-ticket-20261105`, a fixture customer and a fixture sales owner. The plan is `ELITE_MOCK`, active, 30 days, BRL 1.00. The existing catalog stores fiat minor units, so this fixture does not encode the suggested BTC 0.0031 price. The imported manual mainnet wallet was activated so its supplied addresses qualify for allocation.

The corrected Worker ran locally through Wrangler with a temporary remote D1 binding and a local fixture authentication token. `POST /checkout` with idempotency key `mock-smoke-20261105-01` returned HTTP 201. Repeating the same body and key returned HTTP 200 with identical order and address. The D1 console then confirmed one test order, one assigned address with `is_used = 1`, 19 remaining free addresses, and zero foreign-key errors. The test order remains a draft and unpaid. Temporary seed SQL, request results and screenshot evidence are under Git-ignored `.wrangler/checkout-*` files.

The correction was published to `thinker-commerce-worker` as version `d9aa000c-dc2d-477c-ac7b-530ec5989e6a`. Worker tests and TypeScript passed before publication.
