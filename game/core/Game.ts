
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BuildingParts } from '../builder/BuildingParts';
import { Player } from '../player/Player';
import { Environment } from '../environment/Environment';
import { WorldEnvironment } from '../environment/WorldEnvironment';
import { CombatEnvironment } from '../environment/CombatEnvironment';
import { InputManager } from '../managers/InputManager';
import { SoundManager } from '../managers/SoundManager';
import { ParticleManager } from '../managers/ParticleManager';
import { BuilderManager } from '../builder/BuilderManager';
import { EntityStats, PlayerConfig, PlayerInput, InventoryItem } from '../../types';
import { PlayerDebug } from '../player/PlayerDebug';
import { RenderManager } from './RenderManager';
import { EntityManager } from '../managers/EntityManager';
import { LowLevelCityGuard } from '../entities/npc/friendly/LowLevelCityGuard';
import { Blacksmith } from '../entities/npc/friendly/Blacksmith';
import { Shopkeeper } from '../entities/npc/friendly/Shopkeeper';
import { HouseBlueprints, Blueprint } from '../builder/HouseBlueprints';

export class Game {
    private renderManager: RenderManager;
    private clock: THREE.Clock;
    
    public player: Player;
    private entityManager: EntityManager;
    private environment: Environment | null = null;
    private worldEnvironment: WorldEnvironment | null = null;
    private combatEnvironment: CombatEnvironment | null = null;
    private activeScene: 'dev' | 'world' | 'combat';

    public inputManager: InputManager;
    private soundManager: SoundManager;
    private particleManager: ParticleManager;
    private builderManager: BuilderManager;

    private animationId: number = 0;
    private prevTargetPos = new THREE.Vector3();
    
    private cameraFocusMode: number = 0; 
    private isFirstPerson: boolean = false;
    private wasFirstPersonKeyPressed: boolean = false;
    
    private isBuilding: boolean = false;
    private wasBuilderKeyPressed: boolean = false;
    private wasRotateKeyPressed: boolean = false;
    private wasAttack1Pressed: boolean = false;
    private showObstacleHitboxes: boolean = false;

    // Combat Mode State
    private selectedUnit: any | null = null;
    private draggingUnit: any | null = null;
    private isWaitingForClick = false;
    private mouseDownScreenPos = new THREE.Vector2();
    private dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    private dragOffset = new THREE.Vector3();
    private isCombatActive: boolean = false;
    private raycaster = new THREE.Raycaster();
    private fpvYaw: number = 0;
    private fpvPitch: number = 0;
    private readonly tempTargetPos = new THREE.Vector3();
    private readonly tempDeltaPos = new THREE.Vector3();
    private readonly tempHeadPos = new THREE.Vector3();
    private readonly tempForward = new THREE.Vector3();
    private readonly tempCamDir = new THREE.Vector3();
    private readonly tempLookAt = new THREE.Vector3();
    private readonly axisX = new THREE.Vector3(1, 0, 0);
    private readonly axisY = new THREE.Vector3(0, 1, 0);
    private readonly camDirBase = new THREE.Vector3(0, 0, 1);

    public config: PlayerConfig;

    private _onPointerLockChange: (e: Event) => void;
    private _onMouseMove: (e: MouseEvent) => void;
    private _onMouseDown: (e: MouseEvent) => void;
    private _onMouseUp: (e: MouseEvent) => void;

    onInteractionUpdate?: (text: string | null, progress: number | null) => void;
    onBuilderToggle?: (active: boolean) => void;
    onBiomeUpdate?: (biome: { name: string, color: string }) => void;
    onRotationUpdate?: (rotation: number) => void;
    onToggleWorldMapCallback?: (pos: THREE.Vector3) => void;
    public onDialogueTrigger?: (content: string) => void;
    public onTradeTrigger?: () => void;
    public onShopkeeperTrigger?: () => void;
    public onForgeTrigger?: () => void;
    public onShowCharacterStats?: (stats?: EntityStats, name?: string) => void;
    public onUnitSelect?: (stats?: EntityStats) => void;
    public onAttackHit?: (type: string, count: number) => void;
    public onInventoryUpdate?: (items: (InventoryItem | null)[]) => void;
    public onEnvironmentReady?: () => void;

