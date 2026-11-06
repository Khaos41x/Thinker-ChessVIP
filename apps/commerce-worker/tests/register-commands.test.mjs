import assert from "node:assert/strict";
import { test } from "node:test";
import { commands, registerCommands } from "../scripts/register-commands.ts";

const appId = "1568055047852662937";
const registered = commands.map((command, index) => ({ ...command, id: String(1568055047852662938n + BigInt(index)) }));

test("registration upserts only the two requested global commands and verifies them with GET", async () => {
  const calls = [];
  const logs = [];
  const fetcher = async (url, options) => {
    calls.push({ url, ...options });
    assert.equal(options.headers.Authorization, "Bot fixture-token");
    if (url.endsWith("/oauth2/applications/@me")) return Response.json({ id: appId });
    assert.equal(url, `https://discord.com/api/v10/applications/${appId}/commands`);
    if (options.method === "POST") {
      const command = JSON.parse(options.body);
      assert.deepEqual(command, commands[calls.length - 2]);
      return Response.json(registered.find(item => item.name === command.name), { status: command.name === "demo" ? 201 : 200 });
    }
    return Response.json([...registered, { id: "999999999999999999", name: "untouched" }]);
  };
  await registerCommands(appId, "fixture-token", fetcher, message => logs.push(message));
  assert.deepEqual(calls.map(call => call.method), ["GET", "POST", "POST", "GET"]);
  assert.match(logs.at(-1), /HTTP 200 OK/);
  assert.deepEqual(commands[0].options.map(option => [option.name, option.type, option.required]), [["url", 3, true]]);
  assert.deepEqual(commands[1].options[0].choices.map(choice => choice.name), ["Starter", "Pro", "Elite"]);
  assert.ok(commands.every(command => command.default_member_permissions === "0"));
});

test("missing token or mismatched application prevents all command mutations", async () => {
  let calls = 0;
  const fetcher = async () => { calls++; return Response.json({ id: "999999999999999999" }); };
  await assert.rejects(registerCommands(appId, "", fetcher), /DISCORD_BOT_TOKEN/);
  assert.equal(calls, 0);
  await assert.rejects(registerCommands(appId, "fixture-token", fetcher), /não pertence/);
  assert.equal(calls, 1);
});

test("failed or incomplete Discord responses never report successful verification", async () => {
  for (const failure of ["unauthorized", "missing-choice"]) {
    const logs = [];
    let calls = 0;
    const fetcher = async (url, options) => {
      calls++;
      if (failure === "unauthorized") return Response.json({ token: "must-not-appear" }, { status: 401 });
      if (url.endsWith("/@me")) return Response.json({ id: appId });
      if (options.method === "POST") return Response.json(registered.find(command => command.name === JSON.parse(options.body).name));
      return Response.json([registered[0], { ...registered[1], options: [{ ...registered[1].options[0], choices: [] }] }]);
    };
    await assert.rejects(registerCommands(appId, "fixture-token", fetcher, message => logs.push(message)),
      failure === "unauthorized" ? /^Error: Discord GET: HTTP 401\.$/ : /consulta final/);
    assert.equal(logs.some(message => message.includes("confirmados")), false);
    if (failure === "unauthorized") assert.equal(calls, 1);
  }
});
