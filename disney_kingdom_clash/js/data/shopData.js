import { HERO_IMAGE_PATH, UI_IMAGE_PATH } from '../constants.js';

export const SHOP_DATA = {
    featured: [
        {
            id: 'jafar-unlock',
            type: 'hero',
            heroId: 'jafar',
            title: 'Legendary Hero',
            description: 'Unlock the powerful sorcerer, Jafar!',
            cost: 500,
            currency: 'crystals',
            image: `${HERO_IMAGE_PATH}/jafar_lvl4.png`
        }
    ],
    daily: [
        {
            id: 'lumiere-shards',
            type: 'shards',
            heroId: 'lumiere',
            amount: 50,
            title: 'Hero Cards',
            description: 'x50 Cards for Lumière',
            cost: 1000,
            currency: 'gold',
            image: `${HERO_IMAGE_PATH}/lumiere_hero_icon.png`
        },
        {
            id: 'cosmic-chest',
            type: 'chest',
            chestType: 'cosmic',
            title: 'Cosmic Chest',
            description: 'Contains cards for Epic and Legendary heroes.',
            cost: 250,
            currency: 'crystals',
            image: `${UI_IMAGE_PATH}/treasure_chest_closed.png`
        },
        {
            id: 'gold-pouch',
            type: 'currency',
            currencyType: 'gold',
            amount: 5000,
            title: 'Gold Pouch',
            description: 'A bag of gold to upgrade your heroes.',
            cost: 100,
            currency: 'crystals',
            image: `${UI_IMAGE_PATH}/gold_coin.png`
        }
    ]
};