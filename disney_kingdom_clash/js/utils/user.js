import { HERO_DATA } from '../data/heroData.js';
import { LEVEL_DATA } from '../data/levelData.js';

let currentUser;

const defaultUser = {
    name: 'Player123',
    level: 1,
    xp: 0,
    maxXp: 100,
    trophies: 0,
    trophiesByRealm: {},
    gold: 1000,
    crystals: 50,
    avatar: 'assets/images/heroes/elsa_hero_icon.png',
    ownedHeroes: ['minnie', 'groot', 'lumiere', 'winnie_the_pooh'],
    heroCollection: {
        'minnie': { starLevel: 1, shards: 0 },
        'groot': { starLevel: 1, shards: 0 },
        'lumiere': { starLevel: 1, shards: 0 },
        'winnie_the_pooh': { starLevel: 1, shards: 0 },
    },
    completedStages: [],
    unlockedDecks: ['1'],
    decks: {
        '1': ['minnie', 'groot', 'lumiere', 'winnie_the_pooh'],
        '2': [],
        '3': [],
    },
    activeDeck: '1',
    chests: [null, null, null, null],
    pendingReward: false,
    needsStarterHero: true
};

export function loadUser() {
    try {
        const savedUser = localStorage.getItem('disney-kingdom-clash-user');
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            // Start with defaults, then overwrite with saved data.
            // This ensures new properties in defaultUser are added to existing players.
            currentUser = { ...defaultUser, ...parsedUser };
            // Deep merge nested objects to prevent issues
            currentUser.heroCollection = { ...defaultUser.heroCollection, ...(parsedUser.heroCollection || {}) };
            currentUser.decks = { ...defaultUser.decks, ...(parsedUser.decks || {}) };
            // Ensure array properties from saved data are kept
            currentUser.completedStages = parsedUser.completedStages || defaultUser.completedStages;
            currentUser.ownedHeroes = parsedUser.ownedHeroes || defaultUser.ownedHeroes;

            // Migration for unlockedLevels -> completedStages
            if (parsedUser.unlockedLevels) {
                currentUser.completedStages = currentUser.completedStages || [];
                parsedUser.unlockedLevels.forEach(realmId => {
                    const realm = LEVEL_DATA[realmId];
                    if (realm && realm.stages) {
                        realm.stages.forEach(stage => {
                            if (!currentUser.completedStages.includes(stage.id)) {
                                currentUser.completedStages.push(stage.id);
                            }
                        });
                    }
                });
                delete currentUser.unlockedLevels; // Remove old property
            }

            // Ensure trophiesByRealm exists for older users
            if (!currentUser.trophiesByRealm) {
                currentUser.trophiesByRealm = {};
            }
            // Ensure all realms are initialized
            Object.keys(LEVEL_DATA).forEach(realmId => {
                if (!currentUser.trophiesByRealm[realmId]) {
                    currentUser.trophiesByRealm[realmId] = 0;
                }
            });
            
        } else {
            // For a brand new user, create a deep copy of the default user object.
            currentUser = JSON.parse(JSON.stringify(defaultUser));
            saveUser();
        }
    } catch (e) {
        console.error("Could not load user data, resetting to default.", e);
        currentUser = JSON.parse(JSON.stringify(defaultUser));
    }
}

export function saveUser() {
    try {
        localStorage.setItem('disney-kingdom-clash-user', JSON.stringify(currentUser));
    } catch (e) {
        console.error("Could not save user data.", e);
    }
}

export function getCurrentUser() {
    return currentUser;
}

export function setUserProperty(key, value) {
    if (currentUser) {
        currentUser[key] = value;
        saveUser();
    }
}

export function addXP(amount) {
    if (!currentUser) return;
    currentUser.xp += amount;
    while (currentUser.xp >= currentUser.maxXp) {
        currentUser.xp -= currentUser.maxXp;
        currentUser.level++;
        currentUser.maxXp = Math.floor(currentUser.maxXp * 1.5);
    }
    saveUser();
}

export function addTrophies(stageId) {
    if (!currentUser) return;

    let realmId = null;
    let stageData = null;

    for (const rId in LEVEL_DATA) {
        const stage = LEVEL_DATA[rId].stages.find(s => s.id === stageId);
        if (stage) {
            realmId = rId;
            stageData = stage;
            break;
        }
    }

    if (!stageData) {
        console.error(`Could not find stage data for ${stageId} to award trophies.`);
        return;
    }
    const amount = stageData.trophyReward;
    
    // Increment global trophy count (for unlocking realms)
    currentUser.trophies += amount;
    
    // Increment per-realm trophy count (for chest rewards)
    if (!currentUser.trophiesByRealm) currentUser.trophiesByRealm = {};
    if (!currentUser.trophiesByRealm[realmId]) currentUser.trophiesByRealm[realmId] = 0;
    
    const oldRealmTrophies = currentUser.trophiesByRealm[realmId];
    currentUser.trophiesByRealm[realmId] += amount;
    const newRealmTrophies = currentUser.trophiesByRealm[realmId];

    // Check if a 100-trophy threshold was crossed for the realm
    if (Math.floor(newRealmTrophies / 100) > Math.floor(oldRealmTrophies / 100)) {
        const emptySlotIndex = currentUser.chests.findIndex(c => c === null);
        if (emptySlotIndex !== -1) {
            currentUser.chests[emptySlotIndex] = { type: 'magical', state: 'locked' };
            console.log(`Awarded a Magical Chest for reaching ${Math.floor(newRealmTrophies / 100) * 100} trophies in ${realmId}.`);
        } else {
            console.log("Attempted to award a Magical Chest, but no empty slots were available.");
        }
    }

    // Add completed stage
    if (!currentUser.completedStages.includes(stageId)) {
        currentUser.completedStages.push(stageId);
    }
    
    saveUser();
    console.log(`User trophies updated to ${currentUser.trophies}. Stage ${stageId} marked as complete.`, currentUser.completedStages);
}

export function getActiveDeck() {
    if (!currentUser) return [];
    return currentUser.decks[currentUser.activeDeck] || [];
}

export function setActiveDeck(deckId) {
    if (currentUser && currentUser.unlockedDecks.includes(deckId)) {
        currentUser.activeDeck = deckId;
        saveUser();
        return true;
    }
    return false;
}

export function isLevelUnlocked(levelId) {
    if (!currentUser) return false;
    return currentUser.unlockedLevels.includes(levelId);
}

export function isRealmUnlocked(realmId) {
    if (!currentUser) return false;
    const realmData = LEVEL_DATA[realmId];
    if (!realmData) return false;
    return currentUser.trophies >= realmData.trophyRequirement;
}

export function isStageCompleted(stageId) {
    if (!currentUser) return false;
    return currentUser.completedStages.includes(stageId);
}

export function setDevMode(isEnabled) {
    if (isEnabled) {
        console.log("Dev Mode enabled: Unlocking all heroes.");
        const user = getCurrentUser();
        const allHeroIds = Object.keys(HERO_DATA);

        const ownedHeroesSet = new Set(user.ownedHeroes);
        allHeroIds.forEach(id => ownedHeroesSet.add(id));
        user.ownedHeroes = Array.from(ownedHeroesSet);

        allHeroIds.forEach(heroId => {
            if (!user.heroCollection[heroId]) {
                user.heroCollection[heroId] = { starLevel: 1, shards: 0 };
            }
        });

        saveUser();
    }
}