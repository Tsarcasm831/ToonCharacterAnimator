export const CHEST_DATA = {
    'magical': {
        name: 'Magical Chest',
        unlockTime: 3 * 60 * 60, // 3 hours in seconds
        rewards: {
            gold: { min: 100, max: 200 },
            shards: { min: 5, max: 10, rarities: ['rare'] }
        }
    },
    'gold': {
        name: 'Gold Chest',
        unlockTime: 8 * 60 * 60, // 8 hours in seconds
        rewards: {
            gold: { min: 500, max: 1000 },
            shards: { min: 10, max: 20, rarities: ['rare', 'epic'] }
        }
    },
    'cosmic': {
        name: 'Cosmic Chest',
        unlockTime: 12 * 60 * 60, // 12 hours
        rewards: {
            gold: { min: 1000, max: 2000 },
            shards: { min: 20, max: 30, rarities: ['rare', 'epic', 'legendary'] }
        }
    }
};