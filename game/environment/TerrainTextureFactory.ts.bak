
import * as THREE from 'three';

export class TerrainTextureFactory {
    private static textureCache: Map<string, THREE.Texture> = new Map();
    private static inflight: Map<string, Promise<void>> = new Map();
    private static worker: Worker | null = null;
    private static readonly TEXTURE_SIZE = 256;
    private static readonly STORAGE_VERSION = 'v3';

    private static getStorageKey(type: string) {
        return `terrain-texture:${type}:${TerrainTextureFactory.TEXTURE_SIZE}:${TerrainTextureFactory.STORAGE_VERSION}`;
    }

    /**
     * Resolves when all currently generating textures are finished.
     */
    static async allLoaded() {
        while (this.inflight.size > 0) {
            await Promise.all(Array.from(this.inflight.values()));
        }
    }

    private static getBaseColor(type: string) {
        switch (type) {
            case 'Grass': return '#2d3a1e';
            case 'Sand': return '#fbc02d';
            case 'Stone': return '#475569';
            case 'Wood': return '#b45309';
            case 'Snow': return '#f8fafc';
            case 'Gravel': return '#64748b';
            case 'Dirt': return '#78716c';
            case 'Metal': return '#334155';
            case 'Leaves': return '#7c2d12';
            case 'Obsidian': return '#0a0a0a';
            case 'Marble': return '#f5f5f5';
            case 'Toxic': return '#1a2e05';
            case 'Crimson': return '#450a0a';
            default: return '#2d3a1e';
        }
    }

    private static createPlaceholderTexture(color: string) {
        const canvas = document.createElement('canvas');
        canvas.width = 2;
        canvas.height = 2;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }

    private static applyRepeat(type: string, tex: THREE.Texture) {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        // Match the dev grid (10 cells per patch) so textures align with the grid lines.
        const baseRepeat = 10;
        tex.repeat.set(baseRepeat, baseRepeat);

        // Slightly lower repetition for patterns that need larger features.
        if (type === 'Wood' || type === 'Metal' || type === 'Marble') tex.repeat.set(baseRepeat / 2.5, baseRepeat / 2.5);
    }

    private static applyImageToTexture(tex: THREE.Texture, image: CanvasImageSource) {
        tex.image = image;
        tex.needsUpdate = true;
    }

    private static async generateOnMainThread(type: string, tex: THREE.Texture) {
        return new Promise<void>((resolve) => {
            const work = () => {
                const canvas = document.createElement('canvas');
                canvas.width = TerrainTextureFactory.TEXTURE_SIZE;
                canvas.height = TerrainTextureFactory.TEXTURE_SIZE;
                const ctx = canvas.getContext('2d');
                if (!ctx) return resolve();
                TerrainTextureFactory.drawTexture(ctx, TerrainTextureFactory.TEXTURE_SIZE, type);
                TerrainTextureFactory.applyImageToTexture(tex, canvas);
                TerrainTextureFactory.cacheToLocalStorage(type, canvas);
                resolve();
            };

            if ('requestIdleCallback' in window) {
                (window as any).requestIdleCallback(work);
            } else {
                setTimeout(work, 0);
            }
        });
    }

