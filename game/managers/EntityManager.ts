
import * as THREE from 'three';
import { NPC } from '../entities/npc/friendly/NPC';
import { Assassin } from '../entities/npc/enemy/Assassin';
import { Archer } from '../entities/npc/enemy/Archer';
import { Wolf } from '../entities/animal/aggressive/Wolf';
import { Bear } from '../entities/animal/aggressive/Bear';
import { Owl } from '../entities/animal/neutral/Owl';
import { Yeti } from '../entities/animal/neutral/Yeti';
import { Deer } from '../entities/animal/neutral/Deer';
import { Chicken } from '../entities/animal/neutral/Chicken';
import { Pig } from '../entities/animal/neutral/Pig';
import { Sheep } from '../entities/animal/neutral/Sheep';
import { Spider } from '../entities/animal/aggressive/Spider';
import { Lizard } from '../entities/animal/neutral/Lizard';
import { Horse } from '../entities/animal/tameable/Horse';
import { Blacksmith } from '../entities/npc/friendly/Blacksmith';
import { LowLevelCityGuard } from '../entities/npc/friendly/LowLevelCityGuard';
import { Environment } from '../Environment';
import { PlayerConfig } from '../../types';

export class EntityManager {
    public npc: NPC;
    public blacksmith: Blacksmith;
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

    private readonly animationRangeSq = 20 * 20;
    private readonly visibilityRangeSq = 100 * 100;
    private readonly rangeCheckIntervalMs = 100;
    private lastRangeCheck = -Infinity;
    
    private readonly nearCache = new WeakMap<object, boolean>();
    private readonly visibleCache = new WeakMap<object, boolean>();

    private readonly tempPlayerPos = new THREE.Vector3();
    private readonly tempEyePos = new THREE.Vector3();
    private readonly eyeOffset = new THREE.Vector3(0, 1.7, 0);
    private readonly playerOnlyTarget = [{ position: new THREE.Vector3() }];
    private readonly animalTargets = [
        { position: new THREE.Vector3() },
        { position: new THREE.Vector3() },
        { position: new THREE.Vector3() }
    ];
    private readonly archerTargets = [
        { position: new THREE.Vector3() },
        { position: new THREE.Vector3() },
        { position: new THREE.Vector3(), isWolf: true, isDead: false },
        { position: new THREE.Vector3(), isWolf: true, isDead: false }
    ];
    private readonly assassinTargets = [
        { position: new THREE.Vector3() },
        { position: new THREE.Vector3() }
    ];
    private readonly foundryGuardTargets = [
        { position: new THREE.Vector3(), isDead: false }
    ];
    private readonly foundryAssassinTargets = [
        { position: new THREE.Vector3(), isDead: false }
    ];

    constructor(scene: THREE.Scene, environment: Environment | null, initialConfig: PlayerConfig) {
        // NPC
        this.npc = new NPC(scene, { bodyType: 'female', outfit: 'peasant' }, new THREE.Vector3(-3, 0, 2));
        this.blacksmith = new Blacksmith(scene, new THREE.Vector3(-35, 0.4, 53));
        
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
        const now = performance.now();
        this.tempPlayerPos.copy(playerPosition);
        
        if (now - this.lastRangeCheck >= this.rangeCheckIntervalMs) {
            this.lastRangeCheck = now;
            this.refreshRangeCache();
        }

        const isVisible = (entity: { position: THREE.Vector3 }) => this.visibleCache.get(entity as any) ?? false;
        const isNear = (entity: { position: THREE.Vector3 }) => this.nearCache.get(entity as any) ?? false;

        // Update Visibilities & Logic
        const allEntities = this.getAllEntities();
        allEntities.forEach(entity => {
            if (!entity) return;
            
            const visible = isVisible(entity);
            const animate = isNear(entity);
            
            // Set basic visibility
            if (entity.model && entity.model.group) {
                entity.model.group.visible = visible;
            }

            // Only run logic if visible
            if (visible) {
                this.updateEntity(entity, delta, config, animate, environment);
            }
        });
    }

