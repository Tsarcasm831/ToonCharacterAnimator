import * as THREE from 'three';

export interface DoorState {
    isOpen: boolean;
    isAnimating: boolean;
    openAngle: number;
    closedAngle: number;
    currentAngle: number;
    animationSpeed: number;
}

export class Door {
    public mesh: THREE.Group;
    public state: DoorState;
    private leftDoor: THREE.Group;
    private rightDoor: THREE.Group;
    private frame: THREE.Group;
    private lastCollisionOpenState: boolean | null = null;

    constructor(position: THREE.Vector3, rotation: number = 0) {
        this.state = {
            isOpen: false,
            isAnimating: false,
            openAngle: Math.PI / 2, // 90 degrees
            closedAngle: 0,
            currentAngle: 0,
            animationSpeed: 2.0 // radians per second
        };

        this.mesh = new THREE.Group();
        this.frame = new THREE.Group();
        
        this.createDoorGeometry();
        this.positionDoor(position, rotation);
        this.setupInteraction();
    }

    private createDoorGeometry(): void {
        const GRID_SIZE = 1.3333;
        const doorWidth = GRID_SIZE / 2 - 0.05; // Split doorway in half
        const doorHeight = 2.35;
        const doorDepth = 0.15;
        const frameDepth = 0.25;

        // Materials
        const doorMaterial = new THREE.MeshStandardMaterial({
            color: 0x7b5b3a,
            roughness: 0.8,
            metalness: 0.1
        });

        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x4b2f1e,
            roughness: 0.85,
            metalness: 0.05
        });

        const trimMaterial = new THREE.MeshStandardMaterial({
            color: 0x6b4a2f,
            roughness: 0.8,
            metalness: 0.1
        });

        const metalMaterial = new THREE.MeshStandardMaterial({
            color: 0x8f8f8f,
            roughness: 0.35,
            metalness: 0.7
        });

        // Create door frame (posts and lintel)
        const postWidth = 0.05;
        const totalHeight = 3.3;
        const lintelHeight = 0.95;

        // Left post
        const leftPostGeo = new THREE.BoxGeometry(postWidth, totalHeight, frameDepth);
        const leftPost = new THREE.Mesh(leftPostGeo, frameMaterial);
        leftPost.position.x = -(GRID_SIZE/2 - postWidth/2);
        leftPost.castShadow = true;
        leftPost.receiveShadow = true;
        this.frame.add(leftPost);

        // Right post
        const rightPostGeo = new THREE.BoxGeometry(postWidth, totalHeight, frameDepth);
        const rightPost = new THREE.Mesh(rightPostGeo, frameMaterial);
        rightPost.position.x = +(GRID_SIZE/2 - postWidth/2);
        rightPost.castShadow = true;
        rightPost.receiveShadow = true;
        this.frame.add(rightPost);

        // Lintel
        const lintelGeo = new THREE.BoxGeometry(GRID_SIZE - postWidth * 2, lintelHeight, frameDepth);
        const lintel = new THREE.Mesh(lintelGeo, frameMaterial);
        lintel.position.y = (totalHeight/2 - lintelHeight/2);
        lintel.castShadow = true;
        lintel.receiveShadow = true;
        this.frame.add(lintel);

        // Create left door (hinged group)
        this.leftDoor = this.createDoorLeaf(true, doorWidth, doorHeight, doorDepth, doorMaterial, trimMaterial, metalMaterial);
        this.leftDoor.position.x = -(GRID_SIZE / 2 - postWidth / 2);
        this.leftDoor.position.y = -0.475; // Center the door in the opening
        this.leftDoor.userData.isLeftDoor = true;

        // Create right door (hinged group)
        this.rightDoor = this.createDoorLeaf(false, doorWidth, doorHeight, doorDepth, doorMaterial, trimMaterial, metalMaterial);
        this.rightDoor.position.x = +(GRID_SIZE / 2 - postWidth / 2);
        this.rightDoor.position.y = -0.475; // Center the door in the opening
        this.rightDoor.userData.isRightDoor = true;

        this.setDoorPartCollision(this.frame, 'hard');
        this.setDoorPartCollision(this.leftDoor, 'hard');
        this.setDoorPartCollision(this.rightDoor, 'hard');

        // Add doors to mesh
        this.mesh.add(this.leftDoor);
        this.mesh.add(this.rightDoor);
        this.mesh.add(this.frame);
    }

    private createDoorLeaf(isLeft: boolean, doorWidth: number, doorHeight: number, doorDepth: number, doorMaterial: THREE.Material, trimMaterial: THREE.Material, metalMaterial: THREE.Material): THREE.Group {
        const leaf = new THREE.Group();

        const slabGeo = new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth);
        const slab = new THREE.Mesh(slabGeo, doorMaterial);
        slab.position.x = isLeft ? doorWidth / 2 : -doorWidth / 2;
        slab.castShadow = true;
        slab.receiveShadow = true;
        leaf.add(slab);

        const plankDepth = doorDepth * 0.25;
        const plankHeight = doorHeight * 0.92;
        const plankGap = doorWidth * 0.04;
        const plankWidth = (doorWidth - plankGap * 2) / 3;
        const plankGeo = new THREE.BoxGeometry(plankWidth, plankHeight, plankDepth);

        for (let i = 0; i < 3; i++) {
            const plank = new THREE.Mesh(plankGeo, trimMaterial);
            plank.position.x = (-doorWidth / 2) + plankWidth / 2 + i * (plankWidth + plankGap);
            plank.position.z = doorDepth / 2 + plankDepth / 2 + 0.01;
            plank.castShadow = true;
            plank.receiveShadow = true;
            slab.add(plank);
        }

        const braceGeo = new THREE.BoxGeometry(doorWidth * 0.9, doorHeight * 0.12, plankDepth);
        const brace = new THREE.Mesh(braceGeo, trimMaterial);
        brace.position.y = -doorHeight * 0.1;
        brace.position.z = doorDepth / 2 + plankDepth / 2 + 0.01;
        brace.castShadow = true;
        brace.receiveShadow = true;
        slab.add(brace);

        const handleGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.22, 12);
        const handle = new THREE.Mesh(handleGeo, metalMaterial);
        handle.rotation.z = Math.PI / 2;
        handle.position.x = isLeft ? doorWidth / 2 - 0.08 : -doorWidth / 2 + 0.08;
        handle.position.y = 0;
        handle.position.z = doorDepth / 2 + 0.06;
        handle.castShadow = true;
        handle.receiveShadow = true;
        slab.add(handle);

        const plateGeo = new THREE.BoxGeometry(0.08, 0.12, 0.02);
        const plate = new THREE.Mesh(plateGeo, metalMaterial);
        plate.position.set(handle.position.x, handle.position.y, doorDepth / 2 + 0.02);
        plate.castShadow = true;
        plate.receiveShadow = true;
        slab.add(plate);

        const hingeGeo = new THREE.BoxGeometry(0.05, 0.1, 0.02);
        const hingeOffsetX = isLeft ? -doorWidth / 2 + 0.01 : doorWidth / 2 - 0.01;
        const hingeY = doorHeight * 0.25;
        const hingeY2 = -doorHeight * 0.25;
        const hingeZ = doorDepth / 2 + 0.01;

        const hinge1 = new THREE.Mesh(hingeGeo, metalMaterial);
        hinge1.position.set(hingeOffsetX, hingeY, hingeZ);
        slab.add(hinge1);

        const hinge2 = new THREE.Mesh(hingeGeo, metalMaterial);
        hinge2.position.set(hingeOffsetX, hingeY2, hingeZ);
        slab.add(hinge2);

        return leaf;
    }

    private positionDoor(position: THREE.Vector3, rotation: number): void {
        this.mesh.position.copy(position);
        this.mesh.position.y += 1.65; // Align with doorway height
        this.mesh.rotation.y = rotation;
    }

    private setupInteraction(): void {
        // Mark this as an interactable object
        this.markDoorObject(this.mesh, true);
        this.markDoorObject(this.leftDoor, true);
        this.markDoorObject(this.rightDoor, true);
        this.markDoorObject(this.frame, true);
        this.mesh.userData.type = 'soft';
    }

    public update(dt: number): void {
        if (this.state.isAnimating) {
            const targetAngle = this.state.isOpen ? this.state.openAngle : this.state.closedAngle;
            const angleDiff = targetAngle - this.state.currentAngle;
            
            if (Math.abs(angleDiff) < 0.01) {
                // Animation complete
                this.state.currentAngle = targetAngle;
                this.state.isAnimating = false;
            } else {
                // Continue animation
                const direction = angleDiff > 0 ? 1 : -1;
                this.state.currentAngle += direction * this.state.animationSpeed * dt;
                
                // Clamp to target
                if (direction > 0) {
                    this.state.currentAngle = Math.min(this.state.currentAngle, targetAngle);
                } else {
                    this.state.currentAngle = Math.max(this.state.currentAngle, targetAngle);
                }
            }

            // Apply rotation to doors
            this.leftDoor.rotation.y = this.state.currentAngle;
            this.rightDoor.rotation.y = -this.state.currentAngle;
        }

        this.updateCollisionState();
    }

    public interact(): void {
        if (!this.state.isAnimating) {
            this.state.isOpen = !this.state.isOpen;
            this.state.isAnimating = true;
        }
    }

    public getInteractionPrompt(): string {
        if (this.state.isOpen) {
            return "Close Door [E]";
        } else {
            return "Open Door [E]";
        }
    }

    public isPlayerInRange(playerPosition: THREE.Vector3, range: number = 2.0): boolean {
        const distance = this.mesh.position.distanceTo(playerPosition);
        return distance <= range;
    }

    public getObstacleObjects(): THREE.Object3D[] {
        return [this.mesh, this.frame, this.leftDoor, this.rightDoor];
    }

    private updateCollisionState(): void {
        const shouldBeOpen = this.state.isOpen;
        if (this.lastCollisionOpenState === shouldBeOpen) return;
        this.lastCollisionOpenState = shouldBeOpen;

        this.mesh.userData.type = 'soft';
        const leafType = shouldBeOpen ? 'soft' : 'hard';
        this.setDoorPartCollision(this.leftDoor, leafType);
        this.setDoorPartCollision(this.rightDoor, leafType);
    }

    private setDoorPartCollision(obj: THREE.Object3D, type: string): void {
        obj.userData.type = type;
        obj.traverse(child => {
            child.userData.type = type;
        });
    }

    private markDoorObject(obj: THREE.Object3D, markInteractable: boolean): void {
        if (markInteractable) {
            obj.userData.interactType = 'door';
        }
        obj.userData.door = this;
        obj.traverse(child => {
            if (markInteractable) {
                child.userData.interactType = 'door';
            }
            child.userData.door = this;
        });
    }
}
