
import * as THREE from 'three';

export class StaffBuilder {
    static build(metalMat: THREE.Material): THREE.Group {
        const group = new THREE.Group();
        const s = 1.0;

        // --- MATERIALS ---
        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xd4af37,
            metalness: 0.9,
            roughness: 0.2,
            emissive: 0x443300,
            emissiveIntensity: 0.2
        });

        const creamMat = new THREE.MeshStandardMaterial({
            color: 0xf5f5dc,
            roughness: 0.7,
            metalness: 0.05
        });

        // --- DIMENSIONS ---
        const totalLen = 1.8 * s;
        const shaftRad = 0.022 * s;
        const topH = 0.45 * s;
        const shaftH = totalLen - topH;

        // Grip point is at (0,0,0). We want it held about 1/3 from the bottom.
        const buttLen = 0.6 * s;
        const forwardShaftLen = shaftH - buttLen;

        // --- SHAFT (Segmented) ---
        const shaftGroup = new THREE.Group();
        group.add(shaftGroup);

        const numSegments = 12;
        const segH = shaftH / numSegments;
        const ringH = 0.01 * s;

        for (let i = 0; i < numSegments; i++) {
            const yOffset = -buttLen + i * segH;
            
            // Cream Section
            const segGeo = new THREE.CylinderGeometry(shaftRad, shaftRad, segH - ringH, 8);
            const seg = new THREE.Mesh(segGeo, creamMat);
            seg.position.y = yOffset + (segH - ringH) / 2;
            seg.castShadow = true;
            shaftGroup.add(seg);

            // Gold Ring Divider
            const ringGeo = new THREE.CylinderGeometry(shaftRad * 1.2, shaftRad * 1.2, ringH, 8);
            const ring = new THREE.Mesh(ringGeo, goldMat);
            ring.position.y = yOffset + (segH - ringH);
            shaftGroup.add(ring);
        }

        // 1. POLE (Inner Handle Core)
        // Use shaft dimensions for the core pole
        const poleGeo = new THREE.CylinderGeometry(shaftRad * 0.9, shaftRad * 0.9, shaftH, 8);
        // Align to Y axis and shift so (0,0,0) is at the grip point
        poleGeo.translate(0, (shaftH / 2) - buttLen, 0);
        
        const pole = new THREE.Mesh(poleGeo, creamMat);
        pole.castShadow = true;
        group.add(pole);

        // Decorative leather grip wrap at the origin (Hand position)
        const gripMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });
        const gripGeo = new THREE.CylinderGeometry(shaftRad * 1.25, shaftRad * 1.25, 0.4 * s, 8);
        const grip = new THREE.Mesh(gripGeo, gripMat);
        grip.position.set(0, 0, 0); 
        group.add(grip);

        // --- TOP HEAD ASSEMBLY ---
        const headGroup = new THREE.Group();
        headGroup.position.y = forwardShaftLen; 
        group.add(headGroup);

        // Transition Base
        const baseH = 0.12 * s;
        const baseGeo = new THREE.CylinderGeometry(shaftRad * 1.2, shaftRad * 1.6, baseH, 12);
        baseGeo.translate(0, baseH / 2, 0);
        const base = new THREE.Mesh(baseGeo, goldMat);
        headGroup.add(base);

        // Ornamental Bulb
        const bulbSize = shaftRad * 2.5;
        const bulbGeo = new THREE.SphereGeometry(bulbSize, 16, 12);
        bulbGeo.scale(0.9, 1.4, 1);
        const bulb = new THREE.Mesh(bulbGeo, goldMat);
        bulb.position.y = baseH + bulbSize * 0.4;
        headGroup.add(bulb);

        // --- THE SPIRALS (Flame Top) ---
        const spiralGroup = new THREE.Group();
        spiralGroup.position.y = bulb.position.y + bulbSize * 0.5;
        headGroup.add(spiralGroup);

        const createSpiral = (rotOffset: number) => {
            const points: THREE.Vector3[] = [];
            const spiralTurns = 1.3;
            const spiralH = topH * 0.8;
            const steps = 40;
            const baseR = shaftRad * 3.5;

            for (let i = 0; i < steps; i++) {
                const t = i / (steps - 1);
                const angle = t * Math.PI * 2 * spiralTurns + rotOffset;
                // Radius tapers to a point at the top
                const r = baseR * (1.0 - t * 0.9);
                const y = t * spiralH;
                const x = Math.cos(angle) * r;
                const z = Math.sin(angle) * r;
                points.push(new THREE.Vector3(x, y, z));
            }

            const curve = new THREE.CatmullRomCurve3(points);
            // Ribbon-like geometry
            const tubeGeo = new THREE.TubeGeometry(curve, steps, shaftRad * 0.8, 6, false);
            const mesh = new THREE.Mesh(tubeGeo, goldMat);
            mesh.castShadow = true;
            return mesh;
        };

        spiralGroup.add(createSpiral(0));
        spiralGroup.add(createSpiral(Math.PI));

        // Center Spike
        const spikeGeo = new THREE.ConeGeometry(shaftRad * 0.6, topH * 0.95, 8);
        spikeGeo.translate(0, topH * 0.4, 0);
        const spike = new THREE.Mesh(spikeGeo, goldMat);
        spiralGroup.add(spike);

        // --- BUTT END ---
        const buttEnd = new THREE.Mesh(new THREE.SphereGeometry(shaftRad * 2.0, 8, 8), goldMat);
        buttEnd.position.y = -buttLen;
        group.add(buttEnd);

        // Rotate entire group so Y-axis (length of staff) becomes X-axis (aligned with Hand Grip)
        group.rotation.z = -Math.PI / 2;
        group.name = 'Staff';
        return group;
    }
}
