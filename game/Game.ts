import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Player } from './Player';
import { NPC } from './NPC';
import { Assassin } from './Assassin';
import { Archer } from './Archer';
import { Wolf } from './Wolf';
import { Bear } from './Bear';
import { Owl } from './Owl';
import { Yeti } from './Yeti';
import { Deer } from './Deer';
import { Chicken } from './Chicken';
import { Pig } from './Pig';
import { Sheep } from './Sheep';
import { Spider } from './Spider';
import { Lizard } from './Lizard';
import { Horse } from './Horse';
import { LowLevelCityGuard } from './LowLevelCityGuard';
import { Environment } from './Environment';
import { InputManager } from './InputManager';
import { SoundManager } from './SoundManager';
import { ParticleManager } from './ParticleManager';
import { BuilderManager } from './builder/BuilderManager';
import { PlayerConfig, PlayerInput } from '../types';
import { PlayerDebug } from './player/PlayerDebug';

export class Game {
    private container: HTMLElement;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private controls: OrbitControls;
    private clock: THREE.Clock;
    
    private player: Player;
    private npc: NPC;
    private assassin: Assassin;
    private archer: Archer;
    private wolf: Wolf;
    private bear: Bear;
    private owl: Owl;
    private guard: LowLevelCityGuard;

    // New Animals
    private yeti: Yeti;
    private deers: Deer[] = [];
    private chickens: Chicken[] = [];
    private pigs: Pig[] = [];
    private sheeps: Sheep[] = [];
    private spiders: Spider[] = [];
    private lizards: Lizard[] = [];
    private horses: Horse[] = [];

    private foundryGuard: LowLevelCityGuard;
    private foundryAssassin: Assassin;

    private environment: Environment;
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
    onDialogueTrigger?: (content: string) => void;

    private currentBiomeName: string = '';

    constructor(container: HTMLElement, initialConfig: PlayerConfig, initialManualInput: Partial<PlayerInput>, initialInventory: string[]) {
        this.container = container;
        this.config = initialConfig;

        this.inputManager = new InputManager();
        this.inputManager.setManualInput(initialManualInput);
        this.soundManager = new SoundManager();
        this.soundManager.setVolume(initialConfig.globalVolume);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f5ff);
        this.scene.fog = new THREE.Fog(0xf0f5ff, 10, 80);

