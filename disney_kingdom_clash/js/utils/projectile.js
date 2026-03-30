import * as THREE from 'three';
import { getAudioContext, getMasterSoundGain } from './settings.js';
import { HERO_DATA } from '../data/heroData.js';
import { SOUNDS_PATH, PARTICLE_IMAGE_PATH } from '../constants.js';
import { getAsset } from '../assets.js';

const PROJECTILE_SOUNDS = {};
// Pre-populate projectile sounds from HERO_DATA
Object.values(HERO_DATA).forEach(hero => {
    if (hero.projectile && hero.projectile.sound) {
        PROJECTILE_SOUNDS[hero.projectile.sound] = `${SOUNDS_PATH}/projectile_${hero.projectile.sound}.mp3`;
    }
});

const soundBuffers = {};
let activeProjectiles = [];

export function init() {
    activeProjectiles = [];
}

export function update(delta) {
    for (let i = activeProjectiles.length - 1; i >= 0; i--) {
        const alive = activeProjectiles[i].update(delta);
        if (!alive) {
            activeProjectiles.splice(i, 1);
        }
    }
}

async function loadSound(name, url) {
    const audioContext = getAudioContext();
    if (!audioContext) return;
    if (soundBuffers[name]) return;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        soundBuffers[name] = audioBuffer;
    } catch (e) {
        console.error(`Failed to load or decode sound: ${name} from ${url}`, e);
    }
}

export async function preloadProjectileSounds() {
    const promises = Object.entries(PROJECTILE_SOUNDS).map(([key, file]) =>
        loadSound(key, file)
    );
    await Promise.all(promises);
}

function getProjectileConfig(heroId) {
    const baseConfig = {
        count: 50,
        size: 0.3,
        color: 0xffff00,
        spread: 0.5,
        velocity: 2.0,
        lifespan: 0.5,
        texture: null,
        blending: THREE.AdditiveBlending,
        duration: 0.4,
        customParticleUpdate: null
    };

    switch (heroId) {
        case 'elsa':
            return { ...baseConfig, color: 0xadd8e6, texture: getAsset('snowflake_particle_tex'), size: 0.5, velocity: 1, blending: THREE.NormalBlending };
        case 'moana':
            return { ...baseConfig, color: 0x87cefa, count: 80, size: 0.2, spread: 0.3, velocity: 2.5, blending: THREE.NormalBlending, texture: getAsset('sparkle_particle_tex') };
        case 'buzz':
            return { ...baseConfig, color: 0x90ee90, count: 100, size: 0.15, spread: 0.1, velocity: 0.1, lifespan: 0.05, duration: 0.2 };
        case 'stitch':
            return { ...baseConfig, color: 0xff00ff, texture: getAsset('sparkle_particle_tex'), size: 0.4, velocity: 4, spread: 0.8, blending: THREE.NormalBlending };
        case 'groot':
            return { ...baseConfig, color: 0x90ee90, texture: getAsset('leaf_particle_tex'), size: 0.4, velocity: 1.5, blending: THREE.NormalBlending };
        case 'lumiere':
            return { ...baseConfig, color: 0xffa500, texture: getAsset('sparkle_particle_tex'), size: 0.25, velocity: 0.5, customParticleUpdate: (p, v) => { p.y += 0.01; } }; // Embers rise
        case 'genie':
            return { ...baseConfig, color: 0x4169e1, texture: getAsset('sparkle_particle_tex'), size: 0.35, velocity: 2, customParticleUpdate: (p, v, d) => {
                const swirlSpeed = 5;
                const radius = Math.sin(p.y * Math.PI); // just using a property for variation
                p.x += Math.sin(p.z * swirlSpeed) * radius * 0.1;
                p.z += Math.cos(p.x * swirlSpeed) * radius * 0.1;
            }};
        case 'jafar':
            return { ...baseConfig, color: 0x8A2BE2, texture: getAsset('sparkle_particle_tex'), size: 0.4, velocity: 1.5, lifespan: 0.8, spread: 0.7 };
        case 'minnie':
            return { ...baseConfig, color: 0xFF69B4, texture: getAsset('heart_particle_tex'), size: 0.4, velocity: 0.5, blending: THREE.NormalBlending };
        case 'snow_white':
            return { ...baseConfig, color: 0xFFFFE0, texture: getAsset('music_note_particle_tex'), size: 0.4, velocity: 1.0, blending: THREE.NormalBlending };
        case 'winnie_the_pooh':
            return { ...baseConfig, color: 0xFFB90F, count: 30, size: 0.4, velocity: 0.2, spread: 0.2, blending: THREE.NormalBlending, customParticleUpdate: (p) => { p.y -= 0.02; } }; // Drip
        case 'tigger':
            return { ...baseConfig, color: 0xffa500, count: 40, size: 0.25, velocity: 2, customParticleUpdate: (p,v) => { if (Math.random() < 0.05) v.y = Math.abs(v.y); p.y += v.y*0.01; v.y -= 0.01 }}; // Bounce
        case 'pocahontas':
            return { ...baseConfig, color: 0x9acd32, texture: getAsset('leaf_particle_tex'), size: 0.4, velocity: 3.5, blending: THREE.NormalBlending, customParticleUpdate: (p, v, d) => {
                 const swirlSpeed = 8;
                 p.x += Math.sin(p.y * swirlSpeed) * 0.05;
                 p.z += Math.cos(p.y * swirlSpeed) * 0.05;
            }};
        case 'mickey_mouse':
            return { ...baseConfig, color: 0xffd700, texture: getAsset('magic_sparkle_particle_tex'), size: 0.5, velocity: 2.0, blending: THREE.AdditiveBlending, customParticleUpdate: (p,v,d) => {
                p.x += Math.sin(p.y * 10) * 0.08;
                p.z += Math.cos(p.y * 10) * 0.08;
            } };
        case 'jim_hawkins':
             return { ...baseConfig, color: 0x00ffff, count: 80, size: 0.1, spread: 0.2, velocity: 5, lifespan: 0.2, duration: 0.3 };
        case 'captain_amelia':
             return { ...baseConfig, color: 0x00ffff, count: 60, size: 0.2, spread: 0.1, velocity: 8, lifespan: 0.15, duration: 0.2, texture: getAsset('phaser_particle_tex'), blending: THREE.AdditiveBlending };
        case 'donald_duck':
            return { ...baseConfig, color: 0xff0000, texture: getAsset('fury_particle_tex'), size: 0.5, velocity: 2.5, blending: THREE.NormalBlending, customParticleUpdate: (p, v, d) => {
                p.x += (Math.random() - 0.5) * 0.2;
                p.y += (Math.random() - 0.5) * 0.2;
            }};
        case 'peter_pan':
            return { ...baseConfig, color: 0x228b22, texture: getAsset('leaf_particle_tex'), size: 0.4, velocity: 4.0, blending: THREE.NormalBlending, customParticleUpdate: (p, v, d) => {
                 p.x += (Math.random() - 0.5) * 0.1;
                 p.y += (Math.random() - 0.5) * 0.1;
            }};
        case 'woody':
            return { ...baseConfig, color: 0xDAA520, texture: getAsset('whip_particle_tex'), size: 0.4, velocity: 3.0, customParticleUpdate: (p, v, d, life) => {
                const swirlSpeed = 12;
                const radius = Math.sin(p.y * Math.PI) * 0.5;
                const angle = life * swirlSpeed;
                p.x = Math.cos(angle) * radius;
                p.z = Math.sin(angle) * radius;
            }};
        case 'cogsworth':
            return { ...baseConfig, color: 0xB8860B, texture: getAsset('gear_particle_tex'), size: 0.4, velocity: 1.8, blending: THREE.NormalBlending };
        default:
            return { ...baseConfig, color: 0xffff00, texture: getAsset('sparkle_particle_tex') };
    }
}

