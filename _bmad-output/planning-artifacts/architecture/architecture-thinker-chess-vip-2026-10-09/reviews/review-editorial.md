# Editorial gate — Smart Pacing architecture

## Verdict

**PASS WITH FIXES.** The architecture is implementation-ready in structure, but five wording/contract ambiguities should be resolved before freezing DTOs. No broken heading numbering or unbalanced fenced code blocks were found.

## Document Summary

- **Purpose:** help the Thinker Chess owner and implementer build Smart Pacing V2 from stable architectural invariants and an ordered delivery plan.
- **Audience:** project owner and implementation agents/developers.
- **Reader type:** LLM and technical human; precision and dependency-first definitions apply.
- **Structure model:** architecture explanation plus functional implementation plan.
- **Current length:** `ARCHITECTURE-SPINE.md` has 2,466 words across 28 headings; `SOLUTION-DESIGN.md` has 8,836 words across 108 headings.

## Recommendations

### 1. QUESTION — Split response outcome from provenance

**Rationale:** Section 5.3 overloads `source` with provenance (`book`, `engine`, `cache`) and completion state (`partial`, `fallback`, `terminal`, `error`), so clients cannot preserve the original source on a cache hit or partial engine result.

**Minimal fix:** introduce two enums, for example `status: complete | partial | fallback | terminal | error` and `source: forced | book | engine`; represent reuse with `diagnostics.cacheHit` (already present). Update the response example, table, cache prose, and tests together.

**Impact:** ~30–60 added words; eliminates incompatible DTO interpretations.

### 2. QUESTION — Define confidence fields once

**Rationale:** the response schema exposes only `evidence.confidence`, while book rules and tests use undefined `analysisConfidence`; the prose also says provenance confidence may be high, giving one field two meanings.

**Minimal fix:** either add explicit `analysisConfidence` and `provenanceConfidence` fields, or reserve `evidence.confidence` exclusively for analysis coverage and put book provenance confidence in diagnostics. Apply the chosen names to sections 5.2, 5.3, 6.8, 15.1, and the spine convention.

**Impact:** ~10–30 added words; prevents unsafe long-think eligibility from reading the wrong confidence.

### 3. CONDENSE — Make the deep candidate-set rule normative everywhere

**Rationale:** AD-2 and sections 3.6/16 require deep analysis over the union of shallow top-k and the selected move, but section 6.3 says only “manter os mesmos candidatos quando possível,” which permits excluding the selected move and makes `selectedMoveRegret` incomparable.

**Minimal fix:** replace that bullet with: “analisar profundamente a união versionada entre o top-k raso e o lance selecionado; se o tier não puder cobrir a união, retornar `partial` com cobertura explícita e reduzir confidence.”

**Impact:** approximately neutral; removes a direct normative ambiguity.

### 4. MERGE — Clarify the two runtime identities

**Rationale:** `clientSessionToken` governs backend obsolescence, while `runtimeGameToken` governs observation/execution identity, but the request shows only the former and calls it an “opaque-runtime-token”; an implementer may merge them accidentally or be unable to validate the observation lifecycle.

**Minimal fix:** add a short identity table before Request v1 defining owner, lifetime, transport, and purpose for both tokens. If they are intentionally the same value, choose one name throughout; otherwise state that `runtimeGameToken` remains browser-only and is represented server-side solely through `observationKey`.

**Impact:** ~40–70 added words; prevents cancellation scope from leaking across games or tabs.

### 5. CONDENSE — Align draft/final terminology and remove two undefined names

**Rationale:** the document says “proposta pronta para implementação” and presents “Request v1/Response v1,” while Phase 0 says DTO/cache are drafts frozen only after the Komodo spike; it also uses undefined `expectedMovesRemaining` instead of `movesRemainingEstimate`, and the Phase 2 gate says both lenses share one “model” although their models/versions intentionally differ.

**Minimal fix:** label the schemas “proposed v1, frozen after Phase 0”; replace `expectedMovesRemaining` with `conservativeMovesBound(movesRemainingEstimate)`; rewrite the Phase 2 gate as “same plan, position, deadline, and engine generation, with both analyzer/selector configs explicitly versioned.” When accepted, align `status`/`updated` in the spine with the Solution Design header.

**Impact:** ~10–20 added words; makes the freeze point and acceptance gate unambiguous.

## Prose fixes

| Original Text | Revised Text | Changes |
|---|---|---|
| “manter os mesmos candidatos quando possível” | “analisar profundamente a união versionada entre o top-k raso e o lance selecionado; cobertura incompleta retorna `partial` e reduz confidence” | Replaces discretionary wording with the normative candidate-set rule already adopted elsewhere. |
| `recoveryFactor = f(temporalDebtNext, spendableMs, expectedMovesRemaining)` | `recoveryFactor = f(temporalDebtNext, spendableMs, conservativeMovesBound(movesRemainingEstimate))` | Uses the state field and helper already defined in the design. |
| “lance e evidência sempre compartilham position/model/engine generation” | “lance e evidência pertencem ao mesmo plano, posição, deadline e engine generation; as duas configurações e versões são registradas explicitamente” | Removes Portuguese/English ambiguity and avoids falsely implying that the two lenses use one model. |

## Summary

- **Total recommendations:** 5
- **Estimated reduction:** none; these are contract-precision fixes and add roughly 90–180 words.
- **Comprehension trade-offs:** none. Keep the diagnosis, diagrams, phase gates, test matrix, and Definition of Done; they serve implementation and should not be cut before delivery.

## Targeted recheck — 2026-10-10

**Verdict: PASS.** All five blocking recommendations were applied:

1. `source` and `status` are separate response dimensions with distinct tables and DTO fields.
2. `analysisConfidence` and `moveProvenanceConfidence` are explicit, bounded fields with separate semantics in the spine, response, evidence rules, tests, and implementation phase.
3. Deep analysis now mandates the union of shallow top-k and the selected move, with Phase 0 responsible for resolving engine capability before DTO freeze.
4. `clientSessionToken` was removed; `runtimeGameToken` consistently scopes request obsolescence, observation identity, reducer state, API registry, and execution idempotency. Authentication capability remains explicitly separate.
5. Request/response schemas are labeled candidates pending the Komodo spike; the moves-bound formula uses `conservativeMovesBound(movesRemainingEstimate)`; and the Phase 2 gate now names shared plan invariants while preserving distinct, versioned analyzer and selector configurations.

No residual contradiction in these five areas blocks implementation. Heading numbering and fenced code blocks remain structurally valid. The main deliverables were not edited during this recheck.
