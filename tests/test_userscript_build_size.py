import contextlib
import importlib.util
import io
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("userscript_builder", ROOT / "scripts/build_userscript.py")
BUILDER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILDER)


class UserscriptBuildSizeTests(unittest.TestCase):
    def test_large_source_is_preserved_and_deterministic(self):
        source = 'const largeAsset="' + "x" * 1_000_000 + '";\n'
        output = BUILDER.render(source)
        self.assertTrue(output.startswith(source))
        self.assertEqual(BUILDER.render(output), output)

    def test_large_check_reports_bytes_without_rejecting_size(self):
        output = BUILDER.render('const largeAsset="' + "x" * 1_000_000 + '";\n')
        with tempfile.TemporaryDirectory(dir=ROOT) as directory:
            target = Path(directory) / "script.js"
            target.write_text(output, encoding="utf-8")
            captured = io.StringIO()
            with patch.object(BUILDER, "TARGET", target), patch.object(sys, "argv", ["build_userscript.py", "--check"]), contextlib.redirect_stdout(captured):
                self.assertEqual(BUILDER.main(), 0)
            self.assertIn(f"{len(output.encode('utf-8'))} bytes", captured.getvalue())

    def test_marker_validation_remains_active(self):
        with self.assertRaises(RuntimeError):
            BUILDER.render(BUILDER.START + "\n")

    @unittest.skipUnless(shutil.which("node"), "Node.js is required for raster build integration")
    def test_raster_build_accepts_large_script_and_checks_determinism(self):
        with tempfile.TemporaryDirectory(dir=ROOT) as directory:
            root = Path(directory)
            (root / "scripts").mkdir()
            (root / "assets").mkdir()
            shutil.copyfile(ROOT / "scripts/build_banner_raster.mjs", root / "scripts/build_banner_raster.mjs")
            shutil.copyfile(ROOT / "assets/banner-horse.webp", root / "assets/banner-horse.webp")
            target = root / "script.js"
            target.write_text('const bannerHtml = ``;\nconst largeAsset="' + "x" * 1_000_000 + '";\n', encoding="utf-8")
            command = [shutil.which("node"), str(root / "scripts/build_banner_raster.mjs")]
            built = subprocess.run(command, capture_output=True, text=True)
            self.assertEqual(built.returncode, 0, built.stderr)
            self.assertGreater(target.stat().st_size, 1_000_000)
            checked = subprocess.run(command + ["--check"], capture_output=True, text=True)
            self.assertEqual(checked.returncode, 0, checked.stderr)
            self.assertIn("bytes", checked.stdout)


if __name__ == "__main__":
    unittest.main()