export function createProjectile(scene, cell, enemy) {
    // Play sound
    const audioContext = getAudioContext();
    if (audioContext && audioContext.state === 'running' && HERO_DATA[cell.name]?.projectile?.sound) {
        const soundKey = HERO_DATA[cell.name].projectile.sound;
        if (soundBuffers[soundKey]) {
            const source = audioContext.createBufferSource();
            source.buffer = soundBuffers[soundKey];
            source.connect(getMasterSoundGain());
            source.start(0);
        }
    }

    // Config
    const config = getProjectileConfig(cell.name);
    const startPos = cell.model.position.clone().add(new THREE.Vector3(0, 1.5, 0));

    // Particles
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(config.count * 3);
    const particles = [];

    for (let i = 0; i < config.count; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * config.spread;
        positions[i3 + 1] = (Math.random() - 0.5) * config.spread;
        positions[i3 + 2] = (Math.random() - 0.5) * config.spread;
        
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)
        ).normalize().multiplyScalar(Math.random() * config.velocity);

        particles.push({
            position: new THREE.Vector3(positions[i3], positions[i3+1], positions[i3+2]),
            velocity,
            lifetime: Math.random() * config.lifespan,
        });
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: config.color,
        size: config.size,
        map: config.texture,
        blending: config.blending,
        transparent: true,
        depthWrite: false,
        sizeAttenuation: true
    });

    const points = new THREE.Points(geometry, material);
    points.position.copy(startPos);
    scene.add(points);

    let life = 0;

    const projectile = {
        update: (delta) => {
            life += delta;
            if (life >= config.duration || !enemy.model.parent) { // Stop if enemy is gone
                scene.remove(points);
                geometry.dispose();
                material.dispose();
                return false; // dead
            }

            // Move core
            const t = life / config.duration;
            const currentTargetPos = enemy.model.position.clone().add(new THREE.Vector3(0, 1, 0));
            points.position.lerpVectors(startPos, currentTargetPos, t);

            // Update particles
            const posAttr = geometry.attributes.position;
            for (let i = 0; i < config.count; i++) {
                const p = particles[i];
                p.lifetime -= delta;
                if (p.lifetime <= 0) {
                    p.position.set((Math.random() - 0.5) * config.spread, (Math.random() - 0.5) * config.spread, (Math.random() - 0.5) * config.spread);
                    p.lifetime = config.lifespan;
                } else {
                    p.position.add(p.velocity.clone().multiplyScalar(delta));
                    if (config.customParticleUpdate) {
                        config.customParticleUpdate(p.position, p.velocity, delta, life);
                    }
                }
                posAttr.setXYZ(i, p.position.x, p.position.y, p.position.z);
            }
            posAttr.needsUpdate = true;
            material.opacity = Math.sin(Math.PI * (1.0 - t));

            return true; // alive
        }
    };

    activeProjectiles.push(projectile);
}