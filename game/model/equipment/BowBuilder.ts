
import * as THREE from 'three';

export class BowBuilder {
    static buildBow(woodMat: THREE.Material): THREE.Group {
        const group = new THREE.Group();
        const s = 1.0;

        // --- THE BOW (Recurve Style) ---
        // Curve definition
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, -0.6, 0.1), // Bottom Tip (bent back)
            new THREE.Vector3(0, -0.4, -0.05), // Lower Limb
            new THREE.Vector3(0, 0, 0),        // Grip
            new THREE.Vector3(0, 0.4, -0.05),  // Upper Limb
            new THREE.Vector3(0, 0.6, 0.1)     // Top Tip (bent back)
        ]);

        const bowGeo = new THREE.TubeGeometry(curve, 20, 0.02 * s, 8, false);
        const bowMesh = new THREE.Mesh(bowGeo, woodMat);
        bowMesh.castShadow = true;
        group.add(bowMesh);

        // Grip (Thicker leather wrap)
        const gripGeo = new THREE.CylinderGeometry(0.025 * s, 0.025 * s, 0.12 * s, 8);
        const gripMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });
        const grip = new THREE.Mesh(gripGeo, gripMat);
        grip.rotation.z = Math.PI / 2; // Align with hand X-axis
        grip.position.set(0, 0, 0);
        group.add(grip);

        // String
        const stringGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, -0.58, 0.08),
            new THREE.Vector3(0, 0.58, 0.08)
        ]);
        const stringMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
        const bowString = new THREE.Line(stringGeo, stringMat);
        group.add(bowString);

        // Orient for Left Hand Hold
        // Hand Z+ is Palm (Inward), Z- is Back of Hand (Outward). 
        // Hand Y- is Fingers (Down). Hand X is thumb/width.
        // We want the bow vertical (World Y), grip in palm.
        // Default curve is vertical along Y. 
        // Just need to rotate it to face forward.
        group.rotation.y = -Math.PI / 2;
        group.rotation.z = -Math.PI / 2; 

        return group;
    }

    static buildQuiver(): THREE.Group {
        const group = new THREE.Group();
        const s = 1.0;

        // Quiver Body
        const leatherMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.8 });
        const bodyGeo = new THREE.CylinderGeometry(0.08 * s, 0.06 * s, 0.6 * s, 12);
        bodyGeo.translate(0, 0.3, 0); // Pivot at bottom
        const body = new THREE.Mesh(bodyGeo, leatherMat);
        body.castShadow = true;
        group.add(body);

        // Trim
        const trimMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63 });
        const topTrim = new THREE.Mesh(new THREE.TorusGeometry(0.08 * s, 0.01 * s, 4, 12), trimMat);
        topTrim.rotation.x = Math.PI / 2;
        topTrim.position.y = 0.6 * s;
        group.add(topTrim);

        // Arrows inside
        const featherMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
        const shaftMat = new THREE.MeshStandardMaterial({ color: 0xdeb887 });

        for (let i = 0; i < 5; i++) {
            const arrow = new THREE.Group();
            
            // Shaft
            const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.6, 6), shaftMat);
            shaft.position.y = 0.3;
            arrow.add(shaft);

            // Fletching (Feathers)
            const featherGeo = new THREE.PlaneGeometry(0.02, 0.08);
            featherGeo.translate(0.01, 0.55, 0); // Top of shaft
            
            [0, 120, 240].forEach(deg => {
                const f = new THREE.Mesh(featherGeo, featherMat);
                f.rotation.y = deg * (Math.PI / 180);
                arrow.add(f);
            });

            // Randomize position in quiver
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * 0.04;
            arrow.position.set(Math.cos(angle)*r, 0.1 + Math.random() * 0.1, Math.sin(angle)*r);
            arrow.rotation.z = (Math.random() - 0.5) * 0.1;
            arrow.rotation.x = (Math.random() - 0.5) * 0.1;
            
            group.add(arrow);
        }

        return group;
    }
}
