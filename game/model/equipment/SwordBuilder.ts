import * as THREE from 'three';

// --- Types ---
export interface WeaponConfig {
  type: string;
  handleLength: number;
  handleRadius: number;
  guardWidth: number;
  bladeLength: number;
  bladeWidth: number;
  bladeThickness: number;
  pommelSize: number;
  handleColor: string;
  metalColor: string;
  guardColor: string;
  roughness: number;
  metalness: number;
  effect: string;
  effectColor: string;
  variant?: string;
  handleTexture?: string;
  bladeTexture?: string;
}

interface WeaponMaterials {
    handleMat: THREE.MeshStandardMaterial;
    metalMat: THREE.MeshStandardMaterial;
    guardMat: THREE.MeshStandardMaterial;
}

// --- Configuration ---
export const weaponConfig: WeaponConfig = {
  "type": "Sword",
  "handleLength": 0.3,
  "handleRadius": 0.03,
  "guardWidth": 0.3,
  "bladeLength": 1,
  "bladeWidth": 0.1,
  "bladeThickness": 0.02,
  "pommelSize": 0.05,
  "handleColor": "#3e2723",
  "metalColor": "#cfd8dc",
  "guardColor": "#ffd54f",
  "roughness": 0.3,
  "metalness": 0.8,
  "handleTexture": "Leather",
  "bladeTexture": "None",
  "effect": "None",
  "effectColor": "#ff6b00",
  "variant": "standard"
};

// --- Geometry Utilities ---
const makeTaperedBox = (width: number, height: number, depth: number, material: THREE.Material, taperFactorX: number = 0.02, taperFactorZ: number = 0.02): THREE.Mesh => {
    const geo = new THREE.BoxGeometry(width, height, depth, 4, 4, 1);
    const pos = geo.attributes.position;
    const arr = pos.array as Float32Array;
    const halfH = height / 2;
    for (let i = 0; i < arr.length; i += 3) {
        const x = arr[i];
        const y = arr[i + 1];
        
        if (Math.abs(x) > width * 0.35) {
             arr[i+2] *= 0.1; 
        }

        if (y > -halfH + 0.001) {
            const t = Math.max(0, Math.min(1, (y + halfH) / height));
            const scale = 1.0 * (1 - t) + taperFactorX * t;
            const scaleZ = 1.0 * (1 - t) + taperFactorZ * t;
            arr[i] *= scale;
            arr[i + 2] *= scaleZ;
        }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, material);
};

const makeDoubleEdgedBlade = (width: number, height: number, depth: number, material: THREE.Material): THREE.Mesh => {
    const geo = new THREE.BoxGeometry(width, height, depth, 4, 4, 1);
    const pos = geo.attributes.position;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
        if (Math.abs(arr[i]) > width * 0.35) {
            arr[i+2] *= 0.05;
        }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, material);
};

const makeWavyBox = (width: number, height: number, depth: number, material: THREE.Material): THREE.Mesh => {
    const segments = 32;
    const geo = new THREE.BoxGeometry(width, height, depth, 4, segments, 2);
    const pos = geo.attributes.position;
    const arr = pos.array as Float32Array;
    const frequency = 5;
    const amplitude = width * 0.25;

    for (let i = 0; i < arr.length; i += 3) {
        const x = arr[i];
        const y = arr[i + 1];
        const normalizedY = (y + height/2) / height;

        if (Math.abs(x) > width * 0.35) {
             arr[i+2] *= 0.1;
        }

        const wave = Math.sin(normalizedY * Math.PI * frequency) * amplitude;
        arr[i] += wave;
        if (normalizedY > 0.7) {
             const t = (normalizedY - 0.7) / 0.3;
             const scale = 1 - t;
             const currentX = arr[i] - wave;
             arr[i] = wave + (currentX * scale);
             arr[i+2] *= scale;
        }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, material);
};

const makeCurvedBox = (width: number, height: number, depth: number, material: THREE.Material, curveAmount: number): THREE.Mesh => {
    const segments = 24;
    const geo = new THREE.BoxGeometry(width, height, depth, 4, segments, 2);
    const pos = geo.attributes.position;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
        const x = arr[i];
        const y = arr[i + 1];
        const normalizedY = (y + height/2) / height; 

        if (Math.abs(x) > width * 0.35) {
             arr[i+2] *= 0.1;
        }

        const curve = Math.pow(normalizedY, 2) * curveAmount;
        arr[i] += curve;
        if (normalizedY > 0.8) {
             const t = (normalizedY - 0.8) / 0.2;
             arr[i+2] *= (1 - t);
        }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, material);
};

