
import * as THREE from 'three';

export class BowBuilder {
    static buildBow(woodMat: THREE.Material): THREE.Group {
        const group = new THREE.Group();
        const s = 1.0;

        const handleH = 0.18 * s;
        const handleR = 0.028 * s;
        const arcHeight = (1.8 * s) / 2;
        const limbW = 0.045 * s;
        const limbT = 0.025 * s;
        const nockSize = Math.max(0.02 * s, 0.012 * s);
        const curveDepth = 1.8 * s * 0.15;
        const stringOffset = -curveDepth * 0.3;

        const riserGeo = new THREE.CylinderGeometry(handleR * 1.2, handleR * 1.2, handleH * 1.5, 12);
        riserGeo.scale(1.2, 1, 0.8);
        const riser = new THREE.Mesh(riserGeo, woodMat);
        riser.castShadow = true;
        group.add(riser);

        const gripGeo = new THREE.CylinderGeometry(handleR * 1.3, handleR * 1.3, handleH, 16);
        gripGeo.scale(1.25, 1, 0.85);
        const gripMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });
        const grip = new THREE.Mesh(gripGeo, gripMat);
        group.add(grip);

        const createLimb = (isTop: boolean) => {
            const sign = isTop ? 1 : -1;
            const start = new THREE.Vector3(0, (handleH * 0.75) * sign, 0);
            const mid = new THREE.Vector3(curveDepth, (handleH * 0.75 + arcHeight * 0.5) * sign, 0);
            const end = new THREE.Vector3(stringOffset, (handleH * 0.75 + arcHeight) * sign, 0);
            const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
            const shape = new THREE.Shape();
            shape.moveTo(-limbW / 2, -limbT / 2);
            shape.lineTo(limbW / 2, -limbT / 2);
            shape.quadraticCurveTo(limbW / 2, limbT / 2, 0, limbT / 2);
            shape.quadraticCurveTo(-limbW / 2, limbT / 2, -limbW / 2, -limbT / 2);
            const limbGeo = new THREE.ExtrudeGeometry(shape, { steps: 32, extrudePath: curve, bevelEnabled: false });
            const posAttr = limbGeo.attributes.position;
            for (let i = 0; i < posAttr.count; i++) {
                const taper = THREE.MathUtils.lerp(1.0, 0.3, THREE.MathUtils.clamp(Math.abs(posAttr.getY(i) - start.y) / arcHeight, 0, 1));
                posAttr.setX(i, posAttr.getX(i) * taper);
                posAttr.setZ(i, posAttr.getZ(i) * taper);
            }
            posAttr.needsUpdate = true;
            limbGeo.computeVertexNormals();
            const limb = new THREE.Mesh(limbGeo, woodMat);
            limb.castShadow = true;
            group.add(limb);

            // Add gold tip for the top limb
            const tipMat = isTop ? new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 }) : woodMat;

            const nockHeight = nockSize * 4;
            const nock = new THREE.Mesh(new THREE.ConeGeometry(nockSize, nockHeight, 8), tipMat);
            nock.position.copy(end);
            nock.rotation.z = isTop ? -Math.PI / 6 : Math.PI / 6;
            nock.position.y += (nockHeight * 0.3) * sign;
            group.add(nock);
            return end;
        };

        const topEnd = createLimb(true);
        const bottomEnd = createLimb(false);
        const stringVec = new THREE.Vector3().subVectors(topEnd, bottomEnd);
        const stringMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.005 * s, 0.005 * s, stringVec.length(), 6),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })
        );
        stringMesh.position.copy(new THREE.Vector3().addVectors(topEnd, bottomEnd).multiplyScalar(0.5));
        stringMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), stringVec.clone().normalize());
        group.add(stringMesh);

        // Orient for Left Hand Hold
        // We want the bow vertical (World Y), grip in palm, and curving forward.
        // Default curve is vertical along Y.
        
        // Match Sword orientation (Along Local X)
        // Rotate -90 on Z so +Y (Top Limb) becomes +X (Forward/Hand Axis)
        group.rotation.z = -Math.PI / 2;
        group.position.set(0, 0, 0); 

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

            // Deterministic position in quiver (so they don't jump around on re-equip)
            // Use a simple pseudo-random generation based on the arrow index
            const seed = (i + 1) * 9301 + 49297;
            const prng = (offset: number) => {
                const val = Math.sin(seed + offset) * 10000;
                return val - Math.floor(val);
            };

            const angle = prng(0) * Math.PI * 2;
            const r = prng(1) * 0.04;
            
            arrow.position.set(
                Math.cos(angle) * r, 
                0.1 + prng(2) * 0.1, 
                Math.sin(angle) * r
            );
            
            arrow.rotation.z = (prng(3) - 0.5) * 0.1;
            arrow.rotation.x = (prng(4) - 0.5) * 0.1;
            
            group.add(arrow);
        }

        return group;
    }
}
