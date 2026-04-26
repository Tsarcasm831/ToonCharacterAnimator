#!/usr/bin/env python3
"""Offline scaffold for exporting AI4AnimationPy motion data to game JSON.

This script is intentionally not part of the Vite/TypeScript runtime. Run it
inside a Python environment where AI4AnimationPy and any source motion parsing
dependencies are installed.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


GAME_PARTS_REGISTRY = {
    "hips",
    "torsoContainer",
    "torso",
    "chest",
    "neck",
    "head",
    "mouth",
    "pelvis",
    "leftArm",
    "rightArm",
    "leftForeArm",
    "rightForeArm",
    "leftHand",
    "rightHand",
    "leftThigh",
    "rightThigh",
    "leftShin",
    "rightShin",
    "shirt",
}

# Placeholder mapping from source skeleton names to the game's procedural part
# keys. Fill this in once the exact AI4AnimationPy/BVH/FBX source skeleton is
# chosen. Example: "LeftArm": "leftArm".
PARTS_MAPPING = {
    "Hips": "hips",
    "Spine": "torsoContainer",
    "Neck": "neck",
    "Head": "head",
    "LeftArm": "leftArm",
    "RightArm": "rightArm",
}


def import_ai4animationpy() -> Any:
    """Import AI4AnimationPy from the active offline Python environment."""
    try:
        # Future implementation note:
        # Import the specific AI4AnimationPy modules here once the offline
        # environment and source package layout are finalized. The project
        # appears to expose useful motion data through a Motion.py object with
        # frame transforms shaped like [num_frames, num_joints, 4, 4].
        import AI4AnimationPy  # type: ignore[import-not-found]
    except ImportError as exc:
        raise RuntimeError(
            "AI4AnimationPy is not importable. This script is offline tooling "
            "and requires the AI4AnimationPy Python environment; it is not "
            "used by the Vite/TypeScript game runtime."
        ) from exc

    return AI4AnimationPy


def validate_bones(bones: list[str]) -> list[str]:
    """Return bone names that do not match the known game parts registry."""
    return sorted({bone for bone in bones if bone not in GAME_PARTS_REGISTRY})


def write_json(output_path: Path, payload: dict[str, Any]) -> None:
    """Write deterministic, human-readable JSON for the game runtime."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def build_placeholder_clip(action: str, fps: int, loop: bool) -> dict[str, Any]:
    """Build a tiny neutral clip until real retargeting is implemented."""
    bones = ["hips", "torsoContainer", "neck", "head", "leftArm", "rightArm"]
    unknown_bones = validate_bones(bones)
    if unknown_bones:
        raise ValueError(f"Unknown game bone names: {', '.join(unknown_bones)}")

    return {
        "action": action,
        "fps": fps,
        "frameCount": 1,
        "duration": 1 / fps,
        "loop": loop,
        "bones": bones,
        "frames": [
            {
                "index": 0,
                "time": 0.0,
                "rotations": {bone: [0, 0, 0] for bone in bones},
                "positions": {"hips": [0, 0, 0]},
            }
        ],
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export AI4AnimationPy motion data to game animation JSON."
    )
    parser.add_argument("--input", required=True, help="Source motion file path.")
    parser.add_argument("--output", required=True, help="Output JSON file path.")
    parser.add_argument("--action", required=True, help="Game action name.")
    parser.add_argument("--fps", type=int, default=30, help="Output framerate.")
    parser.add_argument(
        "--loop",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Whether the exported clip should loop.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    input_path = Path(args.input)
    output_path = Path(args.output)

    if args.fps <= 0:
        print("--fps must be greater than 0.", file=sys.stderr)
        return 2

    if not input_path.exists():
        print(f"Input file does not exist: {input_path}", file=sys.stderr)
        return 2

    try:
        import_ai4animationpy()
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    # Full retargeting is intentionally not implemented in this foundation
    # scaffold. Future work should load source motion, map source bone names
    # through PARTS_MAPPING, convert transforms/quaternions to Euler XYZ radians,
    # validate the result, and then write the final JSON clip.
    payload = build_placeholder_clip(args.action, args.fps, args.loop)
    write_json(output_path, payload)
    print(f"Wrote placeholder animation JSON to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
