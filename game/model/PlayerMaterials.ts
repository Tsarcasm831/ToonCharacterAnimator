
import * as THREE from 'three';
import { PlayerConfig, OutfitType } from '../../types';

// Helper to generate brain fold texture
const createBrainTexture = () => {
    if (typeof document === 'undefined') return null;
    const size = 1024; // Increased resolution
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Background (Sulci - deep valleys) - Dark reddish grey
    ctx.fillStyle = '#6e4c4c'; 
    ctx.fillRect(0, 0, size, size);

    // Draw Gyri (Ridges)
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw many winding paths with varying thickness to simulate packed tissue
    const drawFolds = (count: number, widthBase: number, alpha: number) => {
        for (let i = 0; i < count; i++) {
            ctx.beginPath();
            let x = Math.random() * size;
            let y = Math.random() * size;
            ctx.moveTo(x, y);
            
            // More segments for tighter winding
            const steps = 15 + Math.random() * 20; 
            for (let j = 0; j < steps; j++) {
                // Tighter random walk for packed look
                const angle = Math.random() * Math.PI * 2;
                const dist = 10 + Math.random() * 25;
                
                // Bias towards center slightly to keep clumps? No, brain is uniform surface mostly.
                // Just random walk.
                
                x += Math.cos(angle) * dist;
                y += Math.sin(angle) * dist;
                
                // Soft wrap
                if (x < 0) x += size; if (x > size) x -= size;
                if (y < 0) y += size; if (y > size) y -= size;
                
                // Bezier for smoother curves
                const cx = x - Math.cos(angle) * dist * 0.5;
                const cy = y - Math.sin(angle) * dist * 0.5;

                ctx.quadraticCurveTo(cx, cy, x, y);
            }
            
            // Varying colors for organic feel
            const r = 220 + Math.random() * 35;
            const g = 180 + Math.random() * 40;
            const b = 180 + Math.random() * 40;
            
            ctx.strokeStyle = `rgba(${r},${g},${b}, ${alpha})`;
            ctx.lineWidth = widthBase + Math.random() * (widthBase * 0.6);
            // Shadow blur to simulate depth
            ctx.shadowBlur = 4;
            ctx.shadowColor = 'rgba(50, 20, 20, 0.5)';
            ctx.stroke();
            ctx.shadowBlur = 0; // Reset
        }
    };

    // Layered drawing for depth
    drawFolds(400, 30, 0.7); // Base structure
    drawFolds(600, 18, 0.6); // Medium details
    drawFolds(800, 8, 0.4);  // Fine details

    return new THREE.CanvasTexture(canvas);
};

export class PlayerMaterials {
    skin: THREE.MeshToonMaterial;
    shirt: THREE.MeshToonMaterial;
    pants: THREE.MeshToonMaterial;
    boots: THREE.MeshToonMaterial;
    sclera: THREE.MeshToonMaterial;
    iris: THREE.MeshToonMaterial;
    pupil: THREE.MeshToonMaterial;
    lip: THREE.MeshToonMaterial;
    underwear: THREE.MeshToonMaterial;
    hair: THREE.MeshToonMaterial;
    brain: THREE.MeshPhysicalMaterial;

    constructor(config: PlayerConfig) {
        this.skin = new THREE.MeshToonMaterial({ color: config.skinColor });
        this.shirt = new THREE.MeshToonMaterial({ color: 0x888888 });
        this.pants = new THREE.MeshToonMaterial({ color: 0x444444 });
        this.boots = new THREE.MeshToonMaterial({ color: 0x222222 });
        this.lip = new THREE.MeshToonMaterial({ color: config.lipColor });
        
        this.sclera = new THREE.MeshToonMaterial({ color: config.scleraColor });
        this.iris = new THREE.MeshToonMaterial({ color: config.eyeColor });
        this.pupil = new THREE.MeshToonMaterial({ color: config.pupilColor });
        
        this.underwear = new THREE.MeshToonMaterial({ color: 0xeaeaea });
        this.hair = new THREE.MeshToonMaterial({ color: config.hairColor, side: THREE.DoubleSide });
        
        // Brain Material setup - Physical for wet/organic look
        const brainTex = createBrainTexture();
        this.brain = new THREE.MeshPhysicalMaterial({ 
            color: 0xdea5b0,   // Pinkish Grey
            roughness: 0.35,   // Wet but not mirror
            metalness: 0.05,
            bumpMap: brainTex || undefined,
            bumpScale: 0.025,  // Deeper folds
            clearcoat: 0.8,    // Mucus/fluid layer
            clearcoatRoughness: 0.25,
            sheen: 0.3,        // Soft velvet-like highlight on ridges
            sheenColor: new THREE.Color(0xffddee),
        });
        
        this.sync(config);
    }

    sync(config: PlayerConfig) {
        const applyColor = (mat: THREE.MeshToonMaterial, color: string | number) => {
            const base = new THREE.Color(color);
            if (config.tintColor) {
                const tint = new THREE.Color(config.tintColor);
                base.multiply(tint);
            }
            mat.color.copy(base);
        };

        applyColor(this.skin, config.skinColor);
        applyColor(this.sclera, config.scleraColor);
        applyColor(this.iris, config.eyeColor);
        applyColor(this.pupil, config.pupilColor);
        applyColor(this.lip, config.lipColor);
        applyColor(this.hair, config.hairColor);

        if (config.equipment.shirt) {
            applyColor(this.shirt, config.shirtColor);
        } else {
            applyColor(this.shirt, config.skinColor);
        }

        if (config.equipment.pants) {
            applyColor(this.pants, config.pantsColor);
        } else {
            applyColor(this.pants, config.skinColor);
        }

        if (config.equipment.shoes) {
            applyColor(this.boots, config.bootsColor || '#3e2723');
        } else {
            applyColor(this.boots, config.skinColor);
        }
    }
    
    applyOutfit(outfit: OutfitType, skinColor: string) {}
}
