- source_spec: `_bmad-output/implementation-artifacts/spec-smart-pacer-analysis.md`
  summary: Separate the pre-existing live Chess.com auto-move pacing path from offline and puzzle-only pacing.
  evidence: The existing `computeSmartPacing` remains connected to `auto_move_piece`; this story deliberately did not connect the new SmartPacer or `/analyze` response to competitive live automation.
