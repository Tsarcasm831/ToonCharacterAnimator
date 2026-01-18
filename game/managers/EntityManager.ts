import * as THREE from 'three';
import { NPC } from '../entities/npc/friendly/NPC';
import { Assassin } from '../entities/npc/enemy/Assassin';
import { Archer } from '../entities/npc/enemy/Archer';
import { Mage } from '../entities/npc/enemy/Mage';
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
// Fix: Use consistent lowercase casing for Shopkeeper import
import { Shopkeeper } from '../entities/npc/friendly/Shopkeeper';
import { Blacksmith } from '../entities/npc/friendly/Blacksmith';
import { LowLevelCityGuard } from '../entities/npc/friendly/LowLevelCityGuard';
import { Environment } from '../Environment';
import { PlayerConfig } from '../../types';

export class EntityManager {
    public scene: THREE.Scene;
    public npc: NPC;
    public blacksmith: Blacksmith;
    public shopkeeper: Shopkeeper;
    public assassin: Assassin;
    public archer: Archer;
    public mage: Mage;
    public guard: LowLevelCityGuard;
    
    // Animals
    public wolf: Wolf; 
    public bears: Bear[] = [];
    public owls: Owl[] = [];
    public yetis: Yeti[] = [];
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
    private readonly visibilityCache = new WeakMap<object, boolean>();

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
    private readonly mageTargets = [
        { position: new THREE.Vector3() },
        { position: new THREE.Vector3() }
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
        this.scene = scene;
        // NPC
        this.npc = new NPC(scene, { bodyType: 'female', outfit: 'peasant' }, new THREE.Vector3(-3, 0, 2));
        this.blacksmith = new Blacksmith(scene, new THREE.Vector3(-35, 0.4, 53));
        const GRID = 1.3333;
        this.shopkeeper = new Shopkeeper(scene, new THREE.Vector3(-50 * GRID, 0, 45 * GRID));
        
        // Hostiles
        this.assassin = new Assassin(scene, new THREE.Vector3(30, 0, 0));
        this.assassin.config.isAssassinHostile = initialConfig.isAssassinHostile;
        
        this.archer = new Archer(scene, new THREE.Vector3(-5, 0, 4));
        this.archer.config.isAssassinHostile = initialConfig.isAssassinHostile;

        this.mage = new Mage(scene, new THREE.Vector3(0, 0, 15), '#6366f1');
        this.mage.config.isAssassinHostile = initialConfig.isAssassinHostile;

        // One Wolf by default
        this.wolf = new Wolf(scene, new THREE.Vector3(10, 0, 10));
        environment?.addObstacle(this.wolf.hitbox);

        // Guards
        this.guard = new LowLevelCityGuard(scene, new THREE.Vector3(-8, 0, -2));
        this.foundryGuard = new LowLevelCityGuard(scene, new THREE.Vector3(-42, 0, -42), 0, '#4ade80');
        this.foundryAssassin = new Assassin(scene, new THREE.Vector3(-38, 0, -38), '#ef4444');
        this.foundryAssassin.config.isAssassinHostile = true;
    }

    spawnAnimalGroup(type: string, count: number, environment: Environment | null, spawnCenter: THREE.Vector3) {
        for (let i = 0; i < count; i++) {
            const offset = new THREE.Vector3((Math.random() - 0.5) * 10, 0, (Math.random() - 0.5) * 10);
            const pos = spawnCenter.clone().add(offset);
            
            let animal: any = null;
            switch (type.toLowerCase()) {
                case 'wolf':
                    const extraWolf = new Wolf(this.scene, pos);
                    this.bears.push(extraWolf as any);
                    environment?.addObstacle(extraWolf.hitbox);
                    break;
                case 'bear':
                    animal = new Bear(this.scene, pos);
                    this.bears.push(animal);
                    break;
                case 'owl':
                    animal = new Owl(this.scene, pos);
                    this.owls.push(animal);
                    break;
                case 'yeti':
                    animal = new Yeti(this.scene, pos);
                    this.yetis.push(animal);
                    break;
                case 'deer':
                    animal = new Deer(this.scene, pos);
                    this.deers.push(animal);
                    break;
                case 'chicken':
                    animal = new Chicken(this.scene, pos);
                    this.chickens.push(animal);
                    break;
                case 'pig':
                    animal = new Pig(this.scene, pos);
                    this.pigs.push(animal);
                    break;
                case 'sheep':
                    animal = new Sheep(this.scene, pos);
                    this.sheeps.push(animal);
                    break;
                case 'spider':
                    animal = new Spider(this.scene, pos);
                    this.spiders.push(animal);
                    break;
                case 'lizard':
                    animal = new Lizard(this.scene, pos);
                    this.lizards.push(animal);
                    break;
                case 'horse':
                    animal = new Horse(this.scene, pos);
                    this.horses.push(animal);
                    break;
            }

            if (animal && animal.hitbox) {
                environment?.addObstacle(animal.hitbox);
            }
        }
    }

