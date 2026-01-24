import * as THREE from 'three';
import { NPC } from './NPC';

export class Blacksmith extends NPC {
    constructor(scene: THREE.Scene, initialPos: THREE.Vector3) {
        super(
            scene,
            {
                bodyType: 'male',
                bodyVariant: 'heavy',
                outfit: 'peasant', 
                hairStyle: 'crew',
                shirtColor: '#3e2723',
                pantsColor: '#1a1a1a',
                equipment: {
                    helm: false,
                    shoulders: false,
                    shield: false,
                    shirt: true,
                    leatherDoublet: false,
                    pants: true,
                    hideBreeches: false,
                    leatherPants: false,
                    chainLeggings: false,
                    plateLeggings: false,
                    warlordLegPlates: false,
                    greaves: false,
                    shoes: true,
                    mask: false,
                    hood: false,
                    quiltedArmor: false,
                    leatherArmor: false,
                    heavyLeatherArmor: false,
                    ringMail: false,
                    plateMail: false,
                    robe: false,
                    blacksmithApron: true,
                    mageHat: false,
                    bracers: true,
                    gloves: false,
                    cape: false,
                    belt: true,
                    skirt: false,
                    skullcap: false,
                    shorts: false
                },
                selectedItem: 'Hammer' // Visual only if we had it
            },
            initialPos
        );
    }
}
