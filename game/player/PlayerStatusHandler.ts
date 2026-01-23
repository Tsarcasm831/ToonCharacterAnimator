
import * as THREE from 'three';

import { EntityStats } from '../../types';

export class PlayerStatusHandler {
    health: number = 120;
    maxHealth: number = 120;
    chakra: number = 60;
    maxChakra: number = 60;
    strength: number = 12;
    dexterity: number = 12;
    defense: number = 10;
    evasion: number = 8;
    damage: number = 15;
    soak: number = 2;
    mana: number = 0;
    maxMana: number = 100;
    attackSpeed: number = 1.0;
    range: number = 1.5;

    isDead: boolean = false;
    deathTime: number = 0;
    deathVariation = { side: 1, twist: 0, fallDir: 1, stumbleDir: 0 };
    recoverTimer: number = 0;

    update(dt: number) {
        if (this.isDead) {
            this.deathTime += dt;
        } else {
            if (this.recoverTimer > 0) this.recoverTimer -= dt;
        }
    }

    toggleDeath(mesh: THREE.Group) {
        this.isDead = !this.isDead;
        this.deathTime = 0;
        if (this.isDead) {
            this.deathVariation = {
                side: Math.random() > 0.5 ? 1 : -1,
                twist: (Math.random() - 0.5) * 0.5,
                fallDir: Math.random() > 0.5 ? 1 : -1,
                stumbleDir: (Math.random() - 0.5) * 0.5
            };
        } else {
            this.recoverTimer = 0.5;
            // Reset rotation to upright (keep Y rotation)
            mesh.rotation.set(0, mesh.rotation.y, 0);
        }
    }

    getStats(): EntityStats {
        return {
            health: this.health,
            maxHealth: this.maxHealth,
            chakra: this.chakra,
            maxChakra: this.maxChakra,
            mana: this.mana,
            maxMana: this.maxMana,
            xp: 0,
            maxXp: 1000,
            strength: this.strength,
            dexterity: this.dexterity,
            defense: this.defense,
            evasion: this.evasion,
            damage: this.damage,
            soak: this.soak,
            attackSpeed: this.attackSpeed,
            range: this.range
        };
    }
}
