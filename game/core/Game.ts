
import * as THREE from 'three';
import { Player } from '../player/Player';
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
import { SceneManager, SceneType } from '../managers/SceneManager';
import { CombatInteractionManager } from '../managers/CombatInteractionManager';
import { LevelGenerator } from '../builder/LevelGenerator';

export class Game {
    private renderManager: RenderManager;
    private clock: THREE.Clock;
    
    public player: Player;
    public entityManager: EntityManager;
    public sceneManager: SceneManager;
    public combatManager: CombatInteractionManager;

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

    // First Person / Camera State
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
    public onUnitSelect?: (stats?: EntityStats, unit?: any) => void;
    public onAttackHit?: (type: string, count: number) => void;
    public onInventoryUpdate?: (items: (InventoryItem | null)[]) => void;
    public onEnvironmentReady?: () => void;

    private currentBiomeName: string = '';
    private lastRotationUpdate = 0;
    private lastRotationValue = 0;
    private lastBiomeCheck = 0;
    private readonly rotationUpdateIntervalMs = 100;
    private readonly rotationUpdateEpsilon = 0.01;

    constructor(container: HTMLElement, initialConfig: PlayerConfig, initialManualInput: Partial<PlayerInput>, initialInventory: (InventoryItem | null)[], activeScene: SceneType) {
        this.config = initialConfig;
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
        
        // Initialize Managers
        // EntityManager needs references to environments, but SceneManager creates them.
        // We'll initialize EntityManager with dev environment for now, or just pass the scene and let it handle updates.
        // SceneManager creates environments.
        this.sceneManager = new SceneManager(
            this.renderManager.scene,
            this.renderManager,
            null as any, // EntityManager injected later
            this.player,
            activeScene
        );

        this.entityManager = new EntityManager(this.renderManager.scene, this.sceneManager.environment, initialConfig);
        // Inject entityManager back into sceneManager (circular dependency resolution)
        this.sceneManager.setEntityManager(this.entityManager);

        this.combatManager = new CombatInteractionManager(this.entityManager, this.renderManager, this.player);
        this.combatManager.onUnitSelect = (stats, unit) => this.onUnitSelect?.(stats, unit);
        this.combatManager.onShowCharacterStats = (stats, name) => this.onShowCharacterStats?.(stats, name);

        // Initialize Scene
        this.sceneManager.switchScene(activeScene, true);
        this.sceneManager.onEnvironmentReady = () => this.onEnvironmentReady?.();

        // Build Level
        LevelGenerator.buildDevLevel(this.sceneManager.environment);
        this.sceneManager.environment.obstacleManager.onLogPickedUp = () => {
            this.player.addItem('Wood', 8, true);
        };
        
        requestAnimationFrame(() => {
            this.sceneManager.environment.buildAsync().then(() => {
                if (this.sceneManager.activeScene === 'dev') this.onEnvironmentReady?.();
            });
            if (this.sceneManager.activeScene !== 'dev') this.onEnvironmentReady?.();
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
            const currentEnv = this.sceneManager.currentEnvironment;
            if (currentEnv) obstacles = currentEnv.obstacles;
            
            if (obstacles) PlayerDebug.updateObstacleHitboxVisuals(obstacles, this.showObstacleHitboxes);
        };
        this.inputManager.onToggleCamera = () => this.toggleCameraFocus();
        this.inputManager.onToggleHands = () => this.player.toggleHandsDebug();
        this.inputManager.onToggleSkeletonMode = () => this.player.toggleSkeletonMode();
        this.inputManager.onToggleFirstPerson = () => this.toggleFirstPerson();
        this.inputManager.onToggleGrid = () => this.sceneManager.environment.toggleWorldGrid();
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
        if (this.sceneManager.activeScene === 'combat') {
            this.combatManager.handleMouseDown(e, this.sceneManager.combatEnvironment);
        }
    }

    private onMouseMove(e: MouseEvent) {
        if (this.sceneManager.activeScene === 'combat') {
            this.combatManager.handleMouseMove(e);
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
        if (this.sceneManager.activeScene === 'combat') {
            this.combatManager.handleMouseUp(e, this.sceneManager.combatEnvironment);
        }
    }
    
    private onContextMenu(e: MouseEvent) {
        if (this.sceneManager.activeScene === 'combat') {
            this.combatManager.handleContextMenu(e);
        }
    }

    public toggleGrid(visible: boolean) {
        if (this.sceneManager.combatEnvironment) {
            this.sceneManager.combatEnvironment.toggleGridLabels(visible);
        }
    }

    public setCombatActive(active: boolean) {
        this.combatManager.setCombatActive(active);
        if (active && this.sceneManager.activeScene === 'combat') {
            this.config.isAssassinHostile = true;
            // Turn off red/green grid coloration when combat starts
            this.sceneManager.combatEnvironment.setCombatStarted(true);
        }
    }

    public switchScene(sceneName: SceneType, isInit: boolean = false) {
        this.sceneManager.switchScene(sceneName, isInit);
        // Clear combat selection when switching scenes
        this.combatManager.clearSelection();
        this.combatManager.setCombatActive(false);
    }

    spawnAnimal(type: string, count: number) {
        if (this.sceneManager.activeScene === 'dev') {
            this.entityManager.spawnAnimalGroup(type, count, this.sceneManager.environment, this.player.mesh.position);
        }
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
    getActiveScene() { return this.sceneManager.activeScene; }
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
        if (this.sceneManager.activeScene === 'combat') {
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
            const currentEnv = this.sceneManager.currentEnvironment;
            if (currentEnv) {
                this.builderManager.build(currentEnv);
                if (this.showObstacleHitboxes) PlayerDebug.updateObstacleHitboxVisuals(currentEnv.obstacles, true);
            }
        }
        this.wasAttack1Pressed = !!input.attack1;

        let cameraRotation = this.isFirstPerson ? (this.fpvYaw - Math.PI) : Math.atan2(this.renderManager.camera.position.x - this.renderManager.controls.target.x, this.renderManager.camera.position.z - this.renderManager.controls.target.z);

        // Update Scene Manager
        this.sceneManager.update(delta, this.config);
        
        // Update EntityManager
        // We need to pass the current environment to update
        const currentEnv = this.sceneManager.currentEnvironment;
        this.entityManager.update(
            delta, 
            this.config, 
            this.player.mesh.position, 
            currentEnv, 
            this.sceneManager.activeScene, 
            this.combatManager.isActive,
            this.onAttackHit
        );
        const currentEntities = this.entityManager.getEntitiesForScene(this.sceneManager.activeScene);

        this.particleManager.update(delta);
        
        if (currentEnv) {
            if (time - this.lastBiomeCheck > 500) {
                this.lastBiomeCheck = time;
                // Only Environment and WorldEnvironment have getBiomeAt. CombatEnvironment might not?
                // Actually CombatEnvironment extends Environment, so it should have it, or we should check type.
                // Assuming all environments support getBiomeAt or we check safely.
                if ((currentEnv as any).getBiomeAt) {
                    const biome = (currentEnv as any).getBiomeAt(this.player.mesh.position);
                    if (biome.name !== this.currentBiomeName) { this.currentBiomeName = biome.name; this.onBiomeUpdate?.(biome); }
                }
            }
            
            const playerInput = { ...input };
            if (this.isBuilding) { playerInput.attack1 = false; playerInput.attack2 = false; }
            this.player.update(delta, playerInput, this.renderManager.camera.position, cameraRotation, currentEnv, this.particleManager, currentEntities);
            // Ensure player mesh and model group are in sync for target detection
            if (this.player.mesh && this.player.model?.group) {
                this.player.model.group.position.copy(this.player.mesh.position);
                this.player.model.group.rotation.copy(this.player.mesh.rotation);
            }
            if (this.isBuilding && this.inputManager.mousePosition) {
                this.builderManager.update(this.player.mesh.position, this.player.mesh.rotation.y, currentEnv, this.renderManager.camera, this.inputManager.mousePosition);
            }
        }
        this.soundManager.update(this.player, delta);
        
        if (time - this.lastRotationUpdate >= this.rotationUpdateIntervalMs || Math.abs(cameraRotation - this.lastRotationValue) >= this.rotationUpdateEpsilon) {
            this.lastRotationUpdate = time; this.lastRotationValue = cameraRotation;
            this.onRotationUpdate?.(cameraRotation);
        }

        if (this.sceneManager.activeScene !== 'combat') {
            this.tempTargetPos.copy(this.player.mesh.position);
            let heightOffset = this.cameraFocusMode === 1 ? 1.0 : (this.cameraFocusMode === 2 ? 0.4 : 1.7);
            this.tempTargetPos.y += heightOffset; 

            if (this.isFirstPerson) {
                // Use fixed eye height relative to player position to avoid animation bobbing
                this.tempHeadPos.copy(this.player.mesh.position);
                this.tempHeadPos.y += 1.6; // Approximate eye height

                this.player.mesh.rotation.y = this.fpvYaw;
                
                // Hide head to prevent seeing inside it
                const head = this.player.model.parts.head;
                if (head) head.visible = false;

                // Position camera
                this.player.mesh.getWorldDirection(this.tempForward);
                this.tempHeadPos.addScaledVector(this.tempForward, 0.2); // Slight forward offset
                
                this.renderManager.controls.target.copy(this.tempHeadPos);
                this.tempCamDir.copy(this.camDirBase).applyAxisAngle(this.axisX, this.fpvPitch).applyAxisAngle(this.axisY, this.fpvYaw);
                
                this.renderManager.camera.position.copy(this.tempHeadPos);
                this.tempLookAt.copy(this.tempHeadPos).add(this.tempCamDir);
                this.renderManager.camera.lookAt(this.tempLookAt);
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
            const targetName = target?.constructor.name;
            
            const label = (targetName === 'Shopkeeper' || target instanceof Shopkeeper)
                ? 'Press E to Chat'
                : (targetName === 'Blacksmith' || target instanceof Blacksmith)
                    ? 'Press E to Trade'
                    : 'Press E to Talk';
            
            this.onInteractionUpdate?.(label, null);
            if (input.interact) { 
                this.player.isTalking = true; 
                if (targetName === 'LowLevelCityGuard' || target instanceof LowLevelCityGuard) { 
                    target.isLeftHandWaving = true; 
                    target.leftHandWaveTimer = 0; 
                    this.onDialogueTrigger?.("Greetings, traveler. Keep your weapons sheathed within city limits and we'll have no trouble. The roads are dangerous these days, stay vigilant."); 
                } 
                else if (targetName === 'Blacksmith' || target instanceof Blacksmith) this.onTradeTrigger?.();
                else if (targetName === 'Shopkeeper' || target instanceof Shopkeeper) this.onShopkeeperTrigger?.();
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
