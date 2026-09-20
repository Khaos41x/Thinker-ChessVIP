# Design QA — Scout visibility and Thinker Chess banner

## References

- Annotated Scout placement screenshot: `codex-clipboard-c2216ab1-70fc-47c2-9d91-33c5c026cfa0.png`
- Annotated opponent HUD screenshot: `codex-clipboard-f387165c-6a14-47f7-90e5-3ce339adcf1a.png`
- Full-height banner reference: `codex-clipboard-443a94f4-50d2-40c4-8ced-0ab55876fcb3.png`
- Production asset: `Banner-ThinkerChess.png` (1122×1402)

## Current Chess.com verification

The current live layout was captured at 1280×720. The upper player is rendered under `#board-layout-player-top > .player-component.player-top`, with the nickname in `.cc-user-username-component`. The notation sidebar measured x=788, y=16, width=300, height=688, leaving a 164-pixel right-side slot after the configured margins.

## Comparison

- Opponent HUD attaches to the current nickname node and remains immediately adjacent to it.
- The Scout wrapper is a non-wrapping horizontal flex row, placing the Scout card directly to the right of the Thinker settings card.
- The supplied banner is embedded byte-for-byte, centered with `object-fit: cover`, and uses the visible notation-sidebar height rather than a width-derived short height.
- At the captured viewport, the computed banner slot is approximately 164×688; at narrower widths it remains visible down to a safe 96-pixel slot without covering the sidebar.
- Ghost Mode continues hiding all three custom surfaces.

## Automated checks

- Banner source/embedded SHA-256 equality.
- Current and legacy opponent selector handling.
- Lobby placeholder rejection.
- Tampermonkey transport success/failure.
- Stale opponent response rejection.
- Syntax, whitespace, endpoint and console-silence checks.

final result: passed