        this.camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.01, 200);
        this.camera.position.set(-24, 3.2, 55.0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.target.set(-24, 1.7, 50);
        
        this.controls.mouseButtons = { LEFT: null as any, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
        this.prevTargetPos.copy(this.controls.target);

        this.scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.6));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 15, 5);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 4096;
        dirLight.shadow.mapSize.height = 4096;
        this.scene.add(dirLight);

        this.environment = new Environment(this.scene);
        this.particleManager = new ParticleManager(this.scene);
        this.builderManager = new BuilderManager(this.scene);

        this.player = new Player(this.scene);
        Object.assign(this.player.config, initialConfig);
        
        this.npc = new NPC(this.scene, { bodyType: 'female', outfit: 'peasant' }, new THREE.Vector3(-3, 0, 2));
        this.assassin = new Assassin(this.scene, new THREE.Vector3(30, 0, 0));
        this.assassin.config.isAssassinHostile = initialConfig.isAssassinHostile;
        this.archer = new Archer(this.scene, new THREE.Vector3(-5, 0, 4));
        this.archer.config.isAssassinHostile = initialConfig.isAssassinHostile;

        this.wolf = new Wolf(this.scene, new THREE.Vector3(10, 0, 10));
        this.environment.addObstacle(this.wolf.hitbox);

        this.bear = new Bear(this.scene, new THREE.Vector3(-15, 0, 15));
        this.environment.addObstacle(this.bear.hitbox);

        this.owl = new Owl(this.scene, new THREE.Vector3(5, 5, -5));
        this.environment.addObstacle(this.owl.hitbox);

        // --- SPAWN NEW ANIMALS ---
        this.yeti = new Yeti(this.scene, new THREE.Vector3(0, 0, -50));
        this.environment.addObstacle(this.yeti.hitbox);

        for(let i=0; i<3; i++) {
            const deer = new Deer(this.scene, new THREE.Vector3(35 + i*2, 0, -35));
            this.deers.push(deer);
            this.environment.addObstacle(deer.hitbox);
        }

        for(let i=0; i<4; i++) {
            const chicken = new Chicken(this.scene, new THREE.Vector3(-5 + i*2, 0, -5));
            this.chickens.push(chicken);
            this.environment.addObstacle(chicken.hitbox);
        }

        for(let i=0; i<2; i++) {
            const pig = new Pig(this.scene, new THREE.Vector3(5 + i*3, 0, 5));
            this.pigs.push(pig);
            this.environment.addObstacle(pig.hitbox);
        }

        for(let i=0; i<3; i++) {
            const sheep = new Sheep(this.scene, new THREE.Vector3(-15 + i*3, 0, -10));
            this.sheeps.push(sheep);
            this.environment.addObstacle(sheep.hitbox);
        }

        for(let i=0; i<2; i++) {
            const spider = new Spider(this.scene, new THREE.Vector3(-35, 0, -35 + i*5));
            this.spiders.push(spider);
            this.environment.addObstacle(spider.hitbox);
        }

        for(let i=0; i<3; i++) {
            const lizard = new Lizard(this.scene, new THREE.Vector3(35, 0, 35 + i*4));
            this.lizards.push(lizard);
            this.environment.addObstacle(lizard.hitbox);
        }

        for(let i=0; i<2; i++) {
            const horse = new Horse(this.scene, new THREE.Vector3(-30, 0, 30 + i*6));
            this.horses.push(horse);
            this.environment.addObstacle(horse.hitbox);
        }

        this.guard = new LowLevelCityGuard(this.scene, new THREE.Vector3(-8, 0, -2));
        this.foundryGuard = new LowLevelCityGuard(this.scene, new THREE.Vector3(-42, 0, -42), 0, '#4ade80');
        this.foundryAssassin = new Assassin(this.scene, new THREE.Vector3(-38, 0, -38), '#ef4444');
        this.foundryAssassin.config.isAssassinHostile = true;

        this.player.inventory.setItems(initialInventory);
        this.clock = new THREE.Clock();

        this.inputManager.onToggleHitbox = () => this.player.toggleHitbox();
        this.inputManager.onToggleObstacleHitboxes = () => {
            this.showObstacleHitboxes = !this.showObstacleHitboxes;
            PlayerDebug.updateObstacleHitboxVisuals(this.environment.obstacles, this.showObstacleHitboxes);
        };
        this.inputManager.onToggleCamera = () => this.toggleCameraFocus();
        this.inputManager.onToggleHands = () => this.player.toggleHandsDebug();
        this.inputManager.onToggleSkeletonMode = () => this.player.toggleSkeletonMode();
        this.inputManager.onToggleFirstPerson = () => this.toggleFirstPerson();
        this.inputManager.onToggleBuilder = () => this.toggleBuilder();
        this.inputManager.onToggleGrid = () => this.environment.toggleWorldGrid();
        
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
        this.controls.dispose(); this.renderer.dispose(); this.inputManager.dispose();
        if (this.container.contains(this.renderer.domElement)) this.container.removeChild(this.renderer.domElement);
    }

    private toggleBuilder() {
        this.isBuilding = !this.isBuilding;
        this.builderManager.setActive(this.isBuilding);
        this.onBuilderToggle?.(this.isBuilding);
        if (this.isBuilding && this.isFirstPerson) this.toggleFirstPerson(false);
    }

    setBuildingType(type: any) { this.builderManager.setType(type); }

    private onPointerLockChange() { if (document.pointerLockElement !== this.renderer.domElement && this.isFirstPerson) this.toggleFirstPerson(false); }

    private onMouseMove(e: MouseEvent) {
        if (this.isFirstPerson && document.pointerLockElement === this.renderer.domElement) {
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
        if (this.npc) this.npc.model.group.visible = config.showNPC;
        if (this.guard) this.guard.model.group.visible = config.showGuard;
        if (this.assassin) { this.assassin.model.group.visible = config.showAssassin; this.assassin.config.isAssassinHostile = config.isAssassinHostile; }
        if (this.archer) { this.archer.model.group.visible = config.showAssassin; this.archer.config.isAssassinHostile = config.isAssassinHostile; }
    }

    setInventory(items: string[]) { this.player.inventory.setItems(items); }
    setSlotSelectCallback(cb: (index: number) => void) { this.inputManager.onSlotSelect = cb; }
    setControlsActive(active: boolean) { this.controls.enabled = active; this.inputManager.setBlocked(!active); }

    private toggleCameraFocus() { if (this.isFirstPerson) this.toggleFirstPerson(false); this.cameraFocusMode = (this.cameraFocusMode + 1) % 3; }

    private toggleFirstPerson(forceState?: boolean) {
        const nextState = forceState !== undefined ? forceState : !this.isFirstPerson;
        if (nextState === this.isFirstPerson) return;
        this.isFirstPerson = nextState;
        if (this.isFirstPerson) {
            this.controls.minDistance = 0.01; this.controls.maxDistance = 0.1; this.controls.enabled = false;
            this.fpvYaw = this.player.mesh.rotation.y + Math.PI; this.fpvPitch = 0;
            this.renderer.domElement.requestPointerLock();
        } else {
            this.controls.minDistance = 0.1; this.controls.maxDistance = 100; this.controls.enabled = true;
            if (document.pointerLockElement === this.renderer.domElement) document.exitPointerLock();
            if (this.player.model.parts.head) this.player.model.parts.head.visible = true;
            const dir = new THREE.Vector3().subVectors(this.camera.position, this.controls.target).normalize();
            this.camera.position.copy(this.controls.target).addScaledVector(dir, 4.0);
        }
    }

    resize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
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
                const offset = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);
                const spherical = new THREE.Spherical().setFromVector3(offset);
                spherical.theta -= joyLook.x * joySensitivity; spherical.phi -= joyLook.y * joySensitivity;
                spherical.makeSafe(); offset.setFromSpherical(spherical);
                this.camera.position.copy(this.controls.target).add(offset);
            }
        }

        if (input.toggleFirstPerson && !this.wasFirstPersonKeyPressed) this.toggleFirstPerson();
        this.wasFirstPersonKeyPressed = !!input.toggleFirstPerson;
        if (input.rotateGhost && !this.wasRotateKeyPressed) this.builderManager.rotate();
        this.wasRotateKeyPressed = !!input.rotateGhost;
        if (this.isBuilding && input.attack1 && !this.wasAttack1Pressed) {
            this.builderManager.build(this.environment);
            if (this.showObstacleHitboxes) PlayerDebug.updateObstacleHitboxVisuals(this.environment.obstacles, true);
        }
        this.wasAttack1Pressed = !!input.attack1;

        let cameraRotation = this.isFirstPerson ? (this.fpvYaw + Math.PI) : Math.atan2(this.camera.position.x - this.controls.target.x, this.camera.position.z - this.controls.target.z);

        this.environment.update(delta, this.config, this.player.mesh.position);
        this.particleManager.update(delta);
        
        const biome = this.environment.getBiomeAt(this.player.mesh.position);
        if (biome.name !== this.currentBiomeName) { this.currentBiomeName = biome.name; this.onBiomeUpdate?.(biome); }

        const playerInput = { ...input };
        if (this.isBuilding) { playerInput.attack1 = false; playerInput.attack2 = false; }
        
        const entities = [
            this.npc, this.guard, this.assassin, this.archer, this.foundryGuard, this.foundryAssassin, 
            this.wolf, this.bear, this.owl, this.yeti, ...this.deers, ...this.chickens, ...this.pigs, 
            ...this.sheeps, ...this.spiders, ...this.lizards, ...this.horses
        ];
        this.player.update(delta, playerInput, this.camera.position, cameraRotation, this.environment, this.particleManager, entities);
        
        if (this.config.showNPC && this.npc) {
            const eyePos = new THREE.Vector3();
            if (this.player.model.parts.head) this.player.model.parts.head.getWorldPosition(eyePos);
            else eyePos.copy(this.player.mesh.position).y += 1.7;
            this.npc.update(delta, eyePos, this.environment);
        }
        if (this.config.showGuard && this.guard) this.guard.update(delta, this.player.mesh.position, this.environment);
        if (this.config.showAssassin && this.archer) {
            this.archer.update(delta, this.environment, [
                { position: this.player.mesh.position.clone() }, { position: this.npc.position.clone() },
                { position: this.wolf.position.clone(), isWolf: true, isDead: this.wolf.isDead },
                { position: this.bear.position.clone(), isWolf: true, isDead: this.bear.isDead }
            ]);
        }

        // Update Animals
        if (this.wolf) this.wolf.update(delta, this.environment, [{ position: this.player.mesh.position.clone() }, { position: this.archer.position.clone() }, { position: this.npc.position.clone() }]);
        if (this.bear) this.bear.update(delta, this.environment, [{ position: this.player.mesh.position.clone() }, { position: this.archer.position.clone() }, { position: this.npc.position.clone() }]);
        if (this.owl) this.owl.update(delta, this.environment, [{ position: this.player.mesh.position.clone() }, { position: this.archer.position.clone() }, { position: this.npc.position.clone() }]);
        if (this.yeti) this.yeti.update(delta, this.environment, [{ position: this.player.mesh.position.clone() }]);
        this.deers.forEach(d => d.update(delta, this.environment, [{ position: this.player.mesh.position.clone() }]));
        this.chickens.forEach(c => c.update(delta, this.environment, [{ position: this.player.mesh.position.clone() }]));
        this.pigs.forEach(p => p.update(delta, this.environment, [{ position: this.player.mesh.position.clone() }]));
        this.sheeps.forEach(s => s.update(delta, this.environment, [{ position: this.player.mesh.position.clone() }]));
        this.spiders.forEach(s => s.update(delta, this.environment, [{ position: this.player.mesh.position.clone() }]));
        this.lizards.forEach(l => l.update(delta, this.environment, [{ position: this.player.mesh.position.clone() }]));
        this.horses.forEach(h => h.update(delta, this.environment, [{ position: this.player.mesh.position.clone() }]));

        if (this.config.showAssassin && this.assassin) this.assassin.update(delta, this.environment, [{ position: this.player.mesh.position.clone() }, { position: this.npc.position.clone() }]);

        if (this.foundryGuard && this.foundryAssassin) {
            this.foundryGuard.update(delta, this.player.mesh.position, this.environment, [{ position: this.foundryAssassin.position.clone(), isDead: false }]);
            this.foundryAssassin.update(delta, this.environment, [{ position: this.foundryGuard.position.clone(), isDead: false }]);
        }
        
        if (this.isBuilding) this.builderManager.update(this.player.mesh.position, this.player.mesh.rotation.y, this.environment, this.camera, this.inputManager.mousePosition);
        this.soundManager.update(this.player, delta);

        const targetPos = this.player.mesh.position.clone();
        let heightOffset = this.cameraFocusMode === 1 ? 1.0 : (this.cameraFocusMode === 2 ? 0.4 : 1.7);
        targetPos.y += heightOffset; 

        if (this.isFirstPerson) {
            const head = this.player.model.parts.head;
            if (head) {
                const headPos = new THREE.Vector3(); head.getWorldPosition(headPos);
                const forward = new THREE.Vector3(); this.player.mesh.getWorldDirection(forward);
                headPos.addScaledVector(forward, 0.14); head.visible = false; this.controls.target.copy(headPos);
                const camDir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(1, 0, 0), this.fpvPitch).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.fpvYaw);
                this.camera.position.copy(headPos); this.camera.lookAt(headPos.clone().add(camDir));
            }
        } else {
            this.controls.target.lerp(targetPos, 0.1);
            const deltaPos = new THREE.Vector3().subVectors(this.controls.target, this.prevTargetPos);
            this.camera.position.add(deltaPos); this.prevTargetPos.copy(this.controls.target); this.controls.update();
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
        this.renderer.render(this.scene, this.camera);
    }
}