
import * as THREE from 'three';
import { BerryBush } from './BerryBush';

export class VegetationFactory {
    static createBush(position: THREE.Vector3, scale: number = 1.0) {
        const group = new THREE.Group();
        group.position.copy(position);
        group.scale.setScalar(scale);

        const leafColors = [0x2d3a1e, 0x3a4d24, 0x4a5d33];
        
        // Compound object: 3-5 overlapping spheres/dodecahedrons
        const count = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
            const s = 0.5 + Math.random() * 0.5;
            const geo = new THREE.DodecahedronGeometry(s, 1);
            const mat = new THREE.MeshStandardMaterial({ 
                color: leafColors[i % leafColors.length],
                flatShading: true,
                roughness: 0.8
            });
            
            const mesh = new THREE.Mesh(geo, mat);
            const angle = (i / count) * Math.PI * 2;
            const dist = 0.2 + Math.random() * 0.3;
            mesh.position.set(
                Math.cos(angle) * dist,
                0.4 + (Math.random() * 0.3),
                Math.sin(angle) * dist
            );
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            group.add(mesh);
        }

        group.userData = { type: 'soft', phase: Math.random() * Math.PI };
        return group;
    }

    static createFern(position: THREE.Vector3) {
        const group = new THREE.Group();
        group.position.copy(position);

        const frondCount = 6 + Math.floor(Math.random() * 4);
        const mat = new THREE.MeshStandardMaterial({ 
            color: 0x3a5d24, 
            side: THREE.DoubleSide,
            flatShading: true 
        });

        for (let i = 0; i < frondCount; i++) {
            const h = 0.8 + Math.random() * 0.4;
            const w = 0.15;
            const geo = new THREE.PlaneGeometry(w, h, 1, 4);
            geo.translate(0, h/2, 0);
            
            // Curve the frond
            const pos = geo.attributes.position;
            for(let k=0; k<pos.count; k++) {
                const y = pos.getY(k);
                const p = y / h;
                const bend = Math.pow(p, 2) * 0.3;
                pos.setZ(k, pos.getZ(k) + bend);
                // Taper
                const taper = 1.0 - Math.pow(p, 2);
                pos.setX(k, pos.getX(k) * taper);
            }
            geo.computeVertexNormals();

            const frond = new THREE.Mesh(geo, mat);
            frond.rotation.y = (i / frondCount) * Math.PI * 2;
            frond.rotation.x = 0.4 + Math.random() * 0.4;
            frond.castShadow = true;
            group.add(frond);
        }

        group.userData = { type: 'soft', phase: Math.random() * Math.PI };
        return group;
    }

    static createReeds(position: THREE.Vector3) {
        const group = new THREE.Group();
        group.position.copy(position);

        const reedCount = 8 + Math.floor(Math.random() * 8);
        const mat = new THREE.MeshStandardMaterial({ color: 0x4a5d33, flatShading: true });

        for (let i = 0; i < reedCount; i++) {
            const h = 1.2 + Math.random() * 0.8;
            const r = 0.015 + Math.random() * 0.01;
            const geo = new THREE.CylinderGeometry(0.005, r, h, 5);
            geo.translate(0, h/2, 0);
            
            const reed = new THREE.Mesh(geo, mat);
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 0.3;
            reed.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
            reed.rotation.x = (Math.random() - 0.5) * 0.2;
            reed.rotation.z = (Math.random() - 0.5) * 0.2;
            reed.castShadow = true;
            group.add(reed);
        }

        group.userData = { type: 'soft', phase: Math.random() * Math.PI };
        return group;
    }

    static createBerryBush(position: THREE.Vector3, scale: number = 1.0) {
        const berryBush = new BerryBush(position, scale);
        return berryBush.group;
    }
}
