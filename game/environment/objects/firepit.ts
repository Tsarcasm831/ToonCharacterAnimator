import * as THREE from 'three';

export class Firepit {
    /**
     * Creates a Firepit group containing rocks, ash base, fire mesh, and a light source.
     */
    static create(isGhost: boolean): THREE.Group {
        const group = new THREE.Group();

        // Shared Materials
        const rockMat = isGhost 
            ? new THREE.MeshStandardMaterial({ color: 0x44ff44, transparent: true, opacity: 0.4, wireframe: true })
            : new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9, flatShading: true });

        // 1. Create Rock Ring
        // We use Dodecahedrons for a jagged "rock" look without needing external assets
        const rockGeo = new THREE.DodecahedronGeometry(0.15, 0); 
        const radius = 0.5;
        const rockCount = 8;
        
        for(let i = 0; i < rockCount; i++) {
            const angle = (i / rockCount) * Math.PI * 2;
            const mesh = new THREE.Mesh(rockGeo, rockMat);
            
            // Add slight randomization to make it look organic
            const rVariation = (Math.random() - 0.5) * 0.1;
            const x = Math.cos(angle) * (radius + rVariation);
            const z = Math.sin(angle) * (radius + rVariation);
            
            mesh.position.set(x, 0.1, z);
            
            // Random rotation for natural rock look
            mesh.rotation.set(
                Math.random() * Math.PI, 
                Math.random() * Math.PI, 
                Math.random() * Math.PI
            );
            
            mesh.castShadow = !isGhost;
            mesh.receiveShadow = !isGhost;
            group.add(mesh);
        }

        // 2. Ash/Coal Base
        const ashGeo = new THREE.CylinderGeometry(0.4, 0.45, 0.05, 8);
        const ashMat = isGhost 
            ? rockMat 
            : new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1 });
        const ash = new THREE.Mesh(ashGeo, ashMat);
        ash.position.y = 0.025;
        ash.receiveShadow = true;
        group.add(ash);

        // 3. The Fire & Light (Only visible if not a ghost)
        if (!isGhost) {
            // Emissive Fire Mesh
            const fireGeo = new THREE.ConeGeometry(0.25, 0.4, 5);
            const fireMat = new THREE.MeshStandardMaterial({
                color: 0xff5500,
                emissive: 0xff2200,
                emissiveIntensity: 3,
                roughness: 1,
                flatShading: true
            });
            const fire = new THREE.Mesh(fireGeo, fireMat);
            fire.position.y = 0.2;
            fire.rotation.y = Math.random() * Math.PI;
            fire.userData.isFire = true; // Tag for potential animation logic later
            group.add(fire);

            // Dynamic Light source
            const light = new THREE.PointLight(0xff6600, 2, 8);
            light.position.set(0, 0.5, 0);
            light.castShadow = true;
            light.shadow.bias = -0.0005;
            
            // Add slight flicker capability via userData
            light.userData = { originalIntensity: 2 };
            group.add(light);
        }

        return group;
    }
}