import * as THREE from 'three';

export const weaponConfig = {
    type: 'Shovel',
    handleLength: 1.4,
    handleRadius: 0.03,
    guardWidth: 0.1,
    bladeLength: 0.4,
    bladeWidth: 0.3,
    bladeThickness: 0.02,
    pommelSize: 0.05,
    scale: 1,
    handleColor: '#4e342e',
    metalColor: '#546e7a',
    guardColor: '#3e2723',
    roughness: 0.8,
    metalness: 0.3,
    handleTexture: 'Wood',
    bladeTexture: 'Rust',
    effect: 'Mud',
    effectColor: '#5d4037',
    variant: 'standard'
};

export interface WeaponConfig {
    type: string;
    handleLength: number;
    handleRadius: number;
    guardWidth: number;
    bladeLength: number;
    bladeWidth: number;
    bladeThickness: number;
    pommelSize: number;
    handleColor: string;
    metalColor: string;
    guardColor: string;
    roughness: number;
    metalness: number;
    effect: string;
    effectColor: string;
    variant?: string;
    handleTexture?: string;
    bladeTexture?: string;
    scale?: number;
}

export class ShovelBuilder {
    static build(): THREE.Group {
        return createWeapon();
    }
}

function createWeapon(config: WeaponConfig = weaponConfig): THREE.Group {
    const group = new THREE.Group();
    const scale = 0.46 * (config.scale ?? 1);

    const handleMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(config.handleColor),
        roughness: 0.85,
        metalness: 0.05
    });
    const metalMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(config.metalColor),
        roughness: config.roughness,
        metalness: config.metalness,
        flatShading: true
    });
    const guardMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(config.guardColor),
        roughness: 0.9,
        metalness: 0.08
    });
    const mudMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(config.effectColor),
        roughness: 1,
        metalness: 0,
        flatShading: true
    });

    const handleLength = config.handleLength * scale;
    const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(config.handleRadius * scale, config.handleRadius * scale, handleLength, 8),
        handleMat
    );
    handle.rotation.z = -Math.PI / 2;
    handle.position.x = handleLength * 0.08;
    handle.castShadow = true;
    group.add(handle);

    const pommel = new THREE.Mesh(
        new THREE.SphereGeometry(config.pommelSize * scale, 8, 6),
        guardMat
    );
    pommel.position.x = -handleLength * 0.48;
    pommel.scale.set(1.0, 0.75, 0.75);
    pommel.castShadow = true;
    group.add(pommel);

    const socket = new THREE.Mesh(
        new THREE.CylinderGeometry(config.guardWidth * scale * 0.42, config.guardWidth * scale * 0.32, config.guardWidth * scale, 8),
        guardMat
    );
    socket.rotation.z = Math.PI / 2;
    socket.position.x = handleLength * 0.48;
    socket.castShadow = true;
    group.add(socket);

    const blade = makeBlade(config, metalMat, scale);
    blade.position.x = handleLength * 0.62;
    blade.rotation.z = -Math.PI / 2;
    blade.castShadow = true;
    blade.receiveShadow = true;
    group.add(blade);

    const mudClump = new THREE.Mesh(
        new THREE.DodecahedronGeometry(config.bladeWidth * scale * 0.16, 0),
        mudMat
    );
    mudClump.position.set(handleLength * 0.71, -config.bladeWidth * scale * 0.18, config.bladeThickness * scale * 1.6);
    mudClump.scale.set(1.3, 0.45, 0.7);
    mudClump.rotation.set(0.2, 0.3, -0.35);
    group.add(mudClump);

    group.userData = {
        itemType: config.type,
        toolType: 'shovel',
        effect: config.effect
    };

    return group;
}

function makeBlade(config: WeaponConfig, material: THREE.Material, scale: number): THREE.Mesh {
    const width = config.bladeWidth * scale;
    const length = config.bladeLength * scale;
    const shape = new THREE.Shape();
    shape.moveTo(-width * 0.5, 0);
    shape.quadraticCurveTo(-width * 0.45, length * 0.72, 0, length);
    shape.quadraticCurveTo(width * 0.45, length * 0.72, width * 0.5, 0);
    shape.quadraticCurveTo(0, -length * 0.12, -width * 0.5, 0);

    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: config.bladeThickness * scale,
        bevelEnabled: true,
        bevelThickness: config.bladeThickness * scale * 0.35,
        bevelSize: config.bladeThickness * scale * 0.75,
        bevelSegments: 1
    });
    geometry.center();
    geometry.computeVertexNormals();

    return new THREE.Mesh(geometry, material);
}
