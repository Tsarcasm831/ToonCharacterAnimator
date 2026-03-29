import * as THREE from 'three';
import { CLASS_STATS } from '../../../../data/stats';
import { Cleric } from './Cleric';

export class Bard extends Cleric {
    constructor(scene: THREE.Scene, initialPos: THREE.Vector3, tint?: string) {
        super(scene, initialPos, tint);

        this.config = {
            ...this.config,
            bodyType: Math.random() > 0.45 ? 'female' : 'male',
            bodyVariant: 'slim',
            outfit: 'noble',
            skinColor: '#f1c27d',
            shirtColor: '#7b2cbf',
            pantsColor: '#3c1642',
            bootsColor: '#4a2c2a',
            robeColor: '#6a1b9a',
            robeTrimColor: '#f4d35e',
            mageHatColor: '#6a1b9a',
            mageHatBandColor: '#f4d35e',
            hairStyle: Math.random() > 0.5 ? 'crew' : 'bald',
            hairColor: '#3e2723',
            tintColor: tint || '#c77dff',
            stats: { ...CLASS_STATS.bard },
            equipment: {
                ...this.config.equipment,
                robe: true,
                mageHat: false,
                cape: true,
                belt: true,
                bracers: true
            },
            selectedItem: null,
            weaponStance: 'side'
        };

        this.stats = { ...CLASS_STATS.bard };
        this.model.sync(this.config, true);
    }
}
