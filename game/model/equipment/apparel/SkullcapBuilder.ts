
import * as THREE from 'three';

export class SkullcapBuilder {
    static build(): THREE.Group {
        const group = new THREE.Group();
        const metalMat = new THREE.MeshStandardMaterial({ 
            color: 0x90a4ae, 
            metalness: 0.8, 
            roughness: 0.2,
            flatShading: false,
            side: THREE.DoubleSide
        });

        // Head radius is 0.21. Snug fit for skullcap.
        const helmRadius = 0.23;
        // Simple dome shape (half sphere)
        const shellGeo = new THREE.SphereGeometry(helmRadius, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
        
        const shell = new THREE.Mesh(shellGeo, metalMat);
        shell.castShadow = true;
        group.add(shell);

        return group;
    }
}