    private currentBiomeName: string = '';
    private lastRotationUpdate = 0;
    private lastRotationValue = 0;
    private lastBiomeCheck = 0;
    private readonly rotationUpdateIntervalMs = 100;
    private readonly rotationUpdateEpsilon = 0.01;

    constructor(container: HTMLElement, initialConfig: PlayerConfig, initialManualInput: Partial<PlayerInput>, initialInventory: (InventoryItem | null)[], activeScene: 'dev' | 'world' | 'combat') {
        this.config = initialConfig;
        this.activeScene = activeScene;
        this.renderManager = new RenderManager(container);

        this.inputManager = new InputManager();
        this.inputManager.setManualInput(initialManualInput);
        this.soundManager = new SoundManager();
        this.soundManager.setVolume(initialConfig.globalVolume);

        this.particleManager = new ParticleManager(this.renderManager.scene);
        this.builderManager = new BuilderManager(this.renderManager.scene);

        this.player = new Player(this.renderManager.scene);
        Object.assign(this.player.config, initialConfig);
        this.player.inventory.setItems(initialInventory);
        
        // Initialize Scenes
        this.environment = new Environment(this.renderManager.scene);
        this.worldEnvironment = new WorldEnvironment(this.renderManager.scene);
        this.combatEnvironment = new CombatEnvironment(this.renderManager.scene);
        
        this.entityManager = new EntityManager(this.renderManager.scene, this.environment, initialConfig);

        this.switchScene(activeScene, true);

        // Pre-build dev environment content
        this.buildStructures();
        this.environment.obstacleManager.onLogPickedUp = () => {
            this.player.addItem('Wood', 8, true);
        };
        
        requestAnimationFrame(() => {
            this.environment?.buildAsync().then(() => {
                if (this.activeScene === 'dev') this.onEnvironmentReady?.();
            });
            if (this.activeScene !== 'dev') this.onEnvironmentReady?.();
        });

        this.prevTargetPos.copy(this.renderManager.controls.target);
        this.clock = new THREE.Clock();

        this.setupInputHandlers();
        
        this._onPointerLockChange = this.onPointerLockChange.bind(this);
        this._onMouseMove = this.onMouseMove.bind(this);
        this._onMouseDown = this.onMouseDown.bind(this);
        this._onMouseUp = this.onMouseUp.bind(this);
        
        document.addEventListener('pointerlockchange', this._onPointerLockChange);
        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('mousedown', this._onMouseDown);
        window.addEventListener('mouseup', this._onMouseUp);
        // Handle right click manually for stats
        window.addEventListener('contextmenu', (e) => this.onContextMenu(e));
        
        this.animate = this.animate.bind(this);
    }

    private setupInputHandlers() {
        this.inputManager.onToggleHitbox = () => this.player.toggleHitbox();
        this.inputManager.onToggleObstacleHitboxes = () => {
            this.showObstacleHitboxes = !this.showObstacleHitboxes;
            let obstacles: THREE.Object3D[] = [];
            if (this.activeScene === 'dev') obstacles = this.environment?.obstacles || [];
            else if (this.activeScene === 'world') obstacles = this.worldEnvironment?.obstacles || [];
            else if (this.activeScene === 'combat') obstacles = this.combatEnvironment?.obstacles || [];
            
            if (obstacles) PlayerDebug.updateObstacleHitboxVisuals(obstacles, this.showObstacleHitboxes);
        };
        this.inputManager.onToggleCamera = () => this.toggleCameraFocus();
        this.inputManager.onToggleHands = () => this.player.toggleHandsDebug();
        this.inputManager.onToggleSkeletonMode = () => this.player.toggleSkeletonMode();
        this.inputManager.onToggleFirstPerson = () => this.toggleFirstPerson();
        this.inputManager.onToggleGrid = () => this.environment?.toggleWorldGrid();
        this.inputManager.onToggleWorldMap = () => {
            this.onToggleWorldMapCallback?.(this.player.mesh.position.clone());
        };
    }

