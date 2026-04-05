
import * as THREE from 'three';
import { PlayerConfig } from '../../../../types';

export class PauldronBuilder {
    static build(isLeft: boolean, config: PlayerConfig): THREE.Group {
        const group = new THREE.Group();

        if (config.equipment.robe) {
            const robeMat = new THREE.MeshStandardMaterial({
                color: config.robeColor,
                roughness: 0.92,
                metalness: 0.04,
                side: THREE.DoubleSide
            });

            const trimMat = new THREE.MeshStandardMaterial({
                color: config.robeTrimColor,
                roughness: 0.6,
                metalness: 0.25,
                side: THREE.DoubleSide
            });

            const capGeo = new THREE.SphereGeometry(0.145, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.5);
            capGeo.scale(1.28, 0.46, 1.0);
            const cap = new THREE.Mesh(capGeo, robeMat);
            cap.rotation.z = isLeft ? -0.34 : 0.34;
            cap.rotation.x = 0.08;
            cap.position.y = 0.07;
            cap.position.x = isLeft ? 0.008 : -0.008;
            cap.castShadow = true;
            group.add(cap);

            const sideFlapGeo = new THREE.SphereGeometry(0.09, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.56);
            sideFlapGeo.scale(1.05, 0.75, 0.9);
            const sideFlap = new THREE.Mesh(sideFlapGeo, robeMat);
            sideFlap.position.set(isLeft ? 0.092 : -0.092, 0.0, 0.014);
            sideFlap.rotation.z = isLeft ? -0.52 : 0.52;
            sideFlap.rotation.y = isLeft ? -0.14 : 0.14;
            sideFlap.rotation.x = 0.14;
            sideFlap.castShadow = true;
            group.add(sideFlap);

            const trimGeo = new THREE.TorusGeometry(0.13, 0.007, 8, 24);
            const trim = new THREE.Mesh(trimGeo, trimMat);
            trim.scale.set(1.28, 1.0, 0.38);
            trim.rotation.x = Math.PI / 2;
            trim.rotation.z = isLeft ? -0.34 : 0.34;
            trim.position.y = 0.065;
            trim.position.x = isLeft ? 0.008 : -0.008;
            group.add(trim);

            return group;
        }
        
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
