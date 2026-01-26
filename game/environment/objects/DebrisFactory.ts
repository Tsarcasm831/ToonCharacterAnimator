
import * as THREE from 'three';

export class DebrisFactory {
    private static materials: Map<string, THREE.Material> = new Map();
    private static geometries: Map<string, THREE.BufferGeometry> = new Map();

    private static getMaterial(color: number, name: string, options: any = {}): THREE.Material {
        if (!this.materials.has(name)) {
            const params = { color, ...options };
            this.materials.set(name, new THREE.MeshStandardMaterial(params));
        }
        return this.materials.get(name)!;
    }

    private static getGeometry(name: string, createFn: () => THREE.BufferGeometry): THREE.BufferGeometry {
        if (!this.geometries.has(name)) {
            this.geometries.set(name, createFn());
        }
        return this.geometries.get(name)!;
    }

    static createDebrisChunk(position: THREE.Vector3, material: THREE.Material) {
        // We reuse the passed material for debris chunks usually, but we can cache the geometry
        const geo = this.getGeometry('debris_chunk', () => new THREE.DodecahedronGeometry(0.1, 0));
        const mesh = new THREE.Mesh(geo, material);
        mesh.position.copy(position);
        return mesh;
    }

    static createStump(position: THREE.Vector3, quaternion: THREE.Quaternion, material: THREE.Material) {
        const group = new THREE.Group();
        group.position.copy(position);
        group.quaternion.copy(quaternion);
        
        const geo = this.getGeometry('debris_stump', () => new THREE.CylinderGeometry(0.65, 0.7, 0.6, 8));
        const stump = new THREE.Mesh(geo, material);
        stump.position.y = 0.3;
        stump.castShadow = true;
        stump.receiveShadow = true;
        stump.userData = { type: 'hard', material: 'wood' };
        
        group.add(stump);
        return group;
    }

    static createLogs(position: THREE.Vector3, quaternion: THREE.Quaternion) {
        const logs: THREE.Mesh[] = [];
        const mat = this.getMaterial(0x5d4037, 'debris_log_wood');
        const geo = this.getGeometry('debris_log', () => new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8));
        
        for(let i=0; i<3; i++) {
            const log = new THREE.Mesh(geo, mat);
            log.position.copy(position);
            log.position.x += (Math.random()-0.5)*2;
            log.position.z += (Math.random()-0.5)*2;
            log.position.y = 0.3;
            log.rotation.z = Math.PI/2;
            log.rotation.y = Math.random() * Math.PI;
            log.castShadow = true;
            log.userData = { type: 'hard', material: 'wood', isLog: true };
            logs.push(log);
        }
        return logs;
    }

    static createFallingTrunk(position: THREE.Vector3, material: THREE.Material) {
        const group = new THREE.Group();
        group.position.copy(position);
        
        const geo = this.getGeometry('debris_falling_trunk', () => new THREE.CylinderGeometry(0.22, 0.65, 4.2, 8));
        const trunk = new THREE.Mesh(geo, material);
        trunk.position.y = 2.1 + 0.6; // Offset for stump
        trunk.castShadow = true;
        
        group.add(trunk);
        return group;
    }
}