const generateTexture = (style: string, colorStr: string) => {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    const baseColor = new THREE.Color(colorStr);
    const getHex = (c: THREE.Color) => '#' + c.getHexString();
    ctx.fillStyle = getHex(baseColor);
    ctx.fillRect(0, 0, size, size);

    if (style === 'None') return new THREE.Texture();

    const darken = (c: THREE.Color, amt: number) => '#' + c.clone().offsetHSL(0, 0, -amt).getHexString();
    const lighten = (c: THREE.Color, amt: number) => '#' + c.clone().offsetHSL(0, 0, amt).getHexString();

    if (style === 'Cloth Wrap') {
        ctx.globalAlpha = 0.15;
        for(let i=0; i<30000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#000000' : '#ffffff';
            ctx.fillRect(Math.random()*size, Math.random()*size, 2, 2);
        }
        ctx.globalAlpha = 0.6;
        ctx.lineWidth = 20;
        const numWraps = 4; 
        const step = size / numWraps;
        for (let i = -numWraps; i < numWraps * 2; i++) {
            const xOffset = i * step;
            ctx.beginPath();
            ctx.strokeStyle = darken(baseColor, 0.2);
            ctx.lineWidth = 8;
            ctx.moveTo(xOffset, 0); ctx.lineTo(xOffset + size, size); ctx.stroke();
            ctx.beginPath();
            ctx.strokeStyle = lighten(baseColor, 0.1);
            ctx.lineWidth = 2;
            ctx.moveTo(xOffset + 6, 0); ctx.lineTo(xOffset + size + 6, size); ctx.stroke();
        }
    } else if (style === 'Leather') {
        ctx.globalAlpha = 0.3;
        for(let i=0; i<5000; i++) {
            const x = Math.random() * size; const y = Math.random() * size;
            const r = Math.random() * 3 + 1;
            ctx.fillStyle = darken(baseColor, 0.15);
            ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
        }
    } else if (style === 'Damascus') {
        ctx.globalAlpha = 0.3;
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x+=4) {
                const val = Math.sin(x * 0.02 + Math.sin(y * 0.05) * 5.0) * 0.5 + 0.5;
                if (val > 0.6) { ctx.fillStyle = lighten(baseColor, 0.2); ctx.fillRect(x, y, 4, 1); } 
                else if (val < 0.4) { ctx.fillStyle = darken(baseColor, 0.2); ctx.fillRect(x, y, 4, 1); }
            }
        }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
};

const getMaterials = (cfg: WeaponConfig): WeaponMaterials => {
    const handleStyle = cfg.handleTexture || 'None';
    const bladeStyle = cfg.bladeTexture || 'None';
    const handleTex = generateTexture(handleStyle, cfg.handleColor);
    const bladeTex = generateTexture(bladeStyle, cfg.metalColor);

    const matProps = (tex: THREE.Texture, baseColor: string, r: number, m: number) => {
        const hasTex = tex.image && (tex.image as any).width > 1; 
        return {
            color: new THREE.Color(baseColor),
            map: hasTex ? tex : null,
            bumpMap: hasTex ? tex : null,
            bumpScale: 0.02,
            roughness: r,
            metalness: m,
            emissive: cfg.effect !== 'None' ? new THREE.Color(cfg.effectColor) : new THREE.Color(0x000000),
            emissiveIntensity: cfg.effect !== 'None' ? 0.2 : 0
        };
    };

    return {
        handleMat: new THREE.MeshStandardMaterial(matProps(handleTex, cfg.handleColor, 0.8, 0.1)),
        metalMat: new THREE.MeshStandardMaterial(matProps(bladeTex, cfg.metalColor, cfg.roughness, cfg.metalness)),
        guardMat: new THREE.MeshStandardMaterial({ 
            color: new THREE.Color(cfg.guardColor), 
            metalness: cfg.metalness * 0.9, 
            roughness: cfg.roughness * 1.2 
        }),
    };
};

