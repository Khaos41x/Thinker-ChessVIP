import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const file = join(root, 'script.js');
const source = await readFile(file, 'utf8');
const artwork = await readFile(join(root, 'assets/banner-horse.webp'));
if (artwork.length >= 40000) throw new Error('Prepared horse exceeds 40 KB');
const uri = 'data:image/webp;base64,' + artwork.toString('base64');
const markup = 'const bannerHtml = `\n' +
  '      <div id="thinker-chess-banner" style="position:absolute!important;left:-9999px;top:0;z-index:2147483000;pointer-events:none;display:none;align-items:center;justify-content:center;overflow:hidden;background:#252523;border:1px solid #3A3A36;border-radius:8px;box-shadow:none;box-sizing:border-box;padding:12px;container-type:size;transition:none!important;">\n' +
  '        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:round(nearest,0.6em,2px);font-size:clamp(12px,13cqw,28px);width:100%;min-width:0;">\n' +
  '          <img data-artwork="banner-horse.webp" src="' + uri + '" alt="Thinker Chess horse" style="display:block;flex:0 0 auto;width:round(down,min(50cqw,70px,17cqh),2px);height:auto;max-width:60%;max-height:34cqh;object-fit:contain;">\n' +
  '          <div class="tc-banner-title" style="width:100%;min-width:0;color:#FFFFFF;text-align:center;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:inherit;font-weight:700;letter-spacing:0;line-height:round(nearest,1.1em,2px);white-space:normal;">Thinker Chess</div>\n' +
  '        </div>\n' +
  '      </div>\n' +
  '    `;';
const start = source.indexOf('const bannerHtml = `');
const end = source.indexOf('`;', start) + 2;
if (start < 0 || end < start) throw new Error('Banner template not found');
const next = source.slice(0, start) + markup + source.slice(end);
if (process.argv.includes('--check')) {
  if (source !== next) throw new Error('Embedded banner WebP is stale');
  console.log(`Embedded WebP matches prepared asset (${artwork.length} bytes); userscript ${Buffer.byteLength(next)} bytes`);
} else if (next !== source) {
  await writeFile(file, next, 'utf8');
  console.log(`Banner updated: ${Buffer.byteLength(source)} → ${Buffer.byteLength(next)} bytes`);
}
