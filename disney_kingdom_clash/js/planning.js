import { getActiveDeck, getCurrentUser, saveUser } from './utils/user.js';
import { HERO_DATA } from './data/heroData.js';
import { HERO_IMAGE_PATH, UI_IMAGE_PATH } from './constants.js';
import { LEVEL_DATA } from './data/levelData.js';

export function getAllHeroes() {
    return Object.values(HERO_DATA).map(hero => ({
        id: hero.id,
        name: hero.name,
        rarity: hero.rarity,
        imgLvl1: `${HERO_IMAGE_PATH}/${hero.id}_lvl1.png`,
        imgLvl2: `${HERO_IMAGE_PATH}/${hero.id}_lvl2.png`,
        imgLvl3: `${HERO_IMAGE_PATH}/${hero.id}_lvl3.png`,
        imgLvl4: `${HERO_IMAGE_PATH}/${hero.id}_lvl4.png`,
        imgLvl5: `${HERO_IMAGE_PATH}/${hero.id}_lvl5.png`,
    }));
}

let selectedDeck = [];
let currentHeroForModal = null;
const MAX_DECK_SIZE = 5;

function createHeroCard(hero, isOwned) {
    const card = document.createElement('div');
    card.className = 'hero-card';
    card.dataset.heroId = hero.id;

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
    return card;
}

export function initPlanning() {
    document.getElementById('modal-close-button').addEventListener('click', closeHeroDetailsModal);
    document.getElementById('modal-confirm-button').addEventListener('click', confirmHeroSelection);
    document.getElementById('star-level-upgrade-button').addEventListener('click', attemptStarUpgrade);
    
    document.querySelectorAll('#hero-details-modal .tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const modal = document.getElementById('hero-details-modal');
            if (!modal) return;
            const tabId = button.dataset.tab;
            
            modal.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            modal.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

            button.classList.add('active');
            const activePane = modal.querySelector(`#${tabId}-tab`);
            if (activePane) {
                activePane.classList.add('active');
            }
        });
    });

    document.querySelectorAll('#hero-details-modal .level-selector-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const level = event.currentTarget.dataset.level;
            updateLevelDetailsView(level);
        });
    });

    renderPlanningScreen();
}

export function renderPlanningScreen() {
    const availableList = document.getElementById('available-heroes-list');
    availableList.innerHTML = '';
    const user = getCurrentUser();
    
    getAllHeroes().forEach(hero => {
        const isOwned = user.ownedHeroes.includes(hero.id);
        const card = createHeroCard(hero, isOwned);
        
        if (isOwned) {
            card.addEventListener('click', () => {
                if (!selectedDeck.find(h => h.id === hero.id)) {
                    showHeroDetailsModal(hero, 'planning');
                }
            });
        }
        availableList.appendChild(card);
    });
    
    const activeDeckIds = getActiveDeck();
    selectedDeck = activeDeckIds.map(id => getAllHeroes().find(h => h.id === id)).filter(Boolean);
    
    updateUI();
}

function populateBonusDescription(container, bonusText) {
    container.innerHTML = '';
    if (!bonusText) return;
    if (bonusText.startsWith('+')) {
        const indicator = document.createElement('span');
        indicator.className = 'bonus-indicator';
        indicator.textContent = '+';
        container.appendChild(indicator);

        const text = document.createElement('span');
        text.className = 'bonus-text';
        text.textContent = bonusText.substring(1).trim();
        container.appendChild(text);
    } else {
        const text = document.createElement('span');
        text.className = 'bonus-text';
        text.textContent = bonusText;
        container.appendChild(text);
    }
}

