const drawTexture = (ctx: OffscreenCanvasRenderingContext2D, size: number, type: string) => {
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
            noise(25000, 2);
            for (let i = 0; i < 12; i++) {
                const cx = Math.random() * size;
                const cy = Math.random() * size;
                const r = 80 + Math.random() * 150;
                const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
                const cVal = Math.random() > 0.5 ? '60, 90, 40' : '45, 75, 30';
                grad.addColorStop(0, `rgba(${cVal}, 0.5)`);
                grad.addColorStop(1, `rgba(${cVal}, 0.0)`);
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, size, size);
            }
            const bladeColors = ['#416128', '#537d32', '#6a9c42', '#345221', '#7ca856'];
            for (let i = 0; i < 4000; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const w = 1.5 + Math.random() * 2.5;
                const h = 4 + Math.random() * 6;
                const rotation = Math.random() * Math.PI * 2;
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(rotation);
                ctx.fillStyle = bladeColors[Math.floor(Math.random() * bladeColors.length)];
                ctx.beginPath();
                ctx.moveTo(-w / 2, 0);
                ctx.lineTo(w / 2, 0);
                ctx.lineTo(0, -h);
                ctx.fill();
                ctx.restore();
            }
            break;

        case 'Sand':
            fill('#fbc02d');
            noise(8000, 2);
            ctx.strokeStyle = '#fdd835';
            ctx.lineWidth = 12;
            ctx.globalAlpha = 0.4;
            for (let i = 0; i < size; i += 30) {
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.bezierCurveTo(size / 3, i + 40, size * 2 / 3, i - 40, size, i);
                ctx.stroke();
            }
            ctx.globalAlpha = 1.0;
            break;

        case 'Stone':
            fill('#475569');
            noise(15000, 3);
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.6;
            for (let i = 0; i < 40; i++) {
                ctx.beginPath();
                ctx.moveTo(Math.random() * size, Math.random() * size);
                ctx.lineTo(Math.random() * size, Math.random() * size);
                ctx.stroke();
            }
            ctx.globalAlpha = 1.0;
            break;

        case 'Wood':
            fill('#b45309');
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 6;
            for (let i = 0; i < size; i += 64) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, size);
                ctx.stroke();
                ctx.fillStyle = 'rgba(0,0,0,0.15)';
                for (let j = 0; j < 15; j++) ctx.fillRect(i + Math.random() * 60, Math.random() * size, 3, 50);
            }
            ctx.fillStyle = '#111';
            for (let i = 0; i < size; i += 64) {
                ctx.beginPath();
                ctx.arc(i + 12, 12, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(i + 52, 12, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(i + 12, size - 12, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(i + 52, size - 12, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            break;

        case 'Snow':
            fill('#f8fafc');
            noise(5000, 2);
            for (let i = 0; i < 8; i++) {
                const cx = Math.random() * size;
                const cy = Math.random() * size;
                const r = 50 + Math.random() * 100;
                const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
                grad.addColorStop(0, 'rgba(224, 242, 254, 0.4)');
                grad.addColorStop(1, 'rgba(224, 242, 254, 0.0)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, size, size);
            }
            break;

        case 'Gravel':
            fill('#64748b');
            for (let i = 0; i < 1500; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? '#334155' : '#94a3b8';
                const s = 3 + Math.random() * 8;
                const x = Math.random() * size;
                const y = Math.random() * size;
                ctx.beginPath();
                ctx.arc(x, y, s, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#1e293b';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
            break;

        case 'Dirt':
            fill('#78716c');
            noise(12000, 4);
            ctx.strokeStyle = '#44403c';
            ctx.lineWidth = 1;
            for (let i = 0; i < 30; i++) {
                ctx.beginPath();
                const x = Math.random() * size;
                const y = Math.random() * size;
                ctx.moveTo(x, y);
                ctx.lineTo(x + Math.random() * 20 - 10, y + Math.random() * 20 - 10);
                ctx.stroke();
            }
            break;

        case 'Metal':
            fill('#334155');
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 4;
            ctx.strokeRect(5, 5, size - 10, size - 10);
            const step = size / 4;
            for (let i = step; i < size; i += step) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, size);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(size, i);
                ctx.stroke();
            }
            ctx.fillStyle = '#64748b';
            for (let x = 10; x < size; x += step) {
                for (let y = 10; y < size; y += step) {
                    ctx.beginPath();
                    ctx.arc(x, y, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(x + step - 20, y, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(x, y + step - 20, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(x + step - 20, y + step - 20, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            break;

        case 'Leaves':
            fill('#7c2d12');
            const leafColors = ['#ea580c', '#c2410c', '#facc15', '#9a3412', '#b91c1c'];
            for (let i = 0; i < 1200; i++) {
                ctx.fillStyle = leafColors[Math.floor(Math.random() * leafColors.length)];
                const x = Math.random() * size;
                const y = Math.random() * size;
                const w = 8 + Math.random() * 12;
                const h = 4 + Math.random() * 6;
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(Math.random() * Math.PI);
                ctx.beginPath();
                ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            break;

        case 'Obsidian':
            fill('#0a0a0a');
            noise(12000, 1.5);
            ctx.strokeStyle = '#4a148c';
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 0.2;
            for (let i = 0; i < 20; i++) {
                ctx.beginPath();
                ctx.moveTo(Math.random() * size, 0);
                ctx.lineTo(Math.random() * size, size);
                ctx.stroke();
            }
            ctx.globalAlpha = 1.0;
            break;

        case 'Marble':
            fill('#f5f5f5');
            ctx.strokeStyle = '#bdbdbd';
            ctx.lineWidth = 2;
            for (let i = 0; i < 15; i++) {
                ctx.beginPath();
                ctx.moveTo(Math.random() * size, 0);
                ctx.bezierCurveTo(Math.random() * size, size / 2, Math.random() * size, size / 2, Math.random() * size, size);
                ctx.stroke();
            }
            break;

        case 'Toxic':
            fill('#1a2e05');
            for (let i = 0; i < 30; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? '#4d7c0f' : '#bef264';
                ctx.beginPath();
                ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 30 + 10, 0, Math.PI * 2);
                ctx.fill();
            }
            noise(15000, 2);
            break;

        case 'Crimson':
            fill('#450a0a');
            noise(12000, 2);
            ctx.fillStyle = '#991b1b';
            for (let i = 0; i < 40; i++) {
                ctx.beginPath();
                ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 20 + 5, 0, Math.PI * 2);
                ctx.fill();
            }
            break;
    }
};

const workerSelf = self as any;

workerSelf.onmessage = async (event: MessageEvent) => {
    const { id, type, size } = event.data || {};
    if (!id || !type || !size) {
        workerSelf.postMessage({ id, bitmap: null });
        return;
    }

    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        workerSelf.postMessage({ id, bitmap: null });
        return;
    }

    drawTexture(ctx, size, type);
    const bitmap = canvas.transferToImageBitmap();
    workerSelf.postMessage({ id, bitmap }, [bitmap]);
};
