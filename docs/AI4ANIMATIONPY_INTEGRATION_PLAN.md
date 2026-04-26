# AI4AnimationPy Integration Plan

> Foundation plan only. This keeps AI4AnimationPy isolated as offline tooling and does not replace the current procedural animation runtime.

## Goals

The game currently uses Three.js primitive geometry, React, TypeScript, Vite, and fully procedural runtime animation. Player and humanoid poses are driven by direct mutation of named `THREE.Object3D` body parts through `player.model.parts`.

This integration should preserve that working baseline while opening a safe path to use AI4AnimationPy, BVH, FBX, GLB, or NPZ motion data as offline donor/reference material.

## Why AI4AnimationPy Stays Offline

AI4AnimationPy is a Python animation research/tooling environment, not a browser runtime dependency. Keeping it offline avoids adding Python, native dependencies, large ML/research packages, or source-asset parsing to the Vite game bundle.

The current game loop needs lightweight TypeScript code that can run in the browser. Offline conversion lets Python handle source formats and retargeting before the game ever loads an animation clip.

## Why The Game Consumes JSON

The browser runtime should consume game-friendly JSON animation clips because JSON is easy for Vite to serve from `public/`, straightforward to validate, and compatible with the current `parts` object model.

JSON clips also let the runtime stay independent from source formats. AI4AnimationPy, BVH, FBX, GLB, or NPZ can all become the same small shape before TypeScript sees them.

## Current Procedural Runtime Remains The Baseline

The procedural animation system is the working production path. It already handles locomotion, combat, interaction, death, ragdoll recovery, face/gaze behavior, skirt physics, item stances, and direct compatibility with the procedural body.

The clip path should be additive at first:

1. Export JSON offline.
2. Load and cache JSON in TypeScript.
3. Sample frames into named body-part rotations.
4. Apply those rotations with the same `lerp` style used by existing action modules.
5. Feature-flag one low-risk action later.

No existing action module should be replaced until the clip path is proven visually and technically.

## Why Idle Is The Safest First Proof Of Concept

Idle is the best later proof-of-concept because it is the default fallback state. It has no hit detection, projectile spawning, combat timing, locomotion physics coupling, or multi-phase attack windows.

An idle clip is visually obvious when wrong, loops naturally, and can exercise several major parts at once: hips, torso, neck, head, arms, and eventually legs. A failed idle experiment should not affect movement, combat, or interaction logic when guarded behind a feature flag.

## Relevant Folders And Files

- `docs/CURRENT_GAME_ANIMATION_ARCHITECTURE.md` - current factual architecture baseline.
- `docs/AI4ANIMATIONPY_INTEGRATION_PLAN.md` - this staged integration plan.
- `tools/animation/` - offline conversion scripts and schema notes.
- `tools/animation/game_animation_schema.md` - game JSON clip format.
- `tools/animation/export_ai4animation_to_game_json.py` - placeholder offline converter scaffold.
- `public/animations/` - static JSON clips served by Vite.
- `public/animations/idle_sample.json` - tiny hand-authored sample for future loader testing.
- `game/animator/AnimationClipLoader.ts` - TypeScript runtime loader and sampler skeleton.
- `game/animator/actions/ClipAction.ts` - procedural-compatible action wrapper skeleton.
- `game/animator/actions/IdleAction.ts` - recommended future proof-of-concept target, not modified now.
- `game/animator/PlayerAnimator.ts` - future feature-flag integration point, not modified now.

## Files And Folders To Avoid For Now

- `ai4animationpy.pinokio.git/` - keep the existing Pinokio launcher untouched.
- `game/animator/PlayerAnimator.ts` - do not wire the clip path yet.
- `game/animator/actions/IdleAction.ts` - do not replace the procedural idle yet.
- `game/animator/actions/MovementAction.ts` - do not replace locomotion.
- `game/player/PlayerLocomotion.ts` - physics remains independent from animation import work.
- `game/player/PlayerCombat.ts` and `game/player/actions/` - combat logic and hit detection stay unchanged.
- `game/model/PlayerMeshBuilder.ts` and mesh builders - no `SkinnedMesh` migration yet.
- `standalone_cc/`, `darkest_clone/`, and other sub-projects - unrelated to this foundation.

