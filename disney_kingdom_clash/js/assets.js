import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createPlaceholderModel } from './utils/placeholders.js';
import { preloadProjectileSounds } from './utils/projectile.js';
import { HERO_DATA } from './data/heroData.js';
import { HERO_IMAGE_PATH, ENEMY_IMAGE_PATH, BACKGROUND_IMAGE_PATH, GLITCH_IMAGE_PATH, UI_IMAGE_PATH, PARTICLE_IMAGE_PATH, GROUND_TEXTURE_PATH, PATH_TEXTURE_PATH } from './constants.js';
import { LEVEL_DATA } from './data/levelData.js';
import { GLITCH_DATA } from './data/glitchData.js';

const ASSETS_CACHE = {};

export function getAsset(key) {
    return ASSETS_CACHE[key];
}

const MODELS = [];
const TEXTURES = {};

const GLBS = {
    'jafar': 'https://file.garden/Zy7B0LkdIVpGyzA1/Disney/assets/glbs/jafar.glb',
    'groot': 'https://file.garden/Zy7B0LkdIVpGyzA1/Disney/assets/glbs/groot.glb',
    'winnie_the_pooh': 'https://file.garden/Zy7B0LkdIVpGyzA1/Disney/assets/glbs/pooh.glb'
};

Object.keys(HERO_DATA).forEach(heroId => {
    for (let i = 1; i <= 5; i++) {
        const modelKey = `${heroId}_lvl${i}`;
        MODELS.push(modelKey);
        TEXTURES[`${modelKey}_tex`] = `${HERO_IMAGE_PATH}/${modelKey}.png`;
    }
});
MODELS.push('enemy_basic');

Object.keys(GLITCH_DATA).forEach(glitchId => {
    MODELS.push(glitchId);
    TEXTURES[`${glitchId}_tex`] = GLITCH_DATA[glitchId].image;
    TEXTURES[`${glitchId}_purified_tex`] = GLITCH_DATA[glitchId].purifiedImage;
});

TEXTURES['enemy_basic_tex'] = `${ENEMY_IMAGE_PATH}/enemy_basic.png`;

Object.values(LEVEL_DATA).forEach(level => {
    TEXTURES[level.id] = level.background;
    TEXTURES[`${level.id}_ground`] = level.groundTexture;
    TEXTURES[`${level.id}_path`] = level.pathTexture;
});

// Particle Textures
TEXTURES['sparkle_particle_tex'] = `${PARTICLE_IMAGE_PATH}/sparkle.png`;
TEXTURES['snowflake_particle_tex'] = `${PARTICLE_IMAGE_PATH}/snowflake.png`;
TEXTURES['leaf_particle_tex'] = `${PARTICLE_IMAGE_PATH}/leaf.png`;
TEXTURES['heart_particle_tex'] = `${PARTICLE_IMAGE_PATH}/heart.png`;
TEXTURES['music_note_particle_tex'] = `${PARTICLE_IMAGE_PATH}/music_note.png`;
TEXTURES['magic_sparkle_particle_tex'] = `${PARTICLE_IMAGE_PATH}/magic_sparkle.png`;
TEXTURES['phaser_particle_tex'] = `${PARTICLE_IMAGE_PATH}/phaser_particle.png`;
TEXTURES['fury_particle_tex'] = `${PARTICLE_IMAGE_PATH}/fury_particle.png`;
TEXTURES['whip_particle_tex'] = `${PARTICLE_IMAGE_PATH}/whip_particle.png`;
TEXTURES['gear_particle_tex'] = `${PARTICLE_IMAGE_PATH}/gear_particle.png`;


// This simulates GLTFLoader.loadAsync using our placeholder generator
function loadPlaceholderAsync(name) {
    return new Promise(resolve => {
        setTimeout(() => { // Simulate network latency
            const modelData = createPlaceholderModel(name);
            resolve(modelData);
        }, Math.random() * 100); // Reduced latency for faster testing
    });
}

const glbLoader = new GLTFLoader();
const MODEL_CACHE_NAME = 'disney-kingdom-clash-models-v1';

