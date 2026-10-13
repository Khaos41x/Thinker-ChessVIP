import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const source = resolve(root, 'node_modules', '@lichess-org', 'stockfish-web');
const target = resolve(root, 'public', 'engine');
const assets = ['sf_19_smallnet.js', 'sf_19_smallnet.wasm'];
const network = 'nn-61e7af4bb97d.nnue';
const networkUrl = `https://tests.stockfishchess.org/api/nn/${network}`;
const networkBytes = 1166381;
const networkSha256 = '61e7af4bb97d51eeeb25d322916f86513b5cd3a827ce189c98c6e31946f99e5b';

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function validNetwork(path) {
  if (!(await exists(path))) return false;
  const content = await readFile(path);
  if (content.byteLength !== networkBytes) return false;
  return createHash('sha256').update(content).digest('hex') === networkSha256;
}

await mkdir(target, { recursive: true });

for (const asset of assets) {
  await copyFile(resolve(source, asset), resolve(target, asset));
}
await copyFile(resolve(root, 'THIRD_PARTY_NOTICES.txt'), resolve(target, 'THIRD_PARTY_NOTICES.txt'));

const networkPath = resolve(target, network);
if (!(await validNetwork(networkPath))) {
  await rm(networkPath, { force: true });
  const partialPath = `${networkPath}.part`;
  try {
    const response = await fetch(networkUrl);
    if (!response.ok) throw new Error(`NNUE download failed: ${response.status} ${response.statusText}`);
    await writeFile(partialPath, new Uint8Array(await response.arrayBuffer()));
  } catch (error) {
    const curlArgs = ['--fail', '--location', '--silent', '--show-error'];
    if (process.platform === 'win32') curlArgs.push('--ssl-no-revoke');
    curlArgs.push('--output', partialPath, networkUrl);
    const curl = spawnSync('curl', curlArgs, {
      stdio: 'inherit',
    });
    if (curl.status !== 0) {
      await rm(partialPath, { force: true });
      throw error;
    }
  }
  const downloaded = await stat(partialPath);
  if (downloaded.size !== networkBytes || !(await validNetwork(partialPath))) {
    await rm(partialPath, { force: true });
    throw new Error(`NNUE integrity check failed: ${downloaded.size} bytes`);
  }
  await rename(partialPath, networkPath);
}

console.log(`Stockfish Web assets ready in ${target}`);
