
import * as THREE from 'three';

export class DebrisFactory {
    static createDebrisChunk(position: THREE.Vector3, material: THREE.Material) {
        const geo = new THREE.DodecahedronGeometry(0.1, 0);
        const mesh = new THREE.Mesh(geo, material);
        mesh.position.copy(position);
        return mesh;
    }

    static createStump(position: THREE.Vector3, quaternion: THREE.Quaternion, material: THREE.Material) {
        const group = new THREE.Group();
        group.position.copy(position);
        group.quaternion.copy(quaternion);
        
        const geo = new THREE.CylinderGeometry(0.65, 0.7, 0.6, 8);
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
        const mat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
        
        for(let i=0; i<3; i++) {
            const log = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8), mat);
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
        
        const geo = new THREE.CylinderGeometry(0.22, 0.65, 4.2, 8);
        const trunk = new THREE.Mesh(geo, material);
        trunk.position.y = 2.1 + 0.6; // Offset for stump
        trunk.castShadow = true;
        
        group.add(trunk);
        return group;
    }
}
