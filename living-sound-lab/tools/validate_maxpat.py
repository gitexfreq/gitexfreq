#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

FORBIDDEN_OBJECTS = {"inlet~", "outlet~"}


def validate_file(path: Path) -> list[str]:
    errors: list[str] = []
    try:
        data: dict[str, Any] = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        return [f"{path}: invalid JSON: {exc}"]

    patcher = data.get("patcher")
    if not isinstance(patcher, dict):
        return [f"{path}: missing top-level patcher object"]

    raw_boxes = patcher.get("boxes", [])
    raw_lines = patcher.get("lines", [])
    ids: set[str] = set()

    for index, wrapper in enumerate(raw_boxes):
        box = wrapper.get("box", {}) if isinstance(wrapper, dict) else {}
        box_id = box.get("id")
        if not isinstance(box_id, str) or not box_id:
            errors.append(f"{path}: box {index} has no valid id")
            continue
        if box_id in ids:
            errors.append(f"{path}: duplicate box id {box_id!r}")
        ids.add(box_id)

        text = box.get("text")
        if isinstance(text, str):
            object_name = text.split(maxsplit=1)[0]
            if object_name in FORBIDDEN_OBJECTS:
                errors.append(f"{path}: forbidden object {object_name!r} in box {box_id}")

    for index, wrapper in enumerate(raw_lines):
        patchline = wrapper.get("patchline", {}) if isinstance(wrapper, dict) else {}
        source = patchline.get("source")
        destination = patchline.get("destination")
        for label, endpoint in (("source", source), ("destination", destination)):
            if not isinstance(endpoint, list) or len(endpoint) != 2:
                errors.append(f"{path}: line {index} has malformed {label}")
                continue
            object_id, outlet_or_inlet = endpoint
            if object_id not in ids:
                errors.append(f"{path}: line {index} references missing {label} id {object_id!r}")
            if not isinstance(outlet_or_inlet, int) or outlet_or_inlet < 0:
                errors.append(f"{path}: line {index} has invalid {label} index {outlet_or_inlet!r}")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", nargs="?", default=".")
    args = parser.parse_args()
    root = Path(args.root)
    files = sorted(root.rglob("*.maxpat"))
    if not files:
        print(f"No .maxpat files found under {root}")
        return 1

    errors: list[str] = []
    for path in files:
        errors.extend(validate_file(path))

    if errors:
        print("Validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print(f"Validated {len(files)} Max patch file(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
