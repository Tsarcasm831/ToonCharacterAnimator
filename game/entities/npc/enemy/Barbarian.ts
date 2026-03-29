import * as THREE from 'three';
import { CLASS_STATS } from '../../../../data/stats';
import { Berserker } from './Berserker';

export class Barbarian extends Berserker {
    constructor(scene: THREE.Scene, initialPos: THREE.Vector3, tint?: string) {
        super(scene, initialPos, tint);

        this.config = {
            ...this.config,
            bodyType: Math.random() > 0.35 ? 'male' : 'female',
            bodyVariant: Math.random() > 0.5 ? 'muscular' : 'heavy',
            outfit: 'warrior',
            skinColor: '#c68642',
            shirtColor: '#7a4a27',
            pantsColor: '#5a2f15',
            bootsColor: '#2f1b12',
            hoodColor: '#7a4a27',
            hairStyle: Math.random() > 0.45 ? 'crew' : 'bald',
            hairColor: '#3b2413',
            tintColor: tint || '#8b5a2b',
            stats: { ...CLASS_STATS.barbarian },
            equipment: {
                ...this.config.equipment,
                shoulders: true,
                heavyLeatherArmor: true,
                bracers: true,
                belt: true
            },
            selectedItem: 'Axe',
            weaponStance: 'side'
        };

        this.stats = { ...CLASS_STATS.barbarian };
        this.model.sync(this.config, true);
    }
}
