
import * as THREE from 'three';
import { PlayerConfig } from '../../../types';

export class HairBuilder {
    static build(parts: any, config: PlayerConfig, material: THREE.Material) {
        const head = parts.head;
        const existing = head.getObjectByName('HairInstanced');
        if (existing) {
            head.remove(existing);
            (existing as THREE.InstancedMesh).geometry.dispose();
        }

        if (config.hairStyle === 'bald') return;

        const hairCapGroup = head.getObjectByName('HairCap');
        if (!hairCapGroup) return;

        const emitters: THREE.Mesh[] = [];
        hairCapGroup.traverse((c: any) => {
            if (c.isMesh) emitters.push(c);
        });

        if (emitters.length === 0) return;

        // Optimization: Further reduce hair count for character performance
        const HAIR_COUNT = 800;
        const hairLen = 0.055; 
        const hairThick = 0.005; 

        const hairGeo = new THREE.CylinderGeometry(0.001, hairThick, hairLen, 3, 2, false);
        hairGeo.translate(0, hairLen / 2, 0);

        const hairMat = material.clone();
        const uInertia = { value: new THREE.Vector3(0, 0, 0) };
        const uGravity = { value: new THREE.Vector3(0, -0.01, 0) };
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
                float speedInfluence = pow(uSpeed * 0.2, 0.6); 
                float wave1 = sin(uTime * 4.0 + position.y * 50.0 + position.x * 100.0) * 0.003;
                float wave2 = cos(uTime * 18.0 + position.z * 150.0) * 0.0015;
                float totalFlutter = (wave1 + wave2) * speedInfluence * h;
                displacement.x += totalFlutter;
                displacement.z += totalFlutter * 0.7;
                displacement.y -= speedInfluence * 0.01 * h;
                transformed += displacement;
                `
            );
        };

        const instancedMesh = new THREE.InstancedMesh(hairGeo, hairMat, HAIR_COUNT);
        instancedMesh.name = 'HairInstanced';
        instancedMesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
        instancedMesh.castShadow = true;
        instancedMesh.frustumCulled = true;

        const dummy = new THREE.Object3D();
        const _position = new THREE.Vector3();
        const _normal = new THREE.Vector3();
        const _target = new THREE.Vector3();

        let totalArea = 0;
        const emitterData: { mesh: THREE.Mesh, area: number }[] = [];

        emitters.forEach(mesh => {
            const geo = mesh.geometry;
            const pos = geo.attributes.position;
            const idx = geo.index;
            const count = idx ? idx.count : pos.count;
            let area = 0;
            const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
            const temp1 = new THREE.Vector3(), temp2 = new THREE.Vector3();
            
            for (let i = 0; i < count; i += 3) {
                if (idx) {
                    a.fromBufferAttribute(pos, idx.getX(i));
                    b.fromBufferAttribute(pos, idx.getX(i+1));
                    c.fromBufferAttribute(pos, idx.getX(i+2));
                } else {
                    a.fromBufferAttribute(pos, i);
                    b.fromBufferAttribute(pos, i+1);
                    c.fromBufferAttribute(pos, i+2);
                }
                temp1.subVectors(b, a);
                temp2.subVectors(c, a);
                temp1.cross(temp2);
                area += 0.5 * temp1.length();
            }
            totalArea += area;
            emitterData.push({ mesh, area }); 
        });

        let hairsGenerated = 0;
        let seed = 42;
        const random = () => {
            seed = (seed * 16807) % 2147483647;
            return (seed - 1) / 2147483646;
        };

        emitterData.forEach(data => {
            if (totalArea === 0) return;
            const count = Math.floor((data.area / totalArea) * HAIR_COUNT);
            const geo = data.mesh.geometry;
            const pos = geo.attributes.position;
            const norm = geo.attributes.normal;
            const idx = geo.index;
            const triangleCount = (idx ? idx.count : pos.count) / 3;

            for (let k = 0; k < count; k++) {
                if (hairsGenerated >= HAIR_COUNT) break;

                const triIndex = Math.floor(random() * triangleCount) * 3;
                let iA, iB, iC;
                if (idx) {
                    iA = idx.getX(triIndex); iB = idx.getX(triIndex+1); iC = idx.getX(triIndex+2);
                } else {
                    iA = triIndex; iB = triIndex+1; iC = triIndex+2;
                }

                let r1 = random(), r2 = random();
                if (r1 + r2 > 1) { r1 = 1 - r1; r2 = 1 - r2; }
                const r3 = 1 - r1 - r2;

                _position.set(0,0,0);
                _position.addScaledVector(new THREE.Vector3().fromBufferAttribute(pos, iA), r1);
                _position.addScaledVector(new THREE.Vector3().fromBufferAttribute(pos, iB), r2);
                _position.addScaledVector(new THREE.Vector3().fromBufferAttribute(pos, iC), r3);

                _normal.set(0,0,0);
                _normal.addScaledVector(new THREE.Vector3().fromBufferAttribute(norm, iA), r1);
                _normal.addScaledVector(new THREE.Vector3().fromBufferAttribute(norm, iB), r2);
                _normal.addScaledVector(new THREE.Vector3().fromBufferAttribute(norm, iC), r3);
                _normal.normalize();

                dummy.position.copy(_position);
                _target.copy(_position).add(_normal);
                dummy.lookAt(_target);
                dummy.rotateX(Math.PI / 2);
                dummy.rotateX((random() - 0.5) * 0.3);
                dummy.rotateZ((random() - 0.5) * 0.3);
                const s = 0.9 + random() * 0.2;
                dummy.scale.set(s, s * (0.8 + random() * 0.4), s);
                dummy.updateMatrix();
                instancedMesh.setMatrixAt(hairsGenerated, dummy.matrix);
                hairsGenerated++;
            }
        });

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
    }
}