const applyEffects = (group: THREE.Group, cfg: WeaponConfig, mats: WeaponMaterials) => {
    if (!cfg.effect || cfg.effect === 'None') return;
    const color = new THREE.Color(cfg.effectColor);

    group.traverse((node) => {
        if (node instanceof THREE.Mesh && node.name === 'damagePart') {
            const particleCount = 100;
            const geo = new THREE.BufferGeometry();
            const pos = new Float32Array(particleCount * 3);
            const sizes = new Float32Array(particleCount);
            const offsets = new Float32Array(particleCount);
            for(let i=0; i<particleCount; i++) {
                pos[i*3]=(Math.random()-0.5)*0.2; pos[i*3+1]=(Math.random()-0.5)*1.0; pos[i*3+2]=(Math.random()-0.5)*0.05;
                sizes[i]=Math.random(); offsets[i]=Math.random()*100;
            }
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
            
            const mat = new THREE.PointsMaterial({ color: color, size: 0.05, transparent: true, blending: THREE.AdditiveBlending });
            const points = new THREE.Points(geo, mat);
            node.add(points);
            
            group.userData.updateEffect = (dt: number) => {
                mat.opacity = 0.5 + Math.sin(Date.now() * 0.005) * 0.5;
            };
        }
    });
};

export function createWeapon(): THREE.Group {
    const group = new THREE.Group();
    const cfg = weaponConfig;
    const mats = getMaterials(cfg);
    const s = 1.2; // Scale factor for character animator hand

    const handleH = cfg.handleLength * s;
    const handleR = cfg.handleRadius * s;
    const guardW = cfg.guardWidth * s;
    const bladeL = cfg.bladeLength * s;
    const bladeW = cfg.bladeWidth * s;
    const bladeT = cfg.bladeThickness * s;
    const pommelR = cfg.pommelSize * s;

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(handleR, handleR, handleH, 16), mats.handleMat);
    handle.position.y = handleH / 2;
    group.add(handle);
    const pommel = new THREE.Mesh(new THREE.SphereGeometry(pommelR, 16, 16), mats.guardMat);
    pommel.position.y = -pommelR * 0.5;
    group.add(pommel);
    
    const connectionY = handleH;
    const variant = cfg.variant || 'standard';

    if (variant === 'rapier') {
        const cupGeo = new THREE.SphereGeometry(guardW * 0.5, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
        const guard = new THREE.Mesh(cupGeo, mats.guardMat);
        guard.rotation.x = Math.PI;
        guard.position.y = connectionY + (guardW * 0.2);
        group.add(guard);
    } else if (variant === 'katana') {
        const tsuba = new THREE.Mesh(new THREE.CylinderGeometry(guardW * 0.4, guardW * 0.4, 0.02 * s, 16), mats.guardMat);
        tsuba.position.y = connectionY;
        group.add(tsuba);
    } else {
        const guardH = 0.05 * s;
        const guard = new THREE.Mesh(new THREE.BoxGeometry(guardW, guardH, 0.06 * s), mats.guardMat);
        guard.position.y = connectionY;
        group.add(guard);
    }

    let blade: THREE.Mesh;
    const bladeStartY = connectionY + (variant === 'rapier' ? 0 : 0.02 * s);
    
    if (variant === 'wavy') {
        blade = makeWavyBox(bladeW, bladeL, bladeT, mats.metalMat);
        blade.position.y = bladeStartY + bladeL/2;
    } else if (variant === 'katana') {
        blade = makeCurvedBox(bladeW, bladeL, bladeT, mats.metalMat, -bladeL * 0.15);
        blade.position.y = bladeStartY + bladeL/2;
    } else if (variant === 'rapier') {
        blade = makeTaperedBox(bladeW, bladeL, bladeT, mats.metalMat, 0.1, 0.1);
        blade.position.y = bladeStartY + bladeL/2;
    } else {
        const bladeMainH = bladeL * 0.8; 
        blade = makeDoubleEdgedBlade(bladeW, bladeMainH, bladeT, mats.metalMat);
        blade.position.y = bladeStartY + (bladeMainH / 2);
        const tipH = bladeL * 0.2;
        const tip = makeTaperedBox(bladeW, tipH, bladeT, mats.metalMat);
        tip.position.y = bladeStartY + bladeMainH + (tipH/2);
        group.add(tip);
    }
    blade.name = 'damagePart';
    group.add(blade);
    
    applyEffects(group, cfg, mats);
    return group;
}

export class SwordBuilder {
    static build(woodMat: THREE.Material, metalMat: THREE.Material): THREE.Group {
        const group = createWeapon();
        // Hand holds items along local X in this app, but weapon is built along Y.
        // Rotate -90 on Z to lay it down forward.
        group.rotation.z = -Math.PI / 2;
        return group;
    }
}
