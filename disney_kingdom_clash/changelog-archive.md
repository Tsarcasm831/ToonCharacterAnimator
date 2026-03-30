# Changelog Archive

## Version 0.7.9.5 (July 7, 2025)
-   **Fix:** Fixed multiple projectile effects that were not rendering correctly due to missing textures or incorrect blending modes. This affected heroes like Buzz, Stitch, Jafar, and Jim Hawkins.
-   **Fix:** Corrected an ID mismatch for Lumière that was preventing his projectile and other data from loading correctly.

## Version 0.7.9.4 (July 6, 2025)
-   **Fix:** Resolved a critical bug where completing a stage did not unlock the next one. Progression through realms should now work as intended.
-   **Fix:** Corrected an issue that caused the game to crash when starting a level due to improper wave data loading.
-   **Fix:** Fixed multiple errors related to projectile sound effects not loading, which was causing audio and console errors for several heroes.

## Version 0.7.9.3 (July 5, 2025)
-   **Fix:** Implemented full user data persistence. Your XP, gold, crystals, hero collection, and other progress will now be correctly saved and loaded between sessions.

## Version 0.7.9.2 (July 5, 2025)
-   **Hero Rework: Peter Pan!** Peter Pan's Level 5 ability, "Neverland's Blessing," has been completely redesigned. Instead of a flash freeze on stabilization, he now has a passive 10% chance to prevent an enemy from reaching the goal by returning it to the start of the path with full health. This gives him unique late-game defensive utility.

## Version 0.7.9.1 (July 4, 2025)
-   **New Feature: Per-Realm Trophy Rewards!** Each realm now tracks its own trophy count.
-   **Rewards:** Earn a Magical Chest for every 100 trophies collected in a specific realm. This provides a new way to earn rewards by mastering different areas of the game.
-   **UI:** The Arena Progress bar on the main menu now displays your progress towards the next trophy-based chest reward for the current realm in a tooltip.
-   **Data:** Refactored user data to support per-realm trophy tracking.

## Version 0.7.9.0 (July 4, 2025)
-   **New Feature: Starter Hero Selection!** New players are now welcomed with a special selection screen.
-   **Onboarding:** All players now start with the four common heroes unlocked. A new modal allows them to choose one additional non-legendary hero to complete their starting lineup.
-   **Fix:** Resolved an issue where several epic and rare heroes were incorrectly unlocked by default for new players.
-   **UI:** Added responsive styling for the new starter hero modal on mobile devices.
-   **Fix:** The hero chosen during the new player onboarding is now correctly unlocked and added to the player's collection and active deck.

## Version 0.7.8.3 (July 4, 2025)
-   **New Hero:** By Jove! Cogsworth from Beauty and the Beast has joined the clash as a new Rare support hero, bringing order to the battlefield.
-   **Assets:** Added complete image set, icon, and sound effects for Cogsworth.

## Version 0.7.8.2 (July 4, 2025)
-   **New Hero:** Howdy, partner! Woody from Toy Story has joined the clash as a new Epic support hero, ready to round up some glitches.
-   **Assets:** Added complete image set, icon, and sound effects for Woody.

## Version 0.7.8.1 (July 4, 2025)
-   **New Heroes:** Welcome three new heroes to the clash!
    -   **Captain Amelia:** A legendary tactical commander who brings naval precision and powerful orbital strikes.
    -   **Donald Duck:** An epic hero who channels his uncontrollable fury into devastating, area-of-effect tantrums.
    -   **Peter Pan:** An epic, agile skirmisher who uses the magic of Neverland to control the battlefield.
-   **Assets:** Added complete image sets, icons, and sound effects for the new heroes.
-   **Balance:** Minor tweaks to ability text and data for consistency across all heroes.
-   **Fixes:** Resolved numerous asset loading errors for a smoother experience.

## Version 0.7.7 (July 3, 2025)
-   **New Major Feature: Co-op Mode!** Team up with an AI partner to defend against the Disruptions on a brand new map layout. The lobby system is a work-in-progress for future multiplayer functionality.
-   **New UI:** Added a Co-op Lobby prototype and a new in-game UI for team play.
-   **Bug Fixes:** Addressed multiple issues in the new Co-op mode, including unit summoning, UI display, and state management.
-   **CSS:** Improved the visual styling and layout of the changelog modal to be more polished and scrollable.

## Version 0.7.4 (July 2, 2025)
-   **New Feature:** Added this very changelog! Click the question mark on the start menu to see what's new.
-   **Art Update:** Level 5 Groot, Jafar, and Winnie the Pooh now have unique 3D models.
-   **UI:** Minor visual updates and bug fixes across various menus.
-   **Backend:** Continued refactoring of core game logic for better stability and future features.

## Version 0.7.0 (June 28, 2025)
-   Major refactoring of game initialization and event handling.
-   Introduced new screens and UI components.
-   Added new heroes and balanced existing ones.

## Version 0.6.5 (June 15, 2025)
-   Initial implementation of the Glitches Codex feature.
-   Added several new enemy types with unique visuals.
-   Balanced gameplay for the first two realms.

## Version 0.6.0 (June 1, 2025)
-   Introduced the planning phase and deck building.
-   Added the first set of heroes and their abilities.
-   Created the initial three realms for players to defend.

## Version 0.5.0 (May 20, 2025)
-   Core gameplay loop implemented.
-   Basic summoning and merging mechanics functional.
-   Placeholder assets for all major systems.

## Version 0.4.0 (May 5, 2025)
-   Project setup and initial Three.js scene.
-   Created basic UI framework and menu navigation.
-   Defined initial data structures for heroes and enemies.