import * as THREE from 'three';
import { RenderManager } from '../../game/core/RenderManager';
import { LightingManager } from '../../game/environment/LightingManager';
import { DoorManager } from '../../game/environment/DoorManager';
import { InputManager } from '../../game/managers/InputManager';
import { InputCommand, DEFAULT_KEYBINDINGS, type KeyBindingMap } from '../../game/managers/InputBindings';
import { CameraManager } from '../../game/managers/CameraManager';
import { SoundManager } from '../../game/managers/SoundManager';
import { ParticleManager } from '../../game/managers/ParticleManager';
import { ProjectileManager } from '../../game/managers/ProjectileManager';
import { Player } from '../../game/player/Player';
import { PlayerCombat } from '../../game/player/PlayerCombat';
import type { PlayerInput } from '../../types';
import { RPGWorld } from '../world/RPGWorld';
import { WolfDirector } from '../entities/WolfDirector';
import { NPCDirector } from '../entities/NPCDirector';
import { useRPGStore } from '../state/rpgStore';
import { getItemDef } from '../data/items';
import { SPAWN_CAMP, SPAWN_FACING_Y, terrainHeightAt } from '../data/worldLayout';

// ============================================================================
// RPGGame — the engine orchestrator for the Thornwood Vale RPG scene.
// Owns the three.js stack (render/light/sound/particles/input/camera), the
// player, the world and the entity directors, and runs the rAF frame loop.
// Gameplay state lives EXCLUSIVELY in the zustand store (RPG/state/rpgStore):
// the engine pushes events in (damage, pickups, kills, position, time) and
// reacts to revision counters coming out (config/inventory/phase/activePanel).
// ============================================================================

const FOG_NIGHT = new THREE.Color(0x111726);
const FOG_DUSK = new THREE.Color(0x8a7a8e);
const FOG_DAY = new THREE.Color(0xa9c2d6);
const FOG_BASE_NEAR = 70;
const FOG_BASE_FAR = 240;

function zeroInput(): PlayerInput {
    return {
        x: 0, y: 0, isRunning: false, jump: false, isDead: false, isPickingUp: false,
        attack1: false, attack2: false, interact: false, combat: false,
        toggleFirstPerson: false, wave: false, leftHandWave: false, summon: false,
        toggleBuilder: false, rotateGhost: false, fireball: false, crouch: false,
    };
}

export class RPGGame {
    public inputManager!: InputManager;

    private container: HTMLElement;
    private renderManager!: RenderManager;
    private lighting!: LightingManager;
    private soundManager!: SoundManager;
    private particleManager!: ParticleManager;
    private cameraManager!: CameraManager;
    private doorManager!: DoorManager;
    private player!: Player;
    private world!: RPGWorld;
    private wolfDirector!: WolfDirector;
    private npcDirector!: NPCDirector;

    private clock = new THREE.Clock();
    private animationId = 0;
    private started = false;
    private disposed = false;

    private unsubscribers: (() => void)[] = [];
    private prevInteract = false;
    private deadInput: PlayerInput = zeroInput();
    private openContainerId: string | null = null;

    // Engine -> store push accumulators.
    private timeOfDayPushTimer = 0;
    private positionPushTimer = 0;
    private playtimeTimer = 0;

    // Temp objects (no per-frame allocation).
    private readonly eyePos = new THREE.Vector3();
    private readonly fogColor = new THREE.Color();

