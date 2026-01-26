import * as THREE from 'three';

export class HalberdBuilder {
    static build(woodMat: THREE.Material, metalMat: THREE.Material): THREE.Group {
        const group = new THREE.Group();
        
        // Scale factor
        const s = 1.0;
        
        // Dimensions
        const poleLen = 2.4 * s;
        const poleRad = 0.022 * s;
        
        // The hand grip point (where the player holds it) is at (0,0,0)
        // We want the player to hold it about 1/3 of the way up from the bottom.
        const buttLen = 0.85 * s;  // Length extending BEHIND the hand
        const frontLen = poleLen - buttLen; // Length extending FORWARD from hand
        
        // 1. POLE (Handle)
        const poleGeo = new THREE.CylinderGeometry(poleRad, poleRad, poleLen, 8);
        poleGeo.rotateZ(Math.PI / 2); // Lay along X axis
        // Shift the geometry so (0,0,0) is at the desired grip distance from the butt.
        poleGeo.translate((poleLen / 2) - buttLen, 0, 0);
        
        const pole = new THREE.Mesh(poleGeo, woodMat);
        pole.castShadow = true;
        group.add(pole);

        // Decorative leather grip wrap at the origin (Hand position)
        const gripMat = new THREE.MeshStandardMaterial({ color: 0x221108, roughness: 0.9 });
        const gripGeo = new THREE.CylinderGeometry(poleRad * 1.2, poleRad * 1.2, 0.4 * s, 8);
        gripGeo.rotateZ(Math.PI / 2);
        const grip = new THREE.Mesh(gripGeo, gripMat);
        grip.position.x = 0; 
        group.add(grip);

        // 2. HEAD ASSEMBLY
        // Positioned at the very end of the forward pole section
        const headGroup = new THREE.Group();
        headGroup.position.x = frontLen;
        group.add(headGroup);

        // Socket (Metal collar around the tip)
        const socketRad = poleRad * 1.35;
        const socketLen = 0.5 * s;
        const socketGeo = new THREE.CylinderGeometry(socketRad, socketRad * 1.1, socketLen, 8);
        socketGeo.rotateZ(Math.PI / 2);
        socketGeo.translate(-socketLen / 2, 0, 0); 
        const socket = new THREE.Mesh(socketGeo, metalMat);
        headGroup.add(socket);

        // Langets (Structural metal strips extending down the pole)
        const langetLen = 0.8 * s;
        const langetGeo = new THREE.BoxGeometry(langetLen, 0.012 * s, poleRad * 2);
        langetGeo.translate(-langetLen / 2, 0, 0);
        
        const rivetGeo = new THREE.SphereGeometry(0.01 * s, 6, 6);

        // Langets on sides
        [-1, 1].forEach(side => {
            const langet = new THREE.Mesh(langetGeo, metalMat);
            langet.position.z = side * (poleRad + 0.005);
            headGroup.add(langet);
            
            for (let i = 0; i < 5; i++) {
                const rivet = new THREE.Mesh(rivetGeo, metalMat);
                rivet.position.set(-0.15 - i * 0.15, 0, side * 0.006 * s);
                langet.add(rivet);
            }
        });

        // 3. TOP SPIKE (Forward thrusting blade)
        const tipSpikeGeo = new THREE.ConeGeometry(0.035 * s, 0.55 * s, 4);
        tipSpikeGeo.rotateZ(-Math.PI / 2); 
        tipSpikeGeo.translate(0.27 * s, 0, 0);
        const tipSpike = new THREE.Mesh(tipSpikeGeo, metalMat);
        headGroup.add(tipSpike);

        // --- BLADE COMPONENTS: Sticking out perpendicular to the shaft (XZ plane) ---
        const axeDepth = 0.015 * s;
        const axeExtrudeSettings = { 
            depth: axeDepth, 
            bevelEnabled: true, 
            bevelThickness: 0.008, 
            bevelSize: 0.01, 
            bevelSegments: 1 
        };

        // 4. AXE BLADE (Crescent Shape)
        const axeShape = new THREE.Shape();
        axeShape.moveTo(0, 0.05 * s);
        axeShape.quadraticCurveTo(0.1 * s, 0.15 * s, 0.25 * s, 0.2 * s); 
        axeShape.quadraticCurveTo(0.35 * s, 0, 0.25 * s, -0.2 * s);
        axeShape.quadraticCurveTo(0.1 * s, -0.15 * s, 0, -0.05 * s);
        axeShape.lineTo(0, 0.05 * s);

        const axeGeo = new THREE.ExtrudeGeometry(axeShape, axeExtrudeSettings);
        axeGeo.translate(0, 0, -axeDepth / 2);
        
        const axe = new THREE.Mesh(axeGeo, metalMat);
        // Rotate 90 degrees around X so the blade sticks out in the Z direction (perpendicular to X-axis shaft)
        axe.rotation.x = Math.PI / 2;
        axe.position.set(-0.1 * s, 0, 0); 
        axe.name = 'damagePart';
        headGroup.add(axe);

        // 5. REAR HOOK (Fluked beak)
        const hookShape = new THREE.Shape();
        hookShape.moveTo(0, 0.04 * s);
        hookShape.lineTo(0.12 * s, 0.03 * s);
        hookShape.quadraticCurveTo(0.25 * s, -0.15 * s, 0.15 * s, -0.25 * s);
        hookShape.lineTo(0.08 * s, -0.18 * s);
        hookShape.lineTo(0, -0.04 * s);

        const hookGeo = new THREE.ExtrudeGeometry(hookShape, axeExtrudeSettings);
        hookGeo.translate(0, 0, -axeDepth / 2);
        const hook = new THREE.Mesh(hookGeo, metalMat);
        // Hook is opposite the axe (also in XZ plane)
        hook.rotation.x = -Math.PI / 2;
        hook.position.set(-0.15 * s, 0, 0);
        headGroup.add(hook);

        // 6. BUTT CAP & SPIKE (At the absolute rear end)
        const buttEndPos = -buttLen;
        
        const pommel = new THREE.Mesh(new THREE.SphereGeometry(poleRad * 1.8, 8, 8), metalMat);
        pommel.position.x = buttEndPos;
        group.add(pommel);
        
        const buttSpikeGeo = new THREE.ConeGeometry(poleRad * 1.4, 0.2 * s, 8);
        buttSpikeGeo.rotateZ(Math.PI / 2);
        buttSpikeGeo.translate(buttEndPos - 0.1 * s, 0, 0);
        const buttSpike = new THREE.Mesh(buttSpikeGeo, metalMat);
        group.add(buttSpike);

        return group;
    }
}