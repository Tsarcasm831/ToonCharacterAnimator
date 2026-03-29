import * as THREE from 'three';
import { CLASS_STATS } from '../../../../data/stats';
import { Ranger } from './Ranger';

export class Druid extends Ranger {
    constructor(scene: THREE.Scene, initialPos: THREE.Vector3, tint?: string) {
        super(scene, initialPos, tint);

        this.config = {
            ...this.config,
            bodyType: Math.random() > 0.5 ? 'female' : 'male',
            bodyVariant: 'slim',
            outfit: 'peasant',
            skinColor: '#d9b38c',
            shirtColor: '#556b2f',
            pantsColor: '#3f5d32',
            bootsColor: '#5c4033',
            robeColor: '#6b8e23',
            robeTrimColor: '#c2b280',
            hoodColor: '#4f772d',
            hairStyle: Math.random() > 0.45 ? 'crew' : 'bald',
            hairColor: '#6f4e37',
            tintColor: tint || '#6b8e23',
            stats: { ...CLASS_STATS.druid },
            equipment: {
                ...this.config.equipment,
                hood: true,
                leatherArmor: false,
                robe: true,
                cape: true,
                belt: true
            },
            selectedItem: null,
            weaponStance: 'side'
        };

        this.stats = { ...CLASS_STATS.druid };
        this.model.sync(this.config, true);
    }
}
