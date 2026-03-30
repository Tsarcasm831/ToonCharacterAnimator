import * as THREE from 'three';
import { getAsset } from '../assets.js';
import { GLITCH_DATA } from '../data/glitchData.js';

// This file creates placeholder 3D models and animations
// to stand in for the GLB files mentioned in the plan.
// MODIFIED: It now creates sprites from loaded textures.

function createLevel5Placeholder() {
    const geo = new THREE.SphereGeometry(1.2, 32, 16);
    const mat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffaa00,
        emissiveIntensity: 2,
        roughness: 0.2,
        metalness: 0.8,
    });
    const model = new THREE.Mesh(geo, mat);
    model.castShadow = true;
    model.position.y = 1.25;

    const group = new THREE.Group();
    group.add(model);

    // Animations
    const idleClip = createIdleClip(model);
    const attackClip = createAttackClip(model, 'sphere'); // A unique attack animation

    return { scene: group, animations: [idleClip, attackClip] };
}

function createUnitSprite(texture) {
    const mat = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.1,
        side: THREE.DoubleSide
    });
    const geo = new THREE.PlaneGeometry(2.5, 2.5);
    const model = new THREE.Mesh(geo, mat);
    model.castShadow = true;
    model.position.y = 1.25;

    const group = new THREE.Group();
    group.add(model);

    // Animations
    const idleClip = createIdleClip(model);
    const attackClip = createAttackClip(model, 'sprite');

    return { scene: group, animations: [idleClip, attackClip] };
}

function createElsa(level) {
    const color = level === 1 ? 0x87CEEB : 0xB0E0E6;
    const geo = new THREE.ConeGeometry(0.8, 2.5, 8);
    const mat = new THREE.MeshStandardMaterial({ color, flatShading: true });
    const model = new THREE.Mesh(geo, mat);
    model.castShadow = true;
    model.position.y = 1.25;

    const group = new THREE.Group();
    group.add(model);

    // Animations
    const idleClip = createIdleClip(model);
    const attackClip = createAttackClip(model, 'cone');

    return { scene: group, animations: [idleClip, attackClip] };
}

function createMoana(level) {
    const color = level === 1 ? 0xD2691E : 0xCD853F;
    const geo = new THREE.BoxGeometry(1.2, 2.2, 1.2);
    const mat = new THREE.MeshStandardMaterial({ color, flatShading: true });
    const model = new THREE.Mesh(geo, mat);
    model.castShadow = true;
    model.position.y = 1.1;

    const group = new THREE.Group();
    group.add(model);
    
    const idleClip = createIdleClip(model);
    const attackClip = createAttackClip(model, 'box');

    return { scene: group, animations: [idleClip, attackClip] };
}

function createBuzz(level) {
    const color = level === 1 ? 0x90EE90 : 0xADFF2F;
    const geo = new THREE.CapsuleGeometry(0.7, 1.2, 4, 8);
    const mat = new THREE.MeshStandardMaterial({ color, flatShading: true });
    const model = new THREE.Mesh(geo, mat);
    model.castShadow = true;
    model.position.y = 1.3;

    const group = new THREE.Group();
    group.add(model);
    
    const idleClip = createIdleClip(model);
    const attackClip = createAttackClip(model, 'capsule');

    return { scene: group, animations: [idleClip, attackClip] };
}

