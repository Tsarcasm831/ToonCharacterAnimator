# Agent 2 – Hero Data

Hero definitions live in `js/data/heroes/`. Each file exports an object with these keys:

- `id` – Unique identifier used throughout the code.
- `name` – Display name for UI.
- `rarity` – `common`, `rare`, `epic` or `legendary`.
- `projectile` – Optional sound name and particle color.
- `heroAbility` – Name and description shown in the hero details modal.
- `starLevels` – Five entries describing bonuses and shard costs for each star.
- `levels` – Stats for the five upgrade levels. Each contains:
  - `damage` – Base attack damage per shot.
  - `cooldown` – Time between attacks.
  - `ability` – Object describing on-hit or passive ability type.
  - `abilityText` – Short text shown on the cards screen.

All heroes are combined in `js/data/heroData.js` which exports `HERO_DATA` for use by other modules. When adding a new hero, follow the template in `instructions/createhero.json` and import the hero file in `heroData.js`.