    update(delta: number, config: PlayerConfig, playerPosition: THREE.Vector3, environment: Environment | null) {
        const now = performance.now();
        this.tempPlayerPos.copy(playerPosition);
        
        if (now - this.lastRangeCheck >= this.rangeCheckIntervalMs) {
            this.lastRangeCheck = now;
            this.refreshRangeCache();
        }

        const isVisible = (entity: { position: THREE.Vector3 }) => this.visibilityCache.get(entity as any) ?? false;
        const isNear = (entity: { position: THREE.Vector3 }) => this.nearCache.get(entity as any) ?? false;

        const allEntities = this.getAllEntities();
        allEntities.forEach(entity => {
            if (!entity) return;
            
            const visible = isVisible(entity);
            const animate = isNear(entity);
            
            if (entity.model && entity.model.group) {
                entity.model.group.visible = visible;
            }

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
        } else if (entity === this.shopkeeper && config.showNPC) {
            this.tempEyePos.copy(this.tempPlayerPos).add(this.eyeOffset);
            this.shopkeeper.update(delta, this.tempEyePos, environment as any, skipAnimation);
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
            if (this.bears.length > 0) {
                this.archerTargets[3].position.copy(this.bears[0].position);
                this.archerTargets[3].isDead = this.bears[0].isDead;
            }
            this.archer.update(delta, environment as any, this.archerTargets as any, skipAnimation);
        } else if (entity === this.mage && config.showAssassin) {
            this.mage.config.isAssassinHostile = config.isAssassinHostile;
            this.mageTargets[0].position.copy(this.tempPlayerPos);
            this.mageTargets[1].position.copy(this.npc.position);
            this.mage.update(delta, environment as any, this.mageTargets as any, skipAnimation);
        } else if (entity === this.foundryGuard || entity === this.foundryAssassin) {
             if (entity === this.foundryGuard) {
                this.foundryGuardTargets[0].position.copy(this.foundryAssassin.position);
                this.foundryGuard.update(delta, this.tempPlayerPos, environment as any, this.foundryGuardTargets as any, skipAnimation);
             } else {
                this.foundryAssassinTargets[0].position.copy(this.foundryGuard.position);
                this.foundryAssassin.update(delta, environment as any, this.foundryAssassinTargets as any, skipAnimation);
             }
        } else if (entity instanceof Wolf || entity instanceof Bear || entity instanceof Owl) {
            this.animalTargets[0].position.copy(this.tempPlayerPos);
            this.animalTargets[1].position.copy(this.archer.position);
            this.animalTargets[2].position.copy(this.npc.position);
            entity.update(delta, environment as any, this.animalTargets as any, skipAnimation);
        } else if (entity instanceof Yeti) {
            entity.update(delta, environment as any, skipAnimation);
        } else {
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
        const list = [
            this.npc, this.blacksmith, this.shopkeeper, this.guard, this.assassin, this.archer, this.mage, this.foundryGuard, this.foundryAssassin, 
            this.wolf, ...this.bears, ...this.owls, ...this.yetis, ...this.deers, ...this.chickens, ...this.pigs, 
            ...this.sheeps, ...this.spiders, ...this.lizards, ...this.horses
        ];
        return list.filter(e => e !== null);
    }

    private refreshRangeCache() {
        const entities = this.getAllEntities();
        entities.forEach(entity => {
            if (!entity) return;
            const distSq = entity.position.distanceToSquared(this.tempPlayerPos);
            this.nearCache.set(entity as any, distSq <= this.animationRangeSq);
            this.visibilityCache.set(entity as any, distSq <= this.visibilityRangeSq);
        });
    }
}