# Global slash command registration

Run `pnpm --filter @thinker/commerce-worker discord:register` from the repository root. The TypeScript script loads `apps/commerce-worker/.env`, which must contain `DISCORD_APPLICATION_ID` and `DISCORD_BOT_TOKEN`. Keep the token in that ignored file; never commit or print it. The bot token is distinct from both the public key and the internal checkout bearer token.

Use `pnpm --filter @thinker/commerce-worker discord:register --dry-run` to inspect command payloads without credentials or API calls.

The script checks the token's application ID before mutations, then POSTs each command individually to the global commands endpoint. Other command names remain untouched. A new command returns 201; an upsert can return 200. A final GET must return 200 and contain both expected schemas before success is reported.

Registered commands:

- `/demo url:<string>`: required Meet URL.
- `/checkout plano:<choice>`: required Starter, Pro, or Elite choice; API values are `starter`, `pro`, and `elite`.

Commands are available only in server contexts and guild installations. `default_member_permissions: "0"` restricts them to administrators until a server administrator explicitly grants Davy's role access in Server Settings → Integrations → Thinker Ops. The application must be installed in the intended server with the `applications.commands` scope. This registration does not install the application.

This step registers the command definitions only. The existing Worker handles PING and the checkout message button; slash command interactions (`type: 2`) still need dedicated handlers, sales authorization, demo/Bounty Shield behavior, and plan mapping before they perform business operations.

Reference: [Discord application commands](https://github.com/discord/discord-api-docs/blob/main/developers/interactions/application-commands.mdx).
