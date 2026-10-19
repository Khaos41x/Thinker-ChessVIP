import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const userscript = readFileSync(resolve(process.cwd(), '..', 'script.js'), 'utf8');
const startMarker = '/* THINKER_EVAL_BAR_V2_GENERATED_START */';
const endMarker = '/* THINKER_EVAL_BAR_V2_GENERATED_END */';
const generated = userscript.slice(
  userscript.indexOf(startMarker),
  userscript.indexOf(endMarker) + endMarker.length,
);

describe('Eval Bar V2 userscript artifact', () => {
  it('contains one self-contained generated IIFE without runtime imports', () => {
    expect(userscript.split(startMarker)).toHaveLength(2);
    expect(userscript.split(endMarker)).toHaveLength(2);
    expect(generated).toContain('globalThis.ThinkerEvalBarV2');
    expect(generated).not.toMatch(/\bimport\s*\(/);
    expect(generated).not.toContain('from "');
  });

  it('declares style injection, feature flag and fail-closed authorization wiring', () => {
    expect(userscript).toContain('// @grant        GM_addStyle');
    expect(userscript).toContain('localStorage.getItem("evalBarV2") !== "false"');
    expect(userscript).toContain('if (!evalBarAuthorization()) return null;');
    expect(userscript).toContain('globalThis.krypbotSetEvalBarV2');
    expect(userscript).toContain('globalThis.krypbotEvalBarDiagnostics');
    expect(userscript).toContain('shouldDisplay: evalBarPresentationAllowed');
    expect(userscript).toContain('readChessComFen?.(board)');
    expect(userscript).toContain('if (evalBarV2Enabled) {');
    expect(userscript).toContain('function injectEvalBarDOM()');
    expect(userscript).not.toContain('container.style.display = "flex"');
  });
});
