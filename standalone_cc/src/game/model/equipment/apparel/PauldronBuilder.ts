
import * as THREE from 'three';
import { PlayerConfig } from '../../../../types';

export class PauldronBuilder {
    static build(isLeft: boolean, config: PlayerConfig): THREE.Group {
        const group = new THREE.Group();
        
        // Materials with double-sided visibility
        const metalMat = new THREE.MeshStandardMaterial({ 
            color: 0xb0bec5, 
            metalness: 0.8, 
            roughness: 0.2,
            side: THREE.DoubleSide
        });
        
        const darkMetalMat = new THREE.MeshStandardMaterial({
            color: 0x78909c,
            metalness: 0.7,
            roughness: 0.3,
            side: THREE.DoubleSide
        });
        
        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.9,
            roughness: 0.2,
            side: THREE.DoubleSide
        });

        // Constants matching ShirtBuilder for better fit
        const torsoRadiusTop = 0.305;
        const torsoDepthScale = 0.68;

        // Main shoulder plate - larger dome that wraps the shoulder
        // We use a sphere segment that covers the top and outer side
        const plateGeo = new THREE.SphereGeometry(torsoRadiusTop * 0.5, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
        plateGeo.scale(1.2, 0.8, 1.1);
        const plate = new THREE.Mesh(plateGeo, metalMat);
        
        // Tilt the plate to sit on the shoulder - tilted OUTWARD (away from body)
        // Fixed: Reversed tilt direction so plates angle outward, not inward
        plate.rotation.z = isLeft ? -0.52 : 0.52; // ~30 degrees outward
        plate.rotation.x = 0.1;
        plate.position.y = 0.05;
        plate.position.x = isLeft ? 0.02 : -0.02;
        plate.castShadow = true;
        group.add(plate);

        // Secondary layered plate (lower)
        const plate2Geo = new THREE.SphereGeometry(torsoRadiusTop * 0.45, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.4);
        plate2Geo.scale(1.1, 0.7, 1.05);
        const plate2 = new THREE.Mesh(plate2Geo, darkMetalMat);
        // Fixed: Reversed tilt direction
        plate2.rotation.z = isLeft ? -0.7 : 0.7; // Slightly more than the top plate, outward
        plate2.rotation.x = 0.2;
        plate2.position.y = -0.02;
        plate2.position.x = isLeft ? 0.05 : -0.05;
        plate2.castShadow = true;
        group.add(plate2);

        // Edge trim ring for the main plate
        const trimGeo = new THREE.TorusGeometry(torsoRadiusTop * 0.5, 0.015, 8, 24, Math.PI * 2);
        const trim = new THREE.Mesh(trimGeo, goldMat);
        trim.scale.set(1.2, 1.1, 0.5); // Flattened torus
        trim.rotation.x = Math.PI / 2;
        // Fixed: Reversed tilt direction to match main plate
        trim.rotation.z = isLeft ? -0.52 : 0.52; // Match main plate tilt
        trim.position.y = 0.05;
        trim.position.x = isLeft ? 0.02 : -0.02;
        group.add(trim);

        // Decorative rivets - positioned on the convex surface
        const rivetGeo = new THREE.SphereGeometry(0.015, 8, 8);
        const rivetPositions = [
            { x: isLeft ? 0.08 : -0.08, y: 0.12, z: 0.08 },
            { x: isLeft ? 0.14 : -0.14, y: 0.08, z: 0 },
            { x: isLeft ? 0.08 : -0.08, y: 0.12, z: -0.08 },
        ];
        
        rivetPositions.forEach(pos => {
            const rivet = new THREE.Mesh(rivetGeo, goldMat);
            rivet.position.set(pos.x, pos.y, pos.z);
            group.add(rivet);
        });

        return group;
    }
}
