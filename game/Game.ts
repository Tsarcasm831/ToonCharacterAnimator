
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BuildingParts } from './builder/BuildingParts';
import { Player } from './Player';
import { Environment } from './Environment';
import { WorldEnvironment } from './WorldEnvironment';
import { InputManager } from './InputManager';
import { SoundManager } from './SoundManager';
import { ParticleManager } from './ParticleManager';
import { BuilderManager } from './builder/BuilderManager';
import { PlayerConfig, PlayerInput } from '../types';
import { PlayerDebug } from './player/PlayerDebug';
import { RenderManager } from './core/RenderManager';
import { EntityManager } from './managers/EntityManager';

export class Game {
    private renderManager: RenderManager;
    private clock: THREE.Clock;
    
    public player: Player;
    private entityManager: EntityManager;
    private environment: Environment | null = null;
    private worldEnvironment: WorldEnvironment | null = null;
    private activeScene: 'dev' | 'world';

    private inputManager: InputManager;
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

    private fpvYaw: number = 0;
    private fpvPitch: number = 0;

    public config: PlayerConfig;

    private _onPointerLockChange: (e: Event) => void;
    private _onMouseMove: (e: MouseEvent) => void;

    onInventoryUpdate?: (items: string[]) => void;
    onInteractionUpdate?: (text: string | null, progress: number | null) => void;
    onBuilderToggle?: (active: boolean) => void;
    onBiomeUpdate?: (biome: { name: string, color: string }) => void;
    onRotationUpdate?: (rotation: number) => void;
    onToggleWorldMapCallback?: (pos: THREE.Vector3) => void;
    onDialogueTrigger?: (content: string) => void;

    private currentBiomeName: string = '';

