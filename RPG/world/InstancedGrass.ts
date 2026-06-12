import * as THREE from 'three';

// ============================================================================
// Wind-swaying instanced grass + flower patches for the RPG overworld.
// Shader modeled on game/environment/GrassManager.ts (uTime + wind direction
// vertex sway, per-instance color variation), but placement is rejection-
// sampled from caller-provided allowAt/heightAt predicates so it works on any
// terrain instead of the biome grid.
// ============================================================================

const BLADE_HEIGHT = 0.46;

const GRASS_VERTEX_SHADER = `
varying vec3 vColor;
varying float vHeightFactor;
uniform float uTime;
uniform vec3 uWindDir;

void main() {
    vColor = instanceColor;

    vec4 worldPos = instanceMatrix * vec4(position, 1.0);

    float h = position.y;
    vHeightFactor = clamp(h / ${BLADE_HEIGHT.toFixed(2)}, 0.0, 1.0);

    float windStrength = 0.22;
    float windSpeed = 1.1;

    // Slow rolling gusts + fine flutter; roots (vHeightFactor=0) stay planted.
    float gusts = sin(worldPos.x * 0.08 + worldPos.z * 0.08 + uTime * 0.55);
    float noise = sin(worldPos.x * 1.6 + worldPos.z * 1.4 + uTime * windSpeed);

    float totalSway = (noise * 0.5 + gusts * 0.5) * windStrength * vHeightFactor;
    vec3 displacement = uWindDir * totalSway;
    displacement.y -= totalSway * totalSway * 0.25;

    gl_Position = projectionMatrix * viewMatrix * modelMatrix * (worldPos + vec4(displacement, 0.0));
}
`;

const GRASS_FRAGMENT_SHADER = `
varying vec3 vColor;
varying float vHeightFactor;

void main() {
    vec3 baseColor = vColor * 0.62;
    vec3 tipColor = vColor * 1.35;
    vec3 finalColor = mix(baseColor, tipColor, vHeightFactor);
    gl_FragColor = vec4(finalColor, 1.0);
}
`;

export interface InstancedScatterOptions {
    count: number;
    /** Samples are drawn from the square [-areaExtent, areaExtent] on both axes. */
    areaExtent: number;
    allowAt: (x: number, z: number) => boolean;
    heightAt: (x: number, z: number) => number;
    baseColor?: THREE.Color;
}

export class InstancedGrass {
    private parent: THREE.Object3D;
    private mesh: THREE.InstancedMesh;
    private material: THREE.ShaderMaterial;
    private time = Math.random() * 100;

    constructor(parent: THREE.Object3D, opts: InstancedScatterOptions) {
        this.parent = parent;

        const geometry = this.createTuftGeometry();

        this.material = new THREE.ShaderMaterial({
            vertexShader: GRASS_VERTEX_SHADER,
            fragmentShader: GRASS_FRAGMENT_SHADER,
            uniforms: {
                uTime: { value: 0 },
                uWindDir: { value: new THREE.Vector3(1, 0, 0.35).normalize() },
            },
            side: THREE.DoubleSide,
        });

        this.mesh = new THREE.InstancedMesh(geometry, this.material, opts.count);
        this.mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
        this.mesh.castShadow = false;
        this.mesh.receiveShadow = false;
        // Instance matrices are world-space offsets; skip per-mesh culling.
        this.mesh.frustumCulled = false;

        // Optional base color shifts the whole palette (default yellow-green).
        const baseHSL = { h: 0.265, s: 0.6, l: 0.4 };
        if (opts.baseColor) opts.baseColor.getHSL(baseHSL);

        const dummy = new THREE.Object3D();
        const color = new THREE.Color();
        const span = opts.areaExtent * 2;

        let spawned = 0;
        const maxAttempts = opts.count * 14;
        for (let attempt = 0; attempt < maxAttempts && spawned < opts.count; attempt++) {
            const x = -opts.areaExtent + Math.random() * span;
            const z = -opts.areaExtent + Math.random() * span;
            if (!opts.allowAt(x, z)) continue;

            dummy.position.set(x, opts.heightAt(x, z) - 0.02, z);
            dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
            const w = 0.75 + Math.random() * 0.7;
            const h = 0.6 + Math.random() * 0.75;
            dummy.scale.set(w, h, w);
            dummy.updateMatrix();
            this.mesh.setMatrixAt(spawned, dummy.matrix);

            // Yellow-green palette with per-instance HSL variation.
            color.setHSL(
                baseHSL.h + (Math.random() - 0.5) * 0.055,
                THREE.MathUtils.clamp(baseHSL.s * 0.75 + Math.random() * 0.3, 0, 1),
                THREE.MathUtils.clamp(baseHSL.l * 0.8 + Math.random() * 0.16, 0, 1)
            );
            this.mesh.setColorAt(spawned, color);
            spawned += 1;
        }

        this.mesh.count = spawned;
        this.mesh.instanceMatrix.needsUpdate = true;
        if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;

        this.parent.add(this.mesh);
    }

