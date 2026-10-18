# Implementation Contract

## Confirmed diagnosis

The visible control in the screenshots is the browser's root document scrollbar. It exists because the intentionally below-the-fold `#oi-wrapper` increases document height. Removing document overflow would also make those panels unreachable, so the correction must suppress only scrollbar painting.

## CSS contract

Add an owned class such as `tc-page-scrollbar-hidden` to `document.documentElement` and scope all rules through it:

```css
html.tc-page-scrollbar-hidden,
html.tc-page-scrollbar-hidden body {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

html.tc-page-scrollbar-hidden::-webkit-scrollbar,
html.tc-page-scrollbar-hidden body::-webkit-scrollbar {
  width: 0 !important;
  height: 0 !important;
  display: none !important;
}
```

These declarations alter scrollbar rendering only. They must not be combined with `overflow`, height, position, or host grid changes.

## Lifecycle

1. Define one named class constant and one idempotent helper that toggles it on `document.documentElement`.
2. Enable suppression when the Thinker UI mounts on a supported route.
3. Reassert it during supported-route reconciliation to tolerate host replacement of the root class list.
4. Disable it when the SPA moves to an unsupported route.
5. Disable it in `cleanupThinkerUiLifecycle` so failed or removed mounts restore the native scrollbar.

## Hermetic verification

- A fake `document.documentElement.classList` proves enable, repeated enable, disable, and repeated disable are idempotent.
- Static checks require the owned class, `scrollbar-width:none`, and the class-scoped WebKit pseudo-element.
- Static checks reject `overflow:hidden`, `overflow:clip`, wheel/touch interception, or unscoped universal scrollbar suppression.
- Supported-route recovery enables the class; unsupported-route handling and cleanup remove it.
- Existing banner, Scout, Session Control, Auto Rating, Auto Queue, syntax, and deterministic build checks remain green.

## Protected regions

- Banner geometry, image payload, artwork scale, and visibility policy.
- `menuHtml` structure and all existing Thinker/Scout layout rules.
- `#oi-wrapper` placement and workspace calculations.
- Auto Queue, Auto Rating, Session Control, and backend behavior.

## Execution evidence

The user approved execution on 2026-10-18. The implementation uses an owned root class, class-scoped standards and WebKit scrollbar rules, supported-route activation, unsupported-route restoration, and cleanup restoration.

Idempotent root class tests and the banner, Scout, Session Control, Auto Rating, Auto Queue, syntax, diff, and generated-region checks passed. Two consecutive deterministic builds produced the same `script.js` SHA-256: `88987057480E7BFF5BA30780CD8FB9315E80C9D78A4BF00D1C3A8FFBBC2F6E51`.