    start() { this.animate(); }
    
    stop() {
        cancelAnimationFrame(this.animationId);
        document.removeEventListener('pointerlockchange', this._onPointerLockChange);
        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('mousedown', this._onMouseDown);
        window.removeEventListener('mouseup', this._onMouseUp);
        this.renderManager.dispose(); 
        this.inputManager.dispose();
    }

    private onMouseDown(e: MouseEvent) {
        if (this.activeScene !== 'combat' || e.button !== 0) return;
        
        const mouse = new THREE.Vector2(
            (e.clientX / window.innerWidth) * 2 - 1,
            -(e.clientY / window.innerHeight) * 2 + 1
        );
        
        this.raycaster.setFromCamera(mouse, this.renderManager.camera);
        
        // Check all entities in the combat scene
        const combatEntities = this.entityManager.getEntitiesForScene('combat');
        const units = [this.player, ...combatEntities];
        const unitMeshes = units.map(u => u.mesh || u.model?.group || u.group).filter(Boolean);
        
        const intersects = this.raycaster.intersectObjects(unitMeshes, true);
        
        if (intersects.length > 0) {
            // Find which unit was clicked
            const clickedMesh = intersects[0].object;
            let foundUnit = units.find(u => {
                const mesh = u.mesh || u.model?.group || u.group;
                return mesh && (mesh === clickedMesh || mesh.getObjectById(clickedMesh.id));
            });

            if (foundUnit) {
                this.draggingUnit = foundUnit;
                this.isWaitingForClick = true;
                this.mouseDownScreenPos.set(e.clientX, e.clientY);
                
                const unitPos = foundUnit.position || foundUnit.mesh?.position;
                if (unitPos && this.raycaster.ray.intersectPlane(this.dragPlane, this.dragOffset)) {
                    this.dragOffset.sub(unitPos);
                }
            }
        } else {
            // Clicked empty ground: deselect
            if (this.selectedUnit) {
                this.setUnitHighlight(this.selectedUnit, false);
                this.selectedUnit = null;
            }
        }
    }

    private onMouseMove(e: MouseEvent) {
        if (this.activeScene === 'combat' && this.draggingUnit) {
            const dist = this.mouseDownScreenPos.distanceTo(new THREE.Vector2(e.clientX, e.clientY));
            if (dist > 5) {
                this.isWaitingForClick = false;
                this.setUnitHighlight(this.draggingUnit, true);
            }

            if (!this.isWaitingForClick) {
                const mouse = new THREE.Vector2(
                    (e.clientX / window.innerWidth) * 2 - 1,
                    -(e.clientY / window.innerHeight) * 2 + 1
                );
                this.raycaster.setFromCamera(mouse, this.renderManager.camera);
                const target = new THREE.Vector3();
                if (this.raycaster.ray.intersectPlane(this.dragPlane, target)) {
                    const newPos = target.sub(this.dragOffset);
                    newPos.y = 0;
                    if (this.draggingUnit.position) {
                        this.draggingUnit.position.copy(newPos);
                    } else if (this.draggingUnit.mesh) {
                        this.draggingUnit.mesh.position.copy(newPos);
                    }
                }
            }
        }

        if (this.isFirstPerson && document.pointerLockElement === this.renderManager.renderer.domElement) {
            const sensitivity = 0.002;
            this.fpvYaw -= e.movementX * sensitivity;
            this.fpvPitch -= e.movementY * sensitivity;
            const limit = Math.PI / 2 - 0.1;
            this.fpvPitch = Math.max(-limit, Math.min(limit, this.fpvPitch));
        }
    }

