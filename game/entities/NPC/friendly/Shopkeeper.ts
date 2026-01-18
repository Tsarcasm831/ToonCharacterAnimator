
import * as THREE from 'three';
// Fix: Use correct casing for directory when importing NPC
import { NPC } from '../../npc/friendly/NPC';

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
                pantsColor: '#4a2f7a'
            },
            initialPos
        );
    }
}
