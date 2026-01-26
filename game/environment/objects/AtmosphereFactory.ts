
import * as THREE from 'three';

export class AtmosphereFactory {
    static createHangingMoss(position: THREE.Vector3, scale: number = 1.0) {
        const group = new THREE.Group();
        group.position.copy(position);
        group.scale.setScalar(scale);

        const segments = 3;
        const totalHeight = 0.8 + Math.random() * 0.6;
        const segHeight = totalHeight / segments;
        const mat = new THREE.MeshStandardMaterial({ 
            color: 0x4a5d23, 
            flatShading: true,
            side: THREE.DoubleSide
        });

        // Create a jagged, draping vine using a few segments
        for (let i = 0; i < segments; i++) {
            const w = 0.08 * (1 - (i / segments) * 0.5);
            const geo = new THREE.PlaneGeometry(w, segHeight, 1, 1);
            geo.translate(0, -segHeight / 2, 0);
            
            const part = new THREE.Mesh(geo, mat);
            part.position.y = -i * segHeight;
            // Add some "jaggedness"
            part.rotation.z = (Math.random() - 0.5) * 0.4;
            part.rotation.y = (Math.random() * Math.PI);
            group.add(part);
        }

        group.userData = { type: 'soft', phase: Math.random() * Math.PI };
        return group;
    }

    static createAtmosphericMotes(position: THREE.Vector3, count: number = 8, color: number = 0xaaff00) {
        const group = new THREE.Group();
        group.position.copy(position);

        const geo = new THREE.BoxGeometry(0.04, 0.04, 0.04);
        const mat = new THREE.MeshStandardMaterial({ 
            color: color,
            emissive: color,
            emissiveIntensity: 2,
            transparent: true,
            opacity: 0.8
        });

        for (let i = 0; i < count; i++) {
            const mote = new THREE.Mesh(geo, mat.clone());
            const range = 4.0;
            mote.position.set(
                (Math.random() - 0.5) * range,
                1.0 + Math.random() * 3.0,
                (Math.random() - 0.5) * range
            );
            
            // Random movement metadata
            mote.userData = {
                originY: mote.position.y,
                phase: Math.random() * Math.PI * 2,
                speed: 0.5 + Math.random() * 0.5,
                isMote: true
            };
            
            group.add(mote);
        }

        group.userData = { type: 'soft' };
        return group;
    }
}
