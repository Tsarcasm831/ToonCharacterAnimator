
import * as THREE from 'three';

export class PlantFactory {
    static createCactus(position: THREE.Vector3, scale: number = 1.0) {
        const group = new THREE.Group();
        group.position.copy(position);
        group.scale.setScalar(scale);
        
        const mat = new THREE.MeshStandardMaterial({ color: 0x4caf50, flatShading: true });
        
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2.5, 8), mat);
        trunk.position.y = 1.25;
        trunk.castShadow = true;
        trunk.userData = { type: 'hard', material: 'cactus' };
        group.add(trunk);
        
        const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.0, 8), mat);
        arm1.position.set(0.3, 1.5, 0);
        arm1.rotation.z = -Math.PI / 3;
        group.add(arm1);
        
        const arm1Up = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8), mat);
        arm1Up.position.set(0.65, 1.9, 0);
        group.add(arm1Up);

        return { group, trunk };
    }

    static createCattail(position: THREE.Vector3) {
        const group = new THREE.Group();
        group.position.copy(position);
        
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 6), new THREE.MeshStandardMaterial({ color: 0x33691e }));
        stem.position.y = 0.6;
        group.add(stem);
        
        const head = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.25, 4, 8), new THREE.MeshStandardMaterial({ color: 0x3e2723 }));
        head.position.y = 1.1;
        group.add(head);
        
        group.userData = { type: 'soft', phase: Math.random() * Math.PI };
        return group;
    }

    static createLilyPad(position: THREE.Vector3) {
        const group = new THREE.Group();
        group.position.copy(position);
        
        const geo = new THREE.CircleGeometry(0.4, 16, 0, Math.PI * 1.8);
        const mat = new THREE.MeshStandardMaterial({ color: 0x4caf50, side: THREE.DoubleSide });
        const pad = new THREE.Mesh(geo, mat);
        pad.rotation.x = -Math.PI / 2;
        group.add(pad);
        
        group.userData = { type: 'soft', phase: Math.random() * Math.PI };
        return group;
    }
}
