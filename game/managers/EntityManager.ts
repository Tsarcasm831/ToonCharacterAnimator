
import * as THREE from 'three';
import { NPC } from '../entities/npc/friendly/NPC';
import { Assassin } from '../entities/npc/enemy/Assassin';
import { Archer } from '../entities/npc/enemy/Archer';
import { Mage } from '../entities/npc/enemy/Mage';
import { Bandit } from '../entities/npc/enemy/Bandit';
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
import { Shopkeeper } from '../entities/npc/friendly/Shopkeeper';
import { Blacksmith } from '../entities/npc/friendly/Blacksmith';
import { LowLevelCityGuard } from '../entities/npc/friendly/LowLevelCityGuard';
import { Cleric } from '../entities/npc/friendly/Cleric';
import { Knight } from '../entities/npc/friendly/Knight';
import { Paladin } from '../entities/npc/friendly/Paladin';
import { Monk } from '../entities/npc/friendly/Monk';
import { Ranger } from '../entities/npc/friendly/Ranger';
import { Sentinel } from '../entities/npc/friendly/Sentinel';
import { Berserker } from '../entities/npc/enemy/Berserker';
import { Rogue } from '../entities/npc/enemy/Rogue';
import { Warlock } from '../entities/npc/enemy/Warlock';
import { Environment } from '../environment/Environment';
import { CombatEnvironment } from '../environment/CombatEnvironment';
import { PlayerConfig } from '../../types';

export class EntityManager {
    public scene: THREE.Scene;
    
    // Static Scene Entities (Dev Scene)
    public npc: NPC;
    public blacksmith: Blacksmith;
    public shopkeeper: Shopkeeper;
    public guard: LowLevelCityGuard;
    public clerics: Cleric[] = [];
    public knights: Knight[] = [];
    public paladins: Paladin[] = [];
    public monks: Monk[] = [];
    public rangers: Ranger[] = [];
    public sentinels: Sentinel[] = [];
    public berserkers: Berserker[] = [];
    public rogues: Rogue[] = [];
    public warlocks: Warlock[] = [];
    public assassin: Assassin;
    public archer: Archer;
    public mage: Mage;
    public wolf: Wolf; 

    // Dynamic Entities
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
    public bandits: Bandit[] = [];

    private readonly animationRangeSq = 40 * 40;
    private readonly visibilityRangeSq = 120 * 120;
    private readonly rangeCheckIntervalMs = 100;
    private lastRangeCheck = -Infinity;
    
    private readonly nearCache = new WeakMap<object, boolean>();
    private readonly visibilityCache = new WeakMap<object, boolean>();

    private readonly tempPlayerPos = new THREE.Vector3();
    private readonly tempEyePos = new THREE.Vector3();
    private readonly eyeOffset = new THREE.Vector3(0, 1.7, 0);
    private readonly tempEnemyTargets: { position: THREE.Vector3, isDead?: boolean }[] = [];

    constructor(scene: THREE.Scene, environment: any | null, initialConfig: PlayerConfig) {
        this.scene = scene;
        
        // Initialize Dev Scene NPCs
        this.npc = new NPC(scene, { bodyType: 'female', outfit: 'peasant' }, new THREE.Vector3(-3, 0, 2));
        this.blacksmith = new Blacksmith(scene, new THREE.Vector3(-35, 0.4, 53));
        const GRID = 1.3333;
        this.shopkeeper = new Shopkeeper(scene, new THREE.Vector3(-50 * GRID, 0, 45 * GRID));
        this.guard = new LowLevelCityGuard(scene, new THREE.Vector3(-8, 0, -2));
        
        this.assassin = new Assassin(scene, new THREE.Vector3(30, 0, 0));
        this.archer = new Archer(scene, new THREE.Vector3(-5, 0, 4));
        this.mage = new Mage(scene, new THREE.Vector3(0, 0, 15), '#6366f1');

        this.wolf = new Wolf(scene, new THREE.Vector3(40, 0, -40));
        environment?.addObstacle(this.wolf.hitbox);
    }