    private onMouseUp(e: MouseEvent) {
        if (this.activeScene === 'combat' && this.draggingUnit) {
            if (this.isWaitingForClick) {
                // Was a static click, toggle selection
                if (this.selectedUnit && this.selectedUnit !== this.draggingUnit) {
                    this.setUnitHighlight(this.selectedUnit, false);
                }
                
                const isNowSelected = this.selectedUnit !== this.draggingUnit;
                this.selectedUnit = isNowSelected ? this.draggingUnit : null;
                this.setUnitHighlight(this.draggingUnit, isNowSelected);
                
                if (isNowSelected) {
                    const stats = this.draggingUnit === this.player ? this.player.status.getStats() : this.draggingUnit.stats;
                    this.onUnitSelect?.(stats);
                } else {
                    this.onUnitSelect?.(undefined);
                }
            } else {
                // Was a drag, snap to grid
                if (this.combatEnvironment) {
                    const unitPos = this.draggingUnit.position || this.draggingUnit.mesh?.position;
                    if (unitPos) {
                        const snapped = this.combatEnvironment.snapToGrid(unitPos);
                        unitPos.copy(snapped);
                    }
                }
            }
            this.draggingUnit = null;
            this.isWaitingForClick = false;
        }
    }
    
    private onContextMenu(e: MouseEvent) {
        if (this.activeScene !== 'combat') return;
        
        const mouse = new THREE.Vector2(
            (e.clientX / window.innerWidth) * 2 - 1,
            -(e.clientY / window.innerHeight) * 2 + 1
        );
        this.raycaster.setFromCamera(mouse, this.renderManager.camera);
        
        const combatEntities = this.entityManager.getEntitiesForScene('combat');
        const units = [this.player, ...combatEntities];
        const unitMeshes = units.map(u => u.mesh || u.model?.group || u.group).filter(Boolean);
        
        const intersects = this.raycaster.intersectObjects(unitMeshes, true);
        
        if (intersects.length > 0) {
            const clickedMesh = intersects[0].object;
            let foundUnit = units.find(u => {
                const mesh = u.mesh || u.model?.group || u.group;
                return mesh && (mesh === clickedMesh || mesh.getObjectById(clickedMesh.id));
            });

            if (foundUnit) {
                // Determine unit type and name for stats
                let stats: EntityStats | undefined = foundUnit.stats;
                let unitName = 'Unknown Unit';

                if (foundUnit === this.player) {
                    stats = this.player.status.getStats();
                    unitName = 'Hero';
                } else {
                    // Try to infer name from class name or type
                    unitName = foundUnit.constructor.name;
                }

                this.onShowCharacterStats?.(stats, unitName);
            }
        }
    }

    private setUnitHighlight(unit: any, active: boolean) {
        if (!unit) return;
        unit.isDebugHitbox = active;
        // Check if it's the player or an NPC/Enemy
        if (unit === this.player) {
            PlayerDebug.updateHitboxVisuals(unit);
        } else if (unit.updateHitboxVisuals) {
            unit.updateHitboxVisuals();
        } else {
            // Fallback for units without explicit updateHitboxVisuals
            // Most specialized NPCs have them, or they use generic animator debug
        }
    }

    public toggleGrid(visible: boolean) {
        if (this.combatEnvironment) {
            this.combatEnvironment.toggleGridLabels(visible);
        }
    }

    public setCombatActive(active: boolean) {
        this.isCombatActive = active;
    }

