import { getCurrentUser, getActiveDeck, setActiveDeck, setUserProperty, saveUser } from './utils/user.js';
import { getAllHeroes, showHeroDetailsModal } from './planning.js';
import { updateMainMenuElements, showRewardModal } from './ui.js';
import { UI_IMAGE_PATH } from './constants.js';
import { HERO_DATA } from './data/heroData.js';
import { LEVEL_DATA } from './data/levelData.js';
import { updateTreasureScreen as updateTreasureScreenFromTreasure } from './treasure.js';

export function updateTreasureScreen() {
    updateTreasureScreenFromTreasure();
}

export function initMainMenu() {
    updateMainMenuUI();

    document.getElementById('deck-tab-1').addEventListener('click', () => switchActiveDeck('1'));
    document.getElementById('deck-tab-2').addEventListener('click', () => switchActiveDeck('2'));
    document.getElementById('deck-tab-3').addEventListener('click', () => switchActiveDeck('3'));

    // Add event listener for the reward banner
    document.querySelector('.reward-banner').addEventListener('click', collectReward);
}

function collectReward() {
    const user = getCurrentUser();
    if (!user.pendingReward) return;

    // Give a reward
    const goldReward = 500;
    const crystalReward = 25;
    user.gold += goldReward;
    user.crystals += crystalReward;
    
    // Clear the reward flag
    setUserProperty('pendingReward', false);
    saveUser();

    // Update the UI
    updateMainMenuUI();

    // Show a confirmation popup
    showRewardModal([
        { type: 'gold', amount: goldReward },
        { type: 'crystals', amount: crystalReward }
    ]);
}

function switchActiveDeck(deckId) {
    if (setActiveDeck(deckId)) {
        updateMainMenuUI();
    } else {
        console.log(`Deck ${deckId} is locked.`);
        // Optionally, provide user feedback that the deck is locked
    }
}

export function updateMainMenuUI() {
    const user = getCurrentUser();
    if (!user) return;

    updateMainMenuElements();
    updateDeckTabs();
    updateDeckDisplay();
    updateArenaProgress();
}

function updateDeckTabs() {
    const user = getCurrentUser();
    for (let i = 1; i <= 3; i++) {
        const deckId = i.toString();
        const tab = document.getElementById(`deck-tab-${deckId}`);
        if (!tab) continue;

        const isUnlocked = user.unlockedDecks.includes(deckId);
        tab.disabled = !isUnlocked;

        if (user.activeDeck === deckId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    }
}

function updateDeckDisplay() {
    const deckHeroIds = getActiveDeck();
    const deckDisplayContainer = document.querySelector('.deck-display');
    deckDisplayContainer.innerHTML = '';

    const allHeroesMap = new Map(getAllHeroes().map(h => [h.id, h]));
    const heroObjects = deckHeroIds.map(id => allHeroesMap.get(id)).filter(Boolean);
    const totalSlots = 5;
    
    // Create placeholders
    for(let i = 0; i < totalSlots; i++) {
        const card = document.createElement('div');
        card.className = 'deck-card';
        deckDisplayContainer.appendChild(card);
    }
    
    // Fill placeholders with actual hero cards
    const cardElements = deckDisplayContainer.querySelectorAll('.deck-card');
    heroObjects.forEach((hero, index) => {
        if(cardElements[index]) {
            cardElements[index].innerHTML = `<img src="${hero.imgLvl1}" alt="${hero.name}">`;
            cardElements[index].addEventListener('click', () => showHeroDetailsModal(hero, 'main_menu'));
        }
    });
}

function updateArenaProgress() {
    const user = getCurrentUser();
    const arenaInfoEl = document.querySelector('.arena-info h3');
    const progressFillEl = document.querySelector('.arena-progress-fill');
    const trophyCountEl = document.querySelector('.arena-trophy-count span');

    if (!arenaInfoEl || !progressFillEl || !trophyCountEl) return;

    // Find the player's current arena based on highest trophy requirement of completed stages
    const completedRealms = [...new Set(user.completedStages.map(s => s.split('_')[0]))];
    
    let currentArena = LEVEL_DATA.enchanted_plains;
    let highestTrophyReq = -1;

    completedRealms.forEach(realmId => {
        if (LEVEL_DATA[realmId] && LEVEL_DATA[realmId].trophyRequirement > highestTrophyReq) {
            highestTrophyReq = LEVEL_DATA[realmId].trophyRequirement;
            currentArena = LEVEL_DATA[realmId];
        }
    });
    
    // Find the next arena to unlock
    let nextArena = null;
    let nextRequirement = Infinity;
    const allArenasSorted = Object.values(LEVEL_DATA).sort((a,b) => a.trophyRequirement - b.trophyRequirement);
    for (const level of allArenasSorted) {
        if (level.trophyRequirement > currentArena.trophyRequirement) {
            nextArena = level;
            nextRequirement = level.trophyRequirement;
            break; 
        }
    }
    
    // Update the bar to show progress to next arena
    arenaInfoEl.textContent = `Arena: ${currentArena.name}`;
    
    const totalTrophies = user.trophies;

    // If all arenas are unlocked, show a full bar
    if (!nextArena) {
        progressFillEl.style.width = '100%';
        trophyCountEl.textContent = `${totalTrophies.toLocaleString()}`;
    } else {
        const previousRequirement = currentArena.trophyRequirement;
        const rangeSize = nextRequirement - previousRequirement;
        const trophiesInRange = totalTrophies - previousRequirement;
        
        const progressPercentage = rangeSize > 0 ? Math.max(0, Math.min(100, (trophiesInRange / rangeSize) * 100)) : 100;

        progressFillEl.style.width = `${progressPercentage}%`;
        trophyCountEl.textContent = `${totalTrophies.toLocaleString()} / ${nextRequirement.toLocaleString()}`;
    }

    // Update tooltip to show per-realm chest progress
    const arenaProgressContainer = document.querySelector('.arena-progress');
    const trophiesInCurrentRealm = user.trophiesByRealm[currentArena.id] || 0;
    const progressToNextChest = trophiesInCurrentRealm % 100;
    arenaProgressContainer.title = `Progress to next chest in this realm: ${progressToNextChest} / 100`;
}