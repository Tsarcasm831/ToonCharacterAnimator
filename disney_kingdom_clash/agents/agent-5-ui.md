# Agent 5 – UI System

User interface elements are defined as HTML strings in `js/screens/`. Examples include `screen-game-ui.js` for the in-game HUD and `screen-cards.js` for the card collection view. The DOM is populated at startup by `js/ui/domManager.js`, which injects all snippets into the `#app-container` element.

The UI module (`js/ui.js`) exposes helper functions for showing/hiding screens and updating labels such as mana or health. CSS classes in the `css/` folder control the look and feel.

When a button is clicked, event listeners in `js/game.js` or the managers call into logic modules. For example, `#summon-button` triggers `unitManager.trySummon()`.
