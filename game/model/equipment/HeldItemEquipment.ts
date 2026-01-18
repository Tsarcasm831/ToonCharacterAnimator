import * as THREE from 'three';
import { SwordBuilder } from './SwordBuilder';
import { AxeBuilder } from './AxeBuilder';
import { PickaxeBuilder } from './PickaxeBuilder';
import { KnifeBuilder } from './KnifeBuilder';
import { HalberdBuilder } from './HalberdBuilder';
import { FishingPoleBuilder } from './FishingPoleBuilder';
import { BowBuilder } from './BowBuilder';
import { StaffBuilder } from './StaffBuilder';

export function updateHeldItem(
    itemName: string | null,
    currentHeldItem: string | null,
    parts: any,
    equippedMeshes: any
): string | null {
    if (itemName === currentHeldItem) return currentHeldItem;

    // 1. Remove old item
    if (equippedMeshes.heldItem) {
        if (equippedMeshes.heldItem.parent) {
            equippedMeshes.heldItem.parent.remove(equippedMeshes.heldItem);
        }
        delete equippedMeshes.heldItem;
    }

    // Specialized cleanup for Bow (Quiver)
    if (equippedMeshes.quiver) {
        if (equippedMeshes.quiver.parent) {
            equippedMeshes.quiver.parent.remove(equippedMeshes.quiver);
        }
        delete equippedMeshes.quiver;
    }

    if (!itemName) return null;

    // 2. Build new item
    let newItem: THREE.Group | THREE.Object3D | null = null;
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.8 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x90a4ae, metalness: 0.8, roughness: 0.2 });

    switch (itemName) {
        case 'Sword':
            newItem = SwordBuilder.build(woodMat, metalMat);
            parts.rightHandMount.add(newItem);
            break;
        case 'Axe':
            newItem = AxeBuilder.build(woodMat, metalMat);
            parts.rightHandMount.add(newItem);
            break;
        case 'Pickaxe':
            newItem = PickaxeBuilder.build(woodMat, metalMat);
            parts.rightHandMount.add(newItem);
            break;
        case 'Knife':
            newItem = KnifeBuilder.build(metalMat);
            parts.rightHandMount.add(newItem);
            break;
        case 'Halberd':
            newItem = HalberdBuilder.build(woodMat, metalMat);
            parts.rightHandMount.add(newItem);
            break;
        case 'Staff':
            newItem = StaffBuilder.build(metalMat);
            parts.rightHandMount.add(newItem);
            break;
        case 'Fishing Pole':
            newItem = FishingPoleBuilder.build(woodMat, metalMat);
            parts.rightHandMount.add(newItem);
            break;
        case 'Bow':
            // Bow is held in Left Hand
            newItem = BowBuilder.buildBow(woodMat);
            parts.leftHandMount.add(newItem);
            
            // Add Quiver to back
            const quiver = BowBuilder.buildQuiver();
            quiver.position.set(0.18, 0.45, -0.15);
            quiver.rotation.set(0, 0, -0.4);
            parts.torso.add(quiver);
            equippedMeshes.quiver = quiver;
            break;
    }

    if (newItem) {
        equippedMeshes.heldItem = newItem;
    }

    return itemName;
}
