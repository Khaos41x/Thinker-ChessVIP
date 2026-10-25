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
    source = (ROOT / "frontend/eval_bar/engine-selection.js").read_text(encoding="utf-8-sig").rstrip()
    source += "\n" + (ROOT / "frontend/eval_bar/engine-layout.js").read_text(encoding="utf-8-sig").rstrip()
    source += "\n" + (ROOT / "frontend/eval_bar/scout-finish.js").read_text(encoding="utf-8-sig").rstrip()
    region = START + "\n" + source + "\n" + END
    if START in current:
        start, end = current.index(START), current.index(END) + len(END)
        updated = current[:start] + region + current[end:]
    else:
        index = current.index('\n(function () {\n  "use strict";')
        updated = current[:index] + "\n" + region + "\n" + current[index:]
    if args.check:
        return int(current != updated)
    target.write_text(updated, encoding="utf8", newline="\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
