import * as THREE from 'three';
import * as EnemyManager from './enemyManager.js';
import * as UI from '../ui.js';
import { HERO_ABILITY_EFFECTS } from '../abilities/heroAbilities.js';
import * as UnitManager from './unitManager.js';
import * as GameState from '../gameState.js';
import { HERO_DATA } from '../data/heroData.js';

const COOLDOWN = 30; // 30 seconds for all heroes for now
const heroStates = {};

export function init(deck) {
    // Clear state from previous game
    for (const key in heroStates) {
        delete heroStates[key];
    }

    const abilitiesContainer = document.getElementById('hero-abilities-container');
    abilitiesContainer.innerHTML = ''; // Clear previous buttons

    deck.forEach(hero => {
        const heroData = HERO_DATA[hero.id];
        if (!heroData) return;

        heroStates[hero.id] = { ready: true };

        // Add ability details to hero object for UI
        const heroWithAbility = {
            ...hero,
            ability: heroData.heroAbility
        };

        const heroButtonEl = UI.createHeroAbilityButton(heroWithAbility, () => onHeroCast(hero));
        abilitiesContainer.appendChild(heroButtonEl);
        UI.updateHeroCooldown(hero.id, COOLDOWN, true);
    });
}

export function updateAbilityButtonsState() {
    const allUnits = UnitManager.getAllUnits();

    const abilitiesContainer = document.getElementById('hero-abilities-container');
    if (!abilitiesContainer) return;

    const heroButtonContainers = abilitiesContainer.querySelectorAll('.hero-ability');

    heroButtonContainers.forEach(container => {
        const heroId = container.dataset.heroId;
        const button = container.querySelector('button');

        if (button && heroStates[heroId]) {
            const isAbilityUnlocked = allUnits.some(unit => unit.name === heroId && unit.level >= 3);
            const isReady = heroStates[heroId].ready;
            
            button.disabled = !isAbilityUnlocked || !isReady;
        }
    });
}

function onHeroCast(hero) {
    if (!heroStates[hero.id] || !heroStates[hero.id].ready) return;

    const allUnits = UnitManager.getAllUnits();
    const isAbilityUnlocked = allUnits.some(unit => unit.name === hero.id && unit.level >= 3);

    if (!isAbilityUnlocked) {
        console.warn(`Attempted to use ability for ${hero.name} but they are not level 3 or higher on the board.`);
        return; // Prevent ability use
    }
    
    // Check if there are any valid targets before casting
    const activeEnemies = EnemyManager.getAllEnemies();
    if (activeEnemies.length === 0) {
        console.log("No enemies to target with hero ability.");
        return;
    }

    triggerHeroEffect(hero.id);
    
    heroStates[hero.id].ready = false;
    UI.updateHeroCooldown(hero.id, COOLDOWN, false);
    
    setTimeout(() => {
        heroStates[hero.id].ready = true;
        UI.updateHeroCooldown(hero.id, COOLDOWN, true);
    }, COOLDOWN * 1000);
}

function triggerHeroEffect(heroId) {
    const effect = HERO_ABILITY_EFFECTS[heroId];
    if (effect && typeof effect === 'function') {
        effect();
    } else {
        console.warn(`No hero ability effect found for ${heroId}`);
    }
}