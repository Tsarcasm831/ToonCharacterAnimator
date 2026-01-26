import * as THREE from 'three';

export class BerryBush {
    public group: THREE.Group;
    private berries: THREE.Mesh[] = [];
    private hasBerries: boolean = true;
    private respawnTimer: number = 0;
    private readonly RESPAWN_TIME = 30; // seconds

    constructor(position: THREE.Vector3, scale: number = 1.0) {
        this.group = new THREE.Group();
        // Adjust position so bush base sits on ground
        const adjustedPosition = position.clone();
        adjustedPosition.y -= 0.3; // Lower the bush so its base touches ground
        this.group.position.copy(adjustedPosition);
        this.group.scale.setScalar(scale);
        
        this.createBush();
        this.createBerries();
        
        this.group.userData = { 
            type: 'berryBush',
            harvestable: true,
            hasBerries: this.hasBerries,
            berryBushInstance: this, // Store reference to this instance
            interact: () => this.harvest()
        };
    }

    private createBush() {
        // Create the bush structure (similar to regular bush but with berries)
        const leafColors = [0x2d5016, 0x3a6b24, 0x4a7d33];
        
        const count = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
            const s = 0.4 + Math.random() * 0.4;
            const geo = new THREE.DodecahedronGeometry(s, 1);
            const mat = new THREE.MeshStandardMaterial({ 
                color: leafColors[i % leafColors.length],
                flatShading: true,
                roughness: 0.8
            });
            
            const mesh = new THREE.Mesh(geo, mat);
            const angle = (i / count) * Math.PI * 2;
            const dist = 0.15 + Math.random() * 0.25;
            mesh.position.set(
                Math.cos(angle) * dist,
                0.1 + (Math.random() * 0.3), // Start from near ground level
                Math.sin(angle) * dist
            );
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.group.add(mesh);
        }
    }

    private createBerries() {
        this.berries = [];
        const berryCount = 12 + Math.floor(Math.random() * 16); // More berries
        
        for (let i = 0; i < berryCount; i++) {
            const geo = new THREE.SphereGeometry(0.04 + Math.random() * 0.03, 8, 6); // Slightly larger berries
            const mat = new THREE.MeshStandardMaterial({ 
                color: 0xdc143c, // Crimson red for berries
                roughness: 0.3,
                metalness: 0.1,
                emissive: 0x440000, // Slight red glow for visibility
                emissiveIntensity: 0.2
            });
            
            const berry = new THREE.Mesh(geo, mat);
            
            // Position berries on the outer surface of the bush for visibility
            const angle = Math.random() * Math.PI * 2;
            const height = 0.2 + Math.random() * 0.4; // Higher up on the bush
            const dist = 0.35 + Math.random() * 0.25; // Further from center to be on outside
            
            berry.position.set(
                Math.cos(angle) * dist,
                height,
                Math.sin(angle) * dist
            );
            
            berry.castShadow = true;
            berry.userData = { isBerry: true };
            this.berries.push(berry);
            this.group.add(berry);
        }
    }

    public harvest(): string | null {
        if (!this.hasBerries) {
            return null; // Already harvested
        }

        // Remove berries from view
        this.berries.forEach(berry => {
            berry.visible = false;
        });
        
        this.hasBerries = false;
        this.respawnTimer = this.RESPAWN_TIME;
        this.group.userData.hasBerries = false;
        
        return 'berries'; // Return the harvested item
    }

    public update(deltaTime: number) {
        // Handle berry respawn
        if (!this.hasBerries && this.respawnTimer > 0) {
            this.respawnTimer -= deltaTime;
            
            if (this.respawnTimer <= 0) {
                this.respawnBerries();
            }
        }

        // Gentle swaying animation (rotation only, no vertical movement)
        const time = Date.now() * 0.001;
        this.group.rotation.y = Math.sin(time * 0.5) * 0.02;
        // Removed: this.group.position.y = this.group.position.y + Math.sin(time * 0.8) * 0.005;
    }

    private respawnBerries() {
        this.hasBerries = true;
        this.group.userData.hasBerries = true;
        
        // Make berries visible again
        this.berries.forEach(berry => {
            berry.visible = true;
        });
    }

    public getHasBerries(): boolean {
        return this.hasBerries;
    }

    public getRespawnTime(): number {
        return Math.max(0, this.respawnTimer);
    }
}
