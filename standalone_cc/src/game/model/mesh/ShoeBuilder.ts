
import * as THREE from 'three';
import { PlayerMaterials } from '../PlayerMaterials';

export class ShoeBuilder {
    static create(materials: PlayerMaterials, isLeft: boolean, arrays: any) {
        const shoeMat = materials.boots;

        // --- Structure Setup (Matching FootBuilder hierarchy for animation) ---
        const heelGroup = new THREE.Group();
        heelGroup.name = (isLeft ? 'left' : 'right') + '_heel';

        const footGroup = new THREE.Group();
        footGroup.name = (isLeft ? 'left' : 'right') + '_foot_anchor';
        footGroup.add(heelGroup);

        const forefootGroup = new THREE.Group();
        forefootGroup.name = (isLeft ? 'left' : 'right') + '_forefoot';

        // Position forefoot at the ball of the foot (pivot point)
        forefootGroup.position.set(0, -0.045, 0.11);
        footGroup.add(forefootGroup);

        // --- Dimensions ---
        const shoeWidth = 0.118;
        const upperHeight = 0.072;
        const rearLen = 0.16;
        const toeLen = 0.145;
        const soleThick = 0.026;

        // 1) REAR UPPER (quarter/heel cup)
        const rearGeo = new THREE.BoxGeometry(shoeWidth, upperHeight, rearLen, 6, 5, 6);
        const rPos = rearGeo.attributes.position;
        const v = new THREE.Vector3();

        for (let i = 0; i < rPos.count; i++) {
            v.fromBufferAttribute(rPos, i);

            const yNorm = (v.y + upperHeight * 0.5) / upperHeight;
            const zNorm = (v.z + rearLen * 0.5) / rearLen;

            // Taper ankle opening
            if (yNorm > 0.6) {
                const t = (yNorm - 0.6) / 0.4;
                v.x *= 1.0 - t * 0.18;
                v.z *= 1.0 - t * 0.08;
            }

            // Round and pull-in heel
            if (zNorm < 0.28) {
                const t = (0.28 - zNorm) / 0.28;
                v.x *= 1.0 - t * 0.28;
                v.z -= t * 0.006;
            }

            // Create instep slope toward the front
            if (zNorm > 0.45 && yNorm > 0.45) {
                const zT = (zNorm - 0.45) / 0.55;
                const yT = (yNorm - 0.45) / 0.55;
                v.y -= zT * yT * 0.022;
            }

            rPos.setXYZ(i, v.x, v.y, v.z);
        }
        rearGeo.computeVertexNormals();

        const rearMesh = new THREE.Mesh(rearGeo, shoeMat);
        rearMesh.position.set(0, -0.022, 0.035);
        rearMesh.castShadow = true;
        heelGroup.add(rearMesh);
        arrays.heelGroups.push(heelGroup);

        // 2) TOE BOX (forefoot upper)
        const toeGeo = new THREE.BoxGeometry(shoeWidth * 0.94, upperHeight * 0.62, toeLen, 6, 4, 8);
        const tPos = toeGeo.attributes.position;

        for (let i = 0; i < tPos.count; i++) {
            v.fromBufferAttribute(tPos, i);
            const zNorm = (v.z + toeLen * 0.5) / toeLen;
            const yNorm = (v.y + upperHeight * 0.31) / (upperHeight * 0.62);

            // Gradual narrowing and flattening at the toe tip
            if (zNorm > 0.5) {
                const t = (zNorm - 0.5) / 0.5;
                v.x *= 1.0 - t * 0.34;
                if (v.y > 0) v.y *= 1.0 - t * 0.45;
            }

            // Slight vamp arch
            if (zNorm > 0.08 && zNorm < 0.7 && yNorm > 0.55) {
                const arch = Math.sin(((zNorm - 0.08) / 0.62) * Math.PI);
                v.y += arch * 0.006;
            }

            tPos.setXYZ(i, v.x, v.y, v.z);
        }
        toeGeo.computeVertexNormals();
        toeGeo.translate(0, 0, toeLen * 0.5); // back-face pivot

        const toeMesh = new THREE.Mesh(toeGeo, shoeMat);
        toeMesh.position.set(0, 0.0, -0.01);
        toeMesh.castShadow = true;
        forefootGroup.add(toeMesh);
        arrays.forefootGroups.push(forefootGroup);

        // 3) SOLES + HEEL BLOCK
        const rearSoleGeo = new THREE.BoxGeometry(shoeWidth * 1.08, soleThick, rearLen * 1.06);
        const rearSole = new THREE.Mesh(rearSoleGeo, shoeMat);
        rearSole.position.set(0, -upperHeight * 0.5 - soleThick * 0.5 + 0.002, 0);
        rearSole.castShadow = true;
        rearMesh.add(rearSole);

        const toeSoleGeo = new THREE.BoxGeometry(shoeWidth * 1.05, soleThick, toeLen * 1.04, 4, 1, 6);
        const tsPos = toeSoleGeo.attributes.position;
        for (let i = 0; i < tsPos.count; i++) {
            const z = tsPos.getZ(i);
            if (z > toeLen * 0.2) {
                const t = (z - toeLen * 0.2) / (toeLen * 0.32);
                tsPos.setX(i, tsPos.getX(i) * (1.0 - THREE.MathUtils.clamp(t, 0, 1) * 0.28));
            }
        }
        toeSoleGeo.computeVertexNormals();
        toeSoleGeo.translate(0, 0, toeLen * 0.5);

        const toeSole = new THREE.Mesh(toeSoleGeo, shoeMat);
        toeSole.position.set(0, -(upperHeight * 0.62) * 0.5 - soleThick * 0.5 + 0.002, -0.01);
        toeSole.castShadow = true;
        toeMesh.add(toeSole);

        const heelStack = new THREE.Mesh(
            new THREE.BoxGeometry(shoeWidth * 0.78, soleThick * 0.72, rearLen * 0.32),
            shoeMat
        );
        heelStack.position.set(0, -upperHeight * 0.5 - soleThick * 0.86, -rearLen * 0.24);
        heelStack.castShadow = true;
        rearMesh.add(heelStack);

        // 4) TONGUE + LACE BAND (subtle detail, not a floating white wedge)
        const tongueGeo = new THREE.BoxGeometry(shoeWidth * 0.52, 0.013, 0.075);
        const tongue = new THREE.Mesh(tongueGeo, shoeMat);
        tongue.position.set(0, upperHeight * 0.39, 0.035);
        tongue.rotation.x = -0.24;
        tongue.castShadow = true;
        rearMesh.add(tongue);

        const laceBand = new THREE.Mesh(
            new THREE.BoxGeometry(shoeWidth * 0.48, 0.01, 0.038),
            materials.underwear
        );
        laceBand.position.set(0, upperHeight * 0.355, 0.018);
        laceBand.rotation.x = -0.2;
        laceBand.castShadow = true;
        rearMesh.add(laceBand);

        return { heelGroup: footGroup, forefootGroup: forefootGroup };
    }
}