## Proposed Data Flow

```text
AI4AnimationPy / BVH / FBX / GLB / NPZ
        |
        v
offline Python converter
        |
        v
game-friendly JSON animation clip
        |
        v
TypeScript runtime loader
        |
        v
existing procedural body parts receive sampled rotations
```

AI4AnimationPy appears to expose motion through a `Motion.py` object with frame data shaped like:

```text
[num_frames, num_joints, 4, 4]
```

Useful source concepts include bone names, parent names, parent indices, framerate, total time, bone transformations, bone positions, bone rotations, quaternion export, and GLB/BVH/FBX/NPZ loading or exporting.

## Runtime Body Part Registry

Exported clip bone names must map to these current `player.model.parts` keys:

```text
hips
torsoContainer
torso
chest
neck
head
mouth
pelvis
leftArm
rightArm
leftForeArm
rightForeArm
leftHand
rightHand
leftThigh
rightThigh
leftShin
rightShin
shirt
```

Special model arrays should be documented for future work but not animated by the first runtime loader unless explicitly needed:

```text
player.model.rightFingers[]
player.model.leftFingers[]
player.model.rightThumb
player.model.leftThumb
player.model.eyes[]
player.model.eyelids[]
player.model.irises[]
player.model.pupils[]
player.model.forefootGroups[]
player.model.heelGroups[]
```

## Proposed JSON Schema

The first runtime format is one action per JSON file:

```json
{
  "action": "idle",
  "fps": 30,
  "frameCount": 90,
  "duration": 3.0,
  "loop": true,
  "bones": ["hips", "torsoContainer", "neck", "head"],
  "frames": [
    {
      "index": 0,
      "time": 0.0,
      "rotations": {
        "hips": [0, 0, 0],
        "torsoContainer": [0, 0, 0],
        "neck": [0, 0, 0],
        "head": [0, 0, 0]
      },
      "positions": {
        "hips": [0, 0, 0]
      }
    }
  ]
}
```

Rotations are Euler XYZ radians because the current runtime directly mutates `Object3D.rotation.x`, `rotation.y`, and `rotation.z`. Positions are optional. Scale is excluded until a real clip needs it.

Missing bones should be ignored safely at runtime. Unknown bones should warn in development but should not crash gameplay.

## License And Commercial Concerns

Before shipping derived animation data or tooling, confirm the AI4AnimationPy license, licenses for any source BVH/FBX/GLB/NPZ datasets, and whether exported/retargeted clips can be used commercially.

Key concerns:

- AI4AnimationPy source license and attribution requirements.
- Source motion dataset license and redistribution rights.
- Whether generated JSON clips are considered derivative works.
- Whether model, character, or mocap data includes non-commercial restrictions.
- Whether any third-party converter dependency has runtime or distribution obligations.

Keep source assets and Python tooling out of the browser bundle until these questions are settled.

## Future Stages

1. Maintain the current documentation baseline and parts registry.
2. Build out the offline converter to read AI4AnimationPy motion objects and source motion files.
3. Validate bone mappings against `player.model.parts` keys before writing JSON.
4. Load JSON clips through `AnimationClipLoader`.
5. Apply sampled rotations through `ClipAction`.
6. Add a feature flag for one low-risk action.
7. Test idle visually in a scene without changing movement or combat.
8. Expand to other actions only after idle works and procedural fallback remains available.
9. Evaluate `AnimationMixer`, `SkinnedMesh`, GLB, or skeletal retargeting only after the JSON path proves insufficient.

## Next Step After This PR

The next safe proof-of-concept is to feature-flag `IdleAction` so the player can optionally use `/public/animations/idle_sample.json` through `AnimationClipLoader` and `ClipAction`.

Do not implement that feature flag in this foundation task.
