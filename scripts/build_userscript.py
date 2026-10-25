from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "frontend" / "session_control"
TARGET = ROOT / "script.js"
START = "/* THINKER_SESSION_CONTROL_GENERATED_START */"
END = "/* THINKER_SESSION_CONTROL_GENERATED_END */"
MODULES = (
    "models",
    "statistics",
    "clock",
    "reducer",
    "repository",
    "controller",
    "ports",
    "platform-chesscom",
    "leader",
    "runtime",
    "status",
    "telemetry",
    "ui",
    "presentation",
    "external",
    "index",
)


def compact_source(source: str) -> list[str]:
    punctuation = set("{}()[],:;=<>+-*%!?&|")
    output = []
    for raw_line in source.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        compact = []
        quote = None
        escaped = False
        index = 0
        while index < len(line):
            char = line[index]
            if quote is not None:
                compact.append(char)
                if escaped:
                    escaped = False
                elif char == "\\":
                    escaped = True
                elif char == quote:
                    quote = None
                index += 1
                continue
            if char in "'\"`":
                quote = char
                compact.append(char)
                index += 1
                continue
            if char.isspace():
                next_index = index + 1
                while next_index < len(line) and line[next_index].isspace():
                    next_index += 1
                previous = compact[-1] if compact else ""
                following = line[next_index] if next_index < len(line) else ""
                token = "".join(compact).rstrip().split()[-1] if compact else ""
                if not (previous in punctuation or following in punctuation) or (following == "(" and token == "async"):
                    compact.append(" ")
                index = next_index
                continue
            compact.append(char)
            index += 1
        output.append("".join(compact))
    return output


def bundle_source() -> str:
    lines = ["(function(root){", '"use strict";', "const factories=Object.create(null);"]
    for name in MODULES:
        source = (SOURCE_DIR / f"{name}.js").read_text(encoding="utf-8").rstrip()
        lines.append(f'factories["{name}"]=function(module,exports,require){{')
        compacted = "".join(compact_source(source))
        if compacted.startswith('"use strict";'):
            compacted = compacted[len('"use strict";'):]
        lines.append(compacted)
        lines.append("};")
    lines.extend(
        [
            "const cache=Object.create(null);",
            "function localRequire(request){",
            'const id=request.replace(/^\\.\\//,"").replace(/\\.js$/,"");',
            'if(!Object.prototype.hasOwnProperty.call(factories,id))throw new Error(`Unknown session-control module: ${request}`);',
            "if(!cache[id]){",
            "const module={exports:{}};",
            "cache[id]=module;",
            "factories[id](module,module.exports,localRequire);",
            "}",
            "return cache[id].exports;",
            "}",
            'const api=localRequire("./index");',
            'Object.defineProperty(root,"ThinkerSessionControl",{configurable:false,enumerable:false,writable:false,value:api});',
            "})(globalThis);",
        ]
    )
    return "\n".join(lines) + "\n"


def generated_region(version=None) -> str:
    if version is None:
        version = re.search(r"^// @version\s+(\S+)", TARGET.read_text(encoding="utf-8"), re.M).group(1)
    loader = (
        "globalThis.ThinkerClientVersion=" + json.dumps(version) + ";\n"
        +
        "globalThis.ThinkerSessionControlReady=(async()=>{\n"
        + bundle_source()
        + "return globalThis.ThinkerSessionControl;\n"
        + "})();"
    )
    return f"{START}\n{loader}\n{END}\n"


def render(current: str) -> str:
    region = generated_region(re.search(r"^// @version\s+(\S+)", current, re.M).group(1))
    start_index = current.find(START)
    end_index = current.find(END)
    if start_index == -1 and end_index == -1:
        return current.rstrip() + "\n\n" + region
    if start_index == -1 or end_index == -1 or end_index < start_index:
        raise RuntimeError("generated region markers are inconsistent")
    end_index += len(END)
    suffix = current[end_index:]
    if suffix.startswith("\r\n"):
        suffix = suffix[2:]
    elif suffix.startswith("\n"):
        suffix = suffix[1:]
    return current[:start_index] + region + suffix


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    current = TARGET.read_text(encoding="utf-8")
    expected = render(current)
    external_target = ROOT / 'frontend' / 'external_config' / 'session-control.js'
    external_bundle = bundle_source()
    print(f"Userscript size (informational): {len(expected.encode('utf-8'))} bytes")
    if args.check:
        if current != expected:
            print("script.js generated session-control region is stale", file=sys.stderr)
            return 1
        if not external_target.exists() or external_target.read_text(encoding='utf-8') != external_bundle:
            print('External Config session-control bundle is stale', file=sys.stderr)
            return 1
        return 0
    TARGET.write_text(expected, encoding="utf-8", newline="\n")
    external_target.write_text(external_bundle, encoding='utf-8', newline='\n')
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