    /** 3-blade crossed tuft — 9 vertices per instance, no alpha, dirt cheap. */
    private createTuftGeometry(): THREE.BufferGeometry {
        const positions: number[] = [];
        const bladeCount = 3;

        for (let i = 0; i < bladeCount; i++) {
            const angle = (i / bladeCount) * Math.PI * 2 + 0.35 * i;
            const rootRadius = 0.035;
            const halfWidth = 0.05 + (i % 2) * 0.014;
            const height = BLADE_HEIGHT * (0.78 + (i % 3) * 0.13);
            const lean = 0.06 + (i % 2) * 0.05;

            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const rightX = Math.cos(angle + Math.PI * 0.5) * halfWidth;
            const rightZ = Math.sin(angle + Math.PI * 0.5) * halfWidth;
            const rootX = cos * rootRadius;
            const rootZ = sin * rootRadius;
            const tipX = rootX + cos * lean;
            const tipZ = rootZ + sin * lean;

            positions.push(
                rootX - rightX, 0, rootZ - rightZ,
                rootX + rightX, 0, rootZ + rightZ,
                tipX, height, tipZ
            );
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();
        return geometry;
    }

    public update(dt: number): void {
        this.time += dt;
        this.material.uniforms.uTime.value = this.time;
    }

    public dispose(): void {
        this.parent.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.material.dispose();
        this.mesh.dispose();
    }
}

// ============================================================================
// FlowerPatches — tiny 5-petal flowers in 4 colors, one InstancedMesh.
// ============================================================================

const FLOWER_COLORS = [0xfdf6e3, 0xf7d04b, 0x9b7bd8, 0xd85a5a]; // white/yellow/violet/red

export class FlowerPatches {
    private parent: THREE.Object3D;
    private mesh: THREE.InstancedMesh;
    private material: THREE.MeshLambertMaterial;

    constructor(parent: THREE.Object3D, opts: InstancedScatterOptions) {
        this.parent = parent;

        const geometry = this.createFlowerGeometry();
        this.material = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide });

        this.mesh = new THREE.InstancedMesh(geometry, this.material, opts.count);
        this.mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
        this.mesh.castShadow = false;
        this.mesh.receiveShadow = false;
        this.mesh.frustumCulled = false;

        const dummy = new THREE.Object3D();
        const color = new THREE.Color();
        const span = opts.areaExtent * 2;

        let spawned = 0;
        const maxAttempts = opts.count * 14;
        for (let attempt = 0; attempt < maxAttempts && spawned < opts.count; attempt++) {
            const x = -opts.areaExtent + Math.random() * span;
            const z = -opts.areaExtent + Math.random() * span;
            if (!opts.allowAt(x, z)) continue;

            dummy.position.set(x, opts.heightAt(x, z), z);
            dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
            const s = 0.75 + Math.random() * 0.6;
            dummy.scale.set(s, s, s);
            dummy.updateMatrix();
            this.mesh.setMatrixAt(spawned, dummy.matrix);

            color.setHex(FLOWER_COLORS[(Math.random() * FLOWER_COLORS.length) | 0]);
            color.offsetHSL((Math.random() - 0.5) * 0.02, 0, (Math.random() - 0.5) * 0.08);
            this.mesh.setColorAt(spawned, color);
            spawned += 1;
        }

        this.mesh.count = spawned;
        this.mesh.instanceMatrix.needsUpdate = true;
        if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;

        this.parent.add(this.mesh);
    }

    /** Thin stem + 5 tilted petal quads + a tiny center; ~26 tris per flower. */
    private createFlowerGeometry(): THREE.BufferGeometry {
        const positions: number[] = [];
        const headY = 0.22;
        const petalLen = 0.085;
        const petalHalfW = 0.034;

        const quad = (
            ax: number, ay: number, az: number,
            bx: number, by: number, bz: number,
            cx: number, cy: number, cz: number,
            dx: number, dy: number, dz: number
        ) => {
            positions.push(ax, ay, az, bx, by, bz, cx, cy, cz);
            positions.push(ax, ay, az, cx, cy, cz, dx, dy, dz);
        };

        // Stem: a slim vertical quad.
        quad(-0.012, 0, 0, 0.012, 0, 0, 0.012, headY, 0, -0.012, headY, 0);

        // 5 petals fanned around the head, tilted slightly upward.
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2;
            const cos = Math.cos(a);
            const sin = Math.sin(a);
            const rx = Math.cos(a + Math.PI / 2) * petalHalfW;
            const rz = Math.sin(a + Math.PI / 2) * petalHalfW;
            const inX = cos * 0.012;
            const inZ = sin * 0.012;
            const outX = cos * petalLen;
            const outZ = sin * petalLen;
            const tipLift = 0.035;
            quad(
                inX - rx, headY, inZ - rz,
                inX + rx, headY, inZ + rz,
                outX + rx * 0.55, headY + tipLift, outZ + rz * 0.55,
                outX - rx * 0.55, headY + tipLift, outZ - rz * 0.55
            );
        }

        // Center disc (two small triangles), slightly above the petals.
        const c = 0.02;
        quad(-c, headY + 0.012, -c, c, headY + 0.012, -c, c, headY + 0.012, c, -c, headY + 0.012, c);

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();
        return geometry;
    }

    public update(_dt: number): void {
        // Static — flowers are too small for sway to read; kept for API symmetry.
    }

    public dispose(): void {
        this.parent.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.material.dispose();
        this.mesh.dispose();
    }
}
