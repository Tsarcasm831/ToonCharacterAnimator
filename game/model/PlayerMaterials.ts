import * as THREE from 'three';
import { PlayerConfig, OutfitType } from '../../types';

export class PlayerMaterials {
    skin: THREE.MeshToonMaterial;
    shirt: THREE.MeshToonMaterial;
    pants: THREE.MeshToonMaterial;
    boots: THREE.MeshToonMaterial;
    sclera: THREE.MeshToonMaterial;
    lip: THREE.MeshToonMaterial;
    underwear: THREE.MeshToonMaterial;
    hair: THREE.MeshToonMaterial;
    private eyeCanvas: HTMLCanvasElement;
    private eyeCtx: CanvasRenderingContext2D | null;
    private eyeTexture: THREE.CanvasTexture;

    constructor(config: PlayerConfig) {
        this.skin = new THREE.MeshToonMaterial({ color: config.skinColor });
        this.shirt = new THREE.MeshToonMaterial({ color: 0x888888 });
        this.pants = new THREE.MeshToonMaterial({ color: 0x444444 });
        this.boots = new THREE.MeshToonMaterial({ color: 0x222222 });
        this.lip = new THREE.MeshToonMaterial({ color: config.lipColor });
        this.eyeCanvas = document.createElement('canvas');
        this.eyeCanvas.width = 256;
        this.eyeCanvas.height = 256;
        this.eyeCtx = this.eyeCanvas.getContext('2d');
        this.eyeTexture = new THREE.CanvasTexture(this.eyeCanvas);
        this.sclera = new THREE.MeshToonMaterial({ color: 0xffffff, map: this.eyeTexture });
        this.underwear = new THREE.MeshToonMaterial({ color: 0xeaeaea });
        this.hair = new THREE.MeshToonMaterial({ color: config.hairColor });
        this.updateEyeTexture(config);
    }

    sync(config: PlayerConfig) {
        this.skin.color.set(config.skinColor);
        this.sclera.color.set(0xffffff);
        this.updateEyeTexture(config);
        this.lip.color.set(config.lipColor);
        this.hair.color.set(config.hairColor);
    }

    private updateEyeTexture(config: PlayerConfig) {
        if (!this.eyeCtx) return;
        const ctx = this.eyeCtx;
        const size = this.eyeCanvas.width;
        const center = size * 0.5;
        const irisRadius = size * 0.22 * config.irisScale;
        const pupilRadius = size * 0.08 * config.pupilScale;

        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = config.scleraColor;
        ctx.fillRect(0, 0, size, size);

        ctx.fillStyle = config.eyeColor;
        ctx.beginPath();
        ctx.arc(center, center, irisRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = config.pupilColor;
        ctx.beginPath();
        ctx.arc(center, center, pupilRadius, 0, Math.PI * 2);
        ctx.fill();

        this.eyeTexture.needsUpdate = true;
    }

    applyOutfit(outfit: OutfitType, skinColor: string) {
        let sc = 0x888888, pc = 0x444444, bc = 0x222222;
        if(outfit === 'peasant') { sc = 0x8d6e63; pc = 0x5d4037; bc = 0x3e2723; }
        else if(outfit === 'warrior') { sc = 0x607d8b; pc = 0x37474f; bc = 0x263238; }
        else if(outfit === 'noble') { sc = 0x3f51b5; pc = 0x1a237e; bc = 0x111111; }
        else if(outfit === 'naked' || outfit === 'nude') { sc = pc = bc = new THREE.Color(skinColor).getHex(); }
        this.shirt.color.setHex(sc);
        this.pants.color.setHex(pc);
        this.boots.color.setHex(bc);
    }
}
