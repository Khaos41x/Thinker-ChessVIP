# Block A — read-only source/history investigation

No production source was edited. No authenticated Chess.com capture was performed by this subtask. Local renderer screenshots are in `local-arrows/`; those are deliberately labeled reconstructed board fixtures, not a real game.

## Confirmed pipeline

The selected Stockfish19·1MB runtime belongs to the Eval Bar/analysis registry. Recommendation generation is a separate legacy path: `script.js` request_move sends `/getmove`, and `app.py` getmove resolves KomodoSingleton. Analysis selector readiness alone therefore does not imply a recommended move was requested or generated. Scout completion is independent of recommendation authority and does not prove the board game API exposes a usable identity.

Current source anchors:
- `script.js:4648`: readThinkerMoveAuthority reads current board API getPlayingAs, FEN side-to-move, and recognized getTurn. Missing/unrecognized identity, inconsistent turn, changed identity and opponent turn deny authority.
- `script.js:5080`: Bot master switch gates requests. With Bot OFF there should be no recommendation request/arrow.
- `script.js:5104–5124`: responses must still match master/game object/FEN/route/mode/AutoMoves preference, and ordinary recommendation requests check authority BEFORE HTTP. Denial cancels scheduling and removes stale arrows.
- `script.js:5142`: Auto Moves effective state chooses execution versus arrow rendering. Auto Moves ON intentionally removes arrows and schedules a move; Auto Moves OFF takes create_div for a valid accepted recommendation.
- `script.js:5274`: `/getmove` request. `script.js:5297–5302`: valid engine UCI response chooses scheduling or create_div.
- `script.js:4977–5024`: create_div picks the current cached board, clears old recommendation elements, validates UCI coordinates, chooses flipped orientation, builds the approved path, and appends SVG at z-index11, pointer-events:none, fill-opacity0.8.
- `app.py:913–989`: `/getmove` uses the Komodo integration, independent of the analysis engine selector. Missing engine capability can produce401 or authentication-required before requesting.

## Historical comparison

`history-matrix.json` inspects every commit from approved e1e705d through current HEAD d31745d without checking out/resetting the dirty tree. The complete renderer source block has SHA256 `070381bf33f3e04f3c0c9d422f1479adfdfad795c8f6cbf769a150655c3b3e83` in ALL six revisions. Arrow geometry, absolute placement, layer11, pointer-events:none and opacity0.8 are unchanged.

The commit that disconnected Theme from arrow color is e1e705d ITSELF: it changed `${current_color || ARROW_COLOR}` to `${ARROW_COLOR}`, set ARROW_COLOR to#3B82F6 and opacity0.8. It also replaced both live arrow-fill update handlers with the constant. Saved green, empty or invalid current_color therefore cannot currently set arrow fill or opacity to an invisible value; the approved hardcoded blue overrides it. Restoring configurable arrow color is BlockB, not proof of why the arrow is absent.

The first subsequent commit79de3e7 introduced fail-closed authority before recommendation generation and stricter final execution checks. The prior implementation could infer player side from the turn, enabling an opponent move. That safety correction must not be reverted merely to obtain arrows. It is a candidate gating explanation only if real diagnostics show one of its denial reasons. Calling it the breaking commit without authenticated evidence would be unsupported. No other subsequent commit changed the renderer.

## Local executed regressions

- `node tests/test_move_authority.js`: PASS64cases. Numeric/string white/black representations, unknown identity, opponent turn, FEN/API conflict, stale response/timer/dispatch, board/route/game changes, cached recommendation removal/recovery, Smart Pacing late-analysis and puzzle boundaries.
- `node tests/test_move_recovery.js`: PASS8failure types, retry backoff, cache execution/recommendation, stale guards and V2plan failures.
- `node tests/test_recommendation_arrows.js`: PASS pure production geometry and opacity/color contract.
- `TC_ARROW_ARTIFACT_DIR=.../local-arrows node tests/test_recommendation_arrows_chrome.js`: PASS actual unchanged production renderer in isolated Chromium,12size/DPR/orientation cases. SVG and path exist, rect equals board rect, layer11, pointer-events:none, no filter, opacity0.8; native arrows retained and pointer click/drag passes through. Screenshots cover both orientations at400/640/900 and DPR1/2. This test calls the actual renderer after supplying a recommended UCI move; it does not prove the live engine/request pipeline runs on the user's page.

## Required live evidence before any BlockA product fix

Read the actual installed client version and `thinkerChessDiagnostics().bot`: enabled/effectiveAutoMove, stage/status, moveAuthority reason/side/turn, authenticated, boardFound, gameApiFound and fenAvailable. Capture whether `/getmove` is sent, status and legal UCI response. Then inspect current-board `.myarrow`, pathfill/opacity and computed visibility/rect/layer. That distinguishes no-request authorization, missing API/token, backend response, stale result rejection, intentional AutoMoves execution and actual rendering/overlay defects.

No source-level root cause of the authenticated report is proven yet. Source and local tests establish that the approved renderer still functions. If real identity/auth/context is unavailable, report the missing requirement; do not weaken authority, infer identity from orientation, redirect the recommendation request to Stockfish, or inject a fabricated game state into the real page.

## Regression extension proposal

Keep existing64authority tests and unchanged renderer tests. Add a pipeline browser fixture which runs actual request_move plus actual create_div with a local test board API and an explicitly mocked privileged `/getmove` response, asserting DOM presence only for BotON/AutoMovesOFF/authorizedcurrentposition. Assert BotOFF, staleFEN and opponent turn produce no new arrow; AutoMovesON follows the existing execution branch. Pair white/black player identities with both board orientations and vary EvalBar/Banner/RecentForm/SmartPacing flags without allowing those independent features to suppress an accepted recommendation. Include reload and opponent-turn→own-turn restoration. BlockB should then extend it with actual swatch input events and accepted ExternalConfig synchronization, verifying each existing path fill updates to saved validhex and stays opacity0.8. The fixtures must be honestly labeled local and never substitute for live authenticated evidence.


## Live access boundary observed by root

The actual local server snapshot reported Bot enabled, Auto Moves disabled, preferred/activeSmallnet, and no authorized analysis context or active analysis. The configuration heartbeat was disconnected, so installed userscript version could not be acknowledged. Computer-use inventory returned `Local browser use is disabled in Work settings`; no authenticated Chess.com page DOM, console or live game was inspected. Therefore no real-site root cause or breaking commit is claimed. Existing authorization is retained. A current authorized user-turn page diagnostic/DOM observation is still required to resolve the reported real-site absence.
