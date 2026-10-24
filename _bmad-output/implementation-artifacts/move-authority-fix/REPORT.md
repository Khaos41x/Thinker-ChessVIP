# Move authorization correction — 2026-10-24

## Confirmed defect

The recorded history rollback was consistent with speculative local moves. The investigation reproduced an actual production-code path where missing/unrecognized player identity caused `side = turn`, then an opponent move reached game.move. Numeric player color 1/2 was also unrecognized in that path even though another repository reader used that convention. See the preceding `move-video-investigation` evidence for the original video analysis; the fix does not claim authenticated network capture from that recording.

## Correction

- A shared, fail-closed authority reader normalizes white/black/w/b and numeric/string 1/2. Unknown identity never falls back to side to move, URL color, or board orientation.
- FEN side to move must be available. A recognized getTurn result must agree with FEN. API errors reject authorization rather than granting it.
- Legacy responses, cache scheduling, Smart Pacing analysis and V2 responses revalidate game object, route, mode, FEN, player side and enablement.
- At the final delayed/session dispatch boundary, the actual game.move callback independently rechecks board connection, master switch, game object, route, mode, the pinned FEN and player side. The source square must contain a piece owned by that side. A legal opponent move is no longer sufficient authorization.
- Puzzle execution retains its explicit puzzle branch, master switch, mode and FEN checks without requiring competitive player identity. It cannot survive a mode change into ordinary play.
- Loss of authority cancels scheduled work, clears the position latch and removes stale recommendations. Restoration can use the cache; late-analysis rejection releases the latch for recovery instead of silently freezing the same FEN.
- Existing console diagnostics expose `thinkerChessDiagnostics().bot.moveAuthority` with allowed/reason/side/turn/fen. No token or private account data is added. Reasons include player-identity-unavailable, waiting-turn, turn-state-inconsistent and player-identity-changed.

The authority source is the current board's getPlayingAs API. If it is absent or has an unsupported representation, the safe result is a visible diagnostic block, not a guessed side. A separately verified participant-identity fallback would require additional evidence and was not invented here.

## Validation

`node tests/test_move_authority.js`: 64 cases, including both colors and numeric/string representations, missing/invalid/throwing identity, untrusted URL/orientation, FEN/API disagreement, wrong source-piece ownership, response/timer/session-dispatch races, route/game/board/mode changes, master disablement, cache, V2, pending Smart Pacing analysis, recovery and puzzle compatibility.

`node tests/test_move_authority_chrome.js`: actual full userscript loaded through the existing local Flask fixture. Uses a local board game API and a mocked privileged engine transport, not a Chess.com account or real engine. The actual 10ms loop and UI toggles are exercised:

1. Unknown identity produces zero engine requests and an explicit diagnostic.
2. Restoring numeric white identity allows one valid move.
3. Opponent's turn produces no additional move.
4. Identity loss rejects a delayed HTTP response.
5. Identity change rejects an already scheduled move.
6. Restoring valid identity and position resumes normal execution.

Zero unauthorized game.move calls were observed. `chromium-report.json` contains requests, authorized moves and diagnostics. `chromium-fixture.png` records the local mounted console; it is not a real-game screenshot.

Other passing regressions:

- `node tests/test_move_recovery.js`
- `node tests/test_smart_pacer.js`
- `node tests/test_smart_pacer_sequences.js`
- All 14 suites in `node tests/session_control/run.js`
- Visual preferences, recommendation arrow geometry/color and Rating Goal session guard suites
- All three deterministic userscript build checks, node syntax and git whitespace validation

The Session Control build test initially hit the Windows sandbox's write restriction; rerunning with the required local file access passed all 14 suites. No product code was changed to work around that environment restriction.

Blind review found two recovery defects in the new rejection paths (pending analysis latch and removed recommendation latch). Both were patched and covered by explicit restoration regressions. No findings remain deferred from this fix.

## Installation and scope

Replace the installed Tampermonkey code with the updated script.js, save, then fully reload the Chess.com tab. Reloading is important: the previous userscript timers and any already-diverged local model must not remain alive. No Flask restart is required for this frontend-only correction.

No engine code, Komodo endpoint, pacing mathematics, default timing, Eval Bar, arrows, console styling, banner, Scout, DTO, reducer or persistence schema was changed. Pre-existing unrelated work is preserved. No remote push.

The specific unsafe fallback is removed and its reproduced failures are blocked. Live authenticated Chess.com verification remains unperformed; this is not a guarantee against all future API/layout changes. Unknown identity now fails safely and diagnostically.