    private readonly onPickupItem = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail?.itemName) {
            useRPGStore.getState().pushToast(`+${detail.count ?? 1} ${detail.itemName}`, 'loot');
        }
    };

    constructor(container: HTMLElement) {
        this.container = container;
    }

    // ------------------------------------------------------------------ boot

    public start(): void {
        if (this.started || this.disposed) return;
        this.started = true;

        if (import.meta.env.DEV) {
            (window as any).__rpgGame = this;
            (window as any).__rpgStore = useRPGStore;
        }

        const store = useRPGStore.getState();

        // -- Rendering ---------------------------------------------------------
        this.renderManager = new RenderManager(this.container);
        this.renderManager.setBaseLightingEnabled(false);
        const scene = this.renderManager.scene;
        // Override the dark default fog with a daylight gradient (re-tinted per
        // frame by time of day) and push the camera far plane out for the vale.
        scene.fog = new THREE.Fog(FOG_DAY.getHex(), FOG_BASE_NEAR, FOG_BASE_FAR);
        this.renderManager.camera.far = 420;
        this.renderManager.camera.updateProjectionMatrix();

        this.lighting = new LightingManager(scene);
        this.lighting.setShadowCoverage(95);
        this.lighting.setSkySphereRadius(185);
        this.lighting.horizonOverride = null; // daylight horizon, not the dark default

        this.soundManager = new SoundManager();
        this.soundManager.setVolume(store.character?.config.globalVolume ?? 0.5);
        this.particleManager = new ParticleManager(scene);

        // -- Input ---------------------------------------------------------------
        const bindings: KeyBindingMap = {
            ...DEFAULT_KEYBINDINGS,
            [InputCommand.PickUp]: ['KeyF'], // frees KeyP for the profile panel
            [InputCommand.Die]: [],          // no debug-die key in the RPG
            [InputCommand.CombatStance]: [], // no combat-stance camera mode
        };
        this.inputManager = new InputManager(bindings);
        // NOTE: the inventory toggle (KeyI) is owned by RPGScene's window
        // listener — wiring onToggleInventory here too would double-toggle on
        // the same keypress (both listeners see the event).
        this.inputManager.onSlotSelect = (slotIndex) => {
            const s = useRPGStore.getState();
            if (s.phase !== 'playing' || slotIndex >= 8) return;
            const item = s.inventory[slotIndex];
            if (item && getItemDef(item.name)?.consume) s.useItemAt(slotIndex);
        };

        // -- Player ----------------------------------------------------------------
        this.player = new Player(scene, this.soundManager);
        if (store.character) Object.assign(this.player.config, store.character.config);
        const spawn = store.playerPosition
            ?? [SPAWN_CAMP[0], terrainHeightAt(SPAWN_CAMP[0], SPAWN_CAMP[1]), SPAWN_CAMP[1]];
        this.player.locomotion.position.set(spawn[0], spawn[1], spawn[2]);
        this.player.mesh.position.set(spawn[0], spawn[1], spawn[2]);
        this.player.locomotion.rotationY = SPAWN_FACING_Y;
        this.player.mesh.rotation.y = SPAWN_FACING_Y;
        this.player.inventory.setItems(store.inventory.map((it) => (it ? { ...it } : null)));

        this.cameraManager = new CameraManager(this.renderManager, this.player);
        // Behind/above the player (player faces -Z; behind is +Z).
        this.renderManager.controls.target.set(spawn[0], spawn[1] + 1.7, spawn[2]);
        this.renderManager.camera.position.set(spawn[0], spawn[1] + 3.4, spawn[2] + 6.5);
        this.renderManager.controls.update();

        // -- World ------------------------------------------------------------------
        this.world = new RPGWorld(scene);
        this.world.build();
        this.doorManager = new DoorManager();
        this.world.getDoors().forEach((d) => this.doorManager.addDoor(d));

        // Replay container save state (looted chests stay open & dark).
        for (const runtime of this.world.containers) {
            if (store.containers[runtime.def.id]?.looted) {
                this.world.setContainerVisualState(runtime.def.id, { looted: true });
            }
        }

        // -- Entities ----------------------------------------------------------------
        this.wolfDirector = new WolfDirector(scene, this.world, {
            onWolfKilled: () => useRPGStore.getState().registerWolfKill(),
            onPlayerDamaged: (dmg) => {
                useRPGStore.getState().damagePlayer(dmg, 'a wolf');
                this.player.model.flashDamage?.();
            },
            getPlayerDamageBonus: () => useRPGStore.getState().getDamageBonus(),
        });
        this.npcDirector = new NPCDirector(scene, this.world);

        // Stale projectiles from other scenes must not collide here.
        ProjectileManager.activeProjectiles.length = 0;

        // Seed the lighting day/night cycle from the saved time of day. The
        // LightingManager only reads config.timeOfDay when isAutoTime is false
        // (its internal cycleTimer is the authority otherwise), so we prime it
        // with one manual-time update, then hand control back to auto-time.
        this.player.config.isAutoTime = false;
        this.player.config.timeOfDay = store.timeOfDay;
        this.lighting.update(0, this.player.config, this.player.mesh.position);
        this.player.config.isAutoTime = true;

        this.subscribeToStore();
        window.addEventListener('pickup-item', this.onPickupItem);

        this.clock.start();
        this.clock.getDelta(); // discard build time
        this.animationId = requestAnimationFrame(this.animate);
    }

    // ---------------------------------------------------------- store -> engine

    private subscribeToStore(): void {
        const unsub = useRPGStore.subscribe((state, prev) => {
            // (a) Appearance / equipment changed in the store.
            if (state.configRevision !== prev.configRevision && state.character) {
                const timeOfDay = this.player.config.timeOfDay;
                Object.assign(this.player.config, state.character.config);
                this.player.config.timeOfDay = timeOfDay; // engine clock is authoritative
                this.soundManager.setVolume(state.character.config.globalVolume ?? 0.5);
            }

            // (b) Inventory changed from the React/store side.
            if (state.inventoryRevision !== prev.inventoryRevision) {
                this.player.inventory.setItems(state.inventory.map((it) => (it ? { ...it } : null)));
            }

            // (c) Phase transitions (death / respawn).
            if (state.phase !== prev.phase) {
                if (state.phase === 'dead') {
                    if (!this.player.status.isDead) this.player.status.toggleDeath(this.player.mesh);
                    this.inputManager.setJoystickMove(0, 0);
                    this.inputManager.setJoystickLook(0, 0);
                } else if (state.phase === 'playing' && prev.phase === 'dead') {
                    if (this.player.status.isDead) this.player.status.toggleDeath(this.player.mesh);
                    const p = state.playerPosition;
                    if (p) this.teleportPlayer(p[0], p[1], p[2]);
                }
            }

            // (d) Panel open/close: block engine input + camera controls.
            if (state.activePanel !== prev.activePanel || state.containerId !== prev.containerId) {
                const blocked = state.activePanel !== 'none';
                this.inputManager.setBlocked(blocked);
                this.renderManager.controls.enabled = !blocked;

                const openId = state.activePanel === 'container' ? state.containerId : null;
                if (openId !== this.openContainerId) {
                    if (this.openContainerId) {
                        const closingId = this.openContainerId;
                        this.world.setContainerVisualState(closingId, { open: false });
                        const def = this.world.containers.find((c) => c.def.id === closingId)?.def;
                        if (def?.mode === 'loot' && state.containers[closingId]?.looted) {
                            this.world.setContainerVisualState(closingId, { looted: true });
                        }
                    }
                    if (openId) this.world.setContainerVisualState(openId, { open: true });
                    this.openContainerId = openId;
                }
            }
        });
        this.unsubscribers.push(unsub);
    }

    private teleportPlayer(x: number, y: number, z: number): void {
        this.player.locomotion.position.set(x, y, z);
        this.player.mesh.position.set(x, y, z);
        this.player.locomotion.velocity.set(0, 0, 0);
        // Snap the camera rig to the new spot; updatePosition() keeps it there.
        const dx = this.renderManager.camera.position.x - this.renderManager.controls.target.x;
        const dy = this.renderManager.camera.position.y - this.renderManager.controls.target.y;
        const dz = this.renderManager.camera.position.z - this.renderManager.controls.target.z;
        this.renderManager.controls.target.set(x, y + 1.7, z);
        this.renderManager.camera.position.set(x + dx, y + 1.7 + dy, z + dz);
    }

    // ------------------------------------------------------------------ frame

    private animate = () => {
        if (!this.started || this.disposed) return;
        this.animationId = requestAnimationFrame(this.animate);

        let dt = this.clock.getDelta();
        if (dt > 0.05) dt = 0.05;
        if (dt <= 0) return;

        const store = useRPGStore.getState();
        const playing = store.phase === 'playing';
        const playerPos = this.player.mesh.position;

        const input = this.inputManager.getInput();

        // Lighting + world clock. isAutoTime drives the cycle; push the engine
        // clock back to the store about once a second.
        this.lighting.update(dt, this.player.config, playerPos);
        this.timeOfDayPushTimer += dt;
        if (this.timeOfDayPushTimer >= 1) {
            this.timeOfDayPushTimer = 0;
            store.setTimeOfDay(this.player.config.timeOfDay);
        }
        this.updateFog(this.player.config.timeOfDay);

        // World + entities.
        this.world.update(dt, playerPos);
        this.wolfDirector.update(dt, playerPos, store.phase === 'dead');
        this.eyePos.set(playerPos.x, playerPos.y + 1.6, playerPos.z);
        this.npcDirector.update(dt, this.eyePos);
        this.doorManager.update(dt);
        this.particleManager.update(dt);

        // Wolf health-bar billboards face this camera.
        this.renderManager.scene.userData.camera = this.renderManager.camera;

        const combinedObstacles = [...this.world.obstacles, ...this.doorManager.getDoorObjects()];
        const entities: any[] = [...this.wolfDirector.wolves, ...this.npcDirector.npcs];

        PlayerCombat.updateProjectiles(dt, this.world, this.particleManager, entities);

        const cameraRotation = this.cameraManager.getCameraRotation();
        const frameInput = playing ? input : this.deadInput;
        this.player.update(
            dt,
            frameInput,
            this.renderManager.camera.position,
            cameraRotation,
            this.world,
            this.particleManager,
            entities,
            false,
            combinedObstacles,
        );

        this.cameraManager.handleJoystickLook(this.inputManager.getJoystickLook(), dt);
        this.cameraManager.updatePosition('rpg', combinedObstacles);

        this.updateInteractions(store, playing, input);

        // -- Engine -> store sync --------------------------------------------------
        if (this.player.inventory.isDirty) {
            store.setInventoryFromEngine(this.player.inventory.items.map((it) => (it ? { ...it } : null)));
            this.player.inventory.isDirty = false;
        }
        if (playing) {
            this.positionPushTimer += dt;
            if (this.positionPushTimer >= 3) {
                this.positionPushTimer = 0;
                store.setPlayerPosition(playerPos.x, playerPos.y, playerPos.z);
            }
            this.playtimeTimer += dt;
            if (this.playtimeTimer >= 1) {
                this.playtimeTimer -= 1;
                store.tickPlaytime(1);
            }
        }

        this.soundManager.update(this.player, dt, this.world);
        this.renderManager.render();
    };

    // ------------------------------------------------------------ interactions

    private updateInteractions(
        store: ReturnType<typeof useRPGStore.getState>,
        playing: boolean,
        input: PlayerInput,
    ): void {
        const interactPressed = input.interact && !this.prevInteract;
        this.prevInteract = input.interact;

        if (!playing || store.activePanel !== 'none') {
            store.setInteraction(null, null);
            return;
        }

        const playerPos = this.player.mesh.position;

        // 1. NPC dialogue.
        if (this.player.canTalk && this.player.talkingTarget) {
            const target = this.player.talkingTarget;
            const label = target.group?.userData?.interactionLabel ?? 'Press E to Talk';
            store.setInteraction(label, null);
            if (interactPressed) {
                const actorId = target.group?.userData?.actorId;
                if (actorId) store.openDialogue(actorId);
            }
            return;
        }

        // 2. Doors. NOTE: PlayerInteraction may already toggle the door this
        // frame (door parts carry userData.interactType = 'door' and are in the
        // obstacles list); Door.interact() ignores calls while animating, so a
        // same-frame double call is a safe no-op.
        const door = this.doorManager.findDoorAtPosition(playerPos, 2.0);
        if (door) {
            store.setInteraction(door.getInteractionPrompt(), null);
            if (interactPressed) door.interact();
            return;
        }

        // 3. Containers (loot-mode containers that are already looted go quiet).
        let bestContainer: { id: string; label: string } | null = null;
        let bestDistSq = Infinity;
        for (const runtime of this.world.containers) {
            if (runtime.def.mode === 'loot' && store.containers[runtime.def.id]?.looted) continue;
            if (!runtime.object.isPlayerInRange(playerPos)) continue;
            const d = runtime.object.mesh.position.distanceToSquared(playerPos);
            if (d < bestDistSq) {
                bestDistSq = d;
                bestContainer = { id: runtime.def.id, label: runtime.def.label };
            }
        }
        if (bestContainer) {
            store.setInteraction(`Press E — Open ${bestContainer.label}`, null);
            if (interactPressed) store.openContainer(bestContainer.id);
            return;
        }

        // 4. Skinning / pickups (F is held; PlayerInteraction owns the logic).
        if (this.player.canSkin) {
            store.setInteraction('Hold F to Skin', this.player.isSkinning ? this.player.skinningProgress : null);
            return;
        }
        if (this.player.pickupTarget) {
            const itemName = this.player.pickupTarget.userData.pickupItem ?? 'Item';
            const label = this.player.pickupTarget.userData.interactionLabel ?? `Press F to Pick Up ${itemName}`;
            store.setInteraction(label, null);
            return;
        }

        store.setInteraction(null, null);
    }

    // ---------------------------------------------------------------- fog tint

    private updateFog(t: number): void {
        // Mirror LightingManager's sun math exactly (cyclePercent 0 = sunrise,
        // day spans the first DAY_RATIO=0.6 of the cycle) so fog color always
        // agrees with the sky dome.
        const cyclePercent = (t % 24) / 24;
        const DAY_RATIO = 0.6;
        let sunAltitude: number;
        if (cyclePercent < DAY_RATIO) {
            sunAltitude = Math.sin((cyclePercent / DAY_RATIO) * Math.PI);
        } else {
            sunAltitude = -Math.sin(((cyclePercent - DAY_RATIO) / (1 - DAY_RATIO)) * Math.PI);
        }
        const c = this.fogColor;
        let dayness: number;
        if (sunAltitude <= -0.1) {
            c.copy(FOG_NIGHT); dayness = 0;
        } else if (sunAltitude < 0.25) {
            const k = (sunAltitude + 0.1) / 0.35;
            if (k < 0.5) c.lerpColors(FOG_NIGHT, FOG_DUSK, k * 2);
            else c.lerpColors(FOG_DUSK, FOG_DAY, (k - 0.5) * 2);
            dayness = k;
        } else {
            c.copy(FOG_DAY); dayness = 1;
        }
        const fog = this.renderManager.scene.fog as THREE.Fog | null;
        if (fog) {
            fog.color.copy(c);
            const scale = 0.78 + 0.22 * dayness; // pull fog in slightly at night
            fog.near = FOG_BASE_NEAR * scale;
            fog.far = FOG_BASE_FAR * scale;
        }
    }

    // ------------------------------------------------------------------ public

    public resize(): void {
        if (this.disposed || !this.started) return;
        this.renderManager.resize();
    }

    public dispose(): void {
        if (this.disposed || !this.started) return;
        this.disposed = true;

        cancelAnimationFrame(this.animationId);
        window.removeEventListener('pickup-item', this.onPickupItem);
        for (const unsub of this.unsubscribers) unsub();
        this.unsubscribers = [];

        this.inputManager.dispose();
        this.doorManager.dispose();
        this.wolfDirector.dispose();
        this.npcDirector.dispose();
        this.world.dispose();

        // Player has no dispose of its own; remove + free its model and vfx.
        this.renderManager.scene.remove(this.player.model.group);
        this.player.model.dispose?.();
        this.player.chakra.dispose?.();

        this.lighting.dispose();
        this.soundManager.ctx?.close().catch(() => {});
        ProjectileManager.activeProjectiles.length = 0;

        this.renderManager.dispose(); // last: frees every remaining scene resource
    }
}
