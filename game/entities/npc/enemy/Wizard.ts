import * as THREE from 'three';
import { CLASS_STATS } from '../../../../data/stats';
import { Warlock } from './Warlock';

export class Wizard extends Warlock {
    constructor(scene: THREE.Scene, initialPos: THREE.Vector3, tint?: string) {
        super(scene, initialPos, tint);

        this.config = {
            ...this.config,
            bodyType: Math.random() > 0.55 ? 'male' : 'female',
            bodyVariant: 'slim',
            outfit: 'noble',
            skinColor: '#e0c4a8',
            shirtColor: '#1e293b',
            pantsColor: '#0f172a',
            bootsColor: '#111827',
            robeColor: '#334155',
            robeTrimColor: '#cbd5e1',
            mageHatColor: '#334155',
            mageHatBandColor: '#93c5fd',
            hairStyle: Math.random() > 0.55 ? 'bald' : 'crew',
            hairColor: '#d6d3d1',
            tintColor: tint || '#93c5fd',
            stats: { ...CLASS_STATS.wizard },
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

        this.stats = { ...CLASS_STATS.wizard };
        this.model.sync(this.config, true);
    }
}
