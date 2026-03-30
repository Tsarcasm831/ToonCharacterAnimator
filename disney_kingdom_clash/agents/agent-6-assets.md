# Agent 6 – Asset Pipeline

The `js/assets.js` module preloads textures and placeholder models. Keys for models and textures are generated from hero IDs, level IDs and glitch IDs.

Textures are loaded with `THREE.TextureLoader` and stored in an internal cache accessible via `getAsset(key)`. Models are simulated using `createPlaceholderModel` from `utils/placeholders.js`.

Projectile sound effects are preloaded in `utils/projectile.js`. The `preloadAll()` function loads both textures and sounds before the scene initializes.

When adding new assets, ensure the file paths match the constants in `js/constants.js` and reference them via the same key patterns used elsewhere in the project.
