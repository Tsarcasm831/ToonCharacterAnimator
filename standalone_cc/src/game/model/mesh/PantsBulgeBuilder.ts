import * as THREE from 'three';

interface PantsBulgeOptions {
    position?: { x: number; y: number; z: number };
    scale?: { x: number; y: number; z: number };
    rotationX?: number;
}

export class PantsBulgeBuilder {
    static build(material: THREE.Material, options: PantsBulgeOptions = {}): THREE.Mesh {
        const geo = new THREE.SphereGeometry(0.054, 20, 16);
        const pos = geo.attributes.position;
        const v = new THREE.Vector3();

        for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i);

            // Keep the rear surface nearly flush with the pelvis so the mesh blends into the pants.
            if (v.z < 0) {
                v.z *= 0.18;
            } else {
                const centerBias = Math.max(0, 1.0 - Math.abs(v.x) / 0.085);
                const lowBias = THREE.MathUtils.clamp((0.04 - v.y) / 0.11, 0, 1);
                const midBias = THREE.MathUtils.clamp(1.0 - Math.abs(v.y + 0.01) / 0.08, 0, 1);
                const topBias = THREE.MathUtils.clamp((v.y + 0.005) / 0.055, 0, 1);

                // Low-profile, broad mound integrated into the fly area.
                v.z *= 0.62;
                v.z += centerBias * lowBias * 0.012;
                v.z += centerBias * midBias * 0.008;
                v.y -= centerBias * lowBias * 0.006;

                // Flatten the top/front so the shape never forms a tip.
                v.z *= 1.0 - topBias * 0.22;
                if (v.z > 0.032) {
                    const t = THREE.MathUtils.clamp((v.z - 0.032) / 0.018, 0, 1);
                    v.z -= t * 0.012;
                    v.x *= 1.0 + t * 0.05;
                }
            }

            // Blend into the inseam smoothly without collapsing to a point.
            if (v.y < -0.005) {
                const t = THREE.MathUtils.clamp((-0.005 - v.y) / 0.07, 0, 1);
                v.x *= 1.0 - t * 0.06;
                v.z *= 1.0 - t * 0.12;
            }

            pos.setXYZ(i, v.x, v.y, v.z);
        }

        geo.computeVertexNormals();

        const mesh = new THREE.Mesh(geo, material);
        const position = options.position ?? { x: 0, y: -0.09, z: 0.102 };
        const scale = options.scale ?? { x: 0.86, y: 0.82, z: 0.62 };

        mesh.name = 'pantsBulge';
        mesh.castShadow = true;
        mesh.position.set(position.x, position.y, position.z);
        mesh.scale.set(scale.x, scale.y, scale.z);
        mesh.rotation.x = options.rotationX ?? 0.12;

        return mesh;
    }
}
