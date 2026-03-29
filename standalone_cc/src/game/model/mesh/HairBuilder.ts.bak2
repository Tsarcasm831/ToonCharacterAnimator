
import * as THREE from 'three';
import { PlayerConfig } from '../../../types';

export class HairBuilder {
    private static strandAlphaMap: THREE.CanvasTexture | null = null;

    private static getStrandAlphaMap(): THREE.Texture | null {
        if (typeof document === 'undefined') return null;
        if (this.strandAlphaMap) return this.strandAlphaMap;

        const width = 32;
        const height = 128;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const img = ctx.createImageData(width, height);
        const data = img.data;
        const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
        const smoothstep = (edge0: number, edge1: number, x: number) => {
            const t = clamp01((x - edge0) / (edge1 - edge0));
            return t * t * (3 - 2 * t);
        };

        for (let y = 0; y < height; y++) {
            const v = y / (height - 1); // 0=root, 1=tip
            for (let x = 0; x < width; x++) {
                const u = x / (width - 1);
                const center = 1 - Math.abs(u - 0.5) * 2;
                const profile = Math.pow(clamp01(center), 1.7);
                const rootFade = smoothstep(0.0, 0.06, v);
                const tipFade = 1.0 - smoothstep(0.72, 1.0, v);
                const micro = 0.88 + Math.sin(v * 80 + u * 23) * 0.08;
                const alpha = clamp01(profile * rootFade * tipFade * micro);
                const value = Math.floor(alpha * 255);
                const idx = (y * width + x) * 4;
                data[idx] = value;
                data[idx + 1] = value;
                data[idx + 2] = value;
                data[idx + 3] = 255;
            }
        }

        ctx.putImageData(img, 0, 0);
        this.strandAlphaMap = new THREE.CanvasTexture(canvas);
        this.strandAlphaMap.wrapS = THREE.ClampToEdgeWrapping;
        this.strandAlphaMap.wrapT = THREE.ClampToEdgeWrapping;
        this.strandAlphaMap.minFilter = THREE.LinearMipmapLinearFilter;
        this.strandAlphaMap.magFilter = THREE.LinearFilter;
        this.strandAlphaMap.generateMipmaps = true;
        return this.strandAlphaMap;
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

        const hairCapGroup = head.getObjectByName('HairCap');
        if (!hairCapGroup) return false;

        const emitters: THREE.Mesh[] = [];
        hairCapGroup.traverse((c: any) => {
            if (c.isMesh) emitters.push(c);
        });

        if (emitters.length === 0) return false;

        // Instanced cards keep draw calls low while still reading as many strands.
        const HAIR_COUNT = 560;
        const hairLen = 0.058;
        const cardWidth = 0.0115;

        const hairGeo = new THREE.PlaneGeometry(cardWidth, hairLen, 1, 4);
        hairGeo.translate(0, hairLen / 2, 0);

        const hairMat = material.clone() as THREE.MeshToonMaterial;
        hairMat.side = THREE.DoubleSide;
        hairMat.transparent = true;
        hairMat.opacity = 0.98;
        hairMat.alphaTest = 0.38;
        hairMat.depthWrite = false;
        hairMat.alphaMap = this.getStrandAlphaMap();
        hairMat.vertexColors = true;

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
                float speedInfluence = pow(max(uSpeed, 0.0) * 0.22, 0.62);
                float seed = fract(sin(dot(instanceMatrix[3].xyz, vec3(12.9898, 78.233, 37.719))) * 43758.5453123);
                float wave1 = sin(uTime * (3.5 + seed * 2.0) + position.y * 42.0 + seed * 6.2831) * (0.0018 + seed * 0.0014);
                float wave2 = cos(uTime * 11.0 + position.y * 27.0 + position.x * 55.0 + seed * 9.1) * 0.001;
                float totalFlutter = (wave1 + wave2) * (0.5 + speedInfluence) * h;
                displacement.x += totalFlutter;
                displacement.z += totalFlutter * 0.7;
                displacement.y -= speedInfluence * 0.005 * h;
                transformed += displacement;
                `
            );
        };
        (hairMat as any).customProgramCacheKey = () => 'hair-card-instanced-v3';
        hairMat.needsUpdate = true;

        const instancedMesh = new THREE.InstancedMesh(hairGeo, hairMat, HAIR_COUNT);
        instancedMesh.name = 'HairInstanced';
        instancedMesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
        instancedMesh.castShadow = false;
        instancedMesh.receiveShadow = false;
        instancedMesh.frustumCulled = false;

        const dummy = new THREE.Object3D();
        const up = new THREE.Vector3(0, 1, 0);
        const position = new THREE.Vector3();
        const normal = new THREE.Vector3();
        const target = new THREE.Vector3();
        const quat = new THREE.Quaternion();
        const twist = new THREE.Quaternion();
        const a = new THREE.Vector3();
        const b = new THREE.Vector3();
        const c = new THREE.Vector3();
        const na = new THREE.Vector3();
        const nb = new THREE.Vector3();
        const nc = new THREE.Vector3();
        const edge1 = new THREE.Vector3();
        const edge2 = new THREE.Vector3();
        const tempColor = new THREE.Color();
        const baseColor = (hairMat.color ? hairMat.color.clone() : new THREE.Color(0x3e2723));

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
                    b.fromBufferAttribute(pos, idx.getX(i+1));
                    c.fromBufferAttribute(pos, idx.getX(i+2));
                } else {
                    a.fromBufferAttribute(pos, i);
                    b.fromBufferAttribute(pos, i+1);
                    c.fromBufferAttribute(pos, i+2);
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

                a.fromBufferAttribute(pos, iA).applyMatrix4(data.mesh.matrix);
                b.fromBufferAttribute(pos, iB).applyMatrix4(data.mesh.matrix);
                c.fromBufferAttribute(pos, iC).applyMatrix4(data.mesh.matrix);
                position.set(0,0,0);
                position.addScaledVector(a, r1);
                position.addScaledVector(b, r2);
                position.addScaledVector(c, r3);

                na.fromBufferAttribute(norm, iA).applyMatrix3(data.normalMatrix).normalize();
                nb.fromBufferAttribute(norm, iB).applyMatrix3(data.normalMatrix).normalize();
                nc.fromBufferAttribute(norm, iC).applyMatrix3(data.normalMatrix).normalize();
                normal.set(0,0,0);
                normal.addScaledVector(na, r1);
                normal.addScaledVector(nb, r2);
                normal.addScaledVector(nc, r3);
                normal.normalize();

                dummy.position.copy(position).addScaledVector(normal, 0.0016);
                target.copy(position).add(normal);
                dummy.lookAt(target);

                quat.setFromUnitVectors(up, normal);
                twist.setFromAxisAngle(normal, random() * Math.PI * 2);
                quat.multiply(twist);
                dummy.quaternion.copy(quat);
                dummy.rotateX(0.18 + random() * 0.26);

                const widthScale = 0.7 + random() * 0.6;
                const lengthScale = 0.78 + random() * 0.5;
                dummy.scale.set(widthScale, lengthScale, 1);
                dummy.updateMatrix();

                instancedMesh.setMatrixAt(hairsGenerated, dummy.matrix);
                const tone = 0.84 + random() * 0.24;
                tempColor.copy(baseColor).multiplyScalar(tone);
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
