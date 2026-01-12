
import * as THREE from 'three';
import { RockFactory } from './RockFactory';

export class HumanRemnantsFactory {
    static createFence(position: THREE.Vector3, rotationY: number) {
        const group = new THREE.Group();
        group.position.copy(position);
        group.rotation.y = rotationY;

        const woodMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9, flatShading: true });
        
        // Two posts
        const postGeo = new THREE.BoxGeometry(0.12, 1.2, 0.12);
        const post1 = new THREE.Mesh(postGeo, woodMat);
        post1.position.set(-0.95, 0.6, 0);
        post1.rotation.y = Math.random();
        post1.castShadow = true;
        group.add(post1);

        const post2 = new THREE.Mesh(postGeo, woodMat);
        post2.position.set(0.95, 0.6, 0);
        post2.rotation.y = Math.random();
        post2.castShadow = true;
        group.add(post2);

        // Two horizontal rails
        const railGeo = new THREE.BoxGeometry(2.0, 0.1, 0.06);
        const rail1 = new THREE.Mesh(railGeo, woodMat);
        rail1.position.set(0, 0.95, 0);
        rail1.castShadow = true;
        group.add(rail1);

        const rail2 = new THREE.Mesh(railGeo, woodMat);
        rail2.position.set(0, 0.45, 0);
        rail2.castShadow = true;
        group.add(rail2);

        // Random brokenness/tilt
        if (Math.random() > 0.5) {
            rail1.rotation.z = (Math.random() - 0.5) * 0.15;
            group.rotation.x = (Math.random() - 0.5) * 0.1;
        }

        group.userData = { type: 'hard', material: 'wood' };
        return group;
    }

    static createPallet(position: THREE.Vector3) {
        const group = new THREE.Group();
        group.position.copy(position);

        const woodMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.95, flatShading: true });
        
        // Base runners
        const runnerGeo = new THREE.BoxGeometry(1.2, 0.1, 0.08);
        for(let i=-1; i<=1; i++) {
            const runner = new THREE.Mesh(runnerGeo, woodMat);
            runner.position.set(0, 0.05, i * 0.45);
            runner.castShadow = true;
            group.add(runner);
        }

        // Top slats
        const slatGeo = new THREE.BoxGeometry(0.12, 0.02, 1.2);
        for(let i=0; i<6; i++) {
            const slat = new THREE.Mesh(slatGeo, woodMat);
            slat.position.set(-0.5 + i * 0.2, 0.11, 0);
            slat.castShadow = true;
            group.add(slat);
        }

        group.userData = { type: 'hard', material: 'wood' };
        return group;
    }

    static createCampfire(position: THREE.Vector3) {
        const group = new THREE.Group();
        group.position.copy(position);

        // Ash circle
        const ashGeo = new THREE.CircleGeometry(0.5, 12);
        const ashMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1.0 });
        const ash = new THREE.Mesh(ashGeo, ashMat);
        ash.rotation.x = -Math.PI/2;
        ash.position.y = 0.01;
        group.add(ash);

        // Ring of rocks
        for(let i=0; i<7; i++) {
            const angle = (i / 7) * Math.PI * 2;
            const r = 0.6 + Math.random() * 0.15;
            const rockPos = new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r);
            const { rock } = RockFactory.createRock(rockPos, 0.18 + Math.random() * 0.12);
            group.add(rock);
        }

        // Charred logs
        const logMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1.0 });
        for(let i=0; i<3; i++) {
            const log = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.7, 6), logMat);
            log.position.y = 0.06;
            log.rotation.z = Math.PI/2;
            log.rotation.y = (i/3) * Math.PI * 2 + Math.random();
            group.add(log);
        }

        group.userData = { type: 'soft' }; 
        return group;
    }

    static createRoadSign(position: THREE.Vector3, type: 'stop' | 'yield' = 'stop') {
        const group = new THREE.Group();
        group.position.copy(position);
        
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7, roughness: 0.4 });
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 2.8, 6), metalMat);
        post.position.y = 1.4;
        post.rotation.z = (Math.random() - 0.5) * 0.2; 
        group.add(post);

        const signMat = new THREE.MeshStandardMaterial({ color: type === 'stop' ? 0x991b1b : 0xd9a100, flatShading: true });
        let signGeo;
        if (type === 'stop') {
             signGeo = new THREE.CircleGeometry(0.35, 8); // Octagon
        } else {
             signGeo = new THREE.CircleGeometry(0.35, 3); // Triangle
        }
        
        const sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(0, 2.4, 0.05);
        sign.rotation.copy(post.rotation);
        sign.castShadow = true;
        group.add(sign);

        group.userData = { type: 'hard', material: 'metal' };
        return group;
    }
}
