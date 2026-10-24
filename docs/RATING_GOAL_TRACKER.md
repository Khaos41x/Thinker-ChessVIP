# Rating Goal Tracker

The tracker observes public Chess.com ratings. It never plays moves, changes difficulty, resigns or initiates matchmaking. A separate Auto Play session guard consumes confirmed observations only to prevent another queue or request the existing graceful stop. Existing standalone rating goals remain observational and independent of automation toggles.

## Run and use

1. Start the existing local server with `python app.py` and open `http://127.0.0.1:5050/config`.
2. Find the single **Rating Goal** text field in **Auto Play**, beside the session settings on Chess.com and inside Auto Play in External Config. Engine Control contains engine settings only.
3. Enter a whole-number rating and press Enter or leave the field. The value is saved locally in SQLite and synchronized across both surfaces. Clear the field to unset it. A failed save preserves your draft for retry.
4. Start an Auto Play session explicitly. The saved target, your validated account and the queue's Bullet/Blitz/Rapid category are pinned for that session. Target edits apply to the next session. Leaving the target blank disables the rating stop condition after the local binding handshake; it does not require public rating lookup. Existing per-category goals and history remain unchanged.

Only fresh, reconciled public evidence can establish the baseline or confirm a crossing. A target at or above the initial confirmed rating is an upward target; a lower target is a downward monitoring threshold. When confirmed, the session leader requests the existing graceful stop: no resignation, move adjustment or outcome manipulation. A game already underway follows the existing draining behavior. Reaching a target blocks legacy queue fallback even after tracker restoration; another session requires an explicit Start.

After a completed game, the guard pauses new queue admission until publication is reconciled. Public data may be delayed, so completion is not instantaneous or guaranteed within a particular interval. Offline, stale, disputed, unknown-identity or unknown-category data cannot claim success. A small inline status beside the target shows pending, unavailable or reached state; no separate dashboard is added. The first session binding requires the local server even for an empty target; once an empty target is pinned it remains unconstrained if the tracker connection later fails.

Bindings are stored independently of existing goals. Active polls renew a 15-minute monitoring heartbeat. Abandoned bindings become dormant and stop public-data work unless another session or goal still needs the account. Restoring the same active session preserves its target/baseline but requires fresh revalidation. Finishing is monotonic; delayed requests cannot reactivate a finished binding.

Targets are not engine Strength Level. Downward thresholds are neutral observations, never instructions to lose games. Historical changes are descriptive, not predictions of how many games remain.

## Existing backend monitoring states

- **Verified:** validated public evidence, with its actual effective date and last check time.
- **Unconfirmed:** a visible, matching player rating observed in the browser, displayed separately from the last verified value.
- **Awaiting Rating Update:** a completed game has not yet been resolved through published evidence. Prior verified rating/progress remains visible.
- **Stale:** last verified evidence retained while refresh is overdue or a newer game is pending.
- **Rating needs verification:** comparable public records disagree. No completion is triggered by disputed evidence.
- **Rating unavailable:** no suitable evidence; missing values are never zero.

Chess.com publication can lag. HTTP304 confirms the cached representation, not publication of a newer result. A successfully fetched old rating does not prove an unchanged post-game rating.

## Data and isolation

Durable state lives in `rating-tracker.db` beside `app.py`, independently of `users.db`, Session Control IndexedDB and engine caches. Database/sidecar files are ignored by Git. `THINKER_RATING_TRACKER_DB` can override this path for an isolated instance or tests. Back up the database only while the server is stopped, or use SQLite's online backup facilities.

The initial deployment supports one local application process on loopback. Do not expose the tracker on a public interface or run multiple workers without a separate deployment/security design. Local tracker routes validate Host/origin and JSON payloads; they do not reuse an engine capability token. The public client only makes fixed-host read-only requests to `api.chess.com`.

Unsent browser hints use a bounded per-tab session-storage outbox, surviving page reloads without cross-tab overwrite. Public rating truth remains in SQLite; closing a tab does not stop server-side public-data monitoring. Browser snapshot caches are presentation-only and always marked stale when restored offline.

Per-game deltas require confirmed adjacent anchors and complete ordering. Gaps, provider adjustments and same-second ambiguity are labeled separately or left unattributed. Goal notifications have durable identities and cross-tab delivery claims; crash recovery can redeliver the same inbox item, not promise exactly-once visual delivery.

## Build

From the repository root:

```powershell
python scripts/build_userscript.py
node analysis_lab/scripts/build-userscript-eval-bar.mjs
node analysis_lab/scripts/build-rating-tracker.mjs
node --check script.js
python scripts/build_userscript.py --check
node analysis_lab/scripts/build-userscript-eval-bar.mjs --check
node analysis_lab/scripts/build-rating-tracker.mjs --check
```

The same inputs must generate identical output. Bundle sizes are informational; there is no project-wide userscript byte ceiling. Install the regenerated `script.js` into the existing Tampermonkey script, save, and reload Chess.com. Do not run duplicate installed copies.

## Validation scope

Deterministic API fixtures test delayed publication, missing categories, errors and contradictory records without playing ranked games. Chromium fixtures exercise the built userscript and External Config against real Flask with a controlled provider, actual IndexedDB, Web Locks and the existing Session Control controller. Upward/downward crossings stop that controller and restored completion remains blocked from requeueing. These do not prove the current authenticated Chess.com DOM or Tampermonkey extension behavior. Read-only authenticated smoke checks remain explicitly separate; unknown identity or category blocks the configured stop-condition guard rather than guessing.

Official provider documentation: [Chess.com Published-Data API](https://www.chess.com/news/view/published-data-api).