async function cacheModelsOnLoad() {
    if (!('caches' in window)) {
        console.log('Cache API not supported, skipping model caching.');
        return;
    }
    try {
        const cache = await caches.open(MODEL_CACHE_NAME);
        const requests = Object.values(GLBS).map(url => new Request(url));
        const responses = await Promise.all(requests.map(req => cache.match(req)));
        const allCached = responses.every(res => res && res.ok);
        if (allCached) {
            console.log('All GLB models are already cached.');
            return;
        }
        console.log('Caching GLB models...');
        await cache.addAll(Object.values(GLBS));
        console.log('All GLB models cached successfully.');
    } catch (error) {
        console.error('Failed to cache GLB models:', error);
    }
}

async function loadGlbFromCacheOrNetwork(url) {
    try {
        const cache = await caches.open(MODEL_CACHE_NAME);
        const response = await cache.match(url);
        let blobUrl;
        if (response && response.ok) {
            const blob = await response.blob();
            blobUrl = URL.createObjectURL(blob);
        } else {
            console.warn(`Model ${url} not found in cache. Fetching from network.`);
            blobUrl = url;
        }
        return await glbLoader.loadAsync(blobUrl);
    } catch (error) {
        console.error(`Failed to load GLB from ${url}`, error);
        return null;
    }
}

function preloadTextures() {
    const loader = new THREE.TextureLoader();
    const promises = Object.entries(TEXTURES).map(([key, path]) => {
        return new Promise((resolve) => {
            loader.load(path, (texture) => {
                ASSETS_CACHE[key] = texture;
                resolve();
            });
        });
    });
    return Promise.all(promises);
}

export async function preloadAll() {
    // Pre-cache models if not already cached.
    await cacheModelsOnLoad();

    // Preload sounds and textures in parallel
    await Promise.all([preloadTextures(), preloadProjectileSounds()]); 

    // Preload GLBs
    const glbPromises = Object.entries(GLBS).map(([key, url]) =>
        loadGlbFromCacheOrNetwork(url).then(gltf => {
            if (gltf) {
                ASSETS_CACHE[`${key}_glb`] = gltf;
            }
        })
    );
    await Promise.all(glbPromises);

    // Create model instances for each hero level from either GLB or placeholder
    const modelPromises = MODELS.map(name => {
        const [heroId, levelStr] = name.split('_lvl');
        const level = levelStr ? parseInt(levelStr) : 0;

        const loadedGltf = ASSETS_CACHE[`${heroId}_glb`];
        let useGlb = false;

        if (loadedGltf) {
            // For these specific heroes, only use the GLB model for level 5.
            if (['groot', 'jafar', 'winnie_the_pooh'].includes(heroId)) {
                if (level === 5) {
                    useGlb = true;
                }
            } else {
                // Future heroes with GLBs could use them for all levels.
                useGlb = true; 
            }
        }

        if (useGlb) {
            // We have a loaded GLB, clone it for this model key
            const modelData = {
                scene: loadedGltf.scene.clone(true),
                animations: loadedGltf.animations,
                isSprite: false
            };
            
            // Adjustments for the model
            modelData.scene.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                }
            });

            // Specific model adjustments for scale and position
            if (heroId === 'groot') {
                 modelData.scene.scale.set(1.2, 1.2, 1.2);
                 modelData.scene.position.y = 1;
            } else if (heroId === 'winnie_the_pooh') {
                modelData.scene.scale.set(0.012, 0.012, 0.012);
                modelData.scene.position.y = 0;
            } else if (heroId === 'jafar') {
                modelData.scene.scale.set(0.8, 0.8, 0.8);
                modelData.scene.position.y = 0;
            } else {
                modelData.scene.position.y = 1.25;
            }


            ASSETS_CACHE[name] = modelData;
            return Promise.resolve();
        } else {
            // No GLB, or not the right level for a special GLB, so use placeholder logic
            return loadPlaceholderAsync(name).then(gltf => {
                ASSETS_CACHE[name] = gltf;
            });
        }
    });

    return Promise.all(modelPromises);
}