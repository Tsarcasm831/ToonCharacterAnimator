import * as THREE from 'three';
import { RenderManager } from '../core/RenderManager';
import { Player } from '../player/Player';

export class CameraManager {
    private renderManager: RenderManager;
    private player: Player;

    // Camera State
    public cameraFocusMode: number = 0; 
    public isFirstPerson: boolean = false;
    
    // First Person State
    public fpvYaw: number = 0;
    public fpvPitch: number = 0;

    // Temp Vectors for Calculation
    private readonly tempTargetPos = new THREE.Vector3();
    private readonly tempDeltaPos = new THREE.Vector3();
    private readonly tempHeadPos = new THREE.Vector3();
    private readonly tempForward = new THREE.Vector3();
    private readonly tempCamDir = new THREE.Vector3();
    private readonly tempLookAt = new THREE.Vector3();
    private readonly axisX = new THREE.Vector3(1, 0, 0);
    private readonly axisY = new THREE.Vector3(0, 1, 0);
    private readonly camDirBase = new THREE.Vector3(0, 0, 1);
    
    // Previous State for TPV smoothing
    private prevTargetPos = new THREE.Vector3();

    constructor(renderManager: RenderManager, player: Player) {
        this.renderManager = renderManager;
        this.player = player;
        this.prevTargetPos.copy(this.renderManager.controls.target);
    }

    public toggleCameraFocus() { 
        if (this.isFirstPerson) this.toggleFirstPerson(false); 
        this.cameraFocusMode = (this.cameraFocusMode + 1) % 3; 
    }

    public toggleFirstPerson(forceState?: boolean) {
        const nextState = forceState !== undefined ? forceState : !this.isFirstPerson;
        if (nextState === this.isFirstPerson) return;
        this.isFirstPerson = nextState;
        
        if (this.isFirstPerson) {
            this.renderManager.controls.minDistance = 0.01; 
            this.renderManager.controls.maxDistance = 0.1; 
            this.renderManager.controls.enabled = false;
            
            // Initialize Yaw/Pitch from current player rotation
            this.fpvYaw = this.player.mesh.rotation.y; 
            this.fpvPitch = 0;
            
            this.renderManager.renderer.domElement.requestPointerLock();
        } else {
            this.renderManager.controls.minDistance = 0.1; 
            this.renderManager.controls.maxDistance = 100; 
            this.renderManager.controls.enabled = true;
            
            if (document.pointerLockElement === this.renderManager.renderer.domElement) {
                document.exitPointerLock();
            }
            
            // Show head again
            if (this.player.model.parts.head) this.player.model.parts.head.visible = true;
            
            // Reset camera position behind player
            const dir = new THREE.Vector3().subVectors(this.renderManager.camera.position, this.renderManager.controls.target).normalize();
            this.renderManager.camera.position.copy(this.renderManager.controls.target).addScaledVector(dir, 4.0);
        }
    }

    public handleMouseMove(e: MouseEvent) {
        if (this.isFirstPerson && document.pointerLockElement === this.renderManager.renderer.domElement) {
            const sensitivity = 0.002;
            this.fpvYaw -= e.movementX * sensitivity;
            this.fpvPitch -= e.movementY * sensitivity;
            const limit = Math.PI / 2 - 0.1;
            this.fpvPitch = Math.max(-limit, Math.min(limit, this.fpvPitch));
        }
    }

    public handleJoystickLook(joyLook: {x: number, y: number}, delta: number) {
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
                spherical.theta -= joyLook.x * joySensitivity; 
                spherical.phi -= joyLook.y * joySensitivity;
                spherical.makeSafe(); 
                offset.setFromSpherical(spherical);
                this.renderManager.camera.position.copy(this.renderManager.controls.target).add(offset);
            }
        }
    }

    public handleCombatCamera(input: any, delta: number) {
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

        // Consume input for movement so it doesn't affect other things if shared
        // NOTE: Do not mutate the shared input object. Downstream systems (player
        // locomotion, animations) rely on these values to move and to trigger
        // walk cycles. If we need to “consume” input for camera-only behavior,
        // operate on a copy at the call site instead of zeroing here.
    }

    public getCameraRotation(): number {
        return this.isFirstPerson 
            ? (this.fpvYaw - Math.PI) 
            : Math.atan2(
                this.renderManager.camera.position.x - this.renderManager.controls.target.x, 
                this.renderManager.camera.position.z - this.renderManager.controls.target.z
              );
    }

    public updatePosition(activeScene: string) {
        if (activeScene !== 'combat') {
            this.tempTargetPos.copy(this.player.mesh.position);
            const playerScale = this.player.mesh.scale.y;
            let heightOffset = this.cameraFocusMode === 1 ? 1.0 : (this.cameraFocusMode === 2 ? 0.4 : 1.7);
            heightOffset *= playerScale;
            this.tempTargetPos.y += heightOffset; 

            if (this.isFirstPerson) {
                // FPV Logic
                this.tempHeadPos.copy(this.player.mesh.position);
                this.tempHeadPos.y += 1.6 * playerScale; // Eye height

                this.player.mesh.rotation.y = this.fpvYaw;
                
                // Hide head
                const head = this.player.model.parts.head;
                if (head) head.visible = false;

                // Position camera
                this.player.mesh.getWorldDirection(this.tempForward);
                this.tempHeadPos.addScaledVector(this.tempForward, 0.2); 
                
                this.renderManager.controls.target.copy(this.tempHeadPos);
                this.tempCamDir.copy(this.camDirBase).applyAxisAngle(this.axisX, this.fpvPitch).applyAxisAngle(this.axisY, this.fpvYaw);
                
                this.renderManager.camera.position.copy(this.tempHeadPos);
                this.tempLookAt.copy(this.tempHeadPos).add(this.tempCamDir);
                this.renderManager.camera.lookAt(this.tempLookAt);
            } else {
                // TPV Logic
                this.prevTargetPos.copy(this.renderManager.controls.target);
                this.renderManager.controls.target.copy(this.tempTargetPos);
                this.tempDeltaPos.subVectors(this.renderManager.controls.target, this.prevTargetPos);
                this.renderManager.camera.position.add(this.tempDeltaPos);
                this.renderManager.controls.update();
            }
        } else {
             this.renderManager.controls.update();
        }
    }
}
