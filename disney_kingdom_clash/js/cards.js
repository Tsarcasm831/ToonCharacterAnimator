import { getCurrentUser, getActiveDeck } from './utils/user.js';
import { getAllHeroes, showHeroDetailsModal } from './planning.js'; // We can reuse the hero list
import { UI_IMAGE_PATH, HERO_IMAGE_PATH } from './constants.js';
import { HERO_DATA } from './data/heroData.js';

let currentUser;

export function initCardsScreen() {
    currentUser = getCurrentUser();
    if (!currentUser) return;
    
    populateDeck();
    populateCollection();
}

function createHeroCard(hero, isOwned) {
    const card = document.createElement('div');
    // Using the shared .hero-card class from planning-screen.css
    card.className = 'hero-card'; 
    if (!isOwned) {
        card.classList.add('locked');
    }

    const rarityClass = hero.rarity || 'common';

    card.innerHTML = `
        <img src="${hero.imgLvl1}" class="hero-portrait" alt="${hero.name}">
        <div class="hero-frame ${rarityClass}"></div>
        <span class="hero-name-plate">${hero.name}</span>
        ${!isOwned ? `<img src="${UI_IMAGE_PATH}/lock_icon.png" class="lock-icon" alt="Locked">` : ''}
    `;

    card.addEventListener('click', () => {
        showHeroDetailsModal(hero, 'cards');
    });

    return card;
}

function populateDeck() {
    const deckDisplay = document.getElementById('cards-deck-display');
    deckDisplay.innerHTML = '';

    if (!currentUser || !currentUser.decks) {
        console.error("User or user decks not available for populating.");
        return;
    }

    const userDeckHeroes = getActiveDeck()
        .map(heroId => getAllHeroes().find(h => h.id === heroId))
        .filter(Boolean); // Filter out any undefined results if a heroId is not found

    userDeckHeroes.forEach(hero => {
        const card = createHeroCard(hero, true);
        deckDisplay.appendChild(card);
    });
}

function populateCollection() {
    const collectionGrid = document.getElementById('hero-collection-grid');
    collectionGrid.innerHTML = '';

    getAllHeroes().forEach(hero => {
        const isOwned = currentUser.ownedHeroes.includes(hero.id);
        const card = createHeroCard(hero, isOwned);
        collectionGrid.appendChild(card);
    });
}