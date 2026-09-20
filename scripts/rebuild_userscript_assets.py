import argparse
import base64
import re
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--script", default="script.js")
    parser.add_argument("--jquery", required=True)
    parser.add_argument("--banner", required=True)
    args = parser.parse_args()

    script_path = Path(args.script)
    content = script_path.read_text(encoding="utf-8")
    jquery = Path(args.jquery).read_text(encoding="utf-8").strip()
    jquery = re.sub(
        r"ce\.Deferred\.exceptionHook=function\(e,t\)\{.*?\},ce\.readyException=",
        "ce.Deferred.exceptionHook=function(){},ce.readyException=",
        jquery,
        count=1,
    )
    banner = base64.b64encode(Path(args.banner).read_bytes()).decode("ascii")

    content = re.sub(r"^// @require\s+https://code\.jquery\.com/jquery-3\.7\.1\.min\.js\r?\n", "", content, flags=re.MULTILINE)
    vendored = f"/* TC_VENDORED_JQUERY_START */\n{jquery}\n/* TC_VENDORED_JQUERY_END */\n\n"
    marker = "(function () {"
    if "TC_VENDORED_JQUERY_START" in content:
        content = re.sub(
            r"/\* TC_VENDORED_JQUERY_START \*/.*?/\* TC_VENDORED_JQUERY_END \*/\s*",
            lambda _: vendored,
            content,
            count=1,
            flags=re.DOTALL,
        )
    else:
        content = content.replace(marker, vendored + marker, 1)

    content, replacements = re.subn(
        r'(<img src=")data:image/[^;]+;base64,[^"]+(" alt="Thinker Chess")',
        rf"\1data:image/jpeg;base64,{banner}\2",
        content,
        count=1,
    )
    if replacements != 1:
        raise RuntimeError("Thinker Chess banner image was not found exactly once")

    script_path.write_text(content, encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
