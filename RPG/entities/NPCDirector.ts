import * as THREE from 'three';
import { NPC } from '../../game/entities/npc/friendly/NPC';
import { RPG_NPCS } from '../data/npcs';
import { terrainHeightAt } from '../data/worldLayout';

// ============================================================================
// NPCDirector — spawns Briarhollow's residents from RPG/data/npcs.ts.
//
// Each NPC is a shared-engine `NPC` (HumanoidEntity subclass) tagged with the
// interaction userData the engine's prompt/dialogue systems read off
// `npc.group.userData` (canTalk / actorId / interactionLabel / radius / mode —
// same convention as EntityManager.initTown2Entities). Friendly NPCs are made
// invulnerable with a per-instance takeDamage no-op so stray swings do nothing
// and NPC.ts stays untouched.
// ============================================================================

/** Beyond this distance from the player, NPCs move but skip animation work. */
const ANIMATION_CULL_DIST = 70;

export interface NPCDirectorWorld {
    obstacles: THREE.Object3D[];
    addObstacle(o: THREE.Object3D): void;
}

export class NPCDirector {
    public npcs: NPC[] = [];

    private readonly world: NPCDirectorWorld;

    constructor(scene: THREE.Scene, world: NPCDirectorWorld) {
        this.world = world;

        for (const def of RPG_NPCS) {
            const [x, z] = def.position;
            const pos = new THREE.Vector3(x, terrainHeightAt(x, z), z);

            // showNPC gates NPC updates/visibility in the shared EntityManager
            // path — force it on so the roster is never hidden by a stale
            // customization config.
            const npc = new NPC(scene, { ...def.appearance, showNPC: true }, pos);
            npc.config.showNPC = true;

            // Facing for idle NPCs (roamers immediately steer to waypoints).
            const rotationY = def.rotationY ?? 0;
            npc.rotationY = rotationY;
            npc.targetRotationY = rotationY;

            // Interaction tagging (EntityManager.configureTownActor convention).
            npc.group.userData.canTalk = true;
            npc.group.userData.actorId = def.id;
            npc.group.userData.interactionLabel = `Press E — Talk to ${def.name}`;
            npc.group.userData.interactionRadius = 2.8;
            npc.group.userData.interactionMode = 'dialogue';

            // Model scale (EntityManager scales the whole entity group).
            npc.group.scale.setScalar(def.scale ?? 1);

            // Behavior.
            const waypoints = (def.behavior.waypoints ?? []).map(
                ([wx, wz]) => new THREE.Vector3(wx, terrainHeightAt(wx, wz), wz)
            );
            npc.setBehavior({
                mode: def.behavior.mode,
                anchor: pos.clone(),
                waypoints,
                speed: def.behavior.speed ?? 1.0,
                pauseMin: 1.2,
                pauseMax: 3.6,
            });

            // Friendly NPCs are invulnerable: per-instance override so we never
            // touch NPC.ts. Stat bars stay hidden too — HumanoidEntity only
            // shows barsGroup via updateStatBars, which we never call.
            (npc as any).takeDamage = () => {};
            if (npc.barsGroup) npc.barsGroup.visible = false;

            this.npcs.push(npc);
        }
    }

    update(dt: number, playerEyePos: THREE.Vector3): void {
        for (const npc of this.npcs) {
            const skipAnimation = npc.position.distanceTo(playerEyePos) > ANIMATION_CULL_DIST;
            // NPC.update expects a full Environment; it only reads `.obstacles`.
            npc.update(dt, playerEyePos, { obstacles: this.world.obstacles } as any, skipAnimation);
        }
    }

    dispose(): void {
        for (const npc of this.npcs) {
            npc.model?.dispose?.();
            npc.dispose(); // BaseEntity.dispose removes npc.group from the scene
        }
        this.npcs = [];
    }
}