function createEnemy() {
    const group = new THREE.Group();
    group.name = "EnemyModelGroup";
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x282828, roughness: 0.9 });

    // Body
    const bodyGeo = new THREE.BoxGeometry(1.8, 0.8, 0.8);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.name = "Body";
    group.add(body);

    // Head
    const headGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.set(1.1, 0.3, 0);
    head.castShadow = true;
    head.name = "Head";
    group.add(head);

    // Eyes
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xcc0000, emissiveIntensity: 2 });
    const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(1.4, 0.45, -0.2);
    leftEye.name = "LeftEye";
    group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(1.4, 0.45, 0.2);
    rightEye.name = "RightEye";
    group.add(rightEye);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.15, 0.1, 1.0, 6);
    const legPositions = [
        { x: 0.6, y: -0.6, z: -0.3, name: "FrontLeftLeg" },   // Front-Left
        { x: 0.6, y: -0.6, z: 0.3, name: "FrontRightLeg" },    // Front-Right
        { x: -0.6, y: -0.6, z: -0.3, name: "BackLeftLeg" },   // Back-Left
        { x: -0.6, y: -0.6, z: 0.3, name: "BackRightLeg" },     // Back-Right
    ];
    
    legPositions.forEach(posData => {
        const leg = new THREE.Mesh(legGeo, bodyMat);
        leg.position.set(posData.x, posData.y, posData.z);
        leg.castShadow = true;
        leg.name = posData.name;
        group.add(leg);
    });

    // Tail
    const tailGeo = new THREE.CylinderGeometry(0.1, 0.05, 0.8, 6);
    const tail = new THREE.Mesh(tailGeo, bodyMat);
    tail.position.set(-1.2, 0, 0);
    tail.rotation.z = Math.PI / 4;
    tail.castShadow = true;
    tail.name = "Tail";
    group.add(tail);

    group.position.y = 1.1; // Lift the whole model up

    // Animation
    const frontLeftLeg = group.getObjectByName("FrontLeftLeg");
    const frontRightLeg = group.getObjectByName("FrontRightLeg");
    const backLeftLeg = group.getObjectByName("BackLeftLeg");
    const backRightLeg = group.getObjectByName("BackRightLeg");

    const times = [0, 0.25, 0.5, 0.75, 1];
    const legSwing = Math.PI / 8;

    // Front-Left and Back-Right legs swing together
    const fwdSwing = [0, legSwing, 0, -legSwing, 0];
    // Front-Right and Back-Left legs swing together, opposite to the other pair
    const backSwing = [0, -legSwing, 0, legSwing, 0];

    const flTrack = new THREE.NumberKeyframeTrack(`${frontLeftLeg.uuid}.rotation[z]`, times, fwdSwing);
    const frTrack = new THREE.NumberKeyframeTrack(`${frontRightLeg.uuid}.rotation[z]`, times, backSwing);
    const blTrack = new THREE.NumberKeyframeTrack(`${backLeftLeg.uuid}.rotation[z]`, times, backSwing);
    const brTrack = new THREE.NumberKeyframeTrack(`${backRightLeg.uuid}.rotation[z]`, times, fwdSwing);

    // Body bobbing
    const bobValues = [group.position.y, group.position.y + 0.1, group.position.y, group.position.y - 0.1, group.position.y];
    const bobTrack = new THREE.NumberKeyframeTrack(`${group.uuid}.position[y]`, times, bobValues);

    const walkClip = new THREE.AnimationClip('walk', -1, [flTrack, frTrack, blTrack, brTrack, bobTrack]);

    return { scene: group, animations: [walkClip] };
}

function createPurifiedSprite(texture) {
    const mat = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.1,
        side: THREE.DoubleSide
    });
    const geo = new THREE.PlaneGeometry(2.5, 2.5);
    const model = new THREE.Mesh(geo, mat);
    model.castShadow = true;
    model.position.y = 1.25;

    const group = new THREE.Group();
    group.add(model);

    // No animations for purified sprites
    return { scene: group, animations: [] };
}

// Reusable animation creators
function createIdleClip(model) {
    const times = [0, 1, 2];
    const values = [
        1, 1.05, 1,
    ];
    const scaleTrack = new THREE.VectorKeyframeTrack('.scale', times, values.flatMap(v => [v, v, v]));
    return new THREE.AnimationClip('idle', -1, [scaleTrack]);
}

function createAttackClip(model, type) {
    let track;
    if (type === 'sprite') { // For all sprite units
        const times = [0, 0.2, 0.5];
        const values = [1, 1.2, 1];
        track = new THREE.VectorKeyframeTrack('.scale', times, values.flatMap(v => [v, v, v]));
    } else if (type === 'sphere') {
        const times = [0, 0.1, 0.4];
        const values = [model.material.emissiveIntensity, model.material.emissiveIntensity * 3, model.material.emissiveIntensity];
        track = new THREE.NumberKeyframeTrack('.material.emissiveIntensity', times, values);
    } else { // Fallback for old shapes
        const times = [0, 0.2, 0.5];
        const values = [1, 1.5, 1];
        track = new THREE.VectorKeyframeTrack('.scale', times, values.flatMap(v => [v, v, v]));
    }
    const clip = new THREE.AnimationClip('attack', 0.5, [track]);
    clip.loop = THREE.LoopOnce;
    return clip;
}

export function createPlaceholderModel(name) {
    let modelData;
    if (name.endsWith('_lvl5')) {
        modelData = createLevel5Placeholder();
        modelData.isSprite = false;
        return modelData;
    }
    const textureKey = `${name}_tex`;
    const texture = getAsset(textureKey);
    if (texture) {
        modelData = createUnitSprite(texture);
        modelData.isSprite = true;
        return modelData;
    }
    // Fallback for enemy or if textures fail to load
    if (name.startsWith('enemy') || GLITCH_DATA[name]) {
        modelData = createEnemy();
        modelData.isSprite = false;
        return modelData;
    }
    return null;
}

export function createPurifiedModel(name) {
    const textureKey = `${name}_purified_tex`;
    const texture = getAsset(textureKey);
    if (texture) {
        const modelData = createPurifiedSprite(texture);
        modelData.isSprite = true;
        return modelData;
    }
    return null;
}