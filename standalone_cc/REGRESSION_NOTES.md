# Standalone CC Regression Notes

Last updated: March 5, 2026

This file records the specific `standalone_cc` changes that fixed the recurring preview/input/appearance regressions. Do not "simplify" these areas without re-testing the exact behaviors listed here.

## Last known good fix set

The current working fix depends on these files together:

- `standalone_cc/src/App.tsx`
- `standalone_cc/src/components/ui/previews/PlayerPreview.tsx`
- `standalone_cc/src/game/model/BodyMorpher.ts`
- `standalone_cc/src/game/model/mesh/ShirtBuilder.ts`

Relevant backup snapshots created during debugging:

- `standalone_cc/src/App.tsx.bak6`
- `standalone_cc/src/components/ui/previews/PlayerPreview.tsx.bak11`
- `standalone_cc/src/game/model/BodyMorpher.ts.bak2`
- `standalone_cc/src/game/model/mesh/ShirtBuilder.ts.bak2`

Older visual baselines that were useful for comparison:

- `standalone_cc/src/App.tsx.bak3`
- `standalone_cc/src/components/ui/previews/PlayerPreview.tsx.bak8`

## What broke repeatedly

### 1. Preview controls

Custom pointer handling in `PlayerPreview.tsx` kept regressing.

Symptoms:

- `LMB` orbit stopped working
- `RMB` pan stopped working
- browser input behavior varied depending on pointer capture/context menu interactions

Stable fix:

- use `OrbitControls`
- force mouse mapping:
  - left = rotate
  - right = pan
- keep zoom disabled in preview

Do not replace `OrbitControls` with hand-rolled pointer logic unless you retest all of the above.

## 2. UI changes appearing to do nothing

The animation loop in `PlayerPreview.tsx` can easily keep reading stale config if it closes over the initial value.

Symptoms:

- toggles appear clickable but model does not update
- face/outfit controls feel ignored
- preview seems stuck on initial appearance

Stable fix:

- maintain `configRef`
- update `configRef.current` in the config effect
- make the animation loop read `configRef.current`

## 3. Shirt pattern color not updating

`shirtColor2` existed in UI but was not part of the shirt rebuild hash and was not being used as the stripe/pattern color in `ShirtBuilder.ts`.

Symptoms:

- "Apparel Pattern" control changed nothing
- shirt details looked frozen

Stable fix:

- include `shirtColor2` in `BodyMorpher.updateShirt()` hash
- use `shirtColor2` as the non-leather shirt pattern color in `ShirtBuilder.ts`

## 4. Face default baseline drifting

The face is very sensitive to initial constants in `App.tsx`.

Symptoms:

- huge eyes
- bad lip/jaw/maxilla relationship
- "stupid" default face even before user edits

Stable fix:

- keep a curated default face baseline in `App.tsx`
- avoid random cleanup of:
  - `irisScale`
  - `pupilScale`
  - `chin*`
  - `maxilla*`
  - `upperLip*`
  - `lowerLip*`
  - `noseForward`

## Regression checklist

Before changing preview or appearance code, verify:

1. `LMB` drag rotates the preview
2. `RMB` drag pans the preview
3. Face controls visibly update the model live
4. Outfit toggles visibly add/remove gear live
5. `Apparel Pattern` changes shirt stripes/details live
6. Default male peasant character does not render with oversized eyes or distorted mouth/jaw

## Validation commands

Run from `standalone_cc`:

```powershell
npm run lint
npm run build
```

Passing lint/build is required but not sufficient. The manual checklist above must also pass.