    private updateEntity(entity: any, delta: number, config: PlayerConfig, animate: boolean, environment: Environment | null) {
        const skipAnimation = !animate;

        if (entity === this.npc && config.showNPC) {
            this.tempEyePos.copy(this.tempPlayerPos).add(this.eyeOffset);
            this.npc.update(delta, this.tempEyePos, environment as any, skipAnimation);
        } else if (entity === this.blacksmith && config.showNPC) {
            this.tempEyePos.copy(this.tempPlayerPos).add(this.eyeOffset);
            this.blacksmith.update(delta, this.tempEyePos, environment as any, skipAnimation);
        } else if (entity === this.guard && config.showGuard) {
            this.guard.update(delta, this.tempPlayerPos, environment as any, [], skipAnimation);
        } else if (entity === this.assassin && config.showAssassin) {
            this.assassin.config.isAssassinHostile = config.isAssassinHostile;
            this.assassinTargets[0].position.copy(this.tempPlayerPos);
            this.assassinTargets[1].position.copy(this.npc.position);
            this.assassin.update(delta, environment as any, this.assassinTargets as any, skipAnimation);
        } else if (entity === this.archer && config.showAssassin) {
            this.archer.config.isAssassinHostile = config.isAssassinHostile;
            this.archerTargets[0].position.copy(this.tempPlayerPos);
            this.archerTargets[1].position.copy(this.npc.position);
            this.archerTargets[2].position.copy(this.wolf.position);
            this.archerTargets[2].isDead = this.wolf.isDead;
            this.archerTargets[3].position.copy(this.bear.position);
            this.archerTargets[3].isDead = this.bear.isDead;
            this.archer.update(delta, environment as any, this.archerTargets as any, skipAnimation);
        } else if (entity === this.foundryGuard || entity === this.foundryAssassin) {
             if (entity === this.foundryGuard) {
                this.foundryGuardTargets[0].position.copy(this.foundryAssassin.position);
                this.foundryGuard.update(delta, this.tempPlayerPos, environment as any, this.foundryGuardTargets as any, skipAnimation);
             } else {
                this.foundryAssassinTargets[0].position.copy(this.foundryGuard.position);
                this.foundryAssassin.update(delta, environment as any, this.foundryAssassinTargets as any, skipAnimation);
             }
        } else if (entity instanceof Wolf) {
            this.animalTargets[0].position.copy(this.tempPlayerPos);
            this.animalTargets[1].position.copy(this.archer.position);
            this.animalTargets[2].position.copy(this.npc.position);
            entity.update(delta, environment as any, this.animalTargets as any, skipAnimation);
        } else if (entity instanceof Bear) {
            this.animalTargets[0].position.copy(this.tempPlayerPos);
            this.animalTargets[1].position.copy(this.archer.position);
            this.animalTargets[2].position.copy(this.npc.position);
            entity.update(delta, environment as any, this.animalTargets as any, skipAnimation);
        } else if (entity instanceof Owl) {
            this.animalTargets[0].position.copy(this.tempPlayerPos);
            this.animalTargets[1].position.copy(this.archer.position);
            this.animalTargets[2].position.copy(this.npc.position);
            entity.update(delta, environment as any, this.animalTargets as any, skipAnimation);
        } else if (entity instanceof Yeti) {
            entity.update(delta, environment as any, skipAnimation);
        } else {
            // General group entities (Deer, Chicken, Pig, Sheep, Spider, Lizard, Horse)
            this.playerOnlyTarget[0].position.copy(this.tempPlayerPos);
            entity.update(delta, environment as any, this.playerOnlyTarget as any, skipAnimation);
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
            this.npc, this.blacksmith, this.guard, this.assassin, this.archer, this.foundryGuard, this.foundryAssassin, 
            this.wolf, this.bear, this.owl, this.yeti, ...this.deers, ...this.chickens, ...this.pigs, 
            ...this.sheeps, ...this.spiders, ...this.lizards, ...this.horses
        ];
    }

    private refreshRangeCache() {
        const entities = this.getAllEntities();
        entities.forEach(entity => {
            if (!entity) return;
            const distSq = entity.position.distanceToSquared(this.tempPlayerPos);
            this.nearCache.set(entity as any, distSq <= this.animationRangeSq);
            this.visibleCache.set(entity as any, distSq <= this.visibilityRangeSq);
        });
    }
}
