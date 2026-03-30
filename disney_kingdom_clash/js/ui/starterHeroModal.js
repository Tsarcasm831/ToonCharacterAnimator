import { HERO_DATA } from '../data/heroData.js';
import { getCurrentUser, saveUser } from '../utils/user.js';
import { HERO_IMAGE_PATH, UI_IMAGE_PATH } from '../constants.js';

let selectedHeroId = null;
let onCompleteCallback = null;
let confirmButton;

function createHeroCard(hero) {
    const card = document.createElement('div');
    card.className = 'hero-card';
    card.dataset.heroId = hero.id;

    const rarityClass = hero.rarity || 'common';

    card.innerHTML = `
        <img src="${HERO_IMAGE_PATH}/${hero.id}_lvl1.png" class="hero-portrait" alt="${hero.name}">
        <div class="hero-frame ${rarityClass}"></div>
        <span class="hero-name-plate">${hero.name}</span>
    `;
    
    card.addEventListener('click', () => {
        selectHero(hero.id, card);
    });

    return card;
}

function selectHero(heroId, cardElement) {
    selectedHeroId = heroId;
    const grid = document.getElementById('starter-hero-grid');
    grid.querySelectorAll('.hero-card').forEach(card => card.classList.remove('selected'));
    cardElement.classList.add('selected');
    confirmButton.disabled = false;
}

function confirmSelection() {
    if (!selectedHeroId) return;

    const user = getCurrentUser();
    user.ownedHeroes.push(selectedHeroId);
    user.heroCollection[selectedHeroId] = { starLevel: 1, shards: 0 };
    
    if (user.decks['1'].length < 5) {
        user.decks['1'].push(selectedHeroId);
    }

    user.needsStarterHero = false;
    saveUser();
    
    document.getElementById('starter-hero-modal').style.display = 'none';
    if (onCompleteCallback) {
        onCompleteCallback();
    }
}

export function initStarterHeroModal(onComplete) {
    onCompleteCallback = onComplete;
    const modal = document.getElementById('starter-hero-modal');
    const grid = document.getElementById('starter-hero-grid');
    confirmButton = document.getElementById('confirm-starter-hero-button');

    grid.innerHTML = '';
    selectedHeroId = null;
    
    const newConfirmButton = confirmButton.cloneNode(true);
    confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
    confirmButton = newConfirmButton;
    confirmButton.disabled = true;

    const user = getCurrentUser();
    const availableHeroes = Object.values(HERO_DATA)
        .filter(hero => hero.rarity !== 'legendary' && !user.ownedHeroes.includes(hero.id));
    
    availableHeroes.forEach(hero => {
        const card = createHeroCard(hero);
        grid.appendChild(card);
    });
    
    confirmButton.addEventListener('click', confirmSelection);

    modal.style.display = 'flex';
}

