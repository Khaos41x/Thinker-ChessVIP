# Rating Goal Tracker

The tracker observes public Chess.com ratings. It never plays moves, changes difficulty, resigns, queues games or controls Auto Play. It works with every automation toggle off.

## Run and use

1. Start the existing local server with `python app.py` and open `http://127.0.0.1:5050/config`.
2. Find the single **Rating Goal** text field below Strength Level in Engine Control. It appears in both External Config and the Chess.com console, without a separate dashboard or visibility opt-in.
3. Enter a whole-number rating and press Enter or leave the field. The value is saved locally in SQLite and synchronized across both surfaces. Clear the field to unset it. A failed save preserves your draft for retry.
4. This simplified field stores the desired rating only. It does not create an account/category monitoring subscription, modify existing per-category goals, change engine strength, or control games. Previously created monitoring goals and history remain preserved in the backend.

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

Deterministic API fixtures test delayed publication, missing categories, errors and contradictory records without playing ranked games. Chromium fixtures exercise the built userscript and External Config against real Flask with a controlled provider. These do not prove the current authenticated Chess.com DOM or Tampermonkey extension behavior. Read-only authenticated smoke checks remain explicitly separate; unknown selectors must fall back to public API monitoring, not guess identity or category.

Official provider documentation: [Chess.com Published-Data API](https://www.chess.com/news/view/published-data-api).
