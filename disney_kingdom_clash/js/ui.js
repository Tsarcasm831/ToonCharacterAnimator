import * as GridManager from './managers/gridManager.js';
import * as UnitManager from './managers/unitManager.js';
import { getAsset } from './assets.js';
import * as GameState from './gameState.js';
import { getCurrentUser } from './utils/user.js';
import { HERO_DATA } from './data/heroData.js';
import { HERO_IMAGE_PATH, UI_IMAGE_PATH } from './constants.js';
import { getActiveDeck } from './utils/user.js';
import { getAllHeroes } from './planning.js';

function getHeroIconPath(heroId) {
    return `${HERO_IMAGE_PATH}/${heroId}_hero_icon.png`;
}

export function init(levelData) {
    updateMana();
    updateHP(GameState.INITIAL_HP); // initial HP
    updateSelectionInfo(null, null);

    // Set level name
    const levelNameEl = document.getElementById('level-name-value');
    if (levelNameEl && levelData) {
        levelNameEl.textContent = levelData.name;
    }
}

export function updateMana() {
    const mana = GameState.getMana();
    const button = document.getElementById('summon-button');
    const manaCost = GameState.getSummonCost();
    const span = button.querySelector('span');
    if (span) {
        span.textContent = `Summon (${manaCost})`;
    }
    document.getElementById('mana-value').textContent = mana;
    button.disabled = mana < manaCost || UnitManager.isBoardFull();
}

export function updateHP(val) {
    const hpValueEl = document.getElementById('hp-value');
    const hpBarFillEl = document.getElementById('hp-bar-fill');
    const currentHP = Math.max(0, val);

    if(hpValueEl) {
        hpValueEl.textContent = `${currentHP} / ${GameState.INITIAL_HP}`;
    }
    if(hpBarFillEl) {
        const percentage = (currentHP / GameState.INITIAL_HP) * 100;
        hpBarFillEl.style.width = `${percentage}%`;
    }
}

export function updateWave(current, total) {
    const waveEl = document.getElementById('wave-value');
    if (waveEl) waveEl.textContent = `Wave ${current}/${total}`;
}

export function updatePurifiedCount() {
    const count = GameState.getTotalPurifiedCount();
    const countEl = document.getElementById('purified-value');
    if (countEl) {
        countEl.textContent = count;
    }
}

export function showObjective(text) {
    const banner = document.getElementById('objective-banner');
    if (!banner) return;
    banner.textContent = text;
    banner.classList.add('visible');
    setTimeout(() => {
        banner.classList.remove('visible');
    }, 4000);
}

export function updateSelectionInfo(i, j) {
    const unitDetails = document.getElementById('unit-details');
    const selectionPrompt = document.getElementById('selection-prompt');
    const selectedCellLabel = document.getElementById('selected-cell-label');
    const mergeButton = document.getElementById('merge-button');

    if (i !== null && j !== null) {
        const cellContent = GridManager.GRID[i][j];
        if (cellContent) {
            unitDetails.classList.remove('hidden');
            selectionPrompt.classList.add('hidden');
            
            const imgUrl = getAsset(`${cellContent.key}_tex`)?.image?.src;
            if (imgUrl) {
                document.getElementById('unit-info-img').src = imgUrl;
            }
            
            document.getElementById('unit-info-name').textContent = `${cellContent.name.charAt(0).toUpperCase() + cellContent.name.slice(1)} Lvl ${cellContent.level}`;
            document.getElementById('unit-info-damage').textContent = cellContent.stats.damage;
            document.getElementById('unit-info-cooldown').textContent = cellContent.stats.cooldown;
            document.getElementById('unit-info-ability').textContent = cellContent.stats.abilityText;
            document.getElementById('unit-info-ability-line').style.display = 'block';

            mergeButton.disabled = cellContent.level >= 5;

        } else {
            unitDetails.classList.add('hidden');
            selectionPrompt.classList.remove('hidden');
            selectedCellLabel.textContent = `[${i}, ${j}]`;
            mergeButton.disabled = true;
        }
    } else {
        unitDetails.classList.add('hidden');
        selectionPrompt.classList.remove('hidden');
        selectedCellLabel.textContent = `None`;
        mergeButton.disabled = true;
    }
}

