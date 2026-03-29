import * as THREE from 'three';
import { CLASS_STATS } from '../../../../data/stats';
import { Warlock } from './Warlock';

export class Sorcerer extends Warlock {
    constructor(scene: THREE.Scene, initialPos: THREE.Vector3, tint?: string) {
        super(scene, initialPos, tint);

        this.config = {
            ...this.config,
            bodyType: Math.random() > 0.5 ? 'female' : 'male',
            bodyVariant: 'slim',
            outfit: 'noble',
            skinColor: '#d8c0a8',
            shirtColor: '#1f3c88',
            pantsColor: '#14213d',
            bootsColor: '#1b1b2f',
            robeColor: '#1f3c88',
            robeTrimColor: '#7dd3fc',
            mageHatColor: '#1f3c88',
            mageHatBandColor: '#f8fafc',
            hairStyle: Math.random() > 0.5 ? 'crew' : 'bald',
            hairColor: '#1b1b1b',
            tintColor: tint || '#60a5fa',
            stats: { ...CLASS_STATS.sorcerer },
            equipment: {
                ...this.config.equipment,
                hood: false,
                mask: false,
                robe: true,
                mageHat: true,
                cape: true,
                bracers: true
            },
            selectedItem: null,
            weaponStance: 'side'
        };

        this.stats = { ...CLASS_STATS.sorcerer };
        this.model.sync(this.config, true);
    }
}