    private static cacheToLocalStorage(type: string, image: CanvasImageSource) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = TerrainTextureFactory.TEXTURE_SIZE;
            canvas.height = TerrainTextureFactory.TEXTURE_SIZE;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(image as any, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/png');
            localStorage.setItem(TerrainTextureFactory.getStorageKey(type), dataUrl);
        } catch {
            // Ignore storage failures
        }
    }

    private static getWorker(): Worker | null {
        if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') return null;
        if (!TerrainTextureFactory.worker) {
            try {
                if (typeof import.meta !== 'undefined' && import.meta.url && import.meta.url.startsWith('http')) {
                    const workerUrl = new URL('./TerrainTextureWorker.ts', import.meta.url);
                    TerrainTextureFactory.worker = new Worker(workerUrl, { type: 'module' });
                } else {
                    return null;
                }
            } catch (e) {
                return null;
            }
        }
        return TerrainTextureFactory.worker;
    }

    private static loadStaticTexture(type: string, tex: THREE.Texture): Promise<boolean> {
        return new Promise((resolve) => {
            const image = new Image();
            image.onload = () => {
                TerrainTextureFactory.applyImageToTexture(tex, image);
                TerrainTextureFactory.cacheToLocalStorage(type, image);
                resolve(true);
            };
            image.onerror = () => resolve(false);
            image.src = `/terrain-textures/${type.toLowerCase()}.png`;
        });
    }

    private static loadStoredTexture(type: string, tex: THREE.Texture): boolean {
        try {
            const stored = localStorage.getItem(TerrainTextureFactory.getStorageKey(type));
            if (!stored) return false;
            const image = new Image();
            image.onload = () => {
                TerrainTextureFactory.applyImageToTexture(tex, image);
            };
            image.src = stored;
            return true;
        } catch {
            return false;
        }
    }

    private static drawTexture(ctx: CanvasRenderingContext2D, size: number, type: string) {
        const noise = (amount: number, scale: number = 1) => {
            for (let i = 0; i < amount; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
                const s = Math.random() * scale;
                ctx.fillRect(Math.random() * size, Math.random() * size, s, s);
            }
        };

        const fill = (color: string) => {
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, size, size);
        };

        switch (type) {
            case 'Grass':
                fill('#2d3a1e'); 
                // Base Noise
                noise(40000, 2);
                
                // Varied Color Patches
                for(let i=0; i<20; i++) {
                    const cx = Math.random() * size;
                    const cy = Math.random() * size;
                    const r = 50 + Math.random() * 100;
                    const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, r);
                    // Mix lighter and darker patches
                    const isLight = Math.random() > 0.5;
                    const color = isLight ? '80, 120, 50' : '30, 50, 20';
                    grad.addColorStop(0, `rgba(${color}, 0.4)`);
                    grad.addColorStop(1, `rgba(${color}, 0.0)`);
                    ctx.fillStyle = grad;
                    ctx.fillRect(0, 0, size, size);
                }

                // Dense Blades
                const bladeColors = ['#416128', '#537d32', '#6a9c42', '#345221', '#7ca856', '#2e4a1a'];
                for(let i=0; i<12000; i++) {
                    const x = Math.random() * size;
                    const y = Math.random() * size;
                    const w = 1 + Math.random() * 2;
                    const h = 2 + Math.random() * 5;
                    const rotation = Math.random() * Math.PI * 2;
                    
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(rotation);
                    ctx.fillStyle = bladeColors[Math.floor(Math.random() * bladeColors.length)];
                    ctx.beginPath();
                    ctx.moveTo(-w/2, 0);
                    ctx.lineTo(w/2, 0);
                    ctx.lineTo(0, -h); 
                    ctx.fill();
                    ctx.restore();
                }
                
                // Add some small flowers/weeds
                for(let i=0; i<300; i++) {
                    const x = Math.random() * size;
                    const y = Math.random() * size;
                    ctx.fillStyle = Math.random() > 0.7 ? '#ffffaa' : '#ffffff';
                    ctx.beginPath();
                    ctx.arc(x, y, 1 + Math.random(), 0, Math.PI*2);
                    ctx.fill();
                }
                break;
            case 'Sand':
                fill('#fbc02d'); noise(8000, 2);
                ctx.strokeStyle = '#fdd835'; ctx.lineWidth = 12; ctx.globalAlpha = 0.4;
                for(let i=0; i<size; i+=30) {
                    ctx.beginPath(); ctx.moveTo(0, i);
                    ctx.bezierCurveTo(size/3, i+40, size*2/3, i-40, size, i);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1.0;
                break;
            case 'Stone':
                fill('#475569'); noise(15000, 3);
                ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 3; ctx.globalAlpha = 0.6;
                for(let i=0; i<40; i++) {
                    ctx.beginPath(); ctx.moveTo(Math.random()*size, Math.random()*size);
                    ctx.lineTo(Math.random()*size, Math.random()*size); ctx.stroke();
                }
                ctx.globalAlpha = 1.0;
                break;
            case 'Wood':
                fill('#b45309'); ctx.strokeStyle = '#78350f'; ctx.lineWidth = 6;
                for(let i=0; i<size; i+=64) {
                    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
                    ctx.fillStyle = 'rgba(0,0,0,0.15)';
                    for(let j=0; j<15; j++) ctx.fillRect(i + Math.random()*60, Math.random()*size, 3, 50);
                }
                ctx.fillStyle = '#111';
                for(let i=0; i<size; i+=64) {
                    ctx.beginPath(); ctx.arc(i+12, 12, 4, 0, Math.PI*2); ctx.fill();
                    ctx.beginPath(); ctx.arc(i+52, 12, 4, 0, Math.PI*2); ctx.fill();
                    ctx.beginPath(); ctx.arc(i+12, size-12, 4, 0, Math.PI*2); ctx.fill();
                    ctx.beginPath(); ctx.arc(i+52, size-12, 4, 0, Math.PI*2); ctx.fill();
                }
                break;
            case 'Snow':
                fill('#f8fafc'); noise(5000, 2);
                for(let i=0; i<8; i++) {
                   const cx = Math.random()*size; const cy = Math.random()*size;
                   const r = 50 + Math.random()*100;
                   const grad = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
                   grad.addColorStop(0, 'rgba(224, 242, 254, 0.4)');
                   grad.addColorStop(1, 'rgba(224, 242, 254, 0.0)');
                   ctx.fillStyle = grad; ctx.fillRect(0,0,size,size);
                }
                break;
            case 'Gravel':
                fill('#64748b');
                for(let i=0; i<1500; i++) {
                    ctx.fillStyle = Math.random()>0.5 ? '#334155' : '#94a3b8';
                    const s = 3 + Math.random() * 8; const x = Math.random()*size; const y = Math.random()*size;
                    ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI*2); ctx.fill();
                    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 0.5; ctx.stroke();
                }
                break;
            case 'Dirt':
                fill('#78716c'); noise(12000, 4); ctx.strokeStyle = '#44403c'; ctx.lineWidth = 1;
                for(let i=0; i<30; i++) {
                    ctx.beginPath(); const x = Math.random()*size, y = Math.random()*size;
                    ctx.moveTo(x,y); ctx.lineTo(x+Math.random()*20-10, y+Math.random()*20-10); ctx.stroke();
                }
                break;
            case 'Metal':
                fill('#334155'); ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 4; ctx.strokeRect(5, 5, size-10, size-10);
                const step = size / 4;
                for(let i=step; i<size; i+=step) {
                    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
                }
                ctx.fillStyle = '#64748b';
                for(let x=10; x<size; x+=step) {
                    for(let y=10; y<size; y+=step) {
                        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI*2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x + step - 20, y, 4, 0, Math.PI*2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x, y + step - 20, 4, 0, Math.PI*2); ctx.fill();
                        ctx.beginPath(); ctx.arc(x + step - 20, y + step - 20, 4, 0, Math.PI*2); ctx.fill();
                    }
                }
                break;
            case 'Leaves':
                fill('#7c2d12'); const leafColors = ['#ea580c', '#c2410c', '#facc15', '#9a3412', '#b91c1c'];
                for(let i=0; i<1200; i++) {
                    ctx.fillStyle = leafColors[Math.floor(Math.random()*leafColors.length)];
                    const x = Math.random()*size; const y = Math.random()*size;
                    const w = 8 + Math.random()*12; const h = 4 + Math.random()*6;
                    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.random()*Math.PI);
                    ctx.beginPath(); ctx.ellipse(0, 0, w, h, 0, 0, Math.PI*2); ctx.fill(); ctx.restore();
                }
                break;
            case 'Obsidian':
                fill('#0a0a0a'); noise(12000, 1.5); ctx.strokeStyle = '#4a148c'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.2;
                for(let i=0; i<20; i++) {
                    ctx.beginPath(); ctx.moveTo(Math.random()*size, 0); ctx.lineTo(Math.random()*size, size); ctx.stroke();
                }
                ctx.globalAlpha = 1.0;
                break;
            case 'Marble':
                fill('#f5f5f5'); ctx.strokeStyle = '#bdbdbd'; ctx.lineWidth = 2;
                for(let i=0; i<15; i++) {
                    ctx.beginPath(); ctx.moveTo(Math.random()*size, 0);
                    ctx.bezierCurveTo(Math.random()*size, size/2, Math.random()*size, size/2, Math.random()*size, size);
                    ctx.stroke();
                }
                break;
            case 'Toxic':
                fill('#1a2e05');
                for(let i=0; i<30; i++) {
                    ctx.fillStyle = Math.random() > 0.5 ? '#4d7c0f' : '#bef264';
                    ctx.beginPath(); ctx.arc(Math.random()*size, Math.random()*size, Math.random()*30 + 10, 0, Math.PI*2); ctx.fill();
                }
                noise(15000, 2);
                break;
            case 'Crimson':
                fill('#450a0a'); noise(12000, 2); ctx.fillStyle = '#991b1b';
                for(let i=0; i<40; i++) {
                    ctx.beginPath(); ctx.arc(Math.random()*size, Math.random()*size, Math.random()*20 + 5, 0, Math.PI*2); ctx.fill();
                }
                break;
        }
    }

    static getTexture(type: string): THREE.Texture {
        if (TerrainTextureFactory.textureCache.has(type)) {
            return TerrainTextureFactory.textureCache.get(type)!;
        }
        const placeholder = TerrainTextureFactory.createPlaceholderTexture(
            TerrainTextureFactory.getBaseColor(type)
        );
        TerrainTextureFactory.applyRepeat(type, placeholder);
        this.textureCache.set(type, placeholder);

        if (!TerrainTextureFactory.inflight.has(type)) {
            const inflight = (async () => {
                try {
                    const stored = TerrainTextureFactory.loadStoredTexture(type, placeholder);
                    if (stored) return;

                    const staticLoaded = await TerrainTextureFactory.loadStaticTexture(type, placeholder);
                    if (staticLoaded) return;

                    const worker = TerrainTextureFactory.getWorker();
                    if (worker) {
                        const resolved = await new Promise<boolean>((resolve) => {
                            const requestId = `${type}:${Date.now()}`;
                            const timeout = window.setTimeout(() => {
                                worker.removeEventListener('message', handleMessage);
                                resolve(false);
                            }, 1000);
                            const handleMessage = (event: MessageEvent) => {
                                const { id, bitmap } = event.data || {};
                                if (id !== requestId) return;
                                window.clearTimeout(timeout);
                                worker.removeEventListener('message', handleMessage);
                                if (bitmap) {
                                    TerrainTextureFactory.applyImageToTexture(placeholder, bitmap as ImageBitmap);
                                    TerrainTextureFactory.cacheToLocalStorage(type, bitmap as ImageBitmap);
                                }
                                resolve(!!bitmap);
                            };
                            worker.addEventListener('message', handleMessage);
                            worker.postMessage({ id: requestId, type, size: TerrainTextureFactory.TEXTURE_SIZE });
                        });

                        if (resolved) return;
                    }

                    await TerrainTextureFactory.generateOnMainThread(type, placeholder);
                } catch (err) {
                    console.warn(`[TerrainTextureFactory] Failed to generate texture for ${type}:`, err);
                }
            })();

            TerrainTextureFactory.inflight.set(type, inflight);
            inflight.finally(() => TerrainTextureFactory.inflight.delete(type));
        }

        return placeholder;
    }
}
