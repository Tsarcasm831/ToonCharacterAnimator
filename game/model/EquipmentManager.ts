
import * as THREE from 'three';
import { PlayerConfig } from '../../types';
import { PlayerEquipment } from './PlayerEquipment';

export class EquipmentManager {
    equippedMeshes: {
        helm?: THREE.Object3D;
        mask?: THREE.Object3D;
        hood?: THREE.Object3D;
        mageHat?: THREE.Object3D;
        leftPauldron?: THREE.Object3D;
        rightPauldron?: THREE.Object3D;
        shield?: THREE.Object3D;
        heldItem?: THREE.Object3D;
        quiver?: THREE.Object3D;
    } = {};

    private parts: any;
    private currentHeldItem: string | null = null;

    constructor(parts: any) {
        this.parts = parts;
    }

    updateEquipment(config: PlayerConfig) {
        PlayerEquipment.updateArmor(config, this.parts, this.equippedMeshes);
    }

    updateHeldItem(itemName: string | null) {
        this.currentHeldItem = PlayerEquipment.updateHeldItem(
            itemName,
            this.currentHeldItem,
            this.parts,
            this.equippedMeshes
        );
    }

    positionEquipment(config: PlayerConfig) {
        // --- RIGGING UPDATES ---
        if (this.equippedMeshes.helm) {
            this.equippedMeshes.helm.position.set(config.helmX, config.helmY, config.helmZ);
            this.equippedMeshes.helm.rotation.x = config.helmRotX;
            this.equippedMeshes.helm.scale.setScalar(config.helmScale);
        }
        if (this.equippedMeshes.hood) {
            this.equippedMeshes.hood.position.set(config.hoodX, config.hoodY, config.hoodZ);
            this.equippedMeshes.hood.scale.setScalar(config.hoodScale);
        }
        if (this.equippedMeshes.mageHat) {
            this.equippedMeshes.mageHat.position.set(config.mageHatX, config.mageHatY, config.mageHatZ);
            this.equippedMeshes.mageHat.rotation.x = config.mageHatRotX;
            this.equippedMeshes.mageHat.scale.setScalar(config.mageHatScale);
            
            // Update colors in real-time
            this.equippedMeshes.mageHat.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    if (child.material instanceof THREE.MeshStandardMaterial) {
                        if (child.geometry.type === 'CylinderGeometry' && child.position.y > 0) {
                            child.material.color.set(config.mageHatBandColor);
                        } else if (child.geometry.type !== 'BoxGeometry' && child.geometry.type !== 'ConeGeometry') {
                            child.material.color.set(config.mageHatColor);
                        }
                    }
                }
            });
        }
        if (this.equippedMeshes.mask) {
            this.equippedMeshes.mask.position.set(config.maskX, config.maskY, config.maskZ);
            this.equippedMeshes.mask.rotation.x = config.maskRotX;
            this.equippedMeshes.mask.scale.set(
                config.maskScale * config.maskStretchX,
                config.maskScale * config.maskStretchY,
                config.maskScale * config.maskStretchZ
            );
        }
        if (this.equippedMeshes.leftPauldron) {
            this.equippedMeshes.leftPauldron.position.set(config.shoulderX, config.shoulderY, config.shoulderZ);
            this.equippedMeshes.leftPauldron.scale.setScalar(config.shoulderScale);
        }
        if (this.equippedMeshes.rightPauldron) {
            this.equippedMeshes.rightPauldron.position.set(-config.shoulderX, config.shoulderY, config.shoulderZ);
            this.equippedMeshes.rightPauldron.scale.setScalar(config.shoulderScale);
        }
        if (this.equippedMeshes.shield) {
            this.equippedMeshes.shield.position.set(config.shieldX, config.shieldY, config.shieldZ);
            this.equippedMeshes.shield.rotation.z = config.shieldRotZ;
            this.equippedMeshes.shield.scale.setScalar(config.shieldScale);
        }
    }
}
