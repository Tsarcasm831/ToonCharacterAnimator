
import * as THREE from 'three';

export class SkirtPhysics {
    static animate(player: any, parts: any, dt: number) {
        const skirt = parts.pelvis?.children.find((m: any) => m.geometry?.type === 'CylinderGeometry' && m.material?.type === 'MeshToonMaterial');
        if (!skirt) return;

        const leftThigh = parts.leftThigh;
        const rightThigh = parts.rightThigh;
        if (!leftThigh || !rightThigh) return;

        // Ensure world matrices are up to date for collision
        leftThigh.updateMatrixWorld();
        rightThigh.updateMatrixWorld();
        skirt.updateMatrixWorld();

        const skirtWorldPos = new THREE.Vector3();
        skirt.getWorldPosition(skirtWorldPos);

        const skirtMatrixInv = skirt.matrixWorld.clone().invert();
        const geo = skirt.geometry;
        const posAttr = geo.attributes.position;
        
        // We only want to affect the bottom vertices (y < 0)
        // CylinderGeometry vertices: top circle, bottom circle, then side faces
        // For a cylinder of height 'h', top is h/2, bottom is -h/2
        
        const thighRadius = 0.12; // Approximate radius of thigh collision
        const pushStrength = 0.8;
        const damping = 0.95;

        if (!skirt.userData.originalPositions) {
            skirt.userData.originalPositions = posAttr.array.slice();
            skirt.userData.velocities = new Float32Array(posAttr.count * 3);
        }

        const orig = skirt.userData.originalPositions;
        const vels = skirt.userData.velocities;

        // Get thigh positions in skirt local space
        const leftThighPos = new THREE.Vector3(0, -0.2, 0).applyMatrix4(leftThigh.matrixWorld).applyMatrix4(skirtMatrixInv);
        const rightThighPos = new THREE.Vector3(0, -0.2, 0).applyMatrix4(rightThigh.matrixWorld).applyMatrix4(skirtMatrixInv);

        for (let i = 0; i < posAttr.count; i++) {
            const ix = i * 3;
            const iy = i * 3 + 1;
            const iz = i * 3 + 2;

            // Current local position
            let px = posAttr.array[ix];
            let py = posAttr.array[iy];
            let pz = posAttr.array[iz];

            // Target (original) position
            const tx = orig[ix];
            const ty = orig[iy];
            const tz = orig[iz];

            // Only simulate physics for bottom half of skirt
            if (py < 0) {
                // Spring back to original
                vels[ix] += (tx - px) * 150 * dt;
                vels[iy] += (ty - py) * 150 * dt;
                vels[iz] += (tz - pz) * 150 * dt;

                // Collision with thighs
                const p = new THREE.Vector3(px, py, pz);
                
                [leftThighPos, rightThighPos].forEach(thighPos => {
                    const distToThigh = p.distanceTo(thighPos);
                    if (distToThigh < thighRadius) {
                        const dir = p.clone().sub(thighPos).normalize();
                        const push = (thighRadius - distToThigh) * pushStrength;
                        vels[ix] += dir.x * push * 500 * dt;
                        vels[iz] += dir.z * push * 500 * dt;
                    }
                });

                // Damping
                vels[ix] *= damping;
                vels[iy] *= damping;
                vels[iz] *= damping;

                // Integrate
                posAttr.array[ix] += vels[ix] * dt;
                posAttr.array[iy] += vels[iy] * dt;
                posAttr.array[iz] += vels[iz] * dt;
            }
        }

        posAttr.needsUpdate = true;
    }
}
