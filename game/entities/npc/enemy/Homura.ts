import * as THREE from 'three';
import { DEFAULT_CONFIG } from '../../../../types';
import { Assassin } from './Assassin';
import { CLASS_STATS } from '../../../../data/stats';

export class Homura extends Assassin {
    constructor(scene: THREE.Scene, initialPos: THREE.Vector3, tint?: string) {
        const config = { 
            ...DEFAULT_CONFIG, 
            bodyType: 'female', 
            bodyVariant: 'slim', 
            outfit: 'warrior', 
            skinColor: '#ffe0bd', // Lighter skin tone from image
            shirtColor: '#1a1a1a', // Dark charcoal/black under-shirt
            pantsColor: '#2b2b2b', // Dark pants
            hairColor: '#1a1a1a', // Black hair base
            hairStyle: 'long01', // Placeholder for long hair, we'll use palette overrides for the red tips
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
                robe: false, 
                blacksmithApron: false, 
                mageHat: false, 
                bracers: false, 
                cape: false, 
                belt: true, 
                skirt: false, 
                skullcap: false, 
                shorts: false,
                vest: true // Using a vest for the olive green tactical look
            }, 
            selectedItem: 'Knife', 
            weaponStance: 'side', 
            isAssassinHostile: true, 
            tintColor: tint,
            // Custom palette overrides for Homura's unique look
            paletteOverrides: {
                vest: '#556b2f', // Olive green tactical vest
                belt: '#cccccc', // Silver/Grey belt buckle
                hairTips: '#b22222', // Firebrick red for the hair highlights in the image
                legWrap: '#ffffff', // White bandages on the thigh
            }
        } as any;

        super(scene, initialPos, tint);
        
        // Re-sync with Homura-specific config
        this.config = config;
        this.stats = { ...CLASS_STATS.assassin, health: 150, maxHealth: 150, damage: 25 }; // Elite assassin stats
        this.model.sync(this.config, true);
    }
}
