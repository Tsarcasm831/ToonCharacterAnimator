import * as THREE from 'three';

// ============================================================================
// Reusable procedural loot/storage container prop (chest / barrel / crate).
// Engine-layer object: no imports from RPG/. Interaction code finds it via
// userData: { type: 'hard', interactType: 'container', containerId, containerLabel }
// on the root group and every child mesh.
// ============================================================================

export interface ContainerObjectOptions {
    kind: 'chest' | 'barrel' | 'crate';
    id: string;
    label: string;
}

/** Back-compat alias. */
export type ContainerOptions = ContainerObjectOptions;

interface TintBackup {
    material: THREE.MeshStandardMaterial;
    color: THREE.Color;
    emissive: THREE.Color;
    emissiveIntensity: number;
}

export class Container {
    public mesh: THREE.Group;
    public readonly id: string;
    public readonly kind: 'chest' | 'barrel' | 'crate';

    private lid: THREE.Group;
    private glow: THREE.Group;
    private glint: THREE.Mesh | null = null;
    private glowRingMat: THREE.MeshBasicMaterial | null = null;
    private glintMat: THREE.MeshStandardMaterial | null = null;

    private openT = 0;          // 0 = closed, 1 = fully open
    private targetOpenT = 0;
    private looted = false;
    private glowTime = Math.random() * Math.PI * 2;
    private tintBackups: TintBackup[] = [];

