
import * as THREE from 'three';
import { PlayerModel } from '../model/PlayerModel';

const CHAKRA_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vColor;
uniform float uTime;

void main() {
    vUv = uv;
    vColor = instanceColor; 
    
    vec3 pos = position;
    
    // Simpler pulse using cheaper math
    float pulse = sin(pos.y * 4.0 - uTime * 2.0) * 0.12;
    pos += normal * pulse;

    vec4 worldPosition = modelMatrix * instanceMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const CHAKRA_FRAGMENT_SHADER = `
varying vec2 vUv;
varying vec3 vColor;
uniform float uTime;
uniform vec3 uCoreColor;

void main() {
    // High-performance flowing energy approximation
    float flow = vUv.y * 2.0 - uTime * 3.0;
    float plasma = abs(sin(vUv.x * 6.28 + flow)) * 0.5;
    
    // Linear end fade is cheaper than smoothstep
    float endFade = clamp(vUv.y * 10.0, 0.0, 1.0) * clamp((1.0 - vUv.y) * 10.0, 0.0, 1.0);
    
    vec3 finalColor = mix(vColor, uCoreColor, plasma);
    gl_FragColor = vec4(finalColor, (0.4 + plasma) * endFade);
}
`;

const ORB_VERTEX_SHADER = `
varying vec3 vNormal;
varying vec3 vColor;
uniform float uTime;

void main() {
    vNormal = normal;
    vColor = instanceColor;
    vec3 pos = position;
    
    // Constant pulsing
    float pulse = sin(uTime * 4.0) * 0.1;
    pos *= (1.0 + pulse);
    
    vec4 worldPosition = modelMatrix * instanceMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const ORB_FRAGMENT_SHADER = `
varying vec3 vNormal;
varying vec3 vColor;
uniform vec3 uCoreColor;

void main() {
    // Fast Fresnel-like glow
    float fresnel = pow(1.0 - abs(vNormal.z), 1.5);
    vec3 finalColor = mix(vColor, uCoreColor, fresnel);
    gl_FragColor = vec4(finalColor, 0.7 + fresnel * 0.3);
}
`;

interface LinkData {
    start: THREE.Object3D;
    end: THREE.Object3D;
    color: THREE.Color;
}

interface OrbData {
    target: THREE.Object3D;
    color: THREE.Color;
}

export interface ChakraNodeLegendEntry {
    id: string;
    name: string;
    color: string;
}

export interface ChakraConnectionLegendEntry {
    id: string;
    name: string;
    color: string;
}

export type ChakraDebugTargetKind = 'node' | 'connection';

export class ChakraNetwork {
    private scene: THREE.Scene;
    private initialized = false;
    private beamMesh: THREE.InstancedMesh | null = null;
    private orbMesh: THREE.InstancedMesh | null = null;
    private debugColorMode = false;
    private xRayMode = false;

    private links: LinkData[] = [];
    private orbs: OrbData[] = [];
    private addedOrbs = new Set<string>();
    private debugObjectLabels = new Map<string, string>();
    private defaultLinkColors: THREE.Color[] = [];
    private defaultOrbColors: THREE.Color[] = [];

    private _dummy = new THREE.Object3D();
    private _posA = new THREE.Vector3();
    private _posB = new THREE.Vector3();
    private _posCache = new Map<string, THREE.Vector3>();

    // Performance Throttling
    private updateTimer = 0;
    private readonly UPDATE_INTERVAL = 0; // 0 = full frame-rate update

    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }

    private makeUniqueDebugColor(index: number): THREE.Color {
        // Golden-angle hue stepping gives stable, well-spread colors.
        const hue = (((index * 0.61803398875) % 1) + 1) % 1;
        return new THREE.Color().setHSL(hue, 0.9, 0.55);
    }

    private applyInstanceColors() {
        if (this.beamMesh) {
            for (let i = 0; i < this.links.length; i++) {
                const color = this.debugColorMode
                    ? this.makeUniqueDebugColor(i)
                    : (this.defaultLinkColors[i] ?? this.links[i].color);
                this.beamMesh.setColorAt(i, color);
            }
            if (this.beamMesh.instanceColor) this.beamMesh.instanceColor.needsUpdate = true;
        }

        if (this.orbMesh) {
            for (let i = 0; i < this.orbs.length; i++) {
                const color = this.debugColorMode
                    ? this.makeUniqueDebugColor(this.links.length + i)
                    : (this.defaultOrbColors[i] ?? this.orbs[i].color);
                this.orbMesh.setColorAt(i, color);
            }
            if (this.orbMesh.instanceColor) this.orbMesh.instanceColor.needsUpdate = true;
        }
    }

    private toTitleCaseLabel(raw: string): string {
        return raw
            .replace(/[_-]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/\b\w/g, (m) => m.toUpperCase());
    }

    private setDebugLabel(target: THREE.Object3D, label?: string) {
        if (!label) return;
        const normalized = label.trim();
        if (!normalized) return;
        const existing = this.debugObjectLabels.get(target.uuid);
        if (!existing || existing.startsWith('Node ')) {
            this.debugObjectLabels.set(target.uuid, normalized);
        }
    }

    private buildDebugNodeName(target: THREE.Object3D, index: number): string {
        const explicitLabel = this.debugObjectLabels.get(target.uuid);
        if (explicitLabel) return explicitLabel;

        if (target.name) {
            const lower = target.name.toLowerCase();
            if (lower === 'chakra_toe_tip') {
                const parentLabel = target.parent ? this.debugObjectLabels.get(target.parent.uuid) : '';
                if (parentLabel) return `${parentLabel} Tip`;
                return 'Toe Tip';
            }
            return this.toTitleCaseLabel(target.name);
        }

        const path: string[] = [];
        let cursor: THREE.Object3D | null = target;
        let depth = 0;
        while (cursor && depth < 6) {
            const trimmedName = cursor.name.trim();
            if (trimmedName) path.unshift(trimmedName);
            cursor = cursor.parent;
            depth++;
        }
        if (path.length === 0) return `Node ${index + 1}`;
        return path.slice(-3).map((part) => this.toTitleCaseLabel(part)).join(' / ');
    }

    private initInstancedMeshes(maxLinks: number, maxOrbs: number) {
        const beamGeo = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true);
        beamGeo.rotateX(Math.PI / 2);
        
        const beamMat = new THREE.ShaderMaterial({
            vertexShader: CHAKRA_VERTEX_SHADER,
            fragmentShader: CHAKRA_FRAGMENT_SHADER,
            uniforms: {
                uTime: { value: 0 },
                uCoreColor: { value: new THREE.Color(0x44aaff) }
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: true,
            side: THREE.DoubleSide
        });

        this.beamMesh = new THREE.InstancedMesh(beamGeo, beamMat, maxLinks);
        this.beamMesh.instanceMatrix.setUsage(THREE.StreamDrawUsage);
        this.beamMesh.frustumCulled = false; 
        this.beamMesh.visible = false;
        this.scene.add(this.beamMesh);

        const orbGeo = new THREE.SphereGeometry(1, 12, 12);
        const orbMat = new THREE.ShaderMaterial({
            vertexShader: ORB_VERTEX_SHADER,
            fragmentShader: ORB_FRAGMENT_SHADER,
            uniforms: {
                uTime: { value: 0 },
                uCoreColor: { value: new THREE.Color(0x44aaff) }
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: true,
            side: THREE.DoubleSide
        });

        this.orbMesh = new THREE.InstancedMesh(orbGeo, orbMat, maxOrbs);
        this.orbMesh.instanceMatrix.setUsage(THREE.StreamDrawUsage);
        this.orbMesh.frustumCulled = false;
        this.orbMesh.visible = false;
        this.scene.add(this.orbMesh);

        this.applyRenderMode();
    }

    private applyRenderMode() {
        if (this.beamMesh) {
            const mat = this.beamMesh.material as THREE.ShaderMaterial;
            mat.depthTest = !this.xRayMode;
            mat.depthWrite = false;
            mat.needsUpdate = true;
            this.beamMesh.renderOrder = this.xRayMode ? 999 : 0;
        }

        if (this.orbMesh) {
            const mat = this.orbMesh.material as THREE.ShaderMaterial;
            mat.depthTest = !this.xRayMode;
            mat.depthWrite = false;
            mat.needsUpdate = true;
            this.orbMesh.renderOrder = this.xRayMode ? 1000 : 1;
        }
    }

    private addChain(chain: THREE.Object3D[], colorHex: number, withOrbs: boolean = true, labels?: string[]) {
        const color = new THREE.Color(colorHex);
        for (let i = 0; i < chain.length - 1; i++) {
            const start = chain[i];
            const end = chain[i+1];
            if (!start || !end) continue;
            if (labels?.[i]) this.setDebugLabel(start, labels[i]);
            if (labels?.[i + 1]) this.setDebugLabel(end, labels[i + 1]);
            this.links.push({ start, end, color });
            if (withOrbs) {
                this.addOrb(start, color, labels?.[i]);
                if (i === chain.length - 2) this.addOrb(end, color, labels?.[i + 1]);
            }
        }
    }

    private addOrb(target: THREE.Object3D, color: THREE.Color, label?: string) {
        this.setDebugLabel(target, label);
        if (this.addedOrbs.has(target.uuid)) return;
        this.addedOrbs.add(target.uuid);
        this.orbs.push({ target, color });
    }

    private getToeNameByIndex(index: number): string {
        const names = ['Big Toe', 'Second Toe', 'Middle Toe', 'Fourth Toe', 'Pinky Toe'];
        return names[index] ?? `Toe ${index + 1}`;
    }

    private getFingerNameByIndex(index: number): string {
        const names = ['Index Finger', 'Middle Finger', 'Ring Finger', 'Pinky Finger'];
        return names[index] ?? `Finger ${index + 1}`;
    }

    private getFingerJointLabels(side: 'Left' | 'Right', fingerName: string): string[] {
        return [
            `${side} Wrist`,
            `${side} ${fingerName} Proximal`,
            `${side} ${fingerName} Distal`,
            `${side} ${fingerName} Tip`
        ];
    }

    private getToeJointLabels(prefix: string, toeUnit: THREE.Object3D): string[] {
        const side = prefix === 'left' ? 'Left' : 'Right';
        const toeIndex = typeof toeUnit.userData?.index === 'number' ? toeUnit.userData.index : -1;
        const toeName = this.getToeNameByIndex(toeIndex);
        return [
            `${side} Forefoot`,
            `${side} ${toeName} Base`,
            `${side} ${toeName} Tip`
        ];
    }

    private getFingerJoints(fingerGroup: THREE.Group, wrist: THREE.Object3D): THREE.Object3D[] {
        const joints: THREE.Object3D[] = [wrist];
        const prox = fingerGroup.children.find(c => c.name === 'proximal');
        if (prox) {
            joints.push(prox);
            const dist = prox.children.find(c => c.name === 'distal');
            if (dist) {
                joints.push(dist);
                const tip = dist.children.find(c => c.type === 'Mesh' && c.position.y < -0.001);
                if (tip) joints.push(tip);
            }
        }
        return joints;
    }

    private getToeJoints(toeUnit: THREE.Object3D, forefoot: THREE.Object3D): THREE.Object3D[] {
        const joints: THREE.Object3D[] = [forefoot, toeUnit];
        const toeMesh = toeUnit.children.find(c => c instanceof THREE.Mesh) as THREE.Mesh | undefined;
        if (!toeMesh) return joints;

        let tip = toeMesh.children.find(c => c.name === 'chakra_toe_tip');
        if (!tip) {
            tip = new THREE.Object3D();
            tip.name = 'chakra_toe_tip';
            toeMesh.add(tip);
        }

        if (!toeMesh.geometry.boundingBox) {
            toeMesh.geometry.computeBoundingBox();
        }
        const tipZ = toeMesh.geometry.boundingBox?.max.z ?? 0.02;
        tip.position.set(0, 0, tipZ);
        joints.push(tip);
        return joints;
    }

    private buildOrganVesselNetwork(
        organ: THREE.Object3D,
        colorHex: number,
        label: string,
        outerRadius: number,
        innerRadius: number,
        organHeight: number,
        complexity: number,
        ringPoints: number,
        wobbleFreq: number,
        wobbleAmp: number,
        tiltX: number = 0,
        tiltZ: number = 0
    ) {
        const color = new THREE.Color(colorHex);
        let wpIdx = 0;

        const makeWP = (x: number, y: number, z: number): THREE.Object3D => {
            const wp = new THREE.Object3D();
            wp.name = `chakra_${label.toLowerCase().replace(/\s+/g, '_')}_v${wpIdx++}`;
            wp.position.set(x, y, z);
            organ.add(wp);
            return wp;
        };

        const applyTilt = (x: number, y: number, z: number): [number, number, number] => {
            if (tiltX) {
                const c = Math.cos(tiltX), s = Math.sin(tiltX);
                const ny = y * c - z * s, nz = y * s + z * c;
                y = ny; z = nz;
            }
            if (tiltZ) {
                const c = Math.cos(tiltZ), s = Math.sin(tiltZ);
                const nx = x * c - y * s, ny = x * s + y * c;
                x = nx; y = ny;
            }
            return [x, y, z];
        };

        // === 1. OUTER MERIDIAN RING (tilted energy field) ===
        const ringWPs: THREE.Object3D[] = [];
        for (let i = 0; i < ringPoints; i++) {
            const t = (i / ringPoints) * Math.PI * 2;
            const [rx, ry, rz] = applyTilt(
                outerRadius * Math.cos(t),
                outerRadius * wobbleAmp * Math.sin(wobbleFreq * t),
                outerRadius * Math.sin(t)
            );
            ringWPs.push(makeWP(rx, ry, rz));
        }
        const ringClosed = [...ringWPs, ringWPs[0]];
        const ringLabels = ringWPs.map((_, i) => `${label} Ring ${i + 1}`);
        ringLabels.push(ringLabels[0]);
        this.addChain(ringClosed, colorHex, false, ringLabels);

        // === 2. MAIN VESSEL TRUNK (helix through organ interior) ===
        const trunkN = 6 + complexity * 3;
        const helixTwists = 0.8 + complexity * 0.4;
        const trunkWPs: THREE.Object3D[] = [];
        for (let i = 0; i < trunkN; i++) {
            const t = i / (trunkN - 1);
            const angle = t * Math.PI * 2 * helixTwists;
            const taper = 1 - 0.25 * Math.sin(t * Math.PI);
            const x = innerRadius * Math.cos(angle) * taper;
            const y = -organHeight * 0.5 + t * organHeight;
            const z = innerRadius * Math.sin(angle) * taper;
            trunkWPs.push(makeWP(x, y, z));
        }
        const trunkLabels = trunkWPs.map((_, i) => `${label} Trunk ${i + 1}`);
        this.addChain(trunkWPs, colorHex, false, trunkLabels);

        // === 3. ARTERIAL BRANCHES (fork from trunk, curve outward) ===
        const branchCount = 2 + complexity * 2;
        const branchLen = 2 + complexity;

        for (let b = 0; b < branchCount; b++) {
            const forkIdx = Math.min(
                Math.floor((b + 1) * trunkN / (branchCount + 1)),
                trunkWPs.length - 1
            );
            const forkWP = trunkWPs[forkIdx];
            const forkPos = forkWP.position;
            const bAngle = (b / branchCount) * Math.PI * 2 + 0.7;
            const sign = b % 2 === 0 ? 1 : -1;

            const bWPs: THREE.Object3D[] = [forkWP];
            const bLabels: string[] = [trunkLabels[forkIdx]];

            for (let j = 1; j <= branchLen; j++) {
                const frac = j / branchLen;
                const spread = innerRadius * (0.5 + frac * 1.5);
                const curveAngle = bAngle + frac * 0.8 * sign;
                const x = forkPos.x + spread * Math.cos(curveAngle);
                const y = forkPos.y + organHeight * 0.1 * Math.sin(j * 1.4) * sign;
                const z = forkPos.z + spread * Math.sin(curveAngle);
                bWPs.push(makeWP(x, y, z));
                bLabels.push(`${label} Branch ${b + 1}.${j}`);
            }

            this.addChain(bWPs, colorHex, false, bLabels);

            // === 4. RETURN LOOPS (branch tip → nearest ring point, forming circulatory loops) ===
            const tipWP = bWPs[bWPs.length - 1];
            let nearIdx = 0;
            let nearDist = Infinity;
            for (let r = 0; r < ringWPs.length; r++) {
                const d = tipWP.position.distanceTo(ringWPs[r].position);
                if (d < nearDist) { nearDist = d; nearIdx = r; }
            }

            const tp = tipWP.position;
            const rp = ringWPs[nearIdx].position;
            const mx = (tp.x + rp.x) * 0.5 + organHeight * 0.08 * Math.sin(b * 2.1);
            const my = (tp.y + rp.y) * 0.5 + organHeight * 0.12 * Math.cos(b * 1.7);
            const mz = (tp.z + rp.z) * 0.5 + organHeight * 0.08 * Math.sin(b * 3.3);
            const returnMid = makeWP(mx, my, mz);

            this.addChain(
                [tipWP, returnMid, ringWPs[nearIdx]],
                colorHex, false,
                [bLabels[bLabels.length - 1], `${label} Return ${b + 1}`, ringLabels[nearIdx]]
            );
        }

        // === 5. CAPILLARY SUB-BRANCHES (complexity >= 2: shorter finer paths off trunk) ===
        if (complexity >= 2) {
            const subCount = complexity;
            for (let s = 0; s < subCount; s++) {
                const sIdx = Math.min(
                    Math.floor((s + 0.5) * trunkN / (subCount + 1)),
                    trunkWPs.length - 1
                );
                const sPos = trunkWPs[sIdx].position;
                const sAngle = (s / subCount) * Math.PI * 2 + Math.PI;

                const sWPs: THREE.Object3D[] = [trunkWPs[sIdx]];
                const sLabels: string[] = [trunkLabels[sIdx]];

                for (let j = 1; j <= 3; j++) {
                    const frac = j / 3;
                    const spread = innerRadius * 0.5 * frac;
                    const x = sPos.x + spread * Math.cos(sAngle + frac * 0.6);
                    const y = sPos.y + organHeight * 0.06 * Math.sin(j * 1.2);
                    const z = sPos.z + spread * Math.sin(sAngle + frac * 0.6);
                    sWPs.push(makeWP(x, y, z));
                    sLabels.push(`${label} Capillary ${s + 1}.${j}`);
                }

                this.addChain(sWPs, colorHex, false, sLabels);
            }
        }

        this.addOrb(organ, color, label);
    }

    private traverseFoot(shin: THREE.Object3D, ankle: THREE.Object3D, prefix: string, color: number) {
        const side = prefix === 'left' ? 'Left' : 'Right';
        const anchor = shin.children.find(c => c.name === `${prefix}_foot_anchor`);
        if (!anchor) return;
        this.addChain([ankle, anchor], color, true, [`${side} Ankle`, `${side} Foot Anchor`]);
        const heel = anchor.children.find(c => c.name === `${prefix}_heel`);
        if (heel) this.addChain([anchor, heel], color, true, [`${side} Foot Anchor`, `${side} Heel`]);
        const forefoot = anchor.children.find(c => c.name === `${prefix}_forefoot`);
        if (forefoot) {
            this.addChain([anchor, forefoot], color, true, [`${side} Foot Anchor`, `${side} Forefoot`]);
            forefoot.children.forEach(c => {
                if (c.type === 'Group') this.addChain(this.getToeJoints(c, forefoot), color, false, this.getToeJointLabels(prefix, c));
            });
        }
    }

    init(model: PlayerModel) {
        this.links = [];
        this.orbs = [];
        this.addedOrbs.clear();
        this.debugObjectLabels.clear();
        const parts = model.parts;
        const C_BASE_BLUE = 0x000088;
        
        if (parts.hips && parts.torsoContainer && parts.neck && parts.head) {
            this.addChain(
                [parts.hips, parts.torsoContainer, parts.neck, parts.head],
                C_BASE_BLUE,
                true,
                ['Hips', 'Torso Core', 'Neck', 'Head']
            );
        }
        if (parts.leftArm && parts.leftForeArm && parts.leftHand) {
            this.addChain(
                [parts.topCap || parts.neck, parts.leftArm, parts.leftForeArm, parts.leftHand],
                C_BASE_BLUE,
                true,
                ['Upper Chest', 'Left Shoulder', 'Left Elbow', 'Left Wrist']
            );
        }
        if (parts.rightArm && parts.rightForeArm && parts.rightHand) {
            this.addChain(
                [parts.topCap || parts.neck, parts.rightArm, parts.rightForeArm, parts.rightHand],
                C_BASE_BLUE,
                true,
                ['Upper Chest', 'Right Shoulder', 'Right Elbow', 'Right Wrist']
            );
        }
        if (parts.leftThigh && parts.leftShin && parts.leftAnkle) {
            this.addChain(
                [parts.hips, parts.leftThigh, parts.leftShin, parts.leftAnkle],
                C_BASE_BLUE,
                true,
                ['Hips', 'Left Thigh', 'Left Shin', 'Left Ankle']
            );
            this.traverseFoot(parts.leftShin, parts.leftAnkle, 'left', C_BASE_BLUE);
        }
        if (parts.rightThigh && parts.rightShin && parts.rightAnkle) {
            this.addChain(
                [parts.hips, parts.rightThigh, parts.rightShin, parts.rightAnkle],
                C_BASE_BLUE,
                true,
                ['Hips', 'Right Thigh', 'Right Shin', 'Right Ankle']
            );
            this.traverseFoot(parts.rightShin, parts.rightAnkle, 'right', C_BASE_BLUE);
        }
        if (model.rightFingers && parts.rightHand) {
            if (model.rightThumb) {
                this.addChain(
                    this.getFingerJoints(model.rightThumb, parts.rightHand),
                    C_BASE_BLUE,
                    false,
                    this.getFingerJointLabels('Right', 'Thumb')
                );
            }
            model.rightFingers.forEach((f, index) => {
                this.addChain(
                    this.getFingerJoints(f, parts.rightHand),
                    C_BASE_BLUE,
                    false,
                    this.getFingerJointLabels('Right', this.getFingerNameByIndex(index))
                );
            });
        }
        if (model.leftFingers && parts.leftHand) {
            if (model.leftThumb) {
                this.addChain(
                    this.getFingerJoints(model.leftThumb, parts.leftHand),
                    C_BASE_BLUE,
                    false,
                    this.getFingerJointLabels('Left', 'Thumb')
                );
            }
            model.leftFingers.forEach((f, index) => {
                this.addChain(
                    this.getFingerJoints(f, parts.leftHand),
                    C_BASE_BLUE,
                    false,
                    this.getFingerJointLabels('Left', this.getFingerNameByIndex(index))
                );
            });
        }

        // === ORGAN CHAKRA LOOPS ===
        // Loopy, non-self-intersecting parametric paths around each internal organ.
        // These are visible even when organs themselves are hidden.
        const C_BRAIN      = 0x8800ff;
        const C_HEART      = 0x00ff66;
        const C_LUNGS      = 0x00aaff;
        const C_LIVER      = 0xff6600;
        const C_STOMACH    = 0xffee00;
        const C_PANCREAS   = 0xffaa00;
        const C_SPLEEN     = 0xff0088;
        const C_KIDNEYS    = 0xff4400;
        const C_GALLBLADDER = 0x00ffaa;

        //                                     organ           color   label          oR     iR    hgt  cplx ring wF  wA   tX    tZ
        if (parts.brain) {
            this.buildOrganVesselNetwork(parts.brain,       C_BRAIN,      'Brain',       0.12, 0.06, 0.10, 3, 12, 3, 0.4, 0.3,  0);
        }
        if (parts.heart) {
            this.buildOrganVesselNetwork(parts.heart,       C_HEART,      'Heart',       0.09, 0.04, 0.12, 3, 10, 2, 0.5, 0,    0.2);
        }
        if (parts.lungs) {
            this.buildOrganVesselNetwork(parts.lungs,       C_LUNGS,      'Lungs',       0.16, 0.08, 0.16, 3, 14, 3, 0.3, 0.2,  0);
        }
        if (parts.liver) {
            this.buildOrganVesselNetwork(parts.liver,       C_LIVER,      'Liver',       0.11, 0.05, 0.08, 2, 10, 2, 0.4, 0,   -0.3);
        }
        if (parts.stomach) {
            this.buildOrganVesselNetwork(parts.stomach,     C_STOMACH,    'Stomach',     0.09, 0.04, 0.10, 2, 10, 2, 0.5, -0.2, 0);
        }
        if (parts.pancreas) {
            this.buildOrganVesselNetwork(parts.pancreas,    C_PANCREAS,   'Pancreas',    0.06, 0.03, 0.04, 2,  8, 3, 0.4, 0,    0.4);
        }
        if (parts.spleen) {
            this.buildOrganVesselNetwork(parts.spleen,      C_SPLEEN,     'Spleen',      0.04, 0.02, 0.04, 1,  8, 2, 0.5, 0.3,  0);
        }
        if (parts.kidneys) {
            this.buildOrganVesselNetwork(parts.kidneys,     C_KIDNEYS,    'Kidneys',     0.07, 0.035, 0.05, 2, 10, 3, 0.3, -0.3, 0);
        }
        if (parts.gallbladder) {
            this.buildOrganVesselNetwork(parts.gallbladder, C_GALLBLADDER,'Gallbladder',  0.035, 0.015, 0.025, 1, 8, 2, 0.6, 0, -0.4);
        }

        this.defaultLinkColors = this.links.map(link => link.color.clone());
        this.defaultOrbColors = this.orbs.map(orb => orb.color.clone());
        this.initInstancedMeshes(this.links.length, this.orbs.length);
        this.applyInstanceColors();
        this.initialized = true;
    }

    setVisible(visible: boolean) {
        if (this.beamMesh) this.beamMesh.visible = visible;
        if (this.orbMesh) this.orbMesh.visible = visible;
    }

    setDebugColorMode(enabled: boolean) {
        if (this.debugColorMode === enabled) return;
        this.debugColorMode = enabled;
        this.applyInstanceColors();
    }

    setXRayMode(enabled: boolean) {
        if (this.xRayMode === enabled) return;
        this.xRayMode = enabled;
        this.applyRenderMode();
    }

    getNodeDebugLegend(): ChakraNodeLegendEntry[] {
        if (!this.initialized) return [];
        const duplicateCounter = new Map<string, number>();
        return this.orbs.map((orb, i) => {
            const baseName = this.buildDebugNodeName(orb.target, i);
            const duplicateIndex = (duplicateCounter.get(baseName) ?? 0) + 1;
            duplicateCounter.set(baseName, duplicateIndex);
            const name = duplicateIndex === 1 ? baseName : `${baseName} (${duplicateIndex})`;
            const color = this.debugColorMode
                ? this.makeUniqueDebugColor(this.links.length + i)
                : (this.defaultOrbColors[i] ?? orb.color);
            return { id: `node-${i}`, name, color: `#${color.getHexString()}` };
        });
    }

    getConnectionDebugLegend(): ChakraConnectionLegendEntry[] {
        if (!this.initialized) return [];
        return this.links.map((link, i) => {
            const fromName = this.buildDebugNodeName(link.start, i * 2);
            const toName = this.buildDebugNodeName(link.end, i * 2 + 1);
            const color = this.debugColorMode
                ? this.makeUniqueDebugColor(i)
                : (this.defaultLinkColors[i] ?? link.color);
            return {
                id: `connection-${i}`,
                name: `${fromName} -> ${toName}`,
                color: `#${color.getHexString()}`
            };
        });
    }

    getDebugWorldPoint(kind: ChakraDebugTargetKind, id: string): THREE.Vector3 | null {
        const prefix = kind === 'node' ? 'node-' : 'connection-';
        if (!id.startsWith(prefix)) return null;
        const index = Number(id.slice(prefix.length));
        if (!Number.isInteger(index) || index < 0) return null;

        if (kind === 'node') {
            const orb = this.orbs[index];
            if (!orb) return null;
            return orb.target.getWorldPosition(new THREE.Vector3());
        }

        const link = this.links[index];
        if (!link) return null;
        const start = link.start.getWorldPosition(new THREE.Vector3());
        const end = link.end.getWorldPosition(new THREE.Vector3());
        return start.lerp(end, 0.5);
    }

    update(dt: number, model: PlayerModel) {
        if (!this.initialized) {
            if (model.parts.head) this.init(model);
            return;
        }
        if (!this.beamMesh?.visible) return;

        if (this.UPDATE_INTERVAL > 0) {
            this.updateTimer += dt;
            if (this.updateTimer < this.UPDATE_INTERVAL) return;
            this.updateTimer = 0;
        }

        const uTime = performance.now() * 0.001;
        this._posCache.clear();

        const getCachedWorldPos = (obj: THREE.Object3D) => {
            let pos = this._posCache.get(obj.uuid);
            if (!pos) {
                pos = new THREE.Vector3();
                obj.getWorldPosition(pos);
                this._posCache.set(obj.uuid, pos);
            }
            return pos;
        };

        if (this.beamMesh) {
            (this.beamMesh.material as THREE.ShaderMaterial).uniforms.uTime.value = uTime;
            for (let i = 0; i < this.links.length; i++) {
                const link = this.links[i];
                this._posA.copy(getCachedWorldPos(link.start));
                this._posB.copy(getCachedWorldPos(link.end));
                const dist = this._posA.distanceTo(this._posB);
                if (dist < 0.001) {
                    this._dummy.scale.set(0,0,0);
                } else {
                    this._dummy.position.lerpVectors(this._posA, this._posB, 0.5);
                    this._dummy.lookAt(this._posB);
                    const thickness = Math.max(0.005, Math.min(0.02, dist * 0.1));
                    this._dummy.scale.set(thickness, thickness, dist);
                }
                this._dummy.updateMatrix();
                this.beamMesh.setMatrixAt(i, this._dummy.matrix);
            }
            this.beamMesh.instanceMatrix.needsUpdate = true;
        }

        if (this.orbMesh) {
            (this.orbMesh.material as THREE.ShaderMaterial).uniforms.uTime.value = uTime;
            for (let i = 0; i < this.orbs.length; i++) {
                this._dummy.position.copy(getCachedWorldPos(this.orbs[i].target));
                this._dummy.rotation.set(0,0,0);
                this._dummy.scale.setScalar(0.02); 
                this._dummy.updateMatrix();
                this.orbMesh.setMatrixAt(i, this._dummy.matrix);
            }
            this.orbMesh.instanceMatrix.needsUpdate = true;
        }
    }

    dispose() {
        if (this.beamMesh) { this.scene.remove(this.beamMesh); this.beamMesh.dispose(); }
        if (this.orbMesh) { this.scene.remove(this.orbMesh); this.orbMesh.dispose(); }
        this.initialized = false;
        this.links = [];
        this.orbs = [];
        this.addedOrbs.clear();
        this.debugObjectLabels.clear();
        this.defaultLinkColors = [];
        this.defaultOrbColors = [];
    }
}