export function showHeroDetailsModal(hero, context = 'planning') {
    currentHeroForModal = hero;
    const modal = document.getElementById('hero-details-modal');
    const heroData = HERO_DATA[hero.id];
    if (!heroData) return;

    document.getElementById('modal-hero-name').textContent = hero.name;
    document.getElementById('equipment-hero-preview').src = hero.imgLvl1;

    document.getElementById('stats-hero-preview').src = hero.imgLvl1;
    document.getElementById('stats-hero-name-display').textContent = hero.name;
    const rarityDisplay = document.getElementById('stats-hero-rarity-display');
    rarityDisplay.textContent = heroData.rarity;
    rarityDisplay.className = 'stats-hero-rarity';
    rarityDisplay.classList.add(heroData.rarity);
    
    document.getElementById('stats-hero-lore').textContent = heroData.lore || 'No lore available for this hero yet.';
    
    const tagsContainer = document.getElementById('stats-hero-tags');
    tagsContainer.innerHTML = '';
    if (heroData.tags && heroData.tags.length > 0) {
        heroData.tags.forEach(tagText => {
            const tag = document.createElement('span');
            tag.className = 'tag-badge';
            tag.textContent = tagText;
            tagsContainer.appendChild(tag);
        });
    } else {
        tagsContainer.innerHTML = '<span>No role tags defined.</span>';
    }

    const ability = heroData.heroAbility;
    if(ability) {
        document.getElementById('stats-hero-ability-name').textContent = ability.name;
        document.getElementById('stats-hero-ability-desc').textContent = ability.description;
    } else {
        document.getElementById('stats-hero-ability-name').textContent = "No ability";
        document.getElementById('stats-hero-ability-desc').textContent = "";
    }

    for (let i = 1; i <= 5; i++) {
        document.getElementById(`level-selector-btn-${i}`).querySelector('img').src = hero[`imgLvl${i}`];
    }

    updateLevelDetailsView(1);
    updateStarLevelTab();

    const confirmButton = document.getElementById('modal-confirm-button');
    if (context === 'planning') {
        confirmButton.style.display = 'block';
        const isInDeck = selectedDeck.find(h => h.id === hero.id);
        confirmButton.disabled = isInDeck || selectedDeck.length >= MAX_DECK_SIZE;
    } else {
        confirmButton.style.display = 'none';
    }

    modal.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    modal.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    const defaultTab = 'stats';
    modal.querySelector(`.tab-button[data-tab="${defaultTab}"]`).classList.add('active');
    modal.querySelector(`#${defaultTab}-tab`).classList.add('active');

    modal.style.display = 'flex';
}