    /**
     * Clears all dynamic entities from the scene graph and tracking arrays.
     */
    clearDynamicEntities() {
        const disposeEntity = (entity: any) => {
            if (entity && entity.group && entity.group.parent) {
                entity.group.parent.remove(entity.group);
            }
            if (entity && entity.model?.group && entity.model.group.parent) {
                entity.model.group.parent.remove(entity.model.group);
            }
        };

        [...this.bandits, ...this.bears, ...this.owls, ...this.yetis, ...this.deers, 
         ...this.chickens, ...this.pigs, ...this.sheeps, ...this.spiders, 
         ...this.lizards, ...this.horses, ...this.clerics, ...this.knights,
         ...this.paladins, ...this.monks, ...this.rangers, ...this.sentinels,
         ...this.berserkers, ...this.rogues, ...this.warlocks].forEach(disposeEntity);

        this.bandits = [];
        this.bears = [];
        this.owls = [];
        this.yetis = [];
        this.deers = [];
        this.chickens = [];
        this.pigs = [];
        this.sheeps = [];
        this.spiders = [];
        this.lizards = [];
        this.horses = [];
        this.clerics = [];
        this.knights = [];
        this.paladins = [];
        this.monks = [];
        this.rangers = [];
        this.sentinels = [];
        this.berserkers = [];
        this.rogues = [];
        this.warlocks = [];
    }

    spawnCombatEncounter(type: string, count: number, arena: CombatEnvironment | null, reservedCells: { r: number; c: number }[] = []) {
        if (!arena) return;
        
        const occupied = new Set<string>();
        reservedCells.forEach(({ r, c }) => {
            const key = `${r},${c}`;
            occupied.add(key);
            arena.setCellOccupied(r, c, true);
        });

        // Spawn requested type
        for (let i = 0; i < count; i++) {
            let row, col, key;
            let attempts = 0;
            do {
                row = Math.floor(Math.random() * 2) + 1; // Row 1 or 2
                col = Math.floor(Math.random() * 4) + 2; // Middle columns
                key = `${row},${col}`;
                attempts++;
            } while (occupied.has(key) && attempts < 50);
            
            occupied.add(key);
            arena.setCellOccupied(row, col, true);
            const snappedPos = arena.getWorldPosition(row, col);

            if (type.toLowerCase() === 'bandit') {
                const bandit = new Bandit(this.scene, snappedPos);
                bandit.rotationY = 0;
                this.bandits.push(bandit);
            } else {
                this.spawnAnimalGroup(type, 1, null, snappedPos);
            }
        }

        // Spawn "all the other enemies"
        const enemyTypes = ['assassin', 'archer', 'mage', 'berserker', 'rogue', 'warlock'];
        enemyTypes.forEach(enemyType => {
            let row, col, key;
            let attempts = 0;
            do {
                row = Math.floor(Math.random() * 3); // Rows 0-2 for enemies
                col = Math.floor(Math.random() * 8);
                key = `${row},${col}`;
                attempts++;
            } while (occupied.has(key) && attempts < 50);

            occupied.add(key);
            arena.setCellOccupied(row, col, true);
            const pos = arena.getWorldPosition(row, col);

            switch(enemyType) {
                case 'assassin':
                    this.assassin.position.copy(pos);
                    if (this.assassin.model?.group) this.assassin.model.group.position.copy(pos);
                    break;
                case 'archer':
                    this.archer.position.copy(pos);
                    if (this.archer.model?.group) this.archer.model.group.position.copy(pos);
                    break;
                case 'mage':
                    this.mage.position.copy(pos);
                    if (this.mage.model?.group) this.mage.model.group.position.copy(pos);
                    break;
                case 'berserker': this.berserkers.push(new Berserker(this.scene, pos)); break;
                case 'rogue': this.rogues.push(new Rogue(this.scene, pos)); break;
                case 'warlock': this.warlocks.push(new Warlock(this.scene, pos)); break;
            }
        });

        // Spawn "all the friendlies (other than NPC and shopkeeper)"
        const friendlyTypes = ['cleric', 'knight', 'paladin', 'monk', 'ranger', 'sentinel', 'guard'];
        friendlyTypes.forEach(fType => {
            let row, col, key;
            let attempts = 0;
            do {
                row = Math.floor(Math.random() * 3) + 5; // Rows 5-7 for friendlies
                col = Math.floor(Math.random() * 8);
                key = `${row},${col}`;
                attempts++;
            } while (occupied.has(key) && attempts < 50);

            occupied.add(key);
            arena.setCellOccupied(row, col, true);
            const pos = arena.getWorldPosition(row, col);

            switch(fType) {
                case 'cleric': this.clerics.push(new Cleric(this.scene, pos)); break;
                case 'knight': this.knights.push(new Knight(this.scene, pos)); break;
                case 'paladin': this.paladins.push(new Paladin(this.scene, pos)); break;
                case 'monk': this.monks.push(new Monk(this.scene, pos)); break;
                case 'ranger': this.rangers.push(new Ranger(this.scene, pos)); break;
                case 'sentinel': this.sentinels.push(new Sentinel(this.scene, pos)); break;
                case 'guard':
                    this.guard.position.copy(pos);
                    if (this.guard.model?.group) this.guard.model.group.position.copy(pos);
                    break;
            }
        });
    }

    spawnAnimalGroup(type: string, count: number, environment: Environment | null, spawnCenter: THREE.Vector3) {
        for (let i = 0; i < count; i++) {
            const offset = new THREE.Vector3((Math.random() - 0.5) * 5, 0, (Math.random() - 0.5) * 5);
            const pos = spawnCenter.clone().add(offset);
            
            let animal: any = null;
            switch (type.toLowerCase()) {
                case 'wolf':
                    animal = new Wolf(this.scene, pos);
                    this.bears.push(animal as any);
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

    update(delta: number, config: PlayerConfig, playerPosition: THREE.Vector3, environment: any | null, activeScene: string, isCombatActive: boolean, onAttackHit?: (type: string, count: number) => void) {
        const now = performance.now();
        this.tempPlayerPos.copy(playerPosition);
        
        if (now - this.lastRangeCheck >= this.rangeCheckIntervalMs) {
            this.lastRangeCheck = now;
            this.refreshRangeCache(activeScene);
        }

        const isVisible = (entity: any) => this.visibilityCache.get(entity) ?? false;
        const isNear = (entity: any) => this.nearCache.get(entity) ?? false;
        const enemyTargets = this.getEnemyTargets(activeScene);
        const playerTargets = [{ position: this.tempPlayerPos }];

        const sceneEntities = this.getEntitiesForScene(activeScene);
        sceneEntities.forEach((entity: any) => {
            if (!entity) return;
            // In Combat Scene, we usually want entities always updated if they are nearby, 
            // but for a small arena, we can just update all of them.
            const visible = activeScene === 'combat' ? true : isVisible(entity);
            const animate = activeScene === 'combat' ? true : isNear(entity);
            
            if (entity.model?.group) entity.model.group.visible = visible;
            
            if (visible) {
                // Check if we should run AI or just idle animation
                if (activeScene === 'combat' && !isCombatActive) {
                    // Just update visual model and idle animation
                    if (entity.model) entity.model.update(delta, new THREE.Vector3(0, 0, 0));
                    if (entity.animator) {
                        const mockInput = { x: 0, y: 0, isRunning: false, jump: false, isDead: false, isPickingUp: false, attack1: false, attack2: false, interact: false, combat: false };
                        entity.animator.animate(entity, delta, false, mockInput, []);
                    }
                } else {
                    this.updateEntity(entity, delta, config, animate, environment, enemyTargets, playerTargets, onAttackHit);
                }
            }
        });
        
        // Hide non-scene entities
        this.getAllEntities().forEach((entity: any) => {
            if (!(sceneEntities as any[]).includes(entity)) {
                if (entity.model?.group) entity.model.group.visible = false;
                if (entity.group) entity.group.visible = false;
            }
        });
    }

    private updateEntity(entity: any, delta: number, config: PlayerConfig, animate: boolean, environment: any | null, enemyTargets: { position: THREE.Vector3, isDead?: boolean }[], playerTargets: { position: THREE.Vector3, isDead?: boolean }[], onAttackHit?: (type: string, count: number) => void) {
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
            this.guard.update(delta, this.tempPlayerPos, environment as any, enemyTargets, skipAnimation);
        } else if (entity === this.assassin && config.showAssassin) {
            this.assassin.config.isAssassinHostile = config.isAssassinHostile;
            this.assassin.update(delta, environment as any, playerTargets, skipAnimation);
        } else if (entity === this.archer && config.showAssassin) {
            this.archer.config.isAssassinHostile = config.isAssassinHostile;
            this.archer.update(delta, environment as any, playerTargets, skipAnimation);
        } else if (entity === this.mage && config.showAssassin) {
            this.mage.config.isAssassinHostile = config.isAssassinHostile;
            this.mage.update(delta, environment as any, playerTargets, skipAnimation);
        } else if (
            entity instanceof Cleric ||
            entity instanceof Knight ||
            entity instanceof Paladin ||
            entity instanceof Monk ||
            entity instanceof Ranger ||
            entity instanceof Sentinel
        ) {
            entity.update(delta, environment as any, enemyTargets, skipAnimation);
        } else if (entity instanceof Bandit) {
            entity.update(delta, environment as any, playerTargets, skipAnimation);
        } else if (entity instanceof Wolf || entity instanceof Bear) {
            entity.update(delta, environment as any, playerTargets, skipAnimation);
        } else if (entity.update) {
            entity.update(delta, environment as any, playerTargets, skipAnimation);
        }
    }

    private getEnemyTargets(sceneName: string): { position: THREE.Vector3, isDead?: boolean }[] {
        this.tempEnemyTargets.length = 0;
        if (sceneName !== 'combat') {
            return this.tempEnemyTargets;
        }
        const units = [
            ...this.bandits,
            ...this.berserkers,
            ...this.rogues,
            ...this.warlocks,
            this.assassin,
            this.archer,
            this.mage
        ];
        for (const unit of units) {
            if (!unit) continue;
            const pos = unit.position;
            if (!pos) continue;
            this.tempEnemyTargets.push({ position: pos, isDead: unit.status?.isDead ?? false });
        }
        return this.tempEnemyTargets;
    }

    getEntitiesForScene(sceneName: string): any[] {
        if (sceneName === 'combat') {
            return [
                ...this.bandits,
                ...this.clerics,
                ...this.knights,
                ...this.paladins,
                ...this.monks,
                ...this.rangers,
                ...this.sentinels,
                this.guard,
                ...this.berserkers,
                ...this.rogues,
                ...this.warlocks,
                this.assassin,
                this.archer,
                this.mage
            ].filter(e => e !== null);
        } else if (sceneName === 'dev') {
            return [
                this.npc, this.blacksmith, this.shopkeeper, this.guard, this.assassin, this.archer, this.mage,
                this.wolf, ...this.bears, ...this.owls, ...this.yetis, ...this.deers, ...this.chickens, ...this.pigs, 
                ...this.sheeps, ...this.spiders, ...this.lizards, ...this.horses
            ].filter(e => e !== null);
        }
        return [];
    }

    getAllEntities(): any[] {
        return [
            this.npc, this.blacksmith, this.shopkeeper, this.guard, this.assassin, this.archer, this.mage,
            this.wolf, ...this.bears, ...this.owls, ...this.yetis, ...this.deers, ...this.chickens, ...this.pigs, 
            ...this.sheeps, ...this.spiders, ...this.lizards, ...this.horses, ...this.bandits
        ].filter(e => e !== null);
    }

    private refreshRangeCache(activeScene: string) {
        const relevant = this.getEntitiesForScene(activeScene);
        relevant.forEach(entity => {
            const distSq = entity.position.distanceToSquared(this.tempPlayerPos);
            this.nearCache.set(entity, distSq <= this.animationRangeSq);
            this.visibilityCache.set(entity, distSq <= this.visibilityRangeSq);
        });
    }
}