export function updateMainMenuElements() {
    const user = getCurrentUser();
    if (!user) return;

    const avatarEl = document.getElementById('main-menu-avatar');
    const nameEl = document.getElementById('main-menu-player-name');
    const levelEl = document.getElementById('main-menu-player-level');
    const progressEl = document.getElementById('main-menu-level-progress');
    const crystalsEl = document.getElementById('main-menu-crystals');
    const goldEl = document.getElementById('main-menu-gold');

    if (avatarEl) avatarEl.src = user.avatar;
    if (nameEl) nameEl.textContent = user.name;
    if (levelEl) levelEl.textContent = `LVL ${user.level}`;

    if (progressEl && user.maxXp > 0) {
        const progressPercentage = (user.xp / user.maxXp) * 100;
        progressEl.style.width = `${progressPercentage}%`;
    }

    if (crystalsEl) crystalsEl.textContent = user.crystals.toLocaleString();
    if (goldEl) goldEl.textContent = user.gold.toLocaleString();

    // Update reward banner visibility
    const rewardBanner = document.querySelector('.reward-banner');
    if (rewardBanner) {
        if (user.pendingReward) {
            rewardBanner.classList.add('visible');
        } else {
            rewardBanner.classList.remove('visible');
        }
    }
}

export function updateHeroCooldown(heroId, duration, isReady) {
    const buttonContainer = document.querySelector(`.hero-ability[data-hero-id="${heroId}"]`);
    if (!buttonContainer) return;

    const overlay = buttonContainer.querySelector('.cooldown-overlay');
    const timerText = buttonContainer.querySelector('.cooldown-timer');
    const button = buttonContainer.querySelector('button');
    
    if (isReady) {
        overlay.style.transform = 'scaleY(0)';
        timerText.style.display = 'none';
    } else {
        overlay.style.transition = 'none';
        overlay.style.transform = 'scaleY(1)';
        timerText.style.display = 'block';
        
        let remaining = duration;
        timerText.textContent = `${remaining}s`;
        
        const interval = setInterval(() => {
            remaining--;
            timerText.textContent = `${remaining}s`;
            overlay.style.transition = 'transform 1s linear';
            overlay.style.transform = `scaleY(${remaining/duration})`;

            if (remaining <= 0) {
                clearInterval(interval);
                timerText.style.display = 'none';
            }
        }, 1000);
    }
}

export function createHeroAbilityButton(hero, onClick) {
    const container = document.createElement('div');
    container.className = 'hero-ability';
    container.dataset.heroId = hero.id;

    const button = document.createElement('button');
    button.className = 'hero-ability-button';
    button.addEventListener('click', onClick);

    const img = document.createElement('img');
    const iconPath = getHeroIconPath(hero.id);
    img.src = iconPath;
    img.alt = `${hero.name}'s Ability`;
    button.appendChild(img);

    const overlay = document.createElement('div');
    overlay.className = 'cooldown-overlay';

    const timer = document.createElement('div');
    timer.className = 'cooldown-timer';

    container.appendChild(button);
    container.appendChild(overlay);
    container.appendChild(timer);

    const tooltip = document.createElement('div');
    tooltip.className = 'hero-ability-tooltip';
    
    if (hero.ability) {
        tooltip.innerHTML = `
            <h4>${hero.ability.name}</h4>
            <p>${hero.ability.description}</p>
        `;
    }
    container.appendChild(tooltip);

    return container;
}

export function showScreen(screenId, hideId = null) {
    if (hideId) {
        const hideEl = document.getElementById(hideId);
        if (hideEl) hideEl.style.display = 'none';
    } else {
        // Hide all screens
        ['main-menu-screen', 'menu-screen', 'options-screen', 'instructions-screen', 'planning-screen', 'hero-details-modal', 'treasure-screen', 'cards-screen', 'glitches-screen', 'glitch-details-modal', 'realm-select-screen'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    }
    
    // Show the target screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.style.display = 'flex';
    }
}

export function showRewardModal(rewards) {
    const modal = document.getElementById('reward-modal');
    const itemsContainer = document.getElementById('reward-modal-items');
    if (!modal || !itemsContainer) return;

    itemsContainer.innerHTML = ''; // Clear previous rewards

    rewards.forEach(reward => {
        const itemEl = document.createElement('div');
        itemEl.className = 'reward-item';

        let iconSrc = '';
        let title = '';
        let description = `x${reward.amount.toLocaleString()}`;

        if (reward.type === 'gold') {
            iconSrc = `${UI_IMAGE_PATH}/gold_coin.png`;
            title = 'Gold';
        } else if (reward.type === 'crystals') {
            iconSrc = `${UI_IMAGE_PATH}/magic_crystal.png`;
            title = 'Crystals';
        } else if (reward.type === 'shards') {
            const heroData = HERO_DATA[reward.heroId];
            iconSrc = `${UI_IMAGE_PATH}/hero_shard_icon.png`;
            title = `${heroData.name} Shards`;
        }

        itemEl.innerHTML = `
            <img src="${iconSrc}" alt="${title}" class="reward-item-icon">
            <div class="reward-item-details">
                <h3>${title}</h3>
                <p>${description}</p>
            </div>
        `;
        itemsContainer.appendChild(itemEl);
    });

    modal.style.display = 'flex';
}