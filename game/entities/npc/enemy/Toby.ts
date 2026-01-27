import * as THREE from 'three';
import { DEFAULT_CONFIG } from '../../../../types';
import { Archer } from './Archer';
import { CLASS_STATS } from '../../../../data/stats';

export class Toby extends Archer {
    constructor(scene: THREE.Scene, initialPos: THREE.Vector3, tint?: string) {
        const config = { 
            ...DEFAULT_CONFIG, 
            bodyType: 'male', 
            bodyVariant: 'slim', 
            outfit: 'warrior', 
            skinColor: '#d7ccc8', // Light skin
            shirtColor: '#4B9CD3', // Carolina Blue
            pantsColor: '#2d3e2d', // Dark forest green (matching image)
            hairColor: '#5d4037', // Brown hair
            hairStyle: 'short01', // Short hair like in image
            equipment: { 
                helm: false, 
                shoulders: false, 
                shield: false, 
                shirt: true, 
                pants: true, 
                shoes: true, 
                mask: false, 
                hood: false, // Image shows no hood
                quiltedArmor: false, 
                leatherArmor: true, 
                heavyLeatherArmor: false, 
                ringMail: false, 
                plateMail: false, 
                robe: false, 
                blacksmithApron: false, 
                mageHat: false, 
                bracers: true, 
                cape: false, 
                belt: true, 
                skirt: false, 
                skullcap: false, 
                shorts: false 
            }, 
            selectedItem: 'Bow', 
            weaponStance: 'side', 
            isAssassinHostile: false, 
            tintColor: tint,
            // Custom palette overrides for Carolina Blue and Gold theme
            paletteOverrides: {
                belt: '#FFD700', // Gold belt
                bracers: '#FFD700', // Gold bracers
                trim: '#FFD700', // Gold trim on shirt
            }
        } as any;

        super(scene, initialPos, tint);
        
        // Re-sync with Toby-specific config
        this.config = config;
        this.stats = { ...CLASS_STATS.archer, health: 120, maxHealth: 120 }; // Slightly unique stats
        this.model.sync(this.config, true);
    }
}
