import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
START = "/* THINKER_ANALYSIS_ENGINE_GENERATED_START */"
END = "/* THINKER_ANALYSIS_ENGINE_GENERATED_END */"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    target = ROOT / "script.js"
    current = target.read_text(encoding="utf8")
    source = (ROOT / "frontend/external_config/status-runtime.js").read_text(encoding="utf-8-sig").rstrip()
    source += "\n" + (ROOT / "frontend/external_config/engine-picker.js").read_text(encoding="utf-8-sig").rstrip()
    source += "\n" + (ROOT / "frontend/eval_bar/engine-selection.js").read_text(encoding="utf-8-sig").rstrip()
    source += "\n" + (ROOT / "frontend/eval_bar/engine-layout.js").read_text(encoding="utf-8-sig").rstrip()
    source += "\n" + (ROOT / "frontend/eval_bar/scout-finish.js").read_text(encoding="utf-8-sig").rstrip()
    source += "\n" + (ROOT / "frontend/eval_bar/focus-finish.js").read_text(encoding="utf-8-sig").rstrip()
    source += "\n" + (ROOT / "frontend/responsive/presentation.js").read_text(encoding="utf-8-sig").rstrip()
    region = START + "\n" + source + "\n" + END
    if START in current:
        start, end = current.index(START), current.index(END) + len(END)
        updated = current[:start] + region + current[end:]
    else:
        index = current.index('\n(function () {\n  "use strict";')
        updated = current[:index] + "\n" + region + "\n" + current[index:]
    connection_start = "/* THINKER_CONFIG_CONNECTION_GENERATED_START */"
    connection_end = "/* THINKER_CONFIG_CONNECTION_GENERATED_END */"
    connection = connection_start + "\n" + (ROOT / "frontend/eval_bar/config-connection.js").read_text(encoding="utf8").rstrip() + "\n" + connection_end + "\n"
    if connection_start in updated:
        start, end = updated.index(connection_start), updated.index(connection_end) + len(connection_end) + 1
    else:
        start, end = updated.index('  let _lastExternalConfig = null;'), updated.index('  let thinkerUserscriptStarted = false;')
    updated = updated[:start] + connection + updated[end:]
    resume_start = "/* THINKER_CONFIG_RESUME_GENERATED_START */"
    resume_end = "/* THINKER_CONFIG_RESUME_GENERATED_END */"
    resume = resume_start + "\n" + (ROOT / "frontend/eval_bar/connection-resume.js").read_text(encoding="utf8").rstrip() + "\n" + resume_end
    if resume_start in updated:
        start, end = updated.index(resume_start), updated.index(resume_end) + len(resume_end)
        updated = updated[:start] + resume + updated[end:]
    else:
        updated = updated.replace('          resumeExternalSessionConnection = () => externalSessionBridge.start();', resume, 1)
    layout_regions = (
        ("workspace-layout", "        function updateWorkspaceLayout() {", "        const observeBannerVisibility ="),
        ("layout-observers", "        const observeBannerVisibility =", "        OpponentIntel.ensureScoutWrapper();"),
        ("banner-position", "  function positionThinkerBannerShell() {", "  function createMenu() {"),
        ("ui-cleanup", "  function cleanupThinkerUiLifecycle(", "  function failThinkerUiMount("),
    )
    for name, first, last in layout_regions:
        begin = "/* THINKER_LAYOUT_" + name.upper().replace("-", "_") + "_START */"
        finish = begin.replace("_START", "_END")
        content = begin + "\n" + (ROOT / ("frontend/responsive/" + name + ".js")).read_text(encoding="utf8").rstrip() + "\n" + finish + "\n"
        if begin in updated:
            start, end = updated.index(begin), updated.index(finish) + len(finish) + 1
        else:
            start = updated.index(first)
            end = updated.index(last, start)
        updated = updated[:start] + content + updated[end:]
    style_anchor = '      </style>\n    `;\n\n    const menuHtml'
    responsive_style = '        ${globalThis.ThinkerResponsive.css}\n'
    if responsive_style not in updated:
        if style_anchor not in updated:
            raise RuntimeError("Console style anchor is missing")
        updated = updated.replace(style_anchor, responsive_style + style_anchor, 1)
    if args.check:
        return int(current != updated)
    target.write_text(updated, encoding="utf8", newline="\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