    public switchScene(sceneName: 'dev' | 'world' | 'combat', isInit: boolean = false) {
        this.activeScene = sceneName;
        const GRID_CELL_SIZE = 1.3333;

        // Visibility
        this.environment?.setVisible(sceneName === 'dev');
        this.worldEnvironment?.setVisible(sceneName === 'world');
        this.combatEnvironment?.setVisible(sceneName === 'combat');
        
        // Reset dynamic entities when switching scenes
        this.entityManager.clearDynamicEntities();

        // Reset Combat Selection
        this.selectedUnit = null;
        this.draggingUnit = null;
        this.isCombatActive = false;

        if (sceneName === 'dev') {
            const startX = -17 * GRID_CELL_SIZE;
            const startZ = 30 * GRID_CELL_SIZE;
            this.player.mesh.position.set(startX, 0, startZ);
            this.renderManager.controls.target.set(startX, 1.7, startZ);
            this.renderManager.camera.position.set(startX, 3.2, startZ + 5.0);
            this.renderManager.controls.enableRotate = true;
            this.renderManager.controls.enableZoom = true;
        } else if (sceneName === 'world') {
            this.player.mesh.position.set(0, 5, 0);
            this.renderManager.controls.target.set(0, 6.7, 0);
            this.renderManager.camera.position.set(0, 8.2, 5.0);
            this.renderManager.controls.enableRotate = true;
            this.renderManager.controls.enableZoom = true;
        } else if (sceneName === 'combat') {
            // Combat Setup
            this.player.mesh.position.set(0, 0, 10);
            if(this.combatEnvironment) {
                const snap = this.combatEnvironment.snapToGrid(this.player.mesh.position);
                this.player.mesh.position.copy(snap);
                
                // Spawn 2 Bandits on the red side for arena
                this.entityManager.spawnCombatEncounter('bandit', 2, this.combatEnvironment);
            }
            this.player.mesh.rotation.y = Math.PI; 
            this.renderManager.controls.target.set(0, 0, 0);
            this.renderManager.camera.position.set(0, 15, 10);
            this.renderManager.camera.lookAt(0,0,0);
            this.renderManager.controls.enablePan = false; 
        }

        if (!isInit) {
            this.prevTargetPos.copy(this.renderManager.controls.target);
            this.player.velocity.set(0,0,0);
            this.player.jumpVelocity = 0;
            this.player.isJumping = false;
            if (sceneName !== 'dev') {
                setTimeout(() => this.onEnvironmentReady?.(), 100);
            }
        }
    }

    spawnAnimal(type: string, count: number) {
        if (this.activeScene === 'dev') {
            this.entityManager.spawnAnimalGroup(type, count, this.environment, this.player.mesh.position);
        }
    }

    private buildStructures() {
        if (!this.environment) return;
        const build = (blueprint: Blueprint, originX: number, originZ: number, blueprintRotation: number = 0, color?: number) => {
             const GRID = 1.3333;
             blueprint.forEach(part => {
                 let localX = part.x;
                 let localZ = part.z;
                 if (part.type === 'foundation' || part.type === 'roof' || part.type === 'round_foundation' || part.type === 'round_wall') {
                     localX += 0.5; localZ += 0.5;
                 } else if (part.type !== 'pillar') {
                     if (part.rotation === Math.PI / 2) localZ += 0.5; else localX += 0.5;
                 }
                 const rx = localX * Math.cos(blueprintRotation) - localZ * Math.sin(blueprintRotation);
                 const rz = localX * Math.sin(blueprintRotation) + localZ * Math.cos(blueprintRotation);
                 const finalX = originX + (rx * GRID);
                 const finalZ = originZ + (rz * GRID);
                 const finalRot = (part.rotation || 0) + blueprintRotation;
                 const FOUNDATION_HEIGHT = 0.4;
                 let y = 0;
                 if (part.type === 'foundation' || part.type === 'round_foundation') y = 0.2; 
                 else if (part.type === 'wall' || part.type === 'pillar' || part.type === 'round_wall') y = FOUNDATION_HEIGHT + 1.65; 
                 else if (part.type === 'doorway') y = FOUNDATION_HEIGHT + 1.65;
                 else if (part.type === 'door') y = FOUNDATION_HEIGHT + 1.175;
                 else if (part.type === 'roof') y = FOUNDATION_HEIGHT + 3.3; 
                 this.placeStructure(part.type, finalX, y, finalZ, finalRot, color);
             });
        };
        const GRID = 1.3333;
        build(HouseBlueprints.getTheForge(), -27 * GRID, 36 * GRID);
        build(HouseBlueprints.getCottage(), -20 * GRID, 45 * GRID, Math.PI / 2, 0x64b5f6);
        build(HouseBlueprints.getLonghouse(), -10 * GRID, 35 * GRID, 0, 0x81c784);
        build(HouseBlueprints.getLShape(), -38 * GRID, 30 * GRID, 0, 0xe57373);
        build(HouseBlueprints.getRoundhouse(), -50 * GRID, 45 * GRID, 0, 0x9575cd);
        build(HouseBlueprints.getGatehouse(), -15 * GRID, 20 * GRID, 0, 0xffb74d);
    }

