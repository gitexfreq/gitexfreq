#!/usr/bin/env python3
from __future__ import annotations

import base64
import gzip
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOCAL_SRC = ROOT / "baseline" / "Heart_v0_3_DubLurch.maxpat.gz.b64"
DST = ROOT / "baseline" / "Heart_v0_3_DubLurch.maxpat"
SOURCE_REPO = "https://github.com/gitexfreq/lab.git"
SOURCE_PATH = "living-sound-lab/baseline/Heart_v0_3_DubLurch.maxpat.gz.b64"


def load_payload() -> str:
    if LOCAL_SRC.exists():
        return LOCAL_SRC.read_text(encoding="utf-8").strip()

    subprocess.run(
        ["git", "fetch", "--quiet", SOURCE_REPO, "main"],
        check=True,
    )
    result = subprocess.run(
        ["git", "show", f"FETCH_HEAD:{SOURCE_PATH}"],
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip()


def main() -> None:
    payload = base64.b64decode(load_payload())
    DST.parent.mkdir(parents=True, exist_ok=True)
    DST.write_bytes(gzip.decompress(payload))
    print(f"Wrote {DST}")


if __name__ == "__main__":
    main()
