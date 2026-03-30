import * as THREE from 'three';
import { getAsset } from '../assets.js';

let scene = null;
let activeEffects = [];

export function init(mainScene) {
    scene = mainScene;
    activeEffects = [];
}

export function update(delta) {
    for (let i = activeEffects.length - 1; i >= 0; i--) {
        const effect = activeEffects[i];
        if (!effect.update(delta)) {
            cleanupEffect(effect);
            activeEffects.splice(i, 1);
        }
    }
}

function cleanupEffect(effect) {
    if (effect.points && scene) scene.remove(effect.points);
    effect.geometry?.dispose();
    effect.material?.dispose();
}

export function triggerEffect(heroId, positions = [new THREE.Vector3(0, 1, 0)]) {
    if (!scene) return;
    const maker = EFFECT_MAP[heroId] || defaultEffect;
    positions.forEach(pos => {
        const effect = maker(pos.clone());
        if (effect) activeEffects.push(effect);
    });
}

function createParticleBurst(position, options) {
    const {
        color = 0xffffff,
        texture = 'sparkle_particle_tex',
        count = 50,
        spread = 1,
        velocity = 2,
        duration = 1
    } = options;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];
    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * spread;
        positions[i3 + 1] = (Math.random() - 0.5) * spread;
        positions[i3 + 2] = (Math.random() - 0.5) * spread;
        velocities.push(
            new THREE.Vector3(
                (Math.random() - 0.5),
                (Math.random() - 0.5),
                (Math.random() - 0.5)
            ).normalize().multiplyScalar(Math.random() * velocity)
        );
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color,
        size: 0.6,
        map: getAsset(texture),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    points.position.copy(position);
    scene.add(points);

    let life = 0;
    return {
        points,
        geometry,
        material,
        update: (delta) => {
            life += delta;
            if (life >= duration) return false;
            const posAttr = geometry.attributes.position;
            for (let i = 0; i < count; i++) {
                const vel = velocities[i];
                positions[i * 3] += vel.x * delta;
                positions[i * 3 + 1] += vel.y * delta;
                positions[i * 3 + 2] += vel.z * delta;
                posAttr.setXYZ(i, positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
            }
            posAttr.needsUpdate = true;
            material.opacity = 1 - life / duration;
            return true;
        }
    };
}

function defaultEffect(position) {
    return createParticleBurst(position, { color: 0xffffff });
}

const EFFECT_MAP = {
    'elsa': (pos) => createParticleBurst(pos, { color: 0xadd8e6, texture: 'snowflake_particle_tex', spread: 1.5 }),
    'moana': (pos) => createParticleBurst(pos, { color: 0x87cefa, texture: 'sparkle_particle_tex', velocity: 3 }),
    'buzz': (pos) => createParticleBurst(pos, { color: 0x90ee90, texture: 'phaser_particle_tex', count: 80, spread: 0.5 }),
    'stitch': (pos) => createParticleBurst(pos, { color: 0xff00ff, texture: 'sparkle_particle_tex', velocity: 4 }),
    'groot': (pos) => createParticleBurst(pos, { color: 0x90ee90, texture: 'leaf_particle_tex' }),
    'lumiere': (pos) => createParticleBurst(pos, { color: 0xffa500, texture: 'sparkle_particle_tex', velocity: 0.5 }),
    'genie': (pos) => createParticleBurst(pos, { color: 0x4169e1, texture: 'magic_sparkle_particle_tex', count: 70 }),
    'jafar': (pos) => createParticleBurst(pos, { color: 0x8a2be2, texture: 'magic_sparkle_particle_tex', spread: 1.2 }),
    'minnie': (pos) => createParticleBurst(pos, { color: 0xff69b4, texture: 'heart_particle_tex' }),
    'snow_white': (pos) => createParticleBurst(pos, { color: 0xffffe0, texture: 'music_note_particle_tex' }),
    'winnie_the_pooh': (pos) => createParticleBurst(pos, { color: 0xffb90f, texture: 'sparkle_particle_tex', velocity: 0.2 }),
    'tigger': (pos) => createParticleBurst(pos, { color: 0xffa500, texture: 'sparkle_particle_tex', spread: 0.8 }),
    'pocahontas': (pos) => createParticleBurst(pos, { color: 0x9acd32, texture: 'leaf_particle_tex', velocity: 3 }),
    'mickey_mouse': (pos) => createParticleBurst(pos, { color: 0xffff00, texture: 'sparkle_particle_tex' }),
    'jim_hawkins': (pos) => createParticleBurst(pos, { color: 0x1e90ff, texture: 'phaser_particle_tex', count: 90 }),
    'captain_amelia': (pos) => createParticleBurst(pos, { color: 0xff4500, texture: 'sparkle_particle_tex' }),
    'donald_duck': (pos) => createParticleBurst(pos, { color: 0xadd8e6, texture: 'sparkle_particle_tex' }),
    'peter_pan': (pos) => createParticleBurst(pos, { color: 0x7fff00, texture: 'sparkle_particle_tex' }),
    'cogsworth': (pos) => createParticleBurst(pos, { color: 0xb8860b, texture: 'gear_particle_tex' })
};

// Placeholder for future advanced VFX
// Real implementations might load GLB particle systems or shaders for each hero.
// When actual graphical assets become available, replace createParticleBurst calls
// with imported effects and handle any additional animations.
