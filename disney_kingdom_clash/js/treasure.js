import { getCurrentUser, saveUser, setUserProperty } from './utils/user.js';
import { updateMainMenuElements, showRewardModal } from './ui.js';
import { UI_IMAGE_PATH, HERO_IMAGE_PATH } from './constants.js';
import { HERO_DATA } from './data/heroData.js';
import { CHEST_DATA } from './data/chestData.js';
import { SHOP_DATA } from './data/shopData.js';

let chestTimerInterval = null;

const shopItemHandlers = {
    'jafar-unlock': (user, button) => {
        const itemData = SHOP_DATA.featured.find(i => i.id === 'jafar-unlock');
        if (user.ownedHeroes.includes(itemData.heroId)) {
            alert("You already own Jafar!");
            return;
        }
        const cost = itemData.cost;
        if (user.crystals >= cost) {
            user.crystals -= cost;
            if (!user.heroCollection) {
                user.heroCollection = {};
            }
            user.ownedHeroes.push(itemData.heroId);
            if (!user.heroCollection[itemData.heroId]) {
                user.heroCollection[itemData.heroId] = { starLevel: 1, shards: 0 };
            }
            alert(`Congratulations! You have unlocked ${HERO_DATA[itemData.heroId].name}!`);
            button.disabled = true;
            button.innerHTML = "OWNED";
            saveUser();
            updateMainMenuElements();
        } else {
            alert("Not enough crystals!");
        }
    },
    'lumiere-shards': (user, button) => {
        const itemData = SHOP_DATA.daily.find(i => i.id === 'lumiere-shards');
        const cost = itemData.cost;
        if (user.gold >= cost) {
            user.gold -= cost;
            if (user.heroCollection[itemData.heroId]) {
                user.heroCollection[itemData.heroId].shards += itemData.amount;
            } else {
                 // If user somehow doesn't own Lumiere, give them the hero too
                user.ownedHeroes.push(itemData.heroId);
                user.heroCollection[itemData.heroId] = { starLevel: 1, shards: itemData.amount };
            }
            alert(`You received ${itemData.amount} ${HERO_DATA[itemData.heroId].name} shards!`);
            saveUser();
            updateMainMenuElements();
        } else {
            alert("Not enough gold!");
        }
    },
    'cosmic-chest': (user, button) => {
        const itemData = SHOP_DATA.daily.find(i => i.id === 'cosmic-chest');
        const cost = itemData.cost;
        if (user.crystals >= cost) {
            user.crystals -= cost;
            const emptySlotIndex = user.chests.findIndex(c => c === null);
            if (emptySlotIndex !== -1) {
                user.chests[emptySlotIndex] = { type: itemData.chestType, state: 'locked' };
                alert(`You bought a ${CHEST_DATA[itemData.chestType].name}! It has been added to your chest slots.`);
                renderChests();
            } else {
                alert(`You bought a ${CHEST_DATA[itemData.chestType].name}, but you have no empty slots! It will be delivered later.`);
                 // TODO: A chest queue system could be implemented here.
            }
            saveUser();
            updateMainMenuElements();
        } else {
            alert("Not enough crystals!");
        }
    },
    'gold-pouch': (user, button) => {
        const itemData = SHOP_DATA.daily.find(i => i.id === 'gold-pouch');
        const cost = itemData.cost;
        if (user.crystals >= cost) {
            user.crystals -= cost;
            const goldReward = itemData.amount;
            user.gold += goldReward;
            alert(`You purchased a Gold Pouch and received ${goldReward.toLocaleString()} gold!`);
            saveUser();
            updateMainMenuElements();
        } else {
            alert("Not enough crystals!");
        }
    },
};

