
import * as THREE from 'three';

export class ArrowBuilder {
    static buildArrow(): THREE.Group {
        const arrow = new THREE.Group();
        
        const shaftMat = new THREE.MeshStandardMaterial({ color: 0xdeb887 });
        const featherMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
        const tipMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.8, roughness: 0.4 });

        // Shaft
        // Length approx 0.7m, thin
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.7, 6), shaftMat);
        // Cylinder is vertical by default (Y). Rotate to Z-forward for "shooting forward".
        shaft.rotation.x = Math.PI / 2;
        arrow.add(shaft);

        // Tip (Head)
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.04, 8), tipMat);
        tip.rotation.x = Math.PI / 2;
        tip.position.z = 0.35; // End of shaft (0.7/2)
        arrow.add(tip);

        // Fletching (Feathers)
        const featherGeo = new THREE.PlaneGeometry(0.02, 0.08);
        // Center of feather should be near back
        // Shaft back is at -0.35
        
        const fletchGroup = new THREE.Group();
        fletchGroup.position.z = -0.32;
        
        [0, 120, 240].forEach(deg => {
            const wrapper = new THREE.Group();
            wrapper.rotation.z = deg * (Math.PI / 180);
            
            const fMesh = new THREE.Mesh(featherGeo, featherMat);
            fMesh.rotation.x = Math.PI / 2; // Lay flat along Z
            fMesh.position.y = 0.01; // Distance from shaft
            wrapper.add(fMesh);
            
            fletchGroup.add(wrapper);
        });
        
        arrow.add(fletchGroup);

        // Increase size by 20% to improve visibility in flight
        arrow.scale.setScalar(1.2);

        return arrow;
    }
}
