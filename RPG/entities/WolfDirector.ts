import * as THREE from 'three';
import { WildWolf } from '../../game/entities/animal/aggressive/WildWolf';
import {
    WOLF_DENS,
    WOLF_RESPAWN_SEC,
    WOLF_RESPAWN_MIN_PLAYER_DIST,
    terrainHeightAt,
} from '../data/worldLayout';
import type { WolfDenDef } from '../types';

// ============================================================================
// WolfDirector — owns every WildWolf in Thornwood Vale.
//
// Spawns `packSize` wolves per den from worldLayout.WOLF_DENS, registers their
// hitboxes as obstacles (melee/skinning targeting), detects deaths (kill hook
// + loot scatter), and respawns wolves at their den after WOLF_RESPAWN_SEC —
// but only while the player is farther than WOLF_RESPAWN_MIN_PLAYER_DIST away,
// so wolves never pop in on screen.
// ============================================================================

/** Beyond this distance from the player, wolves move but skip animation work. */
const ANIMATION_CULL_DIST = 90;
/** Radius of the loot scatter circle around a fresh corpse. */
const LOOT_SCATTER_RADIUS = 0.8;

export interface WolfDirectorWorld {
    obstacles: THREE.Object3D[];
    addObstacle(o: THREE.Object3D): void;
    removeObstacle(o: THREE.Object3D): void;
    spawnItemDrop(itemName: string, count: number, position: THREE.Vector3): void;
}

export interface WolfDirectorHooks {
    onWolfKilled: () => void;
    onPlayerDamaged: (damage: number) => void;
    getPlayerDamageBonus: () => number;
}

interface WolfRecord {
    wolf: WildWolf;
    den: WolfDenDef;
    /** True once this wolf's death has been processed (kill hook + loot). */
    counted: boolean;
    /** Seconds until the den may replace this dead wolf. */
    respawnTimer: number;
}

export class WolfDirector {
    public wolves: WildWolf[] = [];

    private readonly scene: THREE.Scene;
    private readonly world: WolfDirectorWorld;
    private readonly hooks: WolfDirectorHooks;
    private readonly records: WolfRecord[] = [];
    private readonly potentialTargets: { position: THREE.Vector3; isDead?: boolean }[] = [
        { position: new THREE.Vector3(), isDead: false },
    ];

    constructor(scene: THREE.Scene, world: WolfDirectorWorld, hooks: WolfDirectorHooks) {
        this.scene = scene;
        this.world = world;
        this.hooks = hooks;

        for (const den of WOLF_DENS) {
            for (let i = 0; i < den.packSize; i++) {
                this.records.push(this.spawnWolf(den));
            }
        }
        this.syncWolvesList();
    }

    update(dt: number, playerPos: THREE.Vector3, playerIsDead: boolean): void {
        this.potentialTargets[0].position.copy(playerPos);
        this.potentialTargets[0].isDead = playerIsDead;
        const environment = { obstacles: this.world.obstacles };

        for (let i = 0; i < this.records.length; i++) {
            const record = this.records[i];
            const wolf = record.wolf;

            const skipAnimation = wolf.group.position.distanceTo(playerPos) > ANIMATION_CULL_DIST;
            // Dead wolves only run their corpse-settle inside update().
            wolf.update(dt, environment, this.potentialTargets, skipAnimation);

            // -- Death detection -------------------------------------------------
            if (wolf.isDead && !record.counted) {
                record.counted = true;
                record.respawnTimer = WOLF_RESPAWN_SEC;
                this.hooks.onWolfKilled();
                this.scatterDrops(wolf);
            }

            // -- Respawn ---------------------------------------------------------
            if (record.counted) {
                record.respawnTimer -= dt;
                if (record.respawnTimer <= 0) {
                    const [denX, denZ] = record.den.center;
                    const playerDistToDen = Math.hypot(playerPos.x - denX, playerPos.z - denZ);
                    if (playerDistToDen > WOLF_RESPAWN_MIN_PLAYER_DIST) {
                        // Remove the corpse (scene + obstacle) and spawn fresh.
                        this.world.removeObstacle(wolf.hitbox);
                        wolf.dispose();
                        this.records[i] = this.spawnWolf(record.den);
                        this.syncWolvesList();
                    }
                }
            }
        }
    }

    dispose(): void {
        for (const record of this.records) {
            this.world.removeObstacle(record.wolf.hitbox);
            record.wolf.dispose();
        }
        this.records.length = 0;
        this.wolves = [];
    }

    // -----------------------------------------------------------------------

    private spawnWolf(den: WolfDenDef): WolfRecord {
        const [denX, denZ] = den.center;
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.sqrt(Math.random()) * den.wanderRadius;
        const x = denX + Math.sin(angle) * radius;
        const z = denZ + Math.cos(angle) * radius;
        const spawnPos = new THREE.Vector3(x, terrainHeightAt(x, z), z);

        const wolf = new WildWolf(this.scene, spawnPos, {
            den: { x: denX, z: denZ },
            wanderRadius: den.wanderRadius,
            // Tuned for pack fights: a full den converging is survivable in
            // armor, a lone wolf is a fair early-game duel.
            attackDamage: 7,
            attackCooldown: 1.9,
            onAttackTarget: (damage) => this.hooks.onPlayerDamaged(damage),
            getIncomingDamageBonus: () => this.hooks.getPlayerDamageBonus(),
            terrainHeightAt,
        });

        // Hitbox registration is what makes the wolf hittable (melee raycasts)
        // and its corpse skinnable (PlayerInteraction scans obstacles).
        this.world.addObstacle(wolf.hitbox);

        return { wolf, den, counted: false, respawnTimer: 0 };
    }

    private scatterDrops(wolf: WildWolf) {
        const corpse = wolf.group.position;
        const drops = wolf.getDeathDrops();
        const baseAngle = Math.random() * Math.PI * 2;
        drops.forEach((drop, i) => {
            const angle = baseAngle + (i / Math.max(1, drops.length)) * Math.PI * 2;
            const x = corpse.x + Math.cos(angle) * LOOT_SCATTER_RADIUS;
            const z = corpse.z + Math.sin(angle) * LOOT_SCATTER_RADIUS;
            this.world.spawnItemDrop(drop.itemName, drop.count, new THREE.Vector3(x, terrainHeightAt(x, z), z));
        });
    }

    private syncWolvesList() {
        this.wolves = this.records.map((r) => r.wolf);
    }
}