function formatTime(ms) {
    if (ms <= 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateChestTimers() {
    const timers = document.querySelectorAll('.unlock-timer');
    timers.forEach(timer => {
        const unlocksAt = parseInt(timer.dataset.unlocksAt);
        const remainingTime = unlocksAt - Date.now();

        if (remainingTime <= 0) {
            const slotEl = timer.closest('.chest-slot');
            const user = getCurrentUser();
            const slotIndex = parseInt(slotEl.dataset.slotIndex);
            if(user.chests[slotIndex] && user.chests[slotIndex].state === 'unlocking') {
                user.chests[slotIndex].state = 'ready';
                delete user.chests[slotIndex].unlocksAt;
                saveUser();
                renderChests();
            }
        } else {
            timer.textContent = formatTime(remainingTime);
        }
    });
}

function renderChests() {
    const user = getCurrentUser();
    const container = document.querySelector('.chest-slots-container');
    if (!container) return;
    container.innerHTML = '';

    user.chests.forEach((chest, index) => {
        const slot = document.createElement('div');
        slot.id = `chest-slot-${index + 1}`;
        slot.className = 'chest-slot';
        slot.dataset.slotIndex = index;

        if (chest) {
            const chestData = CHEST_DATA[chest.type];
            let content = '';
            switch(chest.state) {
                case 'ready':
                    slot.classList.add('ready');
                    content = `
                        <img src="${UI_IMAGE_PATH}/treasure_chest_closed.png" alt="Treasure Chest" class="chest-image">
                        <div class="chest-info">
                            <h3>${chestData.name}</h3>
                            <button class="open-chest-button">Tap to Open</button>
                        </div>`;
                    break;
                case 'unlocking':
                    slot.classList.add('unlocking');
                    const remainingTime = chest.unlocksAt - Date.now();
                    const unlockCost = Math.ceil(remainingTime / 1000 / 60 / 10); // 1 crystal per 10 mins
                    content = `
                        <img src="${UI_IMAGE_PATH}/treasure_chest_closed.png" alt="Unlocking Chest" class="chest-image">
                        <div class="chest-info">
                            <h3>${chestData.name}</h3>
                            <div class="unlock-timer" data-unlocks-at="${chest.unlocksAt}">${formatTime(remainingTime)}</div>
                            <button class="unlock-now-button" data-cost="${unlockCost}">
                                <img src="${UI_IMAGE_PATH}/magic_crystal.png" alt="Crystals">
                                <span>${unlockCost}</span>
                            </button>
                        </div>`;
                    break;
                case 'locked':
                    slot.classList.add('locked-chest');
                    content = `
                        <img src="${UI_IMAGE_PATH}/treasure_chest_closed.png" alt="Locked Chest" class="chest-image">
                        <div class="chest-info">
                            <h3>${chestData.name}</h3>
                            <button class="unlock-chest-button">Start Unlocking</button>
                        </div>
                    `;
                    break;
            }
            slot.innerHTML = content;
        } else {
            slot.classList.add('locked');
            slot.innerHTML = `<img src="${UI_IMAGE_PATH}/empty_chest_slot.png" alt="Empty Slot" class="chest-image">`;
        }
        container.appendChild(slot);
    });
}

function renderShop() {
    const featuredContainer = document.getElementById('featured-deals-grid');
    const dailyContainer = document.getElementById('daily-deals-grid');
    if(!featuredContainer || !dailyContainer) return;
    featuredContainer.innerHTML = '';
    dailyContainer.innerHTML = '';
    
    SHOP_DATA.featured.forEach(item => {
        featuredContainer.appendChild(createShopCard(item, true));
    });

    SHOP_DATA.daily.forEach(item => {
        dailyContainer.appendChild(createShopCard(item, false));
    });

    updateDailyDealTimer();
}

function createShopCard(item, isFeatured) {
    const card = document.createElement('div');
    card.className = 'shop-offer-card';
    if(isFeatured) card.classList.add('featured');
    card.dataset.item = item.id;

    const currencyIcon = item.currency === 'gold' ? `${UI_IMAGE_PATH}/gold_coin.png` : `${UI_IMAGE_PATH}/magic_crystal.png`;
    const user = getCurrentUser();
    const isOwned = item.type === 'hero' && user.ownedHeroes.includes(item.heroId);

    // Refactored structure for better CSS styling
    card.innerHTML = `
        <div class="shop-offer-header">
            <h3>${item.title}</h3>
        </div>
        <div class="shop-offer-content">
            <img src="${item.image}" alt="${item.title}" class="shop-offer-image ${item.type === 'currency' ? 'gold-pouch' : ''}">
            <p class="shop-offer-description">${item.description}</p>
        </div>
        <div class="shop-offer-footer">
            <button class="shop-buy-button ${item.currency}" data-cost="${item.cost}" data-currency="${item.currency}" ${isOwned ? 'disabled' : ''}>
                ${isOwned ? 'OWNED' : `
                    <img src="${currencyIcon}" alt="${item.currency}">
                    <span>${item.cost.toLocaleString()}</span>
                `}
            </button>
        </div>
    `;
    return card;
}

function updateDailyDealTimer() {
    const timerEl = document.getElementById('daily-deal-timer');
    if (!timerEl) return;
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const remaining = midnight.getTime() - now.getTime();
    timerEl.textContent = `Resets in: ${formatTime(remaining)}`;
}

function openChest(slotIndex) {
    const user = getCurrentUser();
    const chestSlot = user.chests[slotIndex];
    if (!chestSlot || chestSlot.state !== 'ready') return;

    const chestData = CHEST_DATA[chestSlot.type];
    
    const goldReward = Math.floor(Math.random() * (chestData.rewards.gold.max - chestData.rewards.gold.min + 1)) + chestData.rewards.gold.min;
    user.gold += goldReward;
    
    const possibleHeroRarities = chestData.rewards.shards.rarities;
    const heroesOfRarity = Object.values(HERO_DATA).filter(h => possibleHeroRarities.includes(h.rarity));
    const randomHeroId = heroesOfRarity[Math.floor(Math.random() * heroesOfRarity.length)].id;
    const shardsReward = Math.floor(Math.random() * (chestData.rewards.shards.max - chestData.rewards.shards.min + 1)) + chestData.rewards.shards.min;
    
    if (!user.heroCollection[randomHeroId]) {
        user.heroCollection[randomHeroId] = { starLevel: 1, shards: 0 };
    }
    user.heroCollection[randomHeroId].shards += shardsReward;

    showRewardModal([
        { type: 'gold', amount: goldReward },
        { type: 'shards', amount: shardsReward, heroId: randomHeroId }
    ]);
    
    user.chests[slotIndex] = null;
    saveUser();
    updateMainMenuElements();
    renderChests();
}

export function updateTreasureScreen() {
    renderChests();
    renderShop();
}

export function initTreasureScreen() {
    const treasureScreen = document.getElementById('treasure-screen');

    treasureScreen.addEventListener('click', (e) => {
        const user = getCurrentUser();
        const target = e.target;

        if (target.matches('.open-chest-button')) {
            const slot = target.closest('.chest-slot');
            openChest(slot.dataset.slotIndex);
        } else if (target.matches('.unlock-now-button') || target.parentElement.matches('.unlock-now-button')) {
             const button = target.closest('.unlock-now-button');
             const cost = parseInt(button.dataset.cost);
             if (user.crystals >= cost) {
                 user.crystals -= cost;
                 const slot = button.closest('.chest-slot');
                 const slotIndex = slot.dataset.slotIndex;
                 user.chests[slotIndex].state = 'ready';
                 saveUser();
                 openChest(slotIndex);
             } else {
                 alert("Not enough crystals to unlock now!");
             }
        } else if (target.matches('.unlock-chest-button')) {
            if (user.chests.some(c => c && c.state === 'unlocking')) {
                alert("Another chest is already being unlocked!");
                return;
            }
            const slot = target.closest('.chest-slot');
            const slotIndex = slot.dataset.slotIndex;
            const chest = user.chests[slotIndex];
            const chestData = CHEST_DATA[chest.type];

            chest.state = 'unlocking';
            chest.unlocksAt = Date.now() + chestData.unlockTime * 1000;
            saveUser();
            renderChests();
        } else if (target.matches('.shop-buy-button') || target.parentElement.matches('.shop-buy-button')) {
            const button = target.closest('.shop-buy-button');
            const card = button.closest('.shop-offer-card');
            const item = card.dataset.item;
            
            if (shopItemHandlers[item]) {
                shopItemHandlers[item](user, button);
            }
        }
    });

    if (chestTimerInterval) clearInterval(chestTimerInterval);
    chestTimerInterval = setInterval(updateChestTimers, 1000);
    setInterval(updateDailyDealTimer, 60000); // Update shop timer every minute
    updateTreasureScreen();
}