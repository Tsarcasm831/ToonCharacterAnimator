
import * as THREE from 'three';
import { NPC } from '../entities/npc/friendly/NPC';
import { Assassin } from '../entities/npc/enemy/Assassin';
import { Archer } from '../entities/npc/enemy/Archer';
import { Mage } from '../entities/npc/enemy/Mage';
import { Bandit } from '../entities/npc/enemy/Bandit';
import { Wolf } from '../entities/animal/aggressive/Wolf';
import { Bear } from '../entities/animal/aggressive/Bear';
import { Yeti } from '../entities/animal/aggressive/Yeti';
import { Owl } from '../entities/animal/neutral/Owl';
import { Deer } from '../entities/animal/neutral/Deer';
import { Chicken } from '../entities/animal/neutral/Chicken';
import { Pig } from '../entities/animal/neutral/Pig';
import { Sheep } from '../entities/animal/neutral/Sheep';
import { Spider } from '../entities/animal/aggressive/Spider';
import { Lizard } from '../entities/animal/neutral/Lizard';
import { Horse } from '../entities/animal/tameable/Horse';
import { Imp } from '../entities/resonant/demon/imp';
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
import { HumanoidEntity } from '../entities/HumanoidEntity';
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
    public bandit: Bandit;
    public wolf: Wolf; 

    // Dynamic Entities
    public bears: Bear[] = [];
    public wolves: Wolf[] = [];
    public owls: Owl[] = [];
    public yetis: Yeti[] = [];
    public deers: Deer[] = [];
    public chickens: Chicken[] = [];
    public pigs: Pig[] = [];
    public sheeps: Sheep[] = [];
    public spiders: Spider[] = [];
    public lizards: Lizard[] = [];
    public horses: Horse[] = [];
    public imps: Imp[] = [];
    public bandits: Bandit[] = [];
    public combatArchers: Archer[] = [];

    private readonly animationRangeSq = 100 * 100; // Increased to 100m for dev scene visibility
    private readonly visibilityRangeSq = 150 * 150;
    private readonly rangeCheckIntervalMs = 100;
    private lastRangeCheck = -Infinity;
    
    private readonly nearCache = new WeakMap<object, boolean>();
    private readonly visibilityCache = new WeakMap<object, boolean>();

    private readonly tempPlayerPos = new THREE.Vector3();
    private readonly tempEyePos = new THREE.Vector3();
    private readonly eyeOffset = new THREE.Vector3(0, 1.7, 0);
    private readonly tempEnemyTargets: { position: THREE.Vector3, isDead?: boolean }[] = [];
    private readonly tempPlayerTargets: { position: THREE.Vector3, isDead?: boolean }[] = [];
    private lastEnemyCount: number = 0;

    constructor(scene: THREE.Scene, environment: any | null, initialConfig: PlayerConfig) {
        this.scene = scene;
        
        // Initialize Dev Scene NPCs
        this.npc = new NPC(scene, { bodyType: 'female', outfit: 'peasant' }, new THREE.Vector3(-3, 0, 2));
        this.blacksmith = new Blacksmith(scene, new THREE.Vector3(-35, 0.4, 53));
        const GRID = 1.3333;
        const shopkeeperPos = new THREE.Vector3(-49.5 * GRID, 0.45, 45.5 * GRID);
        this.shopkeeper = new Shopkeeper(scene, shopkeeperPos);
        this.guard = new LowLevelCityGuard(scene, new THREE.Vector3(-8, 0, -2));
        
        // Enemies
        this.assassin = new Assassin(scene, new THREE.Vector3(30, 0, 0));
        this.archer = new Archer(scene, new THREE.Vector3(-5, 0, 4));
        this.mage = new Mage(scene, new THREE.Vector3(0, 0, 15), '#6366f1');
        this.bandit = new Bandit(scene, new THREE.Vector3(10, 0, 5));
        this.wolf = new Wolf(scene, new THREE.Vector3(40, 0, -40));
        environment?.addObstacle(this.wolf.hitbox);

        // Spawn one of each animal and NPC type for testing
        const spawnOffset = new THREE.Vector3(10, 0, 10);
        let zRow = 0;
        const nextPos = () => {
            const pos = new THREE.Vector3(zRow * 5, 0, -10 - (zRow * 2));
            zRow++;
            return pos;
        };

        // Animals
        this.spawnAnimalGroup('spider', 1, environment, nextPos());
        this.spawnAnimalGroup('bear', 1, environment, nextPos());
        this.spawnAnimalGroup('yeti', 1, environment, nextPos());
        this.spawnAnimalGroup('owl', 1, environment, nextPos());
        this.spawnAnimalGroup('deer', 1, environment, nextPos());
        this.spawnAnimalGroup('chicken', 1, environment, nextPos());
        this.spawnAnimalGroup('pig', 1, environment, nextPos());
        this.spawnAnimalGroup('sheep', 1, environment, nextPos());
        this.spawnAnimalGroup('lizard', 1, environment, nextPos());
        this.spawnAnimalGroup('horse', 1, environment, nextPos());

        // NPCs
        const cleric = new Cleric(scene, nextPos()); this.clerics.push(cleric);
        const knight = new Knight(scene, nextPos()); this.knights.push(knight);
        const paladin = new Paladin(scene, nextPos()); this.paladins.push(paladin);
        const monk = new Monk(scene, nextPos()); this.monks.push(monk);
        const ranger = new Ranger(scene, nextPos(), '#228b22'); this.rangers.push(ranger);
        const sentinel = new Sentinel(scene, nextPos()); this.sentinels.push(sentinel);
        
        // Enemies (Dynamic)
        const berserker = new Berserker(scene, nextPos()); this.berserkers.push(berserker);
        const rogue = new Rogue(scene, nextPos()); this.rogues.push(rogue);
        const warlock = new Warlock(scene, nextPos()); this.warlocks.push(warlock);
    }

    spawnAllAnimals(environment: Environment | null, origin: THREE.Vector3 = new THREE.Vector3(0, 0, 0)) {
        let row = 0;
        const nextPos = () => new THREE.Vector3(origin.x + row * 3, origin.y, origin.z - row * 2);
        this.spawnAnimalGroup('imp', 1, environment, nextPos()); row++;
        this.spawnAnimalGroup('spider', 1, environment, nextPos()); row++;
        this.spawnAnimalGroup('wolf', 1, environment, nextPos()); row++;
        this.spawnAnimalGroup('bear', 1, environment, nextPos()); row++;
        this.spawnAnimalGroup('yeti', 1, environment, nextPos()); row++;
        this.spawnAnimalGroup('owl', 1, environment, nextPos()); row++;
        this.spawnAnimalGroup('deer', 1, environment, nextPos()); row++;
        this.spawnAnimalGroup('chicken', 1, environment, nextPos()); row++;
        this.spawnAnimalGroup('pig', 1, environment, nextPos()); row++;
        this.spawnAnimalGroup('sheep', 1, environment, nextPos()); row++;
        this.spawnAnimalGroup('lizard', 1, environment, nextPos()); row++;
        this.spawnAnimalGroup('horse', 1, environment, nextPos());
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

        [...this.bandits, ...this.bears, ...this.wolves, ...this.owls, ...this.yetis, ...this.deers, 
         ...this.chickens, ...this.pigs, ...this.sheeps, ...this.spiders, ...this.imps,
         ...this.lizards, ...this.horses, ...this.clerics, ...this.knights,
         ...this.paladins, ...this.monks, ...this.rangers, ...this.sentinels,
         ...this.berserkers, ...this.rogues, ...this.warlocks, ...this.combatArchers].forEach(disposeEntity);

        this.bandits = [];
        this.bears = [];
        this.owls = [];
        this.wolves = [];
        this.yetis = [];
        this.deers = [];
        this.chickens = [];
        this.pigs = [];
        this.sheeps = [];
        this.spiders = [];
        this.imps = [];
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
        this.combatArchers = [];
    }

    /**
     * Hides all static entities from the scene graph.
     */
    clearStaticEntities() {
        const hideEntity = (entity: any) => {
            if (entity && entity.group) {
                entity.group.visible = false;
            }
            if (entity && entity.model?.group) {
                entity.model.group.visible = false;
            }
        };

        [this.npc, this.blacksmith, this.shopkeeper, this.guard, this.assassin, this.archer, this.mage, this.bandit, this.wolf].forEach(hideEntity);
    }

    private readonly tempSpawnOffset = new THREE.Vector3();
    private readonly tempSpawnPos = new THREE.Vector3();

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
            const isFriendly = type.toLowerCase() === 'cleric' || type.toLowerCase() === 'ranger';

            do {
                if (isFriendly) {
                    // Friendly side: Rows 7-10 (Indices) for 13x13 grid
                    // Row 11-12 is Bench
                    row = Math.floor(Math.random() * 4) + 7; 
                } else {
                    // Enemy side: Rows 2-5 (Indices) for 13x13 grid
                    // Row 0-1 is Bench
                    row = Math.floor(Math.random() * 4) + 2; 
                }
                col = Math.floor(Math.random() * 7) + 3; // Cols 3-9 (central area)
                key = `${row},${col}`;
                attempts++;
            } while (occupied.has(key) && attempts < 50);
            
            occupied.add(key);
            arena.setCellOccupied(row, col, true);
            const snappedPos = arena.getWorldPosition(row, col);
            console.log(`[EntityManager] Spawning ${type} at grid {${row}, ${col}} -> world {${snappedPos.x}, ${snappedPos.z}}`);

            if (type.toLowerCase() === 'bandit') {
                const bandit = new Bandit(this.scene, snappedPos);
                bandit.rotationY = 0;
                this.bandits.push(bandit);
            } else if (type.toLowerCase() === 'cleric') {
                const cleric = new Cleric(this.scene, snappedPos);
                cleric.rotationY = Math.PI; // Face enemy side
                this.clerics.push(cleric);
            } else if (type.toLowerCase() === 'ranger') {
                const ranger = new Ranger(this.scene, snappedPos, '#228b22');
                ranger.rotationY = Math.PI; // Face enemy side
                this.rangers.push(ranger);
            } else if (type.toLowerCase() === 'archer') {
                const archer = new Archer(this.scene, snappedPos);
                archer.rotationY = 0; // Face player side
                this.combatArchers.push(archer);
            } else {
                this.spawnAnimalGroup(type, 1, null, snappedPos);
            }
        }
    }

    spawnAnimalGroup(type: string, count: number, environment: Environment | null, spawnCenter: THREE.Vector3) {
        for (let i = 0; i < count; i++) {
            this.tempSpawnOffset.set((Math.random() - 0.5) * 5, 0, (Math.random() - 0.5) * 5);
            this.tempSpawnPos.copy(spawnCenter).add(this.tempSpawnOffset);
            
            let animal: any = null;
            switch (type.toLowerCase()) {
                case 'imp':
                    animal = new Imp(this.scene, this.tempSpawnPos.clone());
                    this.imps.push(animal);
                    break;
                case 'wolf':
                    animal = new Wolf(this.scene, this.tempSpawnPos.clone());
                    this.wolves.push(animal as any);
                    break;
                case 'bear':
                    animal = new Bear(this.scene, this.tempSpawnPos.clone());
                    this.bears.push(animal);
                    break;
                case 'owl':
                    animal = new Owl(this.scene, this.tempSpawnPos.clone());
                    this.owls.push(animal);
                    break;
                case 'yeti':
                    animal = new Yeti(this.scene, this.tempSpawnPos.clone());
                    this.yetis.push(animal);
                    break;
                case 'deer':
                    animal = new Deer(this.scene, this.tempSpawnPos.clone());
                    this.deers.push(animal);
                    break;
                case 'chicken':
                    animal = new Chicken(this.scene, this.tempSpawnPos.clone());
                    this.chickens.push(animal);
                    break;
                case 'pig':
                    animal = new Pig(this.scene, this.tempSpawnPos.clone());
                    this.pigs.push(animal);
                    break;
                case 'sheep':
                    animal = new Sheep(this.scene, this.tempSpawnPos.clone());
                    this.sheeps.push(animal);
                    break;
                case 'spider':
                    animal = new Spider(this.scene, this.tempSpawnPos.clone());
                    this.spiders.push(animal);
                    break;
                case 'lizard':
                    animal = new Lizard(this.scene, this.tempSpawnPos.clone());
                    this.lizards.push(animal);
                    break;
                case 'horse':
                    animal = new Horse(this.scene, this.tempSpawnPos.clone());
                    this.horses.push(animal);
                    break;
            }

            if (animal && animal.hitbox) {
                const isFlyingCreature = type.toLowerCase() === 'owl';
                if (isFlyingCreature) {
                    const obs = environment?.obstacles;
                    if (obs) {
                        const idx = obs.indexOf(animal.hitbox);
                        if (idx !== -1) obs.splice(idx, 1);
                    }
                } else {
                    environment?.addObstacle(animal.hitbox);
                }
            }
        }
    }

    update(delta: number, config: PlayerConfig, playerPosition: THREE.Vector3, cameraPosition: THREE.Vector3, environment: any | null, activeScene: string, isCombatActive: boolean, onAttackHit?: (type: string, count: number) => void, sceneEntities?: any[]) {
        const now = performance.now();
        this.tempPlayerPos.copy(playerPosition);
        
        // Store camera position in scene userData for entities to access (e.g. for stat bars)
        if (this.scene) {
            if (!this.scene.userData.camera) this.scene.userData.camera = {};
            this.scene.userData.camera.position = cameraPosition;
        }
        
        if (now - this.lastRangeCheck >= this.rangeCheckIntervalMs) {
            this.lastRangeCheck = now;
            this.refreshRangeCache(activeScene, sceneEntities);
        }

        const isVisible = (entity: any) => this.visibilityCache.get(entity) ?? false;
        const isNear = (entity: any) => this.nearCache.get(entity) ?? false;
        const enemyTargets = this.getEnemyTargets(activeScene, sceneEntities);
        const playerTargets = this.getPlayerTargets(activeScene, sceneEntities);

        if (activeScene === 'combat' && isCombatActive) {
            // Only log when enemy count changes
            if (enemyTargets.length !== this.lastEnemyCount) {
                console.log(`[EntityManager] Enemy count changed: ${this.lastEnemyCount} -> ${enemyTargets.length}`);
                this.lastEnemyCount = enemyTargets.length;
            }
        }

        const entitiesToUpdate = sceneEntities || this.getEntitiesForScene(activeScene);
        entitiesToUpdate.forEach((entity: any) => {
            if (!entity) return;
            // In Combat Scene, we usually want entities always updated if they are nearby, 
            // but for a small arena, we can just update all of them.
            const visible = activeScene === 'combat' ? true : isVisible(entity);
            const animate = activeScene === 'combat' ? true : isNear(entity);
            
            if (entity.group) entity.group.visible = visible;
            if (entity.model?.group) entity.model.group.visible = visible;
            
            // Always update entities that are visible or near, 
            // but if they just became "not near", ensure we run one last update with skipAnimation=true 
            // to allow them to transition to idle or finish their current state.
            this.updateEntity(entity, delta, config, animate, environment, enemyTargets, playerTargets, isCombatActive, onAttackHit);
            
            if (visible && entity instanceof HumanoidEntity) {
                entity.updateStatBars(cameraPosition, isCombatActive);
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

    private updateEntity(entity: any, delta: number, config: PlayerConfig, animate: boolean, environment: any | null, enemyTargets: { position: THREE.Vector3, isDead?: boolean }[], playerTargets: { position: THREE.Vector3, isDead?: boolean }[], isCombatActive: boolean, onAttackHit?: (type: string, count: number) => void) {
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
            this.guard.update(delta, this.tempPlayerPos, environment as any, enemyTargets, skipAnimation, isCombatActive);
        } else if (entity === this.assassin && config.showAssassin) {
            this.assassin.config.isAssassinHostile = config.isAssassinHostile;
            this.assassin.update(delta, environment as any, playerTargets, skipAnimation, isCombatActive);
        } else if (entity === this.archer && config.showAssassin) {
            this.archer.config.isAssassinHostile = config.isAssassinHostile;
            this.archer.update(delta, environment as any, playerTargets, skipAnimation, isCombatActive);
        } else if (entity === this.mage && config.showAssassin) {
            this.mage.config.isAssassinHostile = config.isAssassinHostile;
            this.mage.update(delta, environment as any, playerTargets, skipAnimation, isCombatActive);
        } else if (entity === this.bandit && config.showAssassin) {
            this.bandit.config.isAssassinHostile = config.isAssassinHostile;
            this.bandit.update(delta, environment as any, playerTargets, skipAnimation, isCombatActive);
        } else if (entity instanceof Berserker) {
            entity.update(delta, environment as any, playerTargets, skipAnimation, isCombatActive);
        } else if (entity instanceof Rogue) {
            entity.update(delta, environment as any, playerTargets, skipAnimation, isCombatActive);
        } else if (entity instanceof Warlock) {
            entity.update(delta, environment as any, playerTargets, skipAnimation, isCombatActive);
        } else if (
            entity instanceof Cleric ||
            entity instanceof Knight ||
            entity instanceof Paladin ||
            entity instanceof Monk ||
            entity instanceof Ranger ||
            entity instanceof Sentinel ||
            entity instanceof Archer
        ) {
            entity.update(delta, environment as any, enemyTargets, skipAnimation, isCombatActive);
        } else if (entity instanceof Bandit) {
            entity.update(delta, environment as any, enemyTargets, skipAnimation, isCombatActive);
        } else if (entity instanceof Wolf || entity instanceof Bear) {
            entity.update(delta, environment as any, playerTargets, skipAnimation);
        } else if (entity.update) {
            entity.update(delta, environment as any, playerTargets, skipAnimation);
        }
    }

    private getEnemyTargets(sceneName: string, sceneEntities?: any[]): { position: THREE.Vector3, isDead?: boolean }[] {
        this.tempEnemyTargets.length = 0;
        if (sceneName !== 'combat') {
            return this.tempEnemyTargets;
        }
        // Friendly units are targets for Enemies (Bandits)
        const entities = sceneEntities || this.getEntitiesForScene(sceneName);
        const friendlyUnits = entities.filter(e => 
            e instanceof Cleric || 
            e instanceof Knight || 
            e instanceof Paladin || 
            e instanceof Monk || 
            e instanceof Ranger || 
            e instanceof Sentinel || 
            (e instanceof Archer && this.combatArchers.includes(e))
        );
        
        this.tempEnemyTargets.push({ position: this.tempPlayerPos, isDead: false });
        
        for (const unit of friendlyUnits) {
            if (!unit) continue;
            const pos = (unit as any).position || (unit as any).mesh?.position || (unit as any).model?.group?.position;
            if (!pos) continue;
            this.tempEnemyTargets.push({ position: pos, isDead: (unit as any).status?.isDead ?? false });
        }
        return this.tempEnemyTargets;
    }

    private getPlayerTargets(activeScene: string, sceneEntities?: any[]): { position: THREE.Vector3, isDead?: boolean }[] {
        this.tempPlayerTargets.length = 0;
        if (activeScene !== 'combat') {
            this.tempPlayerTargets.push({ position: this.tempPlayerPos });
            return this.tempPlayerTargets;
        }
        // Enemy units are targets for Friendlies (Archer)
        const entities = sceneEntities || this.getEntitiesForScene(activeScene);
        const enemyUnits = entities.filter(e => 
            e instanceof Bandit || 
            e instanceof Berserker || 
            e instanceof Rogue || 
            e instanceof Warlock
        );
        for (const unit of enemyUnits) {
            if (!unit) continue;
            const pos = unit.position;
            if (!pos) continue;
            this.tempPlayerTargets.push({ position: pos, isDead: unit.status?.isDead ?? false });
        }
        return this.tempPlayerTargets;
    }

    getEntitiesForScene(sceneName: string): any[] {
        if (sceneName === 'combat') {
            // Combat scene only includes dynamically spawned units, not dev scene static entities
            return [
                ...this.bandits,
                ...this.clerics,
                ...this.knights,
                ...this.paladins,
                ...this.monks,
                ...this.rangers,
                ...this.sentinels,
                ...this.berserkers,
                ...this.rogues,
                ...this.warlocks,
                ...this.combatArchers
            ].filter(e => e !== null);
        } else if (sceneName === 'dev') {
            return [
                this.npc, this.blacksmith, this.shopkeeper, this.guard, this.assassin, this.archer, this.mage, this.bandit,
                this.wolf, ...this.bears, ...this.owls, ...this.yetis, ...this.deers, ...this.chickens, ...this.pigs, 
                ...this.sheeps, ...this.spiders, ...this.imps, ...this.lizards, ...this.horses,
                ...this.clerics, ...this.knights, ...this.paladins, ...this.monks, ...this.rangers, ...this.sentinels,
                ...this.berserkers, ...this.rogues, ...this.warlocks
            ].filter(e => e !== null);
        } else if (sceneName === 'land') {
            return [
                this.npc, this.blacksmith, this.shopkeeper, this.guard,
                this.wolf, ...this.bears, ...this.owls, ...this.yetis, ...this.deers, ...this.chickens, ...this.pigs,
                ...this.sheeps, ...this.spiders, ...this.imps, ...this.lizards, ...this.horses
            ].filter(e => e !== null);
        } else if (sceneName === 'singleBiome') {
            return [
                ...this.bears, ...this.wolves, ...this.owls, ...this.yetis, ...this.deers,
                ...this.chickens, ...this.pigs, ...this.sheeps, ...this.spiders, ...this.imps,
                ...this.lizards, ...this.horses
            ].filter(e => e !== null);
        }
        return [];
    }

    getAllEntities(): any[] {
        return [
            this.npc, this.blacksmith, this.shopkeeper, this.guard, this.assassin, this.archer, this.mage, this.bandit,
            this.wolf, ...this.bears, ...this.wolves, ...this.owls, ...this.yetis, ...this.deers, ...this.chickens, ...this.pigs, 
            ...this.sheeps, ...this.spiders, ...this.imps, ...this.lizards, ...this.horses, 
            ...this.bandits, ...this.clerics, ...this.knights, ...this.paladins, ...this.monks, ...this.rangers, ...this.sentinels,
            ...this.berserkers, ...this.rogues, ...this.warlocks, ...this.combatArchers
        ].filter(e => e !== null);
    }

    private refreshRangeCache(activeScene: string, sceneEntities?: any[]) {
        const relevant = sceneEntities || this.getEntitiesForScene(activeScene);
        relevant.forEach(entity => {
            const distSq = entity.position.distanceToSquared(this.tempPlayerPos);
            this.nearCache.set(entity, distSq <= this.animationRangeSq);
            this.visibilityCache.set(entity, distSq <= this.visibilityRangeSq);
        });
    }
}
