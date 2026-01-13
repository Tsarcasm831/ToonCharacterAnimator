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
import { Blacksmith } from '../Blacksmith';
import { LowLevelCityGuard } from '../LowLevelCityGuard';
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
    private readonly visibilityRangeSq = 20 * 20;
    private readonly rangeCheckIntervalMs = 100;
    private lastRangeCheck = -Infinity;
    private readonly inRangeCache = new WeakMap<object, boolean>();
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
        // Place Blacksmith in the corner of the house (Foundation Y is ~0.4)
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
        const isInRange = (entity: { position: THREE.Vector3 }) =>
            this.inRangeCache.get(entity as any) ?? false;

        // Update Visibilities based on config
        if (this.npc) this.npc.model.group.visible = config.showNPC && isInRange(this.npc);
        if (this.blacksmith) this.blacksmith.model.group.visible = config.showNPC && isInRange(this.blacksmith);
        if (this.guard) this.guard.model.group.visible = config.showGuard && isInRange(this.guard);
        if (this.assassin) { 
            this.assassin.model.group.visible = config.showAssassin && isInRange(this.assassin); 
            this.assassin.config.isAssassinHostile = config.isAssassinHostile; 
        }
        if (this.archer) { 
            this.archer.model.group.visible = config.showAssassin && isInRange(this.archer); 
            this.archer.config.isAssassinHostile = config.isAssassinHostile; 
        }
        if (this.wolf) this.wolf.model.group.visible = isInRange(this.wolf);
        if (this.bear) this.bear.model.group.visible = isInRange(this.bear);
        if (this.owl) this.owl.model.group.visible = isInRange(this.owl);
        if (this.yeti) this.yeti.model.group.visible = isInRange(this.yeti);
        this.deers.forEach(d => d.model.group.visible = isInRange(d));
        this.chickens.forEach(c => c.model.group.visible = isInRange(c));
        this.pigs.forEach(p => p.model.group.visible = isInRange(p));
        this.sheeps.forEach(s => s.model.group.visible = isInRange(s));
        this.spiders.forEach(s => s.model.group.visible = isInRange(s));
        this.lizards.forEach(l => l.model.group.visible = isInRange(l));
        this.horses.forEach(h => h.model.group.visible = isInRange(h));
        if (this.foundryGuard) this.foundryGuard.model.group.visible = isInRange(this.foundryGuard);
        if (this.foundryAssassin) this.foundryAssassin.model.group.visible = isInRange(this.foundryAssassin);

        // Standard Updates
        if (config.showNPC && this.npc && isInRange(this.npc)) {
            this.tempEyePos.copy(this.tempPlayerPos).add(this.eyeOffset);
            this.npc.update(delta, this.tempEyePos, environment as any);
        }
        
        if (config.showGuard && this.guard && isInRange(this.guard)) {
            this.guard.update(delta, this.tempPlayerPos, environment as any);
        }

        // Hostiles & Animals
        if (config.showAssassin && this.archer && isInRange(this.archer)) {
            this.archerTargets[0].position.copy(this.tempPlayerPos);
            this.archerTargets[1].position.copy(this.npc.position);
            this.archerTargets[2].position.copy(this.wolf.position);
            this.archerTargets[2].isDead = this.wolf.isDead;
            this.archerTargets[3].position.copy(this.bear.position);
            this.archerTargets[3].isDead = this.bear.isDead;
            this.archer.update(delta, environment as any, this.archerTargets as any);
        }

        this.animalTargets[0].position.copy(this.tempPlayerPos);
        this.animalTargets[1].position.copy(this.archer.position);
        this.animalTargets[2].position.copy(this.npc.position);
        if (this.wolf && isInRange(this.wolf)) this.wolf.update(delta, environment as any, this.animalTargets as any);
        if (this.bear && isInRange(this.bear)) this.bear.update(delta, environment as any, this.animalTargets as any);
        if (this.owl && isInRange(this.owl)) this.owl.update(delta, environment as any, this.animalTargets as any);
        if (this.yeti && isInRange(this.yeti)) this.yeti.update(delta, environment as any);
        
        this.playerOnlyTarget[0].position.copy(this.tempPlayerPos);
        this.deers.forEach(d => { if (isInRange(d)) d.update(delta, environment as any, this.playerOnlyTarget as any); });
        this.chickens.forEach(c => { if (isInRange(c)) c.update(delta, environment as any, this.playerOnlyTarget as any); });
        this.pigs.forEach(p => { if (isInRange(p)) p.update(delta, environment as any, this.playerOnlyTarget as any); });
        this.sheeps.forEach(s => { if (isInRange(s)) s.update(delta, environment as any, this.playerOnlyTarget as any); });
        this.spiders.forEach(s => { if (isInRange(s)) s.update(delta, environment as any, this.playerOnlyTarget as any); });
        this.lizards.forEach(l => { if (isInRange(l)) l.update(delta, environment as any, this.playerOnlyTarget as any); });
        this.horses.forEach(h => { if (isInRange(h)) h.update(delta, environment as any, this.playerOnlyTarget as any); });

        if (config.showAssassin && this.assassin && isInRange(this.assassin)) {
            this.assassinTargets[0].position.copy(this.tempPlayerPos);
            this.assassinTargets[1].position.copy(this.npc.position);
            this.assassin.update(delta, environment as any, this.assassinTargets as any);
        }

        // Foundry Battle
        if (this.foundryGuard && this.foundryAssassin && (isInRange(this.foundryGuard) || isInRange(this.foundryAssassin))) {
            this.foundryGuardTargets[0].position.copy(this.foundryAssassin.position);
            this.foundryAssassinTargets[0].position.copy(this.foundryGuard.position);
            this.foundryGuard.update(delta, this.tempPlayerPos, environment as any, this.foundryGuardTargets as any);
            this.foundryAssassin.update(delta, environment as any, this.foundryAssassinTargets as any);
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
            const inRange = entity.position.distanceToSquared(this.tempPlayerPos) <= this.visibilityRangeSq;
            this.inRangeCache.set(entity as any, inRange);
        });
    }
}
