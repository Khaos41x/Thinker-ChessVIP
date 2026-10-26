# Item6 — Auto Play warning, report only

Selector: #kb-session-target-help.kb-session-queue-note. Computed color #9AB7A3, font-size11px, weight400, line-height16px and margin8px 0. The original .kb-session-queue-note color rule is in the legacy console CSS in script.js; frontend/eval_bar/engine-layout.js sets the current11px/16px/8px sizing. The normal Timing hint is #AAABA5,11px/16px.

Proposal, not applied: use existing neutral #AAABA5 for this warning, preserving its current11px size,16px line-height,8px margins, exact text and visibility. There is no need to change font size, which is already11px. This would make its visual role match the other hints without introducing a new color.

Read-only check of the actual server saved configuration returned minimum53 and maximum61. The warning still says Win-rate targets are not set by default and Configure both before starting. That wording describes defaults and becomes redundant with both values set; no copy change or conditional hiding was applied. Screenshots use an isolated session with unset targets, not a change to those saved53/61 values.
