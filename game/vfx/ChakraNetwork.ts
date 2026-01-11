
import * as THREE from 'three';
import { PlayerModel } from '../PlayerModel';

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

export class ChakraNetwork {
    private scene: THREE.Scene;
    private initialized = false;
    private beamMesh: THREE.InstancedMesh | null = null;
    private orbMesh: THREE.InstancedMesh | null = null;

    private links: LinkData[] = [];
    private orbs: OrbData[] = [];
    private addedOrbs = new Set<string>();

    private _dummy = new THREE.Object3D();
    private _posA = new THREE.Vector3();
    private _posB = new THREE.Vector3();
    private _posCache = new Map<string, THREE.Vector3>();

    // Performance Throttling
    private updateTimer = 0;
    private readonly UPDATE_INTERVAL = 1 / 30; // 30 FPS update for VFX

    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }

    private initInstancedMeshes(maxLinks: number, maxOrbs: number) {
        const beamGeo = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
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
            depthWrite: false
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
            depthWrite: false
        });

        this.orbMesh = new THREE.InstancedMesh(orbGeo, orbMat, maxOrbs);
        this.orbMesh.instanceMatrix.setUsage(THREE.StreamDrawUsage);
        this.orbMesh.frustumCulled = false;
        this.orbMesh.visible = false;
        this.scene.add(this.orbMesh);
    }

    private addChain(chain: THREE.Object3D[], colorHex: number, withOrbs: boolean = true) {
        const color = new THREE.Color(colorHex);
        for (let i = 0; i < chain.length - 1; i++) {
            const start = chain[i];
            const end = chain[i+1];
            if (!start || !end) continue;
            this.links.push({ start, end, color });
            if (withOrbs) {
                this.addOrb(start, color);
                if (i === chain.length - 2) this.addOrb(end, color);
            }
        }
    }

    private addOrb(target: THREE.Object3D, color: THREE.Color) {
        if (this.addedOrbs.has(target.uuid)) return;
        this.addedOrbs.add(target.uuid);
        this.orbs.push({ target, color });
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

    private traverseFoot(shin: THREE.Object3D, ankle: THREE.Object3D, prefix: string, color: number) {
        const anchor = shin.children.find(c => c.name === `${prefix}_foot_anchor`);
        if (!anchor) return;
        this.addChain([ankle, anchor], color, true);
        const heel = anchor.children.find(c => c.name === `${prefix}_heel`);
        if (heel) this.addChain([anchor, heel], color, true);
        const forefoot = anchor.children.find(c => c.name === `${prefix}_forefoot`);
        if (forefoot) {
            this.addChain([anchor, forefoot], color, true);
            forefoot.children.forEach(c => {
                if (c.type === 'Group') this.addChain([forefoot, c], color, false);
            });
        }
    }

    init(model: PlayerModel) {
        this.links = [];
        this.orbs = [];
        this.addedOrbs.clear();
        const parts = model.parts;
        const C_BASE_BLUE = 0x000088;
        
        if (parts.hips && parts.torsoContainer && parts.neck && parts.head) {
            this.addChain([parts.hips, parts.torsoContainer, parts.neck, parts.head], C_BASE_BLUE, true);
        }
        if (parts.leftArm && parts.leftForeArm && parts.leftHand) {
            this.addChain([parts.topCap || parts.neck, parts.leftArm, parts.leftForeArm, parts.leftHand], C_BASE_BLUE, true);
        }
        if (parts.rightArm && parts.rightForeArm && parts.rightHand) {
            this.addChain([parts.topCap || parts.neck, parts.rightArm, parts.rightForeArm, parts.rightHand], C_BASE_BLUE, true);
        }
        if (parts.leftThigh && parts.leftShin && parts.leftAnkle) {
            this.addChain([parts.hips, parts.leftThigh, parts.leftShin, parts.leftAnkle], C_BASE_BLUE, true);
            this.traverseFoot(parts.leftShin, parts.leftAnkle, 'left', C_BASE_BLUE);
        }
        if (parts.rightThigh && parts.rightShin && parts.rightAnkle) {
            this.addChain([parts.hips, parts.rightThigh, parts.rightShin, parts.rightAnkle], C_BASE_BLUE, true);
            this.traverseFoot(parts.rightShin, parts.rightAnkle, 'right', C_BASE_BLUE);
        }
        if (model.rightFingers && parts.rightHand) {
            if (model.rightThumb) this.addChain(this.getFingerJoints(model.rightThumb, parts.rightHand), C_BASE_BLUE, false);
            model.rightFingers.forEach(f => this.addChain(this.getFingerJoints(f, parts.rightHand), C_BASE_BLUE, false));
        }
        if (model.leftFingers && parts.leftHand) {
            if (model.leftThumb) this.addChain(this.getFingerJoints(model.leftThumb, parts.leftHand), C_BASE_BLUE, false);
            model.leftFingers.forEach(f => this.addChain(this.getFingerJoints(f, parts.leftHand), C_BASE_BLUE, false));
        }

        this.initInstancedMeshes(this.links.length, this.orbs.length);

        if (this.beamMesh) {
            for (let i = 0; i < this.links.length; i++) this.beamMesh.setColorAt(i, this.links[i].color);
            if (this.beamMesh.instanceColor) this.beamMesh.instanceColor.needsUpdate = true;
        }
        if (this.orbMesh) {
            for (let i = 0; i < this.orbs.length; i++) this.orbMesh.setColorAt(i, this.orbs[i].color);
            if (this.orbMesh.instanceColor) this.orbMesh.instanceColor.needsUpdate = true;
        }
        this.initialized = true;
    }

    setVisible(visible: boolean) {
        if (this.beamMesh) this.beamMesh.visible = visible;
        if (this.orbMesh) this.orbMesh.visible = visible;
    }

    update(dt: number, model: PlayerModel) {
        if (!this.initialized) {
            if (model.parts.head) this.init(model);
            return;
        }
        if (!this.beamMesh?.visible) return;

        this.updateTimer += dt;
        if (this.updateTimer < this.UPDATE_INTERVAL) return;
        this.updateTimer = 0;

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
                    const thickness = Math.min(0.02, dist * 0.1);
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
    }
}
