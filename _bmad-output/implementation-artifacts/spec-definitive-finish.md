---
title: 'Definitive console, External Config and recommendation-arrow finish'
type: bugfix
created: '2026-10-24'
status: in-review
baseline_commit: d31745d
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="User authorizes implementation in separately revertible blocks and specifies approval boundaries">

## Intent

**Problem:** Recommendation arrows are reported absent on the installed client. Console and External Config contain misaligned control rows, inconsistent primitives, click-focus halos and small text. Arrow color is disconnected from its stored control.

**Approach:** Measure the untouched current components first. Trace the actual recommendation pipeline and history before changing it. Implement only confirmed defects in blocksA–I with one local commit per block, keeping authenticated execution separate from isolated rendering evidence. Preserve colors and copy except the explicitly approved Theme→Arrow Color rename.

## Boundaries & Constraints

**Always:** Preserve3desktop columns, container breakpoint1034px,12px gaps/symmetric margins/top inset,0px desktop bottom differences Visuals/Engine and Scout/AutoPlay. Keep existing color values for every component; only configured arrows and their swatch change. Keep1px borders, tokens, IDs/storage, AutoRating↔Strength coupling, SmartPacing hiding Timing only, geometry/layer/opacity0.8 arrows, banner responsiveness and below96px hiding. Row height is one even --row-h36–40px, contents centered exactly, with at most8px between sections. EmptyScout and hiddenTiming exceptions allow tails while preserving aligned bottoms. Use deterministic generated bundles. No remote push.

**Ask First:** Any copy change except Theme→ArrowColor; any removal of Theme effects beyond arrows; Timing inputs below64px and any separate-row segmented proposal; impossible spacing/contrast/color conflicts. User subsequently authorizes detaching .myhigh only after computedgreen/blue comparison and freezing the current defaultgreen appearance. User declines a separate Timing row: measure same-row54px/new-row+40px/compact-gap64px alternatives; apply only a height-neutral1086px solution if it fits;1280px+ unchanged.

**Never:** Weaken execution authorization, fabricate a real Chess.com reproduction, change engine behavior/matchmaking/automation, reset unrelated saved choices, recolor component accents, add decorative glow/gradient/shadows, change data/history/copy without approval, or overwrite unrelated dirty work.

## I/O & Edge-Case Matrix

| State | Required outcome |
|---|---|
| BotOFF / unauthorized or opponent turn | Existing gates retained; report why no recommendation without bypass |
| Valid recommended move | Correct board-owned arrow, storedcolor, opacity0.8 and existing orientation geometry |
| Swatch edit at either surface | Arrowfill updates immediately; every other computed component color and frozenhighlight stays unchanged |
| Default desktop | Center deviations0px, rowheightuniform,12px tails and aligned bottoms |
| SmartPacingON | Timinghidden, Togglesvisible, leftcolumnstable, Enginebottomaligned, acceptedtail |
| Empty/populatedScout | Genuineexistingrenderer data, topanchor, readable11px+ text; emptytailaccepted |
| Mouse/keyboardfocus | No clickring; Tab-only discreetneutral1px border without geometryshift |
| NarrowTiming | Measure64pxfit while preserving height; no separate-row implementation without permission |

</frozen-after-approval>

## Code Map

- `script.js` — existing raw console/pipeline/Scout/banner markup and behavior; generated regions must rebuild from source.
- `frontend/eval_bar/engine-layout.js` — console layout source; previousapprovedlayout is present as uncommitted dependency.
- `frontend/eval_bar/engine-selection.js` — analysis select/status and transient acknowledgement.
- `core/external_config.py` — authoritative accepted config/defaults/revisions; arrowcolor migration only in blockB.
- `frontend/external_config/index.html`, `panel.css`, `panel.js` — entire external surface, semantics preserved.
- `tests/phase091_visual_fixture.py` — isolated real-renderer testhost, no productionauthchanges.
- `scripts/build_analysis_engine.py`, `scripts/build_userscript.py` — deterministic region builds.

## Tasks & Acceptance

- [ ] Baseline allcontrols/centers/dividers/colors/textsizes/contrast/components at requestedconsole/config widths and states; report Themebindings.
- [ ] A: diagnose recommendation transport/gates/renderer/history; add actualfunction DOMregression+orientationevidence; no speculativeauthfix.
- [ ] B: storedArrowColor migration and liveupdates, highlights frozenafterapprovedcomputedcomparison, unchangedstoragekeys.
- [ ] C: uniform centeredrows and allowed spacing; report impossible remainder rather than arbitrarypadding.
- [ ] D: Analysis/Strength/Timing/Toggles, AutoRatingthenSmartPacing,1px equaldividers, preservecoupling; narrowTimingonlyapprovedfit.
- [ ] E: pointerringremoved, keyboardneutralborder preserving geometry and componentcolors.
- [ ] F: populatedScoutrhythm,11pxtext, ellipsis/title/countalignment/markers withoutdatacopychanges.
- [ ] G: AutoPlay4columnactions,11pxsinglelineExportifitfits, readabledisabledstate/statusspacing; copyconflictsreportonly.
- [ ] H: externaltokens/primitivesparity/fullpageaudit,12pxlayout,~900collapse,390functional, no recoloring/copyrewrite.
- [ ] I: bannercomputedsize/width1440 verification; onlytextadjustmentifstill~11px.
- [ ] Finalbefore/aftermetrics/screenshots/color-diff, blockdiffs, separatecommits, explicitrealversuslocalvalidationlimitations.

**Acceptance:** Given all measuredcontrols, when rendered at each requiredwidth/state, then centers/gaps/rowheight/bottomalignment/pixelbounds and existingcomponentcolorsmeettheinvariants or an explicit conflict is presented for userdecision. Given validrecommendation, when drawn and swatchchanges, then arrowDOMgeometry/opacity/storagecolorremaincorrectandonlyarrowfillchanges. Given unauthorized/no-runtimecondition, then it is reported and not bypassed.

## Verification

Run existing configuration/session/engine/UI regressions plus targeted audit/browsertests using real sourceandlocalFlaskregistry. CaptureDOMpipelineerrors/commitcomparison and before/afterstyles, including pseudo-elements and focusmodes. Expose any missingauthenticatedbrowseraccess rather than claiming liveproof. Review eachblock beforecommit; stageonlyownedchangesusingtaskbaseline-to-HEADmapping forpreviouslydirtysources. Productcopy/TImingapproval questions remain explicitandpendinguntilanswered.

## Suggested Review Order

- Geometria de linhas e seções, preservando os controles.
  [engine-layout.js:4](../../frontend/eval_bar/engine-layout.js#L4)

- Migração única e persistência das cores personalizadas.
  [external_config.py:95](../../core/external_config.py#L95)

- Foco sem aura e sem congelar estado dos componentes.
  [focus-finish.js:4](../../frontend/eval_bar/focus-finish.js#L4)

- Critérios verificáveis nos 68 estados capturados.
  [validate_finish_audit.py:13](../../tests/validate_finish_audit.py#L13)

- Evidências, limites e investigação da instância antiga.
  [REPORT.md:1](definitive-finish/REPORT.md#L1)


A implementação e os testes locais foram concluídos. Estado permanece in-review até a verificação do userscript instalado no Chess.com autenticado.