    private placeStructure(type: any, x: number, y: number, z: number, rotation: number, color?: number) {
        const mesh = BuildingParts.createStructureMesh(type, false, color);
        mesh.position.set(x, y, z);
        mesh.rotation.y = rotation;
        const applyUserData = (obj: THREE.Object3D) => { 
            obj.userData = { ...obj.userData, type: 'hard', material: 'wood', structureType: type }; 
        };
        if (mesh instanceof THREE.Group) {
            mesh.traverse(applyUserData);
            mesh.traverse(child => {
                if (child instanceof THREE.Mesh && child.userData.type === 'hard') this.environment?.obstacles.push(child);
            });
        } else {
            applyUserData(mesh);
            this.environment?.obstacles.push(mesh);
        }
        this.environment?.group.add(mesh);
    }

    private toggleBuilder() {
        this.isBuilding = !this.isBuilding;
        this.builderManager.setActive(this.isBuilding);
        this.onBuilderToggle?.(this.isBuilding);
        if (this.isBuilding && this.isFirstPerson) this.toggleFirstPerson(false);
    }

    setBuildingType(type: any) { this.builderManager.setType(type); }
    private onPointerLockChange() { if (document.pointerLockElement !== this.renderManager.renderer.domElement && this.isFirstPerson) this.toggleFirstPerson(false); }

    setManualInput(input: Partial<PlayerInput>) { this.inputManager.setManualInput(input); }
    setConfig(config: PlayerConfig) { this.config = config; Object.assign(this.player.config, config); this.soundManager.setVolume(config.globalVolume); }
    setInventory(items: (InventoryItem | null)[]) { this.player.inventory.setItems(items); }
    setSlotSelectCallback(cb: (index: number) => void) { this.inputManager.onSlotSelect = cb; }
    setControlsActive(active: boolean) { this.renderManager.controls.enabled = active; this.inputManager.setBlocked(!active); }
    private toggleCameraFocus() { if (this.isFirstPerson) this.toggleFirstPerson(false); this.cameraFocusMode = (this.cameraFocusMode + 1) % 3; }

    private toggleFirstPerson(forceState?: boolean) {
        const nextState = forceState !== undefined ? forceState : !this.isFirstPerson;
        if (nextState === this.isFirstPerson) return;
        this.isFirstPerson = nextState;
        if (this.isFirstPerson) {
            this.renderManager.controls.minDistance = 0.01; this.renderManager.controls.maxDistance = 0.1; 
            this.renderManager.controls.enabled = false;
            this.fpvYaw = this.player.mesh.rotation.y; 
            this.fpvPitch = 0;
            this.renderManager.renderer.domElement.requestPointerLock();
        } else {
            this.renderManager.controls.minDistance = 0.1; this.renderManager.controls.maxDistance = 100; 
            this.renderManager.controls.enabled = true;
            if (document.pointerLockElement === this.renderManager.renderer.domElement) document.exitPointerLock();
            if (this.player.model.parts.head) this.player.model.parts.head.visible = true;
            const dir = new THREE.Vector3().subVectors(this.renderManager.camera.position, this.renderManager.controls.target).normalize();
            this.renderManager.camera.position.copy(this.renderManager.controls.target).addScaledVector(dir, 4.0);
        }
    }

    resize() { this.renderManager.resize(); }

