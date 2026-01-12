import * as THREE from 'three';
import { NPC } from '../NPC';
import { Assassin } from '../Assassin';
import { Archer } from '../Archer';
import { Wolf } from '../Wolf';
import { Bear } from '../Bear';
import { Owl } from '../Owl';
import { Yeti } from '../Yeti';
import { Deer } from '../Deer';
import { Chicken } from '../Chicken';
import { Pig } from '../Pig';
import { Sheep } from '../Sheep';
import { Spider } from '../Spider';
import { Lizard } from '../Lizard';
import { Horse } from '../Horse';
import { LowLevelCityGuard } from '../LowLevelCityGuard';
import { Environment } from '../Environment';
import { PlayerConfig } from '../../types';

export class EntityManager {
    public npc: NPC;
    public assassin: Assassin;
    public archer: Archer;
    public guard: LowLevelCityGuard;
    
    // Animals
    public wolf: Wolf;
    public bear: Bear;
    public owl: Owl;
    public yeti: Yeti;
    public deers: Deer[] = [];
    public chickens: Chicken[] = [];
    public pigs: Pig[] = [];
    public sheeps: Sheep[] = [];
    public spiders: Spider[] = [];
    public lizards: Lizard[] = [];
    public horses: Horse[] = [];

    // Foundry
    public foundryGuard: LowLevelCityGuard;
    public foundryAssassin: Assassin;

    constructor(scene: THREE.Scene, environment: Environment | null, initialConfig: PlayerConfig) {
        // NPC
        this.npc = new NPC(scene, { bodyType: 'female', outfit: 'peasant' }, new THREE.Vector3(-3, 0, 2));
        
        // Hostiles
        this.assassin = new Assassin(scene, new THREE.Vector3(30, 0, 0));
        this.assassin.config.isAssassinHostile = initialConfig.isAssassinHostile;
        
        this.archer = new Archer(scene, new THREE.Vector3(-5, 0, 4));
        this.archer.config.isAssassinHostile = initialConfig.isAssassinHostile;

        // Animals
        this.wolf = new Wolf(scene, new THREE.Vector3(10, 0, 10));
        environment?.addObstacle(this.wolf.hitbox);

        this.bear = new Bear(scene, new THREE.Vector3(-15, 0, 15));
        environment?.addObstacle(this.bear.hitbox);

        this.owl = new Owl(scene, new THREE.Vector3(5, 5, -5));
        environment?.addObstacle(this.owl.hitbox);

        this.yeti = new Yeti(scene, new THREE.Vector3(0, 0, -50));
        environment?.addObstacle(this.yeti.hitbox);

        // Groups
        for(let i=0; i<3; i++) {
            const deer = new Deer(scene, new THREE.Vector3(35 + i*2, 0, -35));
            this.deers.push(deer);
            environment?.addObstacle(deer.hitbox);
        }

        for(let i=0; i<4; i++) {
            const chicken = new Chicken(scene, new THREE.Vector3(-5 + i*2, 0, -5));
            this.chickens.push(chicken);
            environment?.addObstacle(chicken.hitbox);
        }

        for(let i=0; i<2; i++) {
            const pig = new Pig(scene, new THREE.Vector3(5 + i*3, 0, 5));
            this.pigs.push(pig);
            environment?.addObstacle(pig.hitbox);
        }

        for(let i=0; i<3; i++) {
            const sheep = new Sheep(scene, new THREE.Vector3(-15 + i*3, 0, -10));
            this.sheeps.push(sheep);
            environment?.addObstacle(sheep.hitbox);
        }

        for(let i=0; i<2; i++) {
            const spider = new Spider(scene, new THREE.Vector3(-35, 0, -35 + i*5));
            this.spiders.push(spider);
            environment?.addObstacle(spider.hitbox);
        }

        for(let i=0; i<3; i++) {
            const lizard = new Lizard(scene, new THREE.Vector3(35, 0, 35 + i*4));
            this.lizards.push(lizard);
            environment?.addObstacle(lizard.hitbox);
        }

        for(let i=0; i<2; i++) {
            const horse = new Horse(scene, new THREE.Vector3(-30, 0, 30 + i*6));
            this.horses.push(horse);
            environment?.addObstacle(horse.hitbox);
        }

        // Guards
        this.guard = new LowLevelCityGuard(scene, new THREE.Vector3(-8, 0, -2));
        this.foundryGuard = new LowLevelCityGuard(scene, new THREE.Vector3(-42, 0, -42), 0, '#4ade80');
        this.foundryAssassin = new Assassin(scene, new THREE.Vector3(-38, 0, -38), '#ef4444');
        this.foundryAssassin.config.isAssassinHostile = true;
    }

