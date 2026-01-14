
import * as THREE from 'three';

interface ParticleData {
    active: boolean;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
    rotationSpeed: THREE.Vector3;
    scale: number;
}

export class ParticleManager {
    private scene: THREE.Scene;
    private mesh: THREE.InstancedMesh;
    private particles: ParticleData[] = [];
    private dummy = new THREE.Object3D();
    private count = 100; // Optimized count
    
    constructor(scene: THREE.Scene) {
        this.scene = scene;
        const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xffffff, 
            roughness: 0.9,
            flatShading: true 
        });

        this.mesh = new THREE.InstancedMesh(geometry, material, this.count);
        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.scene.add(this.mesh);

        for (let i = 0; i < this.count; i++) {
            this.particles.push({
                active: false,
                velocity: new THREE.Vector3(),
                life: 0,
                maxLife: 1.0,
                rotationSpeed: new THREE.Vector3(),
                scale: 1.0
            });
            this.dummy.position.set(0, -1000, 0);
            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(i, this.dummy.matrix);
        }
    }

    emit(position: THREE.Vector3, count: number, type: 'wood' | 'stone' | 'spark') {
        let spawned = 0;
        const mat = this.mesh.material as THREE.MeshStandardMaterial;
        let color = new THREE.Color(0xffffff);
        let emissive = new THREE.Color(0x000000);
        let baseScale = 1.0;
        let speedMult = 1.0;

        if (type === 'wood') { color.setHex(0x8d6e63); baseScale = 1.2; }
        else if (type === 'stone') { color.setHex(0x9e9e9e); baseScale = 1.0; }
        else if (type === 'spark') { color.setHex(0xffaa00); emissive.setHex(0xff5500); baseScale = 0.4; speedMult = 2.5; }

        mat.color.copy(color);
        mat.emissive.copy(emissive);

        for (let i = 0; i < this.count; i++) {
            if (!this.particles[i].active) {
                const p = this.particles[i];
                p.active = true;
                p.life = 0;
                p.maxLife = (0.3 + Math.random() * 0.4);
                p.scale = baseScale * (0.5 + Math.random() * 0.5);
                p.velocity.set((Math.random() - 0.5), (Math.random() * 0.8 + 0.2), (Math.random() - 0.5)).normalize().multiplyScalar((3 + Math.random() * 4) * speedMult);
                p.rotationSpeed.set(Math.random() * 15, Math.random() * 15, Math.random() * 15);
                this.dummy.position.copy(position).add(new THREE.Vector3((Math.random()-0.5)*0.2, (Math.random()-0.5)*0.2, (Math.random()-0.5)*0.2));
                this.dummy.scale.setScalar(p.scale);
                this.dummy.updateMatrix();
                this.mesh.setMatrixAt(i, this.dummy.matrix);
                spawned++;
                if (spawned >= count) break;
            }
        }
        this.mesh.instanceMatrix.needsUpdate = true;
    }

    update(dt: number) {
        let needsUpdate = false;
        const gravity = -20;
        for (let i = 0; i < this.count; i++) {
            const p = this.particles[i];
            if (p.active) {
                needsUpdate = true;
                p.life += dt;
                if (p.life >= p.maxLife) {
                    p.active = false;
                    this.dummy.position.set(0, -1000, 0);
                    this.dummy.updateMatrix();
                    this.mesh.setMatrixAt(i, this.dummy.matrix);
                    continue;
                }
                p.velocity.y += gravity * dt;
                this.mesh.getMatrixAt(i, this.dummy.matrix);
                this.dummy.position.setFromMatrixPosition(this.dummy.matrix);
                this.dummy.position.addScaledVector(p.velocity, dt);
                this.dummy.rotation.x += p.rotationSpeed.x * dt;
                this.dummy.rotation.y += p.rotationSpeed.y * dt;
                this.dummy.rotation.z += p.rotationSpeed.z * dt;
                const scale = Math.max(0, p.scale * (1.0 - (p.life / p.maxLife)));
                this.dummy.scale.setScalar(scale);
                this.dummy.updateMatrix();
                this.mesh.setMatrixAt(i, this.dummy.matrix);
            }
        }
        if (needsUpdate) this.mesh.instanceMatrix.needsUpdate = true;
    }
}