    private animate(time: number = 0) {
        this.animationId = requestAnimationFrame(this.animate);
        const delta = Math.min(this.clock.getDelta(), 0.1);
        if (delta <= 0) return;

        const input = this.inputManager.getInput();

        // Scene-Specific Logic
        if (this.activeScene === 'combat') {
             const camForward = new THREE.Vector3();
             this.renderManager.camera.getWorldDirection(camForward);
             camForward.y = 0; 
             camForward.normalize();
             
             const camRight = new THREE.Vector3(-camForward.z, 0, camForward.x); 
             
             const panSpeed = 15.0 * delta;
             const panDelta = new THREE.Vector3();
             
             if (Math.abs(input.y) > 0.1) panDelta.addScaledVector(camForward, -input.y * panSpeed);
             if (Math.abs(input.x) > 0.1) panDelta.addScaledVector(camRight, input.x * panSpeed);

             if (panDelta.lengthSq() > 0) {
                 this.renderManager.camera.position.add(panDelta);
                 this.renderManager.controls.target.add(panDelta);
             }

             input.x = 0;
             input.y = 0;
             input.isRunning = false;
             input.attack1 = false;
             input.attack2 = false;
        }

        // Shared Logic
        const joyLook = this.inputManager.getJoystickLook();
        if (joyLook.x !== 0 || joyLook.y !== 0) {
            const joySensitivity = 2.5 * delta;
            if (this.isFirstPerson) {
                this.fpvYaw -= joyLook.x * joySensitivity; 
                this.fpvPitch += joyLook.y * joySensitivity; 
                const limit = Math.PI / 2 - 0.1;
                this.fpvPitch = Math.max(-limit, Math.min(limit, this.fpvPitch));
            } else {
                const offset = new THREE.Vector3().subVectors(this.renderManager.camera.position, this.renderManager.controls.target);
                const spherical = new THREE.Spherical().setFromVector3(offset);
                spherical.theta -= joyLook.x * joySensitivity; spherical.phi -= joyLook.y * joySensitivity;
                spherical.makeSafe(); offset.setFromSpherical(spherical);
                this.renderManager.camera.position.copy(this.renderManager.controls.target).add(offset);
            }
        }

        if (input.toggleFirstPerson && !this.wasFirstPersonKeyPressed) this.toggleFirstPerson();
        this.wasFirstPersonKeyPressed = !!input.toggleFirstPerson;
        if (input.rotateGhost && !this.wasRotateKeyPressed) this.builderManager.rotate();
        this.wasRotateKeyPressed = !!input.rotateGhost;
        if (this.isBuilding && input.attack1 && !this.wasAttack1Pressed) {
            const currentEnv = this.activeScene === 'dev' ? this.environment : (this.activeScene === 'world' ? this.worldEnvironment : null);
            if (currentEnv) {
                this.builderManager.build(currentEnv);
                if (this.showObstacleHitboxes) PlayerDebug.updateObstacleHitboxVisuals(currentEnv.obstacles, true);
            }
        }
        this.wasAttack1Pressed = !!input.attack1;

        let cameraRotation = this.isFirstPerson ? (this.fpvYaw - Math.PI) : Math.atan2(this.renderManager.camera.position.x - this.renderManager.controls.target.x, this.renderManager.camera.position.z - this.renderManager.controls.target.z);

        let currentEnv: any = null;
        let currentEntities: any[] = [];

        if (this.activeScene === 'dev' && this.environment) {
            this.environment.update(delta, this.config, this.player.mesh.position);
            this.entityManager.update(delta, this.config, this.player.mesh.position, this.environment, this.activeScene, true);
            currentEntities = this.entityManager.getEntitiesForScene(this.activeScene);
            currentEnv = this.environment;
        } else if (this.activeScene === 'world' && this.worldEnvironment) {
            currentEnv = this.worldEnvironment;
            this.worldEnvironment.update(delta, this.config, this.player.mesh.position);
        } else if (this.activeScene === 'combat' && this.combatEnvironment) {
            currentEnv = this.combatEnvironment;
            this.combatEnvironment.update(delta, this.config, this.player.mesh.position);
            this.entityManager.update(delta, this.config, this.player.mesh.position, this.combatEnvironment, this.activeScene, this.isCombatActive, this.onAttackHit);
            currentEntities = this.entityManager.getEntitiesForScene(this.activeScene);
        }

        this.particleManager.update(delta);
        
        if (currentEnv) {
            if (time - this.lastBiomeCheck > 500) {
                this.lastBiomeCheck = time;
                const biome = currentEnv.getBiomeAt(this.player.mesh.position);
                if (biome.name !== this.currentBiomeName) { this.currentBiomeName = biome.name; this.onBiomeUpdate?.(biome); }
            }
            
            const playerInput = { ...input };
            if (this.isBuilding) { playerInput.attack1 = false; playerInput.attack2 = false; }
            this.player.update(delta, playerInput, this.renderManager.camera.position, cameraRotation, currentEnv, this.particleManager, currentEntities);
            if (this.isBuilding && this.inputManager.mousePosition) {
                this.builderManager.update(this.player.mesh.position, this.player.mesh.rotation.y, currentEnv, this.renderManager.camera, this.inputManager.mousePosition);
            }
        }
        this.soundManager.update(this.player, delta);
        
        if (time - this.lastRotationUpdate >= this.rotationUpdateIntervalMs || Math.abs(cameraRotation - this.lastRotationValue) >= this.rotationUpdateEpsilon) {
            this.lastRotationUpdate = time; this.lastRotationValue = cameraRotation;
            this.onRotationUpdate?.(cameraRotation);
        }

        if (this.activeScene !== 'combat') {
            this.tempTargetPos.copy(this.player.mesh.position);
            let heightOffset = this.cameraFocusMode === 1 ? 1.0 : (this.cameraFocusMode === 2 ? 0.4 : 1.7);
            this.tempTargetPos.y += heightOffset; 

            if (this.isFirstPerson) {
                const head = this.player.model.parts.head;
                if (head) {
                    this.player.mesh.rotation.y = this.fpvYaw;
                    head.visible = false;
                    head.getWorldPosition(this.tempHeadPos);
                    this.player.mesh.getWorldDirection(this.tempForward);
                    this.tempHeadPos.addScaledVector(this.tempForward, 0.1); 
                    this.renderManager.controls.target.copy(this.tempHeadPos);
                    this.tempCamDir.copy(this.camDirBase).applyAxisAngle(this.axisX, this.fpvPitch).applyAxisAngle(this.axisY, this.fpvYaw);
                    this.renderManager.camera.position.copy(this.tempHeadPos);
                    this.tempLookAt.copy(this.tempHeadPos).add(this.tempCamDir);
                    this.renderManager.camera.lookAt(this.tempLookAt);
                }
            } else {
                this.prevTargetPos.copy(this.renderManager.controls.target);
                this.renderManager.controls.target.copy(this.tempTargetPos);
                this.tempDeltaPos.subVectors(this.renderManager.controls.target, this.prevTargetPos);
                this.renderManager.camera.position.add(this.tempDeltaPos);
                this.renderManager.controls.update();
            }
        } else {
             this.renderManager.controls.update();
        }
  
        if (this.player.isTalking) this.onInteractionUpdate?.(null, null);
        else if (this.player.isSkinning) this.onInteractionUpdate?.(null, this.player.skinningProgress);
        else if (this.player.isChargingFishing) this.onInteractionUpdate?.('Power', this.player.fishingCharge);
        else if (this.player.canTalk) {
            const target = this.player.talkingTarget;
            const label = target instanceof Shopkeeper
                ? 'Press E to Chat'
                : target instanceof Blacksmith
                    ? 'Press E to Trade'
                    : 'Press E to Talk';
            this.onInteractionUpdate?.(label, null);
            if (input.interact) { 
                this.player.isTalking = true; 
                if (target instanceof LowLevelCityGuard) { target.isLeftHandWaving = true; target.leftHandWaveTimer = 0; this.onDialogueTrigger?.("Greetings, traveler. Keep your weapons sheathed within city limits and we'll have no trouble. The roads are dangerous these days, stay vigilant."); } 
                else if (target instanceof Blacksmith) this.onTradeTrigger?.();
                else if (target instanceof Shopkeeper) this.onShopkeeperTrigger?.();
                else this.onDialogueTrigger?.("Greetings, traveler.");
            }
        } else if (this.player.canSkin) this.onInteractionUpdate?.('Press F to Skin', null);
        else {
            const target = this.player.interactableTarget;
            if (target) {
                const label = target.userData.interactType === 'forge' ? 'Press E to Forge' : 'Interact';
                this.onInteractionUpdate?.(label, null);
                if (input.interact && target.userData.interactType === 'forge') this.onForgeTrigger?.();
            } else this.onInteractionUpdate?.(null, null);
        }
        if (this.player.inventory.isDirty) { this.onInventoryUpdate?.([...this.player.inventory.items]); this.player.inventory.isDirty = false; }
        this.renderManager.render();
    }
}
