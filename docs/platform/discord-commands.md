# Global slash command registration

Run `pnpm --filter @thinker/commerce-worker discord:register` from the repository root. The TypeScript script loads `apps/commerce-worker/.env`, which must contain `DISCORD_APPLICATION_ID` and `DISCORD_BOT_TOKEN`. Keep the token in that ignored file; never commit or print it. The bot token is distinct from both the public key and the internal checkout bearer token.

Use `pnpm --filter @thinker/commerce-worker discord:register --dry-run` to inspect command payloads without credentials or API calls.

The script checks the token's application ID before mutations, then POSTs each command individually to the global commands endpoint. Other command names remain untouched. A new command returns 201; an upsert can return 200. A final GET must return 200 and contain both expected schemas before success is reported.

Registered commands:

- `/demo url:<string>`: required Meet URL.
- `/checkout plano:<choice>`: required Starter, Pro, or Elite choice; API values are `starter`, `pro`, and `elite`.

Commands are available only in server contexts and guild installations. `default_member_permissions: "0"` restricts them to administrators until a server administrator explicitly grants Davy's role access in Server Settings → Integrations → Thinker Ops. The application must be installed in the intended server with the `applications.commands` scope. This registration does not install the application.

The Worker handles signed slash command interactions (`type: 2`) in addition to PING and the checkout message button. Commands require an active staff identity in `discord_staff_members`, scoped to the exact Discord server and user. Granting access to a command in Discord alone does not grant backend access.

## Staff, tickets, and prices

Migration `0005_discord_sales_commands.sql` adds three configuration tables with foreign keys:

- `discord_staff_members`: server/user → active `staff_users` identity. Roles remain `sales` or `founder` in `staff_users`.
- `discord_ticket_channels`: server/channel → existing commercial ticket. Use the buyer's restricted ticket channel for customer-facing messages.
- `discord_checkout_plans`: `starter`, `pro`, or `elite` → active plan version and exact BTC price in integer satoshis. 0.0031 BTC is 310000 satoshis.

An administrator must populate these mappings with verified IDs and approved plan prices. No live mappings or unapproved prices are auto-created. The original mock plan and ticket are not assigned to real Discord buyers by this migration.

For `/demo`, provide an HTTPS Google Meet URL of the form `https://meet.google.com/abc-defg-hij`, without credentials, query parameters, or fragments. The public response includes the security protocol and meeting link, with mentions disabled. `@Miguel` is literal text because his Discord user ID has not been provided.

For `/checkout`, sales may only charge tickets assigned to their staff identity; founders may charge any mapped ticket in their registered server. The order insert rechecks authorization, channel mapping, and the approved price inside the same D1 batch that reserves the address. Payment instructions appear in the ticket channel. The exact BTC amount is persisted on the order; repeated delivery of an interaction returns the same order/address. Catalog changes that conflict with an existing interaction return an error instead of changing its payment instructions.

The order remains draft/unpaid, following the existing checkout contract. This phase does not observe blockchain payments, advance commercial state, or issue licenses. If processing takes longer than 1.8 seconds, the Worker acknowledges first and then updates the original Discord response in the background.

Until staff, channel, and catalog configuration is provided, the deployed handlers return a private setup message and allocate no BTC address. Validate with `pnpm --filter @thinker/commerce-worker typecheck`, `test`, and `build`; tests exercise signatures, disabled/unknown staff, server isolation, Meet validation, ticket ownership, founder access, stored prices, replay, concurrent delivery, and pool exhaustion using isolated fixtures.

Reference: [Discord application commands](https://github.com/discord/discord-api-docs/blob/main/developers/interactions/application-commands.mdx).

## Slash handler rollout

Migration 0005 was applied to remote D1 and Worker version `c2a8c11b-3081-4ef1-996f-f3cac399d1e1` was published. TypeScript, 19 tests, and the build passed. Production health returned 200 and an unsigned interaction returned 401. The Discord bot guild query returned 200 with an empty list: Thinker Ops had not yet been installed in a server. Real staff IDs, ticket channel mapping, and approved plan catalog mappings remain pending; only the earlier mock plan/ticket exists in remote D1. The handlers are deployed, but no live slash checkout has been performed.
