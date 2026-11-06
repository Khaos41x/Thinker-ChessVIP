import { loadEnvFile } from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

export const commands = [
  {
    type: 1,
    name: "demo",
    description: "Prepare a demonstração com o link do Meet e o Bounty Shield.",
    default_member_permissions: "0",
    integration_types: [0],
    contexts: [0],
    options: [{ type: 3, name: "url", description: "Link do Google Meet para a demonstração.", required: true }],
  },
  {
    type: 1,
    name: "checkout",
    description: "Gere uma cobrança para o plano selecionado.",
    default_member_permissions: "0",
    integration_types: [0],
    contexts: [0],
    options: [{
      type: 3, name: "plano", description: "Plano da cobrança.", required: true,
      choices: [
        { name: "Starter", value: "starter" },
        { name: "Pro", value: "pro" },
        { name: "Elite", value: "elite" },
      ],
    }],
  },
];

type Command = typeof commands[number];

export function matchesCommand(actual: unknown, expected: Command): boolean {
  if (!actual || typeof actual !== "object") return false;
  const value = actual as Record<string, unknown>;
  if (typeof value.id !== "string" || !/^[0-9]{16,22}$/.test(value.id)) return false;
  for (const field of ["type", "name", "description", "default_member_permissions"] as const) {
    if (value[field] !== expected[field]) return false;
  }
  for (const field of ["contexts", "integration_types"] as const) {
    if (JSON.stringify(value[field]) !== JSON.stringify(expected[field])) return false;
  }
  if (!Array.isArray(value.options) || value.options.length !== expected.options.length) return false;
  return expected.options.every((option, index) => {
    const item = (value.options as Record<string, unknown>[])[index];
    if (!item || item.type !== option.type || item.name !== option.name ||
        item.description !== option.description || item.required !== option.required) return false;
    const choices = "choices" in option ? option.choices : [];
    return Array.isArray(item.choices ?? []) &&
      JSON.stringify((item.choices ?? []).map((choice: { name: string; value: string }) => ({ name: choice.name, value: choice.value }))) === JSON.stringify(choices);
  });
}

export async function registerCommands(
  applicationId: string, token: string, fetcher: typeof fetch = fetch,
  log: (message: string) => void = console.log,
): Promise<void> {
  if (!/^[0-9]{16,22}$/.test(applicationId)) throw new Error("DISCORD_APPLICATION_ID ausente ou inválido.");
  if (!token || /\s/.test(token)) throw new Error("DISCORD_BOT_TOKEN ausente ou inválido no .env do Worker.");
  const request = async (path: string, method = "GET", body?: object) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetcher(`https://discord.com/api/v10${path}`, {
        method,
        headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(15000),
      });
      const result: unknown = await response.json().catch(() => null);
      if (response.status === 429 && attempt < 2 && result && typeof result === "object" &&
          "retry_after" in result && typeof result.retry_after === "number" &&
          result.retry_after >= 0 && result.retry_after <= 10) {
        await new Promise(resolve => setTimeout(resolve, Math.ceil(result.retry_after * 1000) + 100));
        continue;
      }
      if (!response.ok) throw new Error(`Discord ${method}: HTTP ${response.status}.`);
      return { status: response.status, result };
    }
    throw new Error("Limite de requisições do Discord atingido.");
  };
  const application = await request("/oauth2/applications/@me");
  if (!application.result || typeof application.result !== "object" ||
      !("id" in application.result) || application.result.id !== applicationId) {
    throw new Error("O Bot Token não pertence ao DISCORD_APPLICATION_ID configurado. Nenhum comando registrado.");
  }
  const path = `/applications/${applicationId}/commands`;
  for (const command of commands) {
    const response = await request(path, "POST", command);
    if (![200, 201].includes(response.status) || !matchesCommand(response.result, command)) {
      throw new Error(`Resposta inesperada ao registrar /${command.name}.`);
    }
    log(`/${command.name}: HTTP ${response.status} ${response.status === 201 ? "Created" : "OK"}`);
  }
  const verification = await request(path);
  if (verification.status !== 200 || !Array.isArray(verification.result) ||
      !commands.every(command => (verification.result as unknown[]).some(actual => matchesCommand(actual, command)))) {
    throw new Error("A consulta final não confirmou os dois comandos com as opções esperadas.");
  }
  log("GET commands: HTTP 200 OK — /demo e /checkout confirmados.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.includes("--dry-run")) {
      console.log(JSON.stringify(commands, null, 2));
    } else {
      loadEnvFile(fileURLToPath(new URL("../.env", import.meta.url)));
      await registerCommands(process.env.DISCORD_APPLICATION_ID ?? "", process.env.DISCORD_BOT_TOKEN ?? "");
    }
  } catch (error) {
    console.error(error instanceof Error && !/fetch|network|request|token=/i.test(error.message)
      ? error.message : "Falha ao registrar comandos no Discord. Confira configuração e conexão.");
    process.exitCode = 1;
  }
}