    constructor(container: HTMLElement, initialConfig: PlayerConfig, initialManualInput: Partial<PlayerInput>, initialInventory: string[], activeScene: 'dev' | 'world') {
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
        
        // Define standard cell size used for grid labels
        const GRID_CELL_SIZE = 1.3333;

        if (activeScene === 'dev') {
            this.environment = new Environment(this.renderManager.scene);
            this.entityManager = new EntityManager(this.renderManager.scene, this.environment, initialConfig);
            
            // Initial position for Dev at Timber Wharf label [-17, -30]
            // We multiply the index by cell size to land on the correct label
            const startX = -17 * GRID_CELL_SIZE;
            const startZ = 30 * GRID_CELL_SIZE;
            
            this.player.mesh.position.set(startX, 0, startZ);
            this.renderManager.controls.target.set(startX, 1.7, startZ);
            this.renderManager.camera.position.set(startX, 3.2, startZ + 5.0);
            
            this.buildInitialStructure();
        } else {
            this.worldEnvironment = new WorldEnvironment(this.renderManager.scene);
            this.entityManager = new EntityManager(this.renderManager.scene, null as any, initialConfig);
            this.entityManager.setVisibility(false);

            // Initial position for World
            this.player.mesh.position.set(0, 5, 0);
            this.renderManager.controls.target.set(0, 6.7, 0);
            this.renderManager.camera.position.set(0, 8.2, 5.0);
        }

        this.prevTargetPos.copy(this.renderManager.controls.target);
        this.clock = new THREE.Clock();

        this.inputManager.onToggleHitbox = () => this.player.toggleHitbox();
        this.inputManager.onToggleObstacleHitboxes = () => {
            this.showObstacleHitboxes = !this.showObstacleHitboxes;
            const obstacles = this.activeScene === 'dev' ? this.environment?.obstacles : this.worldEnvironment?.obstacles;
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
        
        this._onPointerLockChange = this.onPointerLockChange.bind(this);
        this._onMouseMove = this.onMouseMove.bind(this);
        document.addEventListener('pointerlockchange', this._onPointerLockChange);
        window.addEventListener('mousemove', this._onMouseMove);
        this.animate = this.animate.bind(this);
    }

    start() { this.animate(); }
    stop() {
        cancelAnimationFrame(this.animationId);
        document.removeEventListener('pointerlockchange', this._onPointerLockChange);
        window.removeEventListener('mousemove', this._onMouseMove);
        this.renderManager.dispose(); 
        this.inputManager.dispose();
    }

    public switchScene(sceneName: 'dev' | 'world') {
        this.activeScene = sceneName;
        const GRID_CELL_SIZE = 1.3333;

        if (sceneName === 'dev') {
            this.environment?.setVisible(true);
            this.worldEnvironment?.setVisible(false);

            // Teleport to Timber Wharf label [-17, -30] for dev scene
            const startX = -17 * GRID_CELL_SIZE;
            const startZ = 30 * GRID_CELL_SIZE;
            
            this.player.mesh.position.set(startX, 0, startZ);
            this.renderManager.controls.target.set(startX, 1.7, startZ);
            this.renderManager.camera.position.set(startX, 3.2, startZ + 5.0);
        } else {
            this.environment?.setVisible(false);
            this.worldEnvironment?.setVisible(true);

            // Teleport to the World Scene (spawn at 0, 5, 0 relative to world center)
            this.player.mesh.position.set(0, 5, 0);
            this.renderManager.controls.target.set(0, 6.7, 0);
            this.renderManager.camera.position.set(0, 8.2, 5.0);
        }
        this.prevTargetPos.copy(this.renderManager.controls.target);

        // Hide entities in world scene
        this.entityManager.setVisibility(sceneName === 'dev');
    }

    private buildInitialStructure() {
        if (!this.environment) return;

        const GRID_SIZE = 1.3333;
        const startX = -27;
        const startZ = 36;
        const size = 5;

        // Foundation is 0.4m tall, centered at 0.2m
        const foundationTop = 0.4;

        // 1. Build 5x5 Foundation
        for (let x = 0; x < size; x++) {
            for (let z = 0; z < size; z++) {
                this.placeStructure('foundation', (startX + x) * GRID_SIZE + GRID_SIZE/2, 0.2, (startZ + z) * GRID_SIZE + GRID_SIZE/2, 0);
            }
        }

        // 2. Build Walls and Doorways around the perimeter
        // Wall/Doorway is 2.75m tall, center is 1.375m. 
        // If placed on foundation, base is at 0.4m, center is at 0.4 + 1.375 = 1.775m
        const wallY = foundationTop + 1.375;

        // North (z=0) and South (z=size)
        for (let x = 0; x < size; x++) {
            // North wall
            if (x === 1) {
                // Doorway at (startX + 1, startZ) - Doorway is 2 grids wide, centers on line
                this.placeStructure('doorway', (startX + x + 1.0) * GRID_SIZE, wallY, (startZ) * GRID_SIZE, 0);
                x++; // Skip next cell since doorway is 2 grids wide
            } else {
                this.placeStructure('wall', (startX + x) * GRID_SIZE + GRID_SIZE/2, wallY, (startZ) * GRID_SIZE, 0);
            }
        }

        for (let x = 0; x < size; x++) {
            // South wall
            if (x === 3) {
                // Doorway at (startX + 3, startZ + size)
                this.placeStructure('doorway', (startX + x + 1.0) * GRID_SIZE, wallY, (startZ + size) * GRID_SIZE, 0);
                x++; // Skip next cell
            } else {
                 this.placeStructure('wall', (startX + x) * GRID_SIZE + GRID_SIZE/2, wallY, (startZ + size) * GRID_SIZE, 0);
            }
        }

        // West (x=0) and East (x=size)
        for (let z = 0; z < size; z++) {
            // West wall
            this.placeStructure('wall', (startX) * GRID_SIZE, wallY, (startZ + z) * GRID_SIZE + GRID_SIZE/2, Math.PI / 2);
            // East wall
            this.placeStructure('wall', (startX + size) * GRID_SIZE, wallY, (startZ + z) * GRID_SIZE + GRID_SIZE/2, Math.PI / 2);
        }
    }

    private placeStructure(type: any, x: number, y: number, z: number, rotation: number) {
        const mesh = BuildingParts.createStructureMesh(type, false);
        mesh.position.set(x, y, z);
        mesh.rotation.y = rotation;

        const applyUserData = (obj: THREE.Object3D) => {
            obj.userData = { 
                ...obj.userData,
                type: 'hard', 
                material: 'wood',
                structureType: type 
            };
        };

        if (mesh instanceof THREE.Group) {
            mesh.traverse(applyUserData);
            mesh.children.forEach(child => this.environment?.obstacles.push(child));
        } else {
            applyUserData(mesh);
            this.environment?.obstacles.push(mesh);
        }
        
        this.renderManager.scene.add(mesh);
    }

    private toggleBuilder() {
        this.isBuilding = !this.isBuilding;
        this.builderManager.setActive(this.isBuilding);
        this.onBuilderToggle?.(this.isBuilding);
        if (this.isBuilding && this.isFirstPerson) this.toggleFirstPerson(false);
    }

    setBuildingType(type: any) { this.builderManager.setType(type); }

    private onPointerLockChange() { if (document.pointerLockElement !== this.renderManager.renderer.domElement && this.isFirstPerson) this.toggleFirstPerson(false); }

    private onMouseMove(e: MouseEvent) {
        if (this.isFirstPerson && document.pointerLockElement === this.renderManager.renderer.domElement) {
            const sensitivity = 0.002;
            this.fpvYaw -= e.movementX * sensitivity;
            this.fpvPitch += e.movementY * sensitivity;
            const limit = Math.PI / 2 - 0.1;
            this.fpvPitch = Math.max(-limit, Math.min(limit, this.fpvPitch));
        }
    }

    setManualInput(input: Partial<PlayerInput>) { this.inputManager.setManualInput(input); }

    setConfig(config: PlayerConfig) {
        this.config = config;
        Object.assign(this.player.config, config);
        this.soundManager.setVolume(config.globalVolume);
    }

    setInventory(items: string[]) { this.player.inventory.setItems(items); }
    setSlotSelectCallback(cb: (index: number) => void) { this.inputManager.onSlotSelect = cb; }
    setControlsActive(active: boolean) { 
        this.renderManager.controls.enabled = active; 
        this.inputManager.setBlocked(!active); 
    }

    private toggleCameraFocus() { if (this.isFirstPerson) this.toggleFirstPerson(false); this.cameraFocusMode = (this.cameraFocusMode + 1) % 3; }

    private toggleFirstPerson(forceState?: boolean) {
        const nextState = forceState !== undefined ? forceState : !this.isFirstPerson;
        if (nextState === this.isFirstPerson) return;
        this.isFirstPerson = nextState;
        if (this.isFirstPerson) {
            this.renderManager.controls.minDistance = 0.01; 
            this.renderManager.controls.maxDistance = 0.1; 
            this.renderManager.controls.enabled = false;
            this.fpvYaw = this.player.mesh.rotation.y + Math.PI; 
            this.fpvPitch = 0;
            this.renderManager.renderer.domElement.requestPointerLock();
        } else {
            this.renderManager.controls.minDistance = 0.1; 
            this.renderManager.controls.maxDistance = 100; 
            this.renderManager.controls.enabled = true;
            if (document.pointerLockElement === this.renderManager.renderer.domElement) document.exitPointerLock();
            if (this.player.model.parts.head) this.player.model.parts.head.visible = true;
            
            const dir = new THREE.Vector3().subVectors(this.renderManager.camera.position, this.renderManager.controls.target).normalize();
            this.renderManager.camera.position.copy(this.renderManager.controls.target).addScaledVector(dir, 4.0);
        }
    }

    resize() {
        this.renderManager.resize();
    }

    private animate() {
        this.animationId = requestAnimationFrame(this.animate);
        const delta = Math.min(this.clock.getDelta(), 0.1);
        const input = this.inputManager.getInput();

        const joyLook = this.inputManager.getJoystickLook();
        if (joyLook.x !== 0 || joyLook.y !== 0) {
            const joySensitivity = 2.5 * delta;
            if (this.isFirstPerson) {
                this.fpvYaw -= joyLook.x * joySensitivity; this.fpvPitch -= joyLook.y * joySensitivity;
                const limit = Math.PI / 2 - 0.1; this.fpvPitch = Math.max(-limit, Math.min(limit, this.fpvPitch));
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
            const currentEnv = this.activeScene === 'dev' ? this.environment : this.worldEnvironment;
            if (currentEnv) {
                this.builderManager.build(currentEnv);
                if (this.showObstacleHitboxes) PlayerDebug.updateObstacleHitboxVisuals(currentEnv.obstacles, true);
            }
        }
        this.wasAttack1Pressed = !!input.attack1;

        let cameraRotation = this.isFirstPerson ? (this.fpvYaw + Math.PI) : Math.atan2(this.renderManager.camera.position.x - this.renderManager.controls.target.x, this.renderManager.camera.position.z - this.renderManager.controls.target.z);

        // Update correct environment
        let currentEnv: any = null;
        let currentEntities: any[] = [];

        if (this.activeScene === 'dev' && this.environment) {
            this.environment.update(delta, this.config, this.player.mesh.position);
            
            // Entities only in dev scene for now
            this.entityManager.update(delta, this.config, this.player.mesh.position, this.environment);
            currentEntities = this.entityManager.getAllEntities();
            currentEnv = this.environment;
        } else if (this.activeScene === 'world' && this.worldEnvironment) {
            currentEnv = this.worldEnvironment;
            this.worldEnvironment.update(delta, this.config, this.player.mesh.position);
            // No entities in World Scene yet
        }

        this.particleManager.update(delta);
        
        if (currentEnv) {
            const biome = currentEnv.getBiomeAt(this.player.mesh.position);
            if (biome.name !== this.currentBiomeName) { this.currentBiomeName = biome.name; this.onBiomeUpdate?.(biome); }
            
            const playerInput = { ...input };
            if (this.isBuilding) { playerInput.attack1 = false; playerInput.attack2 = false; }
            
            this.player.update(delta, playerInput, this.renderManager.camera.position, cameraRotation, currentEnv, this.particleManager, currentEntities);
            
            if (this.isBuilding) this.builderManager.update(this.player.mesh.position, this.player.mesh.rotation.y, currentEnv, this.renderManager.camera, this.inputManager.mousePosition);
        }
        this.soundManager.update(this.player, delta);
        
        // Push Camera Rotation to UI (Compass now reflects looking direction)
        this.onRotationUpdate?.(cameraRotation);

        const targetPos = this.player.mesh.position.clone();
        let heightOffset = this.cameraFocusMode === 1 ? 1.0 : (this.cameraFocusMode === 2 ? 0.4 : 1.7);
        targetPos.y += heightOffset; 

        if (this.isFirstPerson) {
            const head = this.player.model.parts.head;
            if (head) {
                const headPos = new THREE.Vector3(); head.getWorldPosition(headPos);
                const forward = new THREE.Vector3(); this.player.mesh.getWorldDirection(forward);
                headPos.addScaledVector(forward, 0.14); head.visible = false; this.renderManager.controls.target.copy(headPos);
                const camDir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(1, 0, 0), this.fpvPitch).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.fpvYaw);
                this.renderManager.camera.position.copy(headPos); this.renderManager.camera.lookAt(headPos.clone().add(camDir));
            }
        } else {
            this.renderManager.controls.target.lerp(targetPos, 0.1);
            const deltaPos = new THREE.Vector3().subVectors(this.renderManager.controls.target, this.prevTargetPos);
            this.renderManager.camera.position.add(deltaPos); 
            this.prevTargetPos.copy(this.renderManager.controls.target); 
        }
  
        if (this.player.isTalking) this.onInteractionUpdate?.(null, null);
        else if (this.player.isSkinning) this.onInteractionUpdate?.(null, this.player.skinningProgress);
        else if (this.player.isChargingFishing) this.onInteractionUpdate?.('Power', this.player.fishingCharge);
        else if (this.player.canTalk) {
            this.onInteractionUpdate?.('Press E to Talk', null);
            if (input.interact) { this.player.isTalking = true; this.onDialogueTrigger?.("Greetings, traveler. Keep your weapons sheathed within city limits and we'll have no trouble. The roads are dangerous these days, stay vigilant."); }
        } else if (this.player.canSkin) this.onInteractionUpdate?.('Press F to Skin', null);
        else this.onInteractionUpdate?.(null, null);
  
        if (this.player.inventory.isDirty) { this.onInventoryUpdate?.([...this.player.inventory.items]); this.player.inventory.isDirty = false; }
        
        this.renderManager.render();
    }
}
