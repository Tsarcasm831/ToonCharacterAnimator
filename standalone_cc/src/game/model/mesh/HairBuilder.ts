import * as THREE from 'three';
import type { PlayerConfig } from '../../../types';

export class HairBuilder {
    private static getSampleWeight(position: THREE.Vector3, normal: THREE.Vector3): number {
        const upward = THREE.MathUtils.clamp((normal.y + 0.2) / 1.2, 0, 1);
        const height = THREE.MathUtils.smoothstep(position.y, -0.02, 0.2);
        const side = 1 - THREE.MathUtils.smoothstep(Math.abs(position.x), 0.11, 0.19);
        const front = 1 - THREE.MathUtils.smoothstep(position.z, -0.01, 0.11);
        return THREE.MathUtils.clamp(upward * 0.45 + height * 0.3 + side * 0.15 + front * 0.1, 0, 1);
    }

    static build(parts: any, config: PlayerConfig, material: THREE.Material): boolean {
        const head = parts.head;
        if (!head) return false;

        const existing = head.getObjectByName('HairInstanced');
        if (existing) {
            head.remove(existing);
            if (existing instanceof THREE.InstancedMesh) {
                existing.geometry.dispose();
                if (Array.isArray(existing.material)) existing.material.forEach(m => m.dispose());
                else if (existing.material) existing.material.dispose();
            }
        }

        if (config.hairStyle === 'bald') return false;
        if (config.hairStyle === 'crew') return false;

        const hairCapGroup = head.getObjectByName('HairCap');
        if (!hairCapGroup) return false;

        const emitters: THREE.Mesh[] = [];
        hairCapGroup.traverse((c: any) => {
            if (c.isMesh) emitters.push(c);
        });

        if (emitters.length === 0) return false;

        const HAIR_COUNT = 900;
        const hairLen = 0.042;
        const rootRadius = 0.0012;
        const tipRadius = 0.0036;

        const hairGeo = new THREE.CylinderGeometry(rootRadius, tipRadius, hairLen, 5, 2, false);
        hairGeo.translate(0, hairLen / 2, 0);

        const hairMat = material.clone() as THREE.MeshToonMaterial;
        hairMat.vertexColors = true;
        hairMat.transparent = false;
        hairMat.opacity = 1;
        hairMat.side = THREE.DoubleSide;
        hairMat.depthWrite = true;

        const uInertia = { value: new THREE.Vector3(0, 0, 0) };
        const uGravity = { value: new THREE.Vector3(0, -0.008, 0) };
        const uSpeed = { value: 0.0 };

        hairMat.onBeforeCompile = (shader) => {
            shader.uniforms.uHairInertia = uInertia;
            shader.uniforms.uGravity = uGravity;
            shader.uniforms.uSpeed = uSpeed;
            shader.uniforms.uTime = { value: 0 };

            shader.vertexShader = `
                uniform vec3 uHairInertia;
                uniform vec3 uGravity;
                uniform float uSpeed;
                uniform float uTime;
                ${shader.vertexShader}
            `;

            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
                #include <begin_vertex>
                float h = clamp(position.y / ${hairLen.toFixed(4)}, 0.0, 1.0);
                float bendFactor = h * h * (3.0 - 2.0 * h);
                vec3 displacement = (uHairInertia + uGravity) * bendFactor;
                float speedInfluence = pow(max(uSpeed, 0.0) * 0.18, 0.6);
                float wave1 = sin(uTime * 4.0 + position.y * 48.0 + position.x * 95.0) * 0.0013;
                float wave2 = cos(uTime * 15.0 + position.z * 125.0) * 0.0008;
                float totalFlutter = (wave1 + wave2) * (0.35 + speedInfluence) * h;
                displacement.x += totalFlutter;
                displacement.z += totalFlutter * 0.7;
                displacement.y -= speedInfluence * 0.004 * h;
                transformed += displacement;
                `
            );
        };
        (hairMat as any).customProgramCacheKey = () => 'hair-cylinder-instanced-v1';
        hairMat.needsUpdate = true;

        const instancedMesh = new THREE.InstancedMesh(hairGeo, hairMat, HAIR_COUNT);
        instancedMesh.name = 'HairInstanced';
        instancedMesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
        instancedMesh.castShadow = true;
        instancedMesh.receiveShadow = false;
        instancedMesh.frustumCulled = false;

        const dummy = new THREE.Object3D();
        const position = new THREE.Vector3();
        const normal = new THREE.Vector3();
        const direction = new THREE.Vector3();
        const target = new THREE.Vector3();
        const up = new THREE.Vector3(0, 1, 0);
        const a = new THREE.Vector3();
        const b = new THREE.Vector3();
        const c = new THREE.Vector3();
        const na = new THREE.Vector3();
        const nb = new THREE.Vector3();
        const nc = new THREE.Vector3();
        const edge1 = new THREE.Vector3();
        const edge2 = new THREE.Vector3();
        const tempColor = new THREE.Color();
        const baseColor = material instanceof THREE.MeshToonMaterial
            ? material.color.clone()
            : new THREE.Color(config.hairColor);

        let totalArea = 0;
        const emitterData: { mesh: THREE.Mesh; area: number; normalMatrix: THREE.Matrix3 }[] = [];

        emitters.forEach(mesh => {
            const geo = mesh.geometry;
            const pos = geo.attributes.position;
            const idx = geo.index;
            const count = idx ? idx.count : pos.count;
            let area = 0;
            const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrix);

            for (let i = 0; i < count; i += 3) {
                if (idx) {
                    a.fromBufferAttribute(pos, idx.getX(i));
                    b.fromBufferAttribute(pos, idx.getX(i + 1));
                    c.fromBufferAttribute(pos, idx.getX(i + 2));
                } else {
                    a.fromBufferAttribute(pos, i);
                    b.fromBufferAttribute(pos, i + 1);
                    c.fromBufferAttribute(pos, i + 2);
                }
                edge1.subVectors(b, a);
                edge2.subVectors(c, a);
                edge1.cross(edge2);
                area += 0.5 * edge1.length();
            }

            totalArea += area;
            emitterData.push({ mesh, area, normalMatrix });
        });

        let hairsGenerated = 0;
        let seed = 42;
        const random = () => {
            seed = (seed * 16807) % 2147483647;
            return (seed - 1) / 2147483646;
        };

        emitterData.forEach(data => {
            if (totalArea === 0) return;
            const targetCount = Math.ceil((data.area / totalArea) * HAIR_COUNT * 1.8);
            const geo = data.mesh.geometry;
            const pos = geo.attributes.position;
            const norm = geo.attributes.normal;
            const idx = geo.index;
            const triangleCount = (idx ? idx.count : pos.count) / 3;

            for (let k = 0; k < targetCount; k++) {
                if (hairsGenerated >= HAIR_COUNT) break;

                const triIndex = Math.floor(random() * triangleCount) * 3;
                let iA: number;
                let iB: number;
                let iC: number;
                if (idx) {
                    iA = idx.getX(triIndex);
                    iB = idx.getX(triIndex + 1);
                    iC = idx.getX(triIndex + 2);
                } else {
                    iA = triIndex;
                    iB = triIndex + 1;
                    iC = triIndex + 2;
                }

                let r1 = random();
                let r2 = random();
                if (r1 + r2 > 1) {
                    r1 = 1 - r1;
                    r2 = 1 - r2;
                }
                const r3 = 1 - r1 - r2;

                a.fromBufferAttribute(pos, iA).applyMatrix4(data.mesh.matrix);
                b.fromBufferAttribute(pos, iB).applyMatrix4(data.mesh.matrix);
                c.fromBufferAttribute(pos, iC).applyMatrix4(data.mesh.matrix);
                position.set(0, 0, 0);
                position.addScaledVector(a, r1);
                position.addScaledVector(b, r2);
                position.addScaledVector(c, r3);

                na.fromBufferAttribute(norm, iA).applyMatrix3(data.normalMatrix).normalize();
                nb.fromBufferAttribute(norm, iB).applyMatrix3(data.normalMatrix).normalize();
                nc.fromBufferAttribute(norm, iC).applyMatrix3(data.normalMatrix).normalize();
                normal.set(0, 0, 0);
                normal.addScaledVector(na, r1);
                normal.addScaledVector(nb, r2);
                normal.addScaledVector(nc, r3);
                normal.normalize();

                const sampleWeight = this.getSampleWeight(position, normal);
                if (sampleWeight <= 0.12 || random() > sampleWeight) continue;

                direction.copy(normal).multiplyScalar(0.35).addScaledVector(up, 0.82);
                direction.z -= THREE.MathUtils.smoothstep(position.z, -0.04, 0.08) * 0.08;
                direction.x -= Math.sign(position.x) * THREE.MathUtils.smoothstep(Math.abs(position.x), 0.08, 0.17) * 0.05;
                direction.normalize();

                dummy.position.copy(position).addScaledVector(normal, 0.0015);
                target.copy(dummy.position).add(direction);
                dummy.lookAt(target);
                dummy.rotateX(Math.PI / 2);
                dummy.rotateX(-0.22 + random() * 0.12);
                dummy.rotateZ((random() - 0.5) * 0.22);

                const widthScale = 0.85 + random() * 0.45;
                const lengthScale = 0.78 + random() * 0.3 + sampleWeight * 0.18;
                dummy.scale.set(widthScale, lengthScale, widthScale);
                dummy.updateMatrix();

                instancedMesh.setMatrixAt(hairsGenerated, dummy.matrix);
                tempColor.copy(baseColor).multiplyScalar(0.9 + random() * 0.14);
                instancedMesh.setColorAt(hairsGenerated, tempColor);
                hairsGenerated++;
            }
        });

        if (hairsGenerated === 0) {
            hairGeo.dispose();
            hairMat.dispose();
            return false;
        }

        instancedMesh.count = hairsGenerated;
        instancedMesh.instanceMatrix.needsUpdate = true;
        if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;

        instancedMesh.onBeforeRender = () => {
            const m = instancedMesh.material as any;
            if (m.uniforms && m.uniforms.uTime) {
                m.uniforms.uTime.value = performance.now() * 0.001;
            }
        };

        head.add(instancedMesh);
        instancedMesh.userData.uInertia = uInertia;
        instancedMesh.userData.uGravity = uGravity;
        instancedMesh.userData.uSpeed = uSpeed;
        return true;
    }
}