    update(delta: number, config: PlayerConfig, playerPosition: THREE.Vector3, environment: Environment | null) {
        // Update Visibilities based on config
        if (this.npc) this.npc.model.group.visible = config.showNPC;
        if (this.guard) this.guard.model.group.visible = config.showGuard;
        if (this.assassin) { 
            this.assassin.model.group.visible = config.showAssassin; 
            this.assassin.config.isAssassinHostile = config.isAssassinHostile; 
        }
        if (this.archer) { 
            this.archer.model.group.visible = config.showAssassin; 
            this.archer.config.isAssassinHostile = config.isAssassinHostile; 
        }

        // Standard Updates
        if (config.showNPC && this.npc) {
            const eyePos = playerPosition.clone().add(new THREE.Vector3(0, 1.7, 0));
            this.npc.update(delta, eyePos, environment as any);
        }
        
        if (config.showGuard && this.guard) {
            this.guard.update(delta, playerPosition, environment as any);
        }

        // Hostiles & Animals
        if (config.showAssassin && this.archer) {
            this.archer.update(delta, environment as any, [
                { position: playerPosition.clone() }, 
                { position: this.npc.position.clone() },
                { position: this.wolf.position.clone(), isWolf: true, isDead: this.wolf.isDead },
                { position: this.bear.position.clone(), isWolf: true, isDead: this.bear.isDead }
            ]);
        }

        if (this.wolf) this.wolf.update(delta, environment as any, [{ position: playerPosition.clone() }, { position: this.archer.position.clone() }, { position: this.npc.position.clone() }]);
        if (this.bear) this.bear.update(delta, environment as any, [{ position: playerPosition.clone() }, { position: this.archer.position.clone() }, { position: this.npc.position.clone() }]);
        if (this.owl) this.owl.update(delta, environment as any, [{ position: playerPosition.clone() }, { position: this.archer.position.clone() }, { position: this.npc.position.clone() }]);
        if (this.yeti) this.yeti.update(delta, environment as any);
        
        this.deers.forEach(d => d.update(delta, environment as any, [{ position: playerPosition.clone() }]));
        this.chickens.forEach(c => c.update(delta, environment as any, [{ position: playerPosition.clone() }]));
        this.pigs.forEach(p => p.update(delta, environment as any, [{ position: playerPosition.clone() }]));
        this.sheeps.forEach(s => s.update(delta, environment as any, [{ position: playerPosition.clone() }]));
        this.spiders.forEach(s => s.update(delta, environment as any, [{ position: playerPosition.clone() }]));
        this.lizards.forEach(l => l.update(delta, environment as any, [{ position: playerPosition.clone() }]));
        this.horses.forEach(h => h.update(delta, environment as any, [{ position: playerPosition.clone() }]));

        if (config.showAssassin && this.assassin) {
            this.assassin.update(delta, environment as any, [{ position: playerPosition.clone() }, { position: this.npc.position.clone() }]);
        }

        // Foundry Battle
        if (this.foundryGuard && this.foundryAssassin) {
            this.foundryGuard.update(delta, playerPosition, environment as any, [{ position: this.foundryAssassin.position.clone(), isDead: false }]);
            this.foundryAssassin.update(delta, environment as any, [{ position: this.foundryGuard.position.clone(), isDead: false }]);
        }
    }

    setVisibility(visible: boolean) {
        const entities = this.getAllEntities();
        entities.forEach(entity => {
            if (entity && entity.model && entity.model.group) {
                entity.model.group.visible = visible;
            }
        });
    }

    getAllEntities() {
        return [
            this.npc, this.guard, this.assassin, this.archer, this.foundryGuard, this.foundryAssassin, 
            this.wolf, this.bear, this.owl, this.yeti, ...this.deers, ...this.chickens, ...this.pigs, 
            ...this.sheeps, ...this.spiders, ...this.lizards, ...this.horses
        ];
    }
}
