
import * as THREE from 'three';

export class ScatterFactory {
    static createGrassClump(position: THREE.Vector3, type: 'tall' | 'short' | 'dry' = 'short') {
        const group = new THREE.Group();
        group.position.copy(position);

        const bladeCount = type === 'tall' ? 5 : 3;
        const baseHeight = type === 'tall' ? 0.6 : 0.3;
        const color = type === 'dry' ? 0x9a8c81 : (type === 'tall' ? 0x2d3a1e : 0x416128);
        
        const mat = new THREE.MeshStandardMaterial({ 
            color: color, 
            flatShading: true,
            roughness: 0.9
        });

        for (let i = 0; i < bladeCount; i++) {
            const h = baseHeight * (0.8 + Math.random() * 0.4);
            const w = 0.05 + Math.random() * 0.05;
            const geo = new THREE.ConeGeometry(w, h, 3);
            geo.translate(0, h/2, 0);
            
            const blade = new THREE.Mesh(geo, mat);
            const angle = (i / bladeCount) * Math.PI * 2;
            const dist = Math.random() * 0.15;
            blade.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
            blade.rotation.y = Math.random() * Math.PI;
            blade.rotation.z = (Math.random() - 0.5) * 0.4;
            blade.rotation.x = (Math.random() - 0.5) * 0.4;
            
            group.add(blade);
        }

        group.userData = { type: 'soft' };
        return group;
    }

    static createPebble(position: THREE.Vector3) {
        const s = 0.05 + Math.random() * 0.12;
        const geo = new THREE.DodecahedronGeometry(s, 0);
        const colors = [0x757575, 0x616161, 0x9e9e9e, 0x5d4037];
        const mat = new THREE.MeshStandardMaterial({ 
            color: colors[Math.floor(Math.random() * colors.length)],
            flatShading: true 
        });
        
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(position);
        mesh.position.y += s * 0.5; // Sit on ground
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        return mesh;
    }

    static createMushroom(position: THREE.Vector3) {
        const group = new THREE.Group();
        group.position.copy(position);

        const s = 0.4 + Math.random() * 0.4;
        group.scale.setScalar(s);

        const stalkMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
        const capColors = [0xb71c1c, 0x5d4037, 0x795548, 0xeeeeee];
        const capMat = new THREE.MeshStandardMaterial({ 
            color: capColors[Math.floor(Math.random() * capColors.length)],
            flatShading: true
        });

        // Stalk
        const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.12, 6), stalkMat);
        stalk.position.y = 0.06;
        group.add(stalk);

        // Cap
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), capMat);
        cap.position.y = 0.12;
        cap.scale.y = 0.6;
        group.add(cap);

        // Small spots if red
        if (capMat.color.getHex() === 0xb71c1c) {
            const spotMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
            for(let i=0; i<5; i++) {
                const spot = new THREE.Mesh(new THREE.SphereGeometry(0.015, 4, 4), spotMat);
                const angle = Math.random() * Math.PI * 2;
                const r = 0.03 + Math.random() * 0.04;
                spot.position.set(Math.cos(angle)*r, 0.15, Math.sin(angle)*r);
                group.add(spot);
            }
        }

        group.userData = { type: 'soft' };
        return group;
    }
}
