
import * as THREE from 'three';
import { NPC, NpcBehaviorConfig } from '../entities/npc/friendly/NPC';
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
    // Temporary toggle to reduce scene noise while working on gameplay.
    private readonly autoAnimalSpawnsEnabled = false;
    // Temporary toggle: keep only merchant NPCs visible in world scenes.
    private readonly merchantsOnlyNpcMode = true;
    
    // Static Scene Entities (Dev Scene)
    public npc: NPC;
    public blacksmith: Blacksmith;
    public shopkeeper: Shopkeeper;
    public guard: LowLevelCityGuard;
    public town2Residents: NPC[] = [];
    public town2Children: NPC[] = [];
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
    private readonly trackedDeadEntities = new Set<any>();
    private lastEnemyCount: number = 0;

    constructor(scene: THREE.Scene, environment: any | null, initialConfig: PlayerConfig) {
        this.scene = scene;
    }

    initDevEntities(environment: any | null, initialConfig: PlayerConfig) {
        // Initialize Dev Scene NPCs
        this.npc = new NPC(this.scene, { bodyType: 'female', outfit: 'peasant' }, new THREE.Vector3(-3, 0, 2));
        this.blacksmith = new Blacksmith(this.scene, new THREE.Vector3(-35, 0.4, 53));
        const GRID = 1.3333;
        const shopkeeperPos = new THREE.Vector3(-49.5 * GRID, 0.45, 45.5 * GRID);
        this.shopkeeper = new Shopkeeper(this.scene, shopkeeperPos);
        this.guard = new LowLevelCityGuard(this.scene, new THREE.Vector3(-8, 0, -2));
        
        // Enemies
        this.assassin = new Assassin(this.scene, new THREE.Vector3(30, 0, 0));
        this.archer = new Archer(this.scene, new THREE.Vector3(-5, 0, 4));
        this.mage = new Mage(this.scene, new THREE.Vector3(0, 0, 15), '#6366f1');
        this.bandit = new Bandit(this.scene, new THREE.Vector3(10, 0, 5));
        if (this.autoAnimalSpawnsEnabled) {
            this.wolf = new Wolf(this.scene, new THREE.Vector3(40, 0, -40));
            environment?.addObstacle(this.wolf.hitbox);
        }

        // Spawn one of each animal and NPC type for testing
        const spawnOffset = new THREE.Vector3(10, 0, 10);
        let zRow = 0;
        const nextPos = () => {
            const pos = new THREE.Vector3(zRow * 5, 0, -10 - (zRow * 2));
            zRow++;
            return pos;
        };

        if (this.autoAnimalSpawnsEnabled) {
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
        }

        // NPCs
        const cleric = new Cleric(this.scene, nextPos()); this.clerics.push(cleric);
        const knight = new Knight(this.scene, nextPos()); this.knights.push(knight);
        const paladin = new Paladin(this.scene, nextPos()); this.paladins.push(paladin);
        const monk = new Monk(this.scene, nextPos()); this.monks.push(monk);
        const ranger = new Ranger(this.scene, nextPos(), '#228b22'); this.rangers.push(ranger);
        const sentinel = new Sentinel(this.scene, nextPos()); this.sentinels.push(sentinel);
        
        // Enemies (Dynamic)
        const berserker = new Berserker(this.scene, nextPos()); this.berserkers.push(berserker);
        const rogue = new Rogue(this.scene, nextPos()); this.rogues.push(rogue);
        const warlock = new Warlock(this.scene, nextPos()); this.warlocks.push(warlock);
    }

    initTownEntities(environment: any | null, _initialConfig: PlayerConfig) {
        const ensureVisible = (entity: any) => {
            if (entity?.group) entity.group.visible = true;
            if (entity?.model?.group) entity.model.group.visible = true;
        };

        const moveEntity = (entity: any, pos: THREE.Vector3, rotationY?: number) => {
            if (!entity) return;
            entity.position?.copy(pos);
            if (typeof rotationY === 'number') {
                entity.rotationY = rotationY;
            }
            if (entity.group) entity.group.position.copy(pos);
            if (entity.model?.group) entity.model.group.position.copy(pos);
            ensureVisible(entity);
        };

        if (!this.npc) {
            this.npc = new NPC(this.scene, { bodyType: 'female', outfit: 'peasant' }, new THREE.Vector3(0, 0, 6));
        }
        moveEntity(this.npc, new THREE.Vector3(0, 0, 6), Math.PI);

        if (!this.blacksmith) {
            this.blacksmith = new Blacksmith(this.scene, new THREE.Vector3(14, 0.4, -6));
        }
        moveEntity(this.blacksmith, new THREE.Vector3(14, 0.4, -6), -Math.PI / 2);

        if (!this.shopkeeper) {
            this.shopkeeper = new Shopkeeper(this.scene, new THREE.Vector3(-6, 0.45, -10));
        }
        moveEntity(this.shopkeeper, new THREE.Vector3(-6, 0.45, -10), Math.PI / 2);

        if (!this.guard) {
            this.guard = new LowLevelCityGuard(this.scene, new THREE.Vector3(6, 0, 10));
        }
        moveEntity(this.guard, new THREE.Vector3(6, 0, 10), Math.PI);

        if (this.autoAnimalSpawnsEnabled) {
            if (!this.chickens.length) {
                this.spawnAnimalGroup('chicken', 2, environment, new THREE.Vector3(-2, 0, -2));
            }
            if (!this.pigs.length) {
                this.spawnAnimalGroup('pig', 1, environment, new THREE.Vector3(4, 0, -4));
            }
        }
    }

    initTown2Entities(environment: any | null, _initialConfig: PlayerConfig) {
        const GRID = 1.3333;
        const MIN_X = -200;
        const MIN_Z = -100;
        const gridPos = (cellX: number, cellZ: number, y: number = 0.05) => new THREE.Vector3(
            MIN_X + (cellX + 0.5) * GRID,
            y,
            MIN_Z + (cellZ + 0.5) * GRID
        );
        const pos = gridPos(199, 108);

        const ensureVisible = (entity: any) => {
            if (entity?.group) entity.group.visible = true;
            if (entity?.model?.group) entity.model.group.visible = true;
        };

        const moveEntity = (entity: any, nextPos: THREE.Vector3, rotationY?: number) => {
            if (!entity) return;
            entity.position?.copy(nextPos);
            entity.targetPosition?.copy(nextPos);
            if (typeof rotationY === 'number') {
                entity.rotationY = rotationY;
                entity.targetRotationY = rotationY;
            }
            if (entity.group) entity.group.position.copy(nextPos);
            if (entity.model?.group) entity.model.group.position.set(0, 0, 0);
            ensureVisible(entity);
        };

        const configureTownActor = (
            entity: any,
            nextPos: THREE.Vector3,
            rotationY: number,
            actorId: string,
            interactionLabel: string,
            behavior?: NpcBehaviorConfig,
            options?: { scale?: number; interactionMode?: 'dialogue' | 'trade' | 'shop' }
        ) => {
            moveEntity(entity, nextPos, rotationY);
            if (typeof entity.setBehavior === 'function') {
                entity.setBehavior({
                    anchor: nextPos.clone(),
                    ...behavior
                });
            }
            if (entity.group) {
                entity.group.scale.setScalar(options?.scale ?? 1);
                entity.group.userData.canTalk = true;
                entity.group.userData.actorId = actorId;
                entity.group.userData.interactionLabel = interactionLabel;
                entity.group.userData.interactionRadius = 2.8;
                if (options?.interactionMode) {
                    entity.group.userData.interactionMode = options.interactionMode;
                } else {
                    delete entity.group.userData.interactionMode;
                }
            }
        };

        if (!this.npc) {
            this.npc = new NPC(this.scene, {
                bodyType: 'female',
                bodyVariant: 'slim',
                outfit: 'noble',
                hairColor: '#2f1b0c',
                shirtColor: '#d9c7a2',
                robeColor: '#8f5f43',
                robeTrimColor: '#ead7b1',
                pantsColor: '#4f6272',
                bootsColor: '#3b2618'
            }, pos.clone());
        }
        configureTownActor(this.npc, pos, Math.PI, 'elder_mara', 'Press E to Talk', {
            mode: 'idle',
            lookTarget: gridPos(200, 110)
        });

        if (!this.blacksmith) {
            this.blacksmith = new Blacksmith(this.scene, gridPos(177, 97, 0.05));
        }
        configureTownActor(
            this.blacksmith,
            gridPos(177, 97, 0.05),
            Math.PI / 2,
            'blacksmith_vendor',
            'Press E to Trade',
            {
                mode: 'work',
                lookTarget: gridPos(176, 96, 0.05)
            },
            { interactionMode: 'trade' }
        );

        if (!this.shopkeeper) {
            this.shopkeeper = new Shopkeeper(this.scene, gridPos(182, 107, 0.45));
        }
        configureTownActor(
            this.shopkeeper,
            gridPos(182, 107, 0.45),
            Math.PI / 2,
            'shopkeeper_mira',
            'Press E to Chat',
            {
                mode: 'idle',
                lookTarget: gridPos(185, 107, 0.45)
            },
            { interactionMode: 'shop' }
        );

        if (!this.guard) {
            this.guard = new LowLevelCityGuard(this.scene, gridPos(201, 129));
        }
        moveEntity(this.guard, gridPos(201, 129), Math.PI);
        if (this.guard.group) {
            this.guard.group.userData.canTalk = true;
            this.guard.group.userData.actorId = 'captain_bren';
            this.guard.group.userData.interactionLabel = 'Press E to Talk to Captain Bren';
            this.guard.group.userData.interactionRadius = 2.5;
        }

        const addCreatureObstacle = (entity: any) => {
            if (!entity?.hitbox) return;
            if (environment?.addObstacle) {
                environment.addObstacle(entity.hitbox);
            } else if (environment?.obstacles) {
                environment.obstacles.push(entity.hitbox);
            }
        };

        if (!this.chickens.length) {
            const chickenA = new Chicken(this.scene, gridPos(205, 109));
            const chickenB = new Chicken(this.scene, gridPos(207, 111));
            const chickenC = new Chicken(this.scene, gridPos(180, 108));
            this.chickens.push(chickenA, chickenB, chickenC);
            addCreatureObstacle(chickenA);
            addCreatureObstacle(chickenB);
            addCreatureObstacle(chickenC);
            const chickenD = new Chicken(this.scene, gridPos(191, 110));
            this.chickens.push(chickenD);
            addCreatureObstacle(chickenD);
        }

        if (!this.pigs.length) {
            const pigA = new Pig(this.scene, gridPos(186, 86));
            const pigB = new Pig(this.scene, gridPos(188, 88));
            const pigC = new Pig(this.scene, gridPos(196, 111));
            this.pigs.push(pigA, pigB, pigC);
            addCreatureObstacle(pigA);
            addCreatureObstacle(pigB);
            addCreatureObstacle(pigC);
        }

        if (!this.horses.length) {
            const horse = new Horse(this.scene, gridPos(245, 112, 0.12));
            const marketHorse = new Horse(this.scene, gridPos(213, 109, 0.12));
            this.horses.push(horse, marketHorse);
            addCreatureObstacle(horse);
            addCreatureObstacle(marketHorse);
        }

        if (!this.sheeps.length) {
            const sheepA = new Sheep(this.scene, gridPos(223, 116, 0.05));
            const sheepB = new Sheep(this.scene, gridPos(226, 118, 0.05));
            this.sheeps.push(sheepA, sheepB);
            addCreatureObstacle(sheepA);
            addCreatureObstacle(sheepB);
        }

        if (!this.town2Residents.length) {
            const reeveAnya = new NPC(this.scene, {
                bodyType: 'female',
                bodyVariant: 'average',
                outfit: 'noble',
                shirtColor: '#8e6c3a',
                robeColor: '#5b7c5c',
                robeTrimColor: '#d8c48a',
                pantsColor: '#4d4337',
                bootsColor: '#3e2f25'
            }, gridPos(190, 107));
            const villagerDoran = new NPC(this.scene, {
                bodyType: 'male',
                bodyVariant: 'average',
                outfit: 'peasant',
                shirtColor: '#6f7f8c',
                pantsColor: '#51463b',
                bootsColor: '#342a24'
            }, gridPos(206, 105));
            const villagerSella = new NPC(this.scene, {
                bodyType: 'female',
                bodyVariant: 'slim',
                outfit: 'peasant',
                shirtColor: '#b08968',
                pantsColor: '#6d597a',
                bootsColor: '#3f2b1d'
            }, gridPos(208, 105));
            const forgeApprentice = new NPC(this.scene, {
                bodyType: 'male',
                bodyVariant: 'average',
                outfit: 'peasant',
                shirtColor: '#7a4f2f',
                pantsColor: '#2e2e2e',
                bootsColor: '#24160f'
            }, gridPos(177, 98));

            this.town2Residents.push(reeveAnya, villagerDoran, villagerSella, forgeApprentice);
        }

        if (!this.town2Children.length) {
            const lina = new NPC(this.scene, {
                bodyType: 'female',
                bodyVariant: 'slim',
                outfit: 'peasant',
                shirtColor: '#d58f7e',
                pantsColor: '#577590',
                bootsColor: '#3b2618'
            }, gridPos(194, 111));
            const toma = new NPC(this.scene, {
                bodyType: 'male',
                bodyVariant: 'slim',
                outfit: 'peasant',
                shirtColor: '#8ab17d',
                pantsColor: '#4d5b6a',
                bootsColor: '#3a2a1b'
            }, gridPos(197, 113));
            this.town2Children.push(lina, toma);
        }

        const [reeveAnya, villagerDoran, villagerSella, forgeApprentice] = this.town2Residents;
        configureTownActor(reeveAnya, gridPos(190, 107), Math.PI / 2, 'reeve_anya', 'Press E to Talk', {
            mode: 'roam',
            speed: 1.25,
            waypoints: [gridPos(188, 107), gridPos(191, 109), gridPos(194, 106), gridPos(190, 104)],
            pauseMin: 0.8,
            pauseMax: 2.2
        });
        configureTownActor(villagerDoran, gridPos(206, 105), Math.PI / 2, 'villager_doran', 'Press E to Talk', {
            mode: 'conversation',
            lookTarget: gridPos(208, 105)
        });
        configureTownActor(villagerSella, gridPos(208, 105), -Math.PI / 2, 'villager_sella', 'Press E to Talk', {
            mode: 'conversation',
            lookTarget: gridPos(206, 105)
        });
        configureTownActor(forgeApprentice, gridPos(177, 98), Math.PI / 2, 'smith_joric', 'Press E to Talk', {
            mode: 'work',
            lookTarget: gridPos(178, 97, 0.4),
            gesture: 'interact',
            gestureCycle: 2.1
        });

        const [lina, toma] = this.town2Children;
        configureTownActor(lina, gridPos(194, 111), Math.PI / 2, 'lina_child', 'Press E to Talk', {
            mode: 'roam',
            speed: 2.2,
            waypoints: [gridPos(194, 111), gridPos(198, 114), gridPos(201, 111), gridPos(197, 108)],
            pauseMin: 0.2,
            pauseMax: 0.9
        }, { scale: 0.78 });
        configureTownActor(toma, gridPos(197, 113), Math.PI, 'toma_child', 'Press E to Talk', {
            mode: 'roam',
            speed: 2.3,
            waypoints: [gridPos(197, 113), gridPos(193, 109), gridPos(199, 107), gridPos(202, 112)],
            pauseMin: 0.2,
            pauseMax: 1.0
        }, { scale: 0.76 });
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

        [this.npc, this.blacksmith, this.shopkeeper, this.guard, ...this.town2Residents, ...this.town2Children, this.assassin, this.archer, this.mage, this.bandit, this.wolf].forEach(hideEntity);
    }

    private readonly tempSpawnOffset = new THREE.Vector3();
    private readonly tempSpawnPos = new THREE.Vector3();

    public spawnCombatUnitAtCell(type: string, arena: CombatEnvironment | null, row: number, col: number, forceIdle: boolean = false): boolean {
        if (!arena) return false;
        if (row < 0 || row >= arena.GRID_ROWS || col < 0 || col >= arena.GRID_COLS) return false;
        if (arena.isCellOccupied(row, col)) return false;

        const snappedPos = arena.getWorldPosition(row, col);
        const lower = type.toLowerCase();
        let spawnedUnit: any = null;

        if (lower === 'sentinel' || lower === 'vanguard sentinel') {
            const sentinel = new Sentinel(this.scene, snappedPos);
            sentinel.rotationY = Math.PI;
            this.sentinels.push(sentinel);
            spawnedUnit = sentinel;
        } else if (lower === 'knight') {
            const knight = new Knight(this.scene, snappedPos);
            knight.rotationY = Math.PI;
            this.knights.push(knight);
            spawnedUnit = knight;
        } else if (lower === 'paladin' || lower === 'iron paladin') {
            const paladin = new Paladin(this.scene, snappedPos);
            paladin.rotationY = Math.PI;
            this.paladins.push(paladin);
            spawnedUnit = paladin;
        } else if (lower === 'monk' || lower === 'storm adept') {
            const monk = new Monk(this.scene, snappedPos);
            monk.rotationY = Math.PI;
            this.monks.push(monk);
            spawnedUnit = monk;
        } else if (lower === 'bandit' || lower === 'shade assassin') {
            const bandit = new Bandit(this.scene, snappedPos);
            bandit.rotationY = 0;
            this.bandits.push(bandit);
            spawnedUnit = bandit;
        } else if (lower === 'cleric') {
            const cleric = new Cleric(this.scene, snappedPos);
            cleric.rotationY = Math.PI;
            this.clerics.push(cleric);
            spawnedUnit = cleric;
        } else if (lower === 'ranger' || lower === 'arc ranger') {
            const ranger = new Ranger(this.scene, snappedPos, '#228b22');
            ranger.rotationY = Math.PI;
            this.rangers.push(ranger);
            spawnedUnit = ranger;
        } else if (lower === 'archer') {
            const archer = new Archer(this.scene, snappedPos);
            archer.rotationY = 0;
            this.combatArchers.push(archer);
            spawnedUnit = archer;
        } else {
            return false;
        }

        if (spawnedUnit) {
            (spawnedUnit as any).__forceIdle = forceIdle;
        }

        arena.setCellOccupied(row, col, true);
        return true;
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
            const spawned = this.spawnCombatUnitAtCell(type, arena, row, col);
            if (!spawned) {
                const snappedPos = arena.getWorldPosition(row, col);
                this.spawnAnimalGroup(type, 1, null, snappedPos);
            }
        }
    }

    spawnAnimalGroup(type: string, count: number, environment: { obstacles?: THREE.Object3D[]; addObstacle?: (obj: THREE.Object3D) => void } | null, spawnCenter: THREE.Vector3) {
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
                    if (environment?.addObstacle) {
                        environment.addObstacle(animal.hitbox);
                    } else if (environment?.obstacles) {
                        environment.obstacles.push(animal.hitbox);
                    }
                }
            }
        }
    }

    update(delta: number, config: PlayerConfig, playerPosition: THREE.Vector3, cameraPosition: THREE.Vector3, environment: any | null, activeScene: string, isCombatActive: boolean, onAttackHit?: (type: string, count: number) => void, onEntityDeath?: (entityType: string) => void, sceneEntities?: any[]) {
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
            
            // Check if entity is in arena and adjust ground height if needed (for town scene)
            if (activeScene === 'town' && environment && (environment as any).isPositionInArena) {
                const entityPos = (entity as any).position || (entity as any).mesh?.position;
                if (entityPos && (environment as any).isPositionInArena(entityPos)) {
                    const arenaGroundHeight = (environment as any).getGroundHeightAt(entityPos);
                    // Only adjust if entity is at or below arena floor level
                    if (entityPos.y <= arenaGroundHeight + 0.5) {
                        entityPos.y = arenaGroundHeight;
                        // Update group positions if they exist
                        if ((entity as any).group) (entity as any).group.position.copy(entityPos);
                        if ((entity as any).model?.group) (entity as any).model.group.position.copy(entityPos);
                    }
                }
            }
            
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

        if ((entity as any).__forceIdle) {
            // Bench-deployed unit preview: keep fixed in idle pose with no behavior/animation state updates.
            const pos = (entity as any).position || (entity as any).mesh?.position || (entity as any).model?.group?.position;
            if (entity.group && pos) entity.group.position.copy(pos);
            if (entity.model?.group && pos) {
                entity.model.group.position.set(0, 0, 0);
                if (typeof entity.rotationY === 'number') {
                    entity.model.group.rotation.y = entity.rotationY;
                }
            }
            return;
        }

        if (isCombatActive && (entity as any).externalControl) {
            const pos = (entity as any).position || (entity as any).mesh?.position || (entity as any).model?.group?.position;
            if (entity.group && pos) {
                entity.group.position.copy(pos);
            }
            if (entity.model?.group) {
                if (pos) {
                    entity.model.group.position.set(0, 0, 0);
                }
                if (typeof entity.rotationY === 'number') {
                    entity.model.group.rotation.y = entity.rotationY;
                }
            }
            return;
        }

        if (entity === this.npc && config.showNPC) {
            this.tempEyePos.copy(this.tempPlayerPos).add(this.eyeOffset);
            this.npc.update(delta, this.tempEyePos, environment as any, skipAnimation);
        } else if (entity === this.blacksmith && config.showNPC) {
            this.tempEyePos.copy(this.tempPlayerPos).add(this.eyeOffset);
            this.blacksmith.update(delta, this.tempEyePos, environment as any, skipAnimation);
        } else if (entity === this.shopkeeper && config.showNPC) {
            this.tempEyePos.copy(this.tempPlayerPos).add(this.eyeOffset);
            this.shopkeeper.update(delta, this.tempEyePos, environment as any, skipAnimation);
        } else if (entity instanceof NPC && config.showNPC) {
            this.tempEyePos.copy(this.tempPlayerPos).add(this.eyeOffset);
            entity.update(delta, this.tempEyePos, environment as any, skipAnimation);
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
        } else if (entity instanceof Yeti) {
            entity.update(delta, environment as any, skipAnimation);
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
                ...this.imps,
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
            ].filter(e => !!e);
        } else if (sceneName === 'dev') {
            if (this.merchantsOnlyNpcMode) {
                return [
                    this.blacksmith,
                    this.shopkeeper,
                    this.wolf, ...this.bears, ...this.owls, ...this.yetis, ...this.deers, ...this.chickens, ...this.pigs,
                    ...this.sheeps, ...this.spiders, ...this.imps, ...this.lizards, ...this.horses
                ].filter(e => !!e);
            }
            return [
                this.npc, this.blacksmith, this.shopkeeper, this.guard, this.assassin, this.archer, this.mage, this.bandit,
                this.wolf, ...this.bears, ...this.owls, ...this.yetis, ...this.deers, ...this.chickens, ...this.pigs, 
                ...this.sheeps, ...this.spiders, ...this.imps, ...this.lizards, ...this.horses,
                ...this.clerics, ...this.knights, ...this.paladins, ...this.monks, ...this.rangers, ...this.sentinels,
                ...this.berserkers, ...this.rogues, ...this.warlocks
            ].filter(e => !!e);
        } else if (sceneName === 'town') {
            if (this.merchantsOnlyNpcMode) {
                return [
                    this.blacksmith, this.shopkeeper,
                    ...this.chickens, ...this.pigs
                ].filter(e => !!e);
            }
            return [
                this.npc, this.blacksmith, this.shopkeeper, this.guard,
                ...this.chickens, ...this.pigs
            ].filter(e => !!e);
        } else if (sceneName === 'town2') {
            return [
                this.npc,
                this.blacksmith,
                this.shopkeeper,
                this.guard,
                ...this.town2Residents,
                ...this.town2Children,
                ...this.chickens,
                ...this.pigs,
                ...this.sheeps,
                ...this.horses
            ].filter(e => !!e);
        } else if (sceneName === 'land') {
            if (this.merchantsOnlyNpcMode) {
                return [
                    this.blacksmith, this.shopkeeper,
                    this.wolf, ...this.bears, ...this.owls, ...this.yetis, ...this.deers, ...this.chickens, ...this.pigs,
                    ...this.sheeps, ...this.spiders, ...this.imps, ...this.lizards, ...this.horses
                ].filter(e => !!e);
            }
            return [
                this.npc, this.blacksmith, this.shopkeeper, this.guard,
                this.wolf, ...this.bears, ...this.owls, ...this.yetis, ...this.deers, ...this.chickens, ...this.pigs,
                ...this.sheeps, ...this.spiders, ...this.imps, ...this.lizards, ...this.horses
            ].filter(e => !!e);
        } else if (sceneName === 'singleBiome') {
            return [
                ...this.bears, ...this.wolves, ...this.owls, ...this.yetis, ...this.deers,
                ...this.chickens, ...this.pigs, ...this.sheeps, ...this.spiders, ...this.imps,
                ...this.lizards, ...this.horses
            ].filter(e => !!e);
        }
        return [];
    }

    getAllEntities(): any[] {
        return [
            this.npc, this.blacksmith, this.shopkeeper, this.guard, ...this.town2Residents, ...this.town2Children, this.assassin, this.archer, this.mage, this.bandit,
            this.wolf, ...this.bears, ...this.wolves, ...this.owls, ...this.yetis, ...this.deers, ...this.chickens, ...this.pigs, 
            ...this.sheeps, ...this.spiders, ...this.imps, ...this.lizards, ...this.horses, 
            ...this.bandits, ...this.clerics, ...this.knights, ...this.paladins, ...this.monks, ...this.rangers, ...this.sentinels,
            ...this.berserkers, ...this.rogues, ...this.warlocks, ...this.combatArchers
        ].filter(e => !!e);
    }

    private refreshRangeCache(activeScene: string, sceneEntities?: any[]) {
        const relevant = sceneEntities || this.getEntitiesForScene(activeScene);
        relevant.forEach(entity => {
            const distSq = entity.position.distanceToSquared(this.tempPlayerPos);
            this.nearCache.set(entity, distSq <= this.animationRangeSq);
            this.visibilityCache.set(entity, distSq <= this.visibilityRangeSq);
        });
    }

    // Debug function for manual yeti spawning
    debugSpawnYeti() {
        console.log('[EntityManager] Debug: Spawning test yeti');
        const playerPos = new THREE.Vector3(0, 0, 0); // Spawn at origin for testing
        this.spawnAnimalGroup('yeti', 1, null, playerPos);
        console.log('[EntityManager] Debug: Total yetis:', this.yetis.length);
    }
}