    constructor(position: THREE.Vector3, rotationY: number, options: ContainerObjectOptions) {
        this.id = options.id;
        this.kind = options.kind;

        this.mesh = new THREE.Group();
        this.mesh.position.copy(position);
        this.mesh.rotation.y = rotationY;

        this.lid = new THREE.Group();
        this.glow = new THREE.Group();

        if (options.kind === 'chest') this.buildChest();
        else if (options.kind === 'barrel') this.buildBarrel();
        else this.buildCrate();

        // Interaction / collision tagging on the root AND every child.
        // (Done BEFORE the decorative glow is attached so the glow stays 'soft'
        // and its base ring does not inflate the collision AABB.)
        const tag = {
            type: 'hard',
            interactType: 'container',
            containerId: options.id,
            containerLabel: options.label,
        };
        this.mesh.userData = { ...this.mesh.userData, ...tag };
        this.mesh.traverse((child) => {
            child.userData = { ...child.userData, ...tag };
        });

        // Remember original material colors for the looted desaturation toggle.
        this.mesh.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                this.tintBackups.push({
                    material: child.material,
                    color: child.material.color.clone(),
                    emissive: child.material.emissive.clone(),
                    emissiveIntensity: child.material.emissiveIntensity,
                });
            }
        });

        this.buildGlow();
        this.glow.userData = { ...this.glow.userData, interactType: 'container', containerId: options.id, containerLabel: options.label };
        this.mesh.add(this.glow);
    }

    // ------------------------------------------------------------------ wood

    private wood(baseHex: number, tone: number = 0): THREE.MeshStandardMaterial {
        // Per-instance material with a slight HSL variation so plank stripes read.
        const color = new THREE.Color(baseHex);
        color.offsetHSL((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.08, tone + (Math.random() - 0.5) * 0.045);
        return new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0.04, flatShading: false });
    }

    private metal(): THREE.MeshStandardMaterial {
        return new THREE.MeshStandardMaterial({ color: 0x33312e, roughness: 0.45, metalness: 0.75 });
    }

    private addPart(parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh {
        const m = new THREE.Mesh(geo, mat);
        m.castShadow = true;
        m.receiveShadow = true;
        parent.add(m);
        return m;
    }

    // ----------------------------------------------------------------- chest

    private buildChest() {
        const W = 1.0;   // width  (local X)
        const D = 0.62;  // depth  (local Z)
        const bodyH = 0.46;

        // Body: stacked horizontal plank boxes with varied wood tones.
        const plankCount = 3;
        const plankH = bodyH / plankCount;
        for (let i = 0; i < plankCount; i++) {
            const p = this.addPart(
                this.mesh,
                new THREE.BoxGeometry(W, plankH - 0.012, D),
                this.wood(0x7a5230, i % 2 === 0 ? -0.015 : 0.02)
            );
            p.position.y = plankH * 0.5 + i * plankH;
        }
        // Side panels (slightly darker, frame look).
        for (const sx of [-1, 1]) {
            const side = this.addPart(this.mesh, new THREE.BoxGeometry(0.06, bodyH + 0.02, D + 0.02), this.wood(0x5c3d22));
            side.position.set(sx * (W / 2 - 0.02), bodyH / 2, 0);
        }
        // Bottom skids.
        for (const sz of [-1, 1]) {
            const skid = this.addPart(this.mesh, new THREE.BoxGeometry(W + 0.04, 0.05, 0.08), this.wood(0x4d321c));
            skid.position.set(0, 0.025, sz * (D / 2 - 0.06));
        }

        // Metal bands wrapped around the body.
        for (const bx of [-0.3, 0.3]) {
            const band = this.addPart(this.mesh, new THREE.BoxGeometry(0.07, bodyH + 0.015, D + 0.03), this.metal());
            band.position.set(bx, bodyH / 2, 0);
        }

        // Curved lid hinged at the back edge.
        const lidR = D / 2;
        this.lid = new THREE.Group();
        this.lid.position.set(0, bodyH, -0); // hinge sits on the back top edge
        // Hinge pivot is the back edge -> shift geometry forward by lidR is not needed:
        // we model the half-cylinder centered, and place the pivot at the back edge.
        const lidGroup = new THREE.Group();
        lidGroup.position.z = 0; // half cylinder is centered on the box top

        const lidShell = this.addPart(
            lidGroup,
            new THREE.CylinderGeometry(lidR, lidR, W, 18, 1, false, 0, Math.PI),
            this.wood(0x84592f, 0.02)
        );
        lidShell.rotation.z = Math.PI / 2; // axis along X, curve up

        // Flat underside that closes the half cylinder.
        const lidBase = this.addPart(lidGroup, new THREE.BoxGeometry(W, 0.045, D), this.wood(0x5c3d22));
        lidBase.position.y = -0.0225;

        // Metal bands over the lid curve.
        for (const bx of [-0.3, 0.3]) {
            const lidBand = this.addPart(
                lidGroup,
                new THREE.CylinderGeometry(lidR + 0.012, lidR + 0.012, 0.07, 18, 1, true, 0, Math.PI),
                this.metal()
            );
            lidBand.rotation.z = Math.PI / 2;
            lidBand.position.x = bx;
        }

        // Hasp on the lid front.
        const hasp = this.addPart(lidGroup, new THREE.BoxGeometry(0.1, 0.14, 0.03), this.metal());
        hasp.position.set(0, -0.02, D / 2 + 0.015);

        // Re-parent so the lid rotates around the BACK edge (hinge).
        lidGroup.position.z = 0;
        this.lid.add(lidGroup);
        this.lid.position.set(0, bodyH, -D / 2);
        lidGroup.position.z = D / 2;

        this.mesh.add(this.lid);

        // Lock plate on the body front.
        const plate = this.addPart(this.mesh, new THREE.BoxGeometry(0.13, 0.13, 0.025), this.metal());
        plate.position.set(0, bodyH - 0.1, D / 2 + 0.012);
    }

    // ---------------------------------------------------------------- barrel

    private buildBarrel() {
        const R = 0.4;
        const H = 0.95;

        // Core (slightly narrower so staves sit proud of it).
        const core = this.addPart(this.mesh, new THREE.CylinderGeometry(R - 0.03, R - 0.05, H, 14), this.wood(0x6e4a28));
        core.position.y = H / 2;

        // Staves around the core, each with its own wood tone.
        const staveCount = 12;
        for (let i = 0; i < staveCount; i++) {
            const a = (i / staveCount) * Math.PI * 2;
            const stave = this.addPart(this.mesh, new THREE.BoxGeometry(0.205, H, 0.05), this.wood(0x77502c, i % 3 === 0 ? 0.025 : -0.012));
            stave.position.set(Math.cos(a) * (R - 0.015), H / 2, Math.sin(a) * (R - 0.015));
            stave.rotation.y = -a + Math.PI / 2;
            // Barrel belly: bow the stave out slightly.
            stave.scale.y = 1.0;
        }

        // Two metal rings.
        for (const ry of [0.22, 0.74]) {
            const ring = this.addPart(this.mesh, new THREE.TorusGeometry(R + 0.012, 0.024, 8, 22), this.metal());
            ring.rotation.x = Math.PI / 2;
            ring.position.y = ry;
        }

        // Lid disc that lifts off.
        this.lid = new THREE.Group();
        this.lid.position.y = H;
        const lidDisc = this.addPart(this.lid, new THREE.CylinderGeometry(R - 0.02, R - 0.02, 0.06, 14), this.wood(0x84592f, 0.03));
        lidDisc.position.y = 0.03;
        const lidHandle = this.addPart(this.lid, new THREE.BoxGeometry(0.26, 0.05, 0.07), this.wood(0x4d321c));
        lidHandle.position.y = 0.085;
        this.mesh.add(this.lid);
    }

    // ----------------------------------------------------------------- crate

    private buildCrate() {
        const S = 0.85;  // footprint
        const H = 0.72;

        // Corner posts.
        for (const sx of [-1, 1]) {
            for (const sz of [-1, 1]) {
                const post = this.addPart(this.mesh, new THREE.BoxGeometry(0.09, H, 0.09), this.wood(0x5c3d22));
                post.position.set(sx * (S / 2 - 0.045), H / 2, sz * (S / 2 - 0.045));
            }
        }

        // Slats on all four sides (3 horizontal slats with gaps).
        const slatH = 0.16;
        const slatYs = [0.14, 0.36, 0.58];
        for (const y of slatYs) {
            for (const sz of [-1, 1]) {
                const slat = this.addPart(this.mesh, new THREE.BoxGeometry(S, slatH, 0.045), this.wood(0x8a5f33, (y * 10) % 2 === 0 ? 0.02 : -0.01));
                slat.position.set(0, y, sz * (S / 2 - 0.0225));
            }
            for (const sx of [-1, 1]) {
                const slat = this.addPart(this.mesh, new THREE.BoxGeometry(0.045, slatH, S), this.wood(0x8a5f33, -0.015));
                slat.position.set(sx * (S / 2 - 0.0225), y, 0);
            }
        }

        // Cross-brace on the front face.
        const brace1 = this.addPart(this.mesh, new THREE.BoxGeometry(S * 1.12, 0.085, 0.03), this.wood(0x4d321c));
        brace1.position.set(0, H / 2, S / 2 + 0.015);
        brace1.rotation.z = Math.PI / 4.6;
        const brace2 = this.addPart(this.mesh, new THREE.BoxGeometry(S * 1.12, 0.085, 0.03), this.wood(0x4d321c));
        brace2.position.set(0, H / 2, S / 2 + 0.018);
        brace2.rotation.z = -Math.PI / 4.6;

        // Slatted lid that slides back / tilts.
        this.lid = new THREE.Group();
        this.lid.position.y = H;
        for (let i = 0; i < 4; i++) {
            const plank = this.addPart(this.lid, new THREE.BoxGeometry(S + 0.04, 0.05, (S - 0.06) / 4), this.wood(0x84592f, i % 2 === 0 ? 0.02 : -0.012));
            plank.position.set(0, 0.025, -S / 2 + 0.05 + (i + 0.5) * ((S - 0.06) / 4));
        }
        const lidBrace = this.addPart(this.lid, new THREE.BoxGeometry(0.1, 0.05, S), this.wood(0x4d321c));
        lidBrace.position.y = 0.075;
        this.mesh.add(this.lid);
    }

    // ------------------------------------------------------------------ glow

    private buildGlow() {
        // Soft golden ring at the base + floating glint above; both pulse while un-looted.
        this.glowRingMat = new THREE.MeshBasicMaterial({
            color: 0xffd97a,
            transparent: true,
            opacity: 0.32,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.85, 28), this.glowRingMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.035;
        this.glow.add(ring);

        this.glintMat = new THREE.MeshStandardMaterial({
            color: 0xffe9a8,
            emissive: 0xffc44d,
            emissiveIntensity: 1.6,
            roughness: 0.3,
            metalness: 0.1,
            transparent: true,
            opacity: 0.95,
        });
        this.glint = new THREE.Mesh(new THREE.OctahedronGeometry(0.085, 0), this.glintMat);
        this.glint.position.y = this.kind === 'barrel' ? 1.35 : 1.1;
        this.glow.add(this.glint);

        // Glow is decorative only.
        this.glow.userData = { type: 'soft' };
        this.glow.traverse((c) => { c.userData = { ...c.userData, type: 'soft' }; });
    }

    // ------------------------------------------------------------------- API

    public setOpen(open: boolean): void {
        this.targetOpenT = open ? 1 : 0;
    }

    public setLooted(looted: boolean): void {
        if (this.looted === looted) return;
        this.looted = looted;
        this.glow.visible = !looted;
        for (const backup of this.tintBackups) {
            if (looted) {
                // Kill the glow, slightly desaturate / dim.
                const hsl = { h: 0, s: 0, l: 0 };
                backup.color.getHSL(hsl);
                backup.material.color.setHSL(hsl.h, hsl.s * 0.55, hsl.l * 0.85);
                backup.material.emissiveIntensity = 0;
            } else {
                backup.material.color.copy(backup.color);
                backup.material.emissive.copy(backup.emissive);
                backup.material.emissiveIntensity = backup.emissiveIntensity;
            }
        }
    }

    public update(dt: number): void {
        // Lid lerp (~0.4s open/close).
        const speed = 2.5;
        if (this.openT !== this.targetOpenT) {
            const dir = this.targetOpenT > this.openT ? 1 : -1;
            this.openT = THREE.MathUtils.clamp(this.openT + dir * speed * dt, 0, 1);
            const t = this.openT * this.openT * (3 - 2 * this.openT); // smoothstep ease
            if (this.kind === 'chest') {
                this.lid.rotation.x = -t * 1.25; // ~70 degree swing
            } else if (this.kind === 'barrel') {
                this.lid.position.y = 0.95 + t * 0.28;
                this.lid.rotation.z = t * 0.5;
                this.lid.position.x = t * 0.22;
            } else {
                this.lid.position.z = -t * 0.5;
                this.lid.rotation.x = t * 0.4;
                this.lid.position.y = 0.72 + t * 0.12;
            }
        }

        // Idle glow pulse while un-looted.
        if (!this.looted && this.glow.visible) {
            this.glowTime += dt;
            const pulse = 0.5 + 0.5 * Math.sin(this.glowTime * 2.4);
            if (this.glowRingMat) this.glowRingMat.opacity = 0.18 + pulse * 0.22;
            if (this.glintMat) this.glintMat.emissiveIntensity = 1.0 + pulse * 1.2;
            if (this.glint) {
                this.glint.rotation.y += dt * 1.6;
                const baseY = this.kind === 'barrel' ? 1.35 : 1.1;
                this.glint.position.y = baseY + Math.sin(this.glowTime * 1.7) * 0.06;
            }
        }
    }

    public isPlayerInRange(playerPos: THREE.Vector3, range: number = 2.2): boolean {
        const dx = playerPos.x - this.mesh.position.x;
        const dz = playerPos.z - this.mesh.position.z;
        return (dx * dx + dz * dz) <= range * range;
    }

    public dispose(): void {
        this.mesh.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach((m) => m.dispose());
                } else if (child.material) {
                    child.material.dispose();
                }
            }
        });
        if (this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
        this.tintBackups = [];
    }
}