function updateLevelDetailsView(level) {
    if (!currentHeroForModal) return;

    const hero = currentHeroForModal;
    const heroData = HERO_DATA[hero.id];
    const stats = heroData.levels[level];
    if (!stats) return;

    document.getElementById('level-details-img').src = hero[`imgLvl${level}`];
    document.getElementById('level-details-level').textContent = `Level ${level}`;
    document.getElementById('level-details-damage').textContent = stats.damage;
    document.getElementById('level-details-cooldown').textContent = stats.cooldown;
    document.getElementById('level-details-ability').textContent = stats.abilityText;

    document.querySelectorAll('.level-selector-button').forEach(button => {
        if (button.dataset.level === level.toString()) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

function updateStarLevelTab() {
    if (!currentHeroForModal) return;

    const hero = currentHeroForModal;
    const user = getCurrentUser();
    const isOwned = user.ownedHeroes.includes(hero.id);
    let heroCollectionData = user.heroCollection[hero.id];
    const heroStarData = HERO_DATA[hero.id].starLevels;

    if (!heroCollectionData) {
        heroCollectionData = { starLevel: 1, shards: 0 };
    }
    
    if (!heroStarData) return;

    const currentStarLevel = heroCollectionData.starLevel;
    const nextStarLevel = currentStarLevel + 1;
    const maxStarLevel = Object.keys(heroStarData).length;

    const starDisplay = document.getElementById('star-level-display');
    starDisplay.innerHTML = '';
    for (let i = 1; i <= maxStarLevel; i++) {
        const starImg = document.createElement('img');
        starImg.className = 'star-icon';
        starImg.src = i <= currentStarLevel ? `${UI_IMAGE_PATH}/star_icon.png` : `${UI_IMAGE_PATH}/star_icon_empty.png`;
        starImg.alt = i <= currentStarLevel ? 'Filled Star' : 'Empty Star';
        starDisplay.appendChild(starImg);
    }
    
    document.getElementById('star-level-shard-icon').src = `${UI_IMAGE_PATH}/hero_shard_icon.png`;

    document.getElementById('star-level-current-num').textContent = currentStarLevel;
    const currentBonusContainer = document.getElementById('star-level-current-bonus-container');
    populateBonusDescription(currentBonusContainer, heroStarData[currentStarLevel].bonus);

    const nextSection = document.getElementById('star-level-next-section');
    const upgradeSection = document.getElementById('star-level-upgrade-section');
    const maxLevelMessage = document.getElementById('star-level-max-message');

    if (currentStarLevel >= maxStarLevel) {
        nextSection.style.display = 'none';
        upgradeSection.style.display = 'none';
        maxLevelMessage.style.display = 'block';
    } else {
        nextSection.style.display = 'block';
        upgradeSection.style.display = isOwned ? 'flex' : 'none';
        maxLevelMessage.style.display = 'none';

        const nextLevelData = heroStarData[nextStarLevel];
        document.getElementById('star-level-next-num').textContent = nextStarLevel;
        const nextBonusContainer = document.getElementById('star-level-next-bonus-container');
        populateBonusDescription(nextBonusContainer, nextLevelData.bonus);

        if (isOwned) {
            const shardsNeeded = nextLevelData.shards;
            const shardsOwned = heroCollectionData.shards;
            document.getElementById('star-level-upgrade-cost').textContent = `${shardsOwned} / ${shardsNeeded}`;
    
            const upgradeButton = document.getElementById('star-level-upgrade-button');
            upgradeButton.disabled = shardsOwned < shardsNeeded;
        }
    }
}

function attemptStarUpgrade() {
    if (!currentHeroForModal) return;

    const hero = currentHeroForModal;
    const user = getCurrentUser();

    if (!user.ownedHeroes.includes(hero.id)) {
        alert("You must own this hero to upgrade their star level.");
        return;
    }

    const heroCollectionData = user.heroCollection[hero.id];
    const heroStarData = HERO_DATA[hero.id].starLevels;
    const currentStarLevel = heroCollectionData.starLevel;
    const nextStarLevel = currentStarLevel + 1;

    if (nextStarLevel > Object.keys(heroStarData).length) return;

    const cost = heroStarData[nextStarLevel].shards;
    if (heroCollectionData.shards >= cost) {
        heroCollectionData.shards -= cost;
        heroCollectionData.starLevel = nextStarLevel;
        saveUser();
        updateStarLevelTab();
    } else {
        alert("Not enough Hero Shards!");
    }
}

function closeHeroDetailsModal() {
    currentHeroForModal = null;
    document.getElementById('hero-details-modal').style.display = 'none';
}

function confirmHeroSelection() {
    if (currentHeroForModal) {
        selectHero(currentHeroForModal);
        closeHeroDetailsModal();
    }
}

function selectHero(hero) {
    if (selectedDeck.find(h => h.id === hero.id)) return;
    if (selectedDeck.length < MAX_DECK_SIZE) {
        selectedDeck.push(hero);
        updateUI();
    }
}

function deselectHero(hero) {
    selectedDeck = selectedDeck.filter(h => h.id !== hero.id);
    updateUI();
}

function updateUI() {
    const availableList = document.getElementById('available-heroes-list');
    const deckList = document.getElementById('deck-heroes-list');
    const deckCount = document.getElementById('deck-count');
    const startButton = document.getElementById('start-battle-button');

    deckList.innerHTML = '';
    selectedDeck.forEach(hero => {
        const card = createHeroCard(hero, true);
        card.addEventListener('click', () => deselectHero(hero));
        deckList.appendChild(card);
    });
    
    availableList.querySelectorAll('.hero-card').forEach(card => {
        const heroId = card.dataset.heroId;
        if (selectedDeck.find(h => h.id === heroId)) {
            card.classList.add('disabled');
        } else {
            card.classList.remove('disabled');
        }
    });

    deckCount.textContent = `${selectedDeck.length}`;
    startButton.disabled = selectedDeck.length !== MAX_DECK_SIZE;

    const user = getCurrentUser();
    user.decks[user.activeDeck] = selectedDeck.map(h => h.id);
    saveUser();
}

export function getSelectedDeck() {
    if (selectedDeck && selectedDeck.length > 0) {
        return selectedDeck;
    }
    const activeDeckIds = getActiveDeck();
    return activeDeckIds.map(id => getAllHeroes().find(h => h.id === id)).filter(Boolean);
}