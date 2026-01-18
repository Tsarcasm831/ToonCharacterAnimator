import * as THREE from 'three';
import { NPC } from './NPC';

export class Shopkeeper extends NPC {
    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        super(
            scene,
            {
                bodyType: 'female',
                bodyVariant: 'average',
                outfit: 'noble',
                hairStyle: 'crew',
                shirtColor: '#6a4c93',
                pantsColor: '#4a2f7a',
                // Explicitly satisfy required EquipmentState for custom NPC config
                equipment: {
                    helm: false,
                    shoulders: false,
                    shield: false,
                    shirt: true,
                    pants: true,
                    shoes: true,
                    mask: false,
                    hood: false,
                    quiltedArmor: false,
                    leatherArmor: false,
                    heavyLeatherArmor: false,
                    ringMail: false,
                    plateMail: false,
                    robe: true,
                    blacksmithApron: false,
                    mageHat: false
                }
            },
            initialPos
        );
    }
}