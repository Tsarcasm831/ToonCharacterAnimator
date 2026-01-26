
import * as THREE from 'three';

export class ForgeBuilder {
    static build(position: THREE.Vector3, rotationY: number): { group: THREE.Group, obstacles: THREE.Object3D[] } {
        const group = new THREE.Group();
        group.position.copy(position);
        group.rotation.y = rotationY;

        const obstacles: THREE.Object3D[] = [];

        // --- MATERIALS ---
        const brickColor = '#8d402b';
        const mortarColor = '#a89f91';
        
        // Procedural Brick Texture
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = brickColor;
            ctx.fillRect(0,0,512,512);
            // Noise
            ctx.globalAlpha = 0.2;
            for(let i=0; i<10000; i++) {
                ctx.fillStyle = Math.random()>0.5?'#000':'#fff';
                ctx.fillRect(Math.random()*512, Math.random()*512, 2, 2);
            }
            ctx.globalAlpha = 1.0;
            // Brick lines
            ctx.strokeStyle = mortarColor;
            ctx.lineWidth = 4;
            const brickH = 32;
            const brickW = 64;
            for(let y=0; y<512; y+=brickH) {
                ctx.beginPath();
                ctx.moveTo(0,y); ctx.lineTo(512,y);
                ctx.stroke();
                const offset = (y/brickH)%2 === 0 ? 0 : brickW/2;
                for(let x= -brickW; x<512; x+=brickW) {
                    ctx.beginPath();
                    ctx.moveTo(x+offset, y);
                    ctx.lineTo(x+offset, y+brickH);
                    ctx.stroke();
                }
            }
        }
        const brickTex = new THREE.CanvasTexture(canvas);
        brickTex.wrapS = THREE.RepeatWrapping;
        brickTex.wrapT = THREE.RepeatWrapping;
        
        const brickMat = new THREE.MeshStandardMaterial({ map: brickTex, roughness: 0.9 });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, metalness: 0.6 });
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9 });
        const leatherMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8 });

        // --- HEARTH (Base) ---
        const hearthW = 2.4;
        const hearthD = 1.4;
        const hearthH = 0.9;
        
        const hearth = new THREE.Mesh(new THREE.BoxGeometry(hearthW, hearthH, hearthD), brickMat);
        hearth.position.y = hearthH/2;
        hearth.castShadow = true;
        hearth.receiveShadow = true;
        // MARK AS INTERACTABLE
        hearth.userData = { 
            type: 'hard', 
            material: 'stone', 
            isForge: true,
            interactType: 'forge' 
        };
        group.add(hearth);
        obstacles.push(hearth);

        // Fire Pit Indentation (Visual only, black top)
        const pit = new THREE.Mesh(new THREE.BoxGeometry(hearthW-0.6, 0.05, hearthD-0.6), new THREE.MeshStandardMaterial({ color: 0x111111 }));
        pit.position.y = hearthH + 0.026;
        pit.position.z = 0.1;
        group.add(pit);

        // --- CHIMNEY ---
        // Back wall part
        const chimW = hearthW;
        const chimD = 0.6;
        const chimH = 5.5;
        const chimney = new THREE.Mesh(new THREE.BoxGeometry(chimW, chimH, chimD), brickMat);
        chimney.position.set(0, chimH/2, -(hearthD/2) + (chimD/2));
        chimney.castShadow = true;
        chimney.userData = { type: 'hard', material: 'stone' };
        group.add(chimney);
        obstacles.push(chimney);

        // Tapered top of chimney
        const taperH = 1.5;
        const taperGeo = new THREE.CylinderGeometry(0.5, chimW*0.65, taperH, 4);
        taperGeo.rotateY(Math.PI/4); // Square it
        const taper = new THREE.Mesh(taperGeo, brickMat);
        taper.position.set(0, chimH + taperH/2, -(hearthD/2) + (chimD/2));
        taper.castShadow = true;
        group.add(taper);

        // --- METAL HOOD ---
        const hoodH = 1.4;
        const hoodW = 1.8;
        const hoodD = 1.2;
        // Pyramid shape with top cut off
        const hoodGeo = new THREE.CylinderGeometry(0.4, Math.sqrt(hoodW*hoodW/2), hoodH, 4, 1, true);
        hoodGeo.rotateY(Math.PI/4); // Square it
        const hood = new THREE.Mesh(hoodGeo, metalMat);
        hood.position.set(0, hearthH + 1.2, 0);
        hood.scale.set(1, 1, 0.7);
        hood.castShadow = true;
        group.add(hood);

        // --- FIRE & EMBERS ---
        const fireLight = new THREE.PointLight(0xff6600, 3, 10);
        fireLight.position.set(0, hearthH + 0.4, 0.1);
        fireLight.userData = { isFlameLight: true, phase: 0 };
        group.add(fireLight);

        // Embers
        const emberGeo = new THREE.DodecahedronGeometry(0.2, 0);
        const emberMat = new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff2200, emissiveIntensity: 3 });
        for(let i=0; i<8; i++) {
            const ember = new THREE.Mesh(emberGeo, emberMat);
            ember.scale.setScalar(0.5 + Math.random()*0.5);
            ember.position.set((Math.random()-0.5)*1.0, hearthH+0.1, 0.1 + (Math.random()-0.5)*0.5);
            ember.rotation.set(Math.random(), Math.random(), Math.random());
            group.add(ember);
        }

        // --- BELLOWS ---
        const bellowsGroup = new THREE.Group();
        bellowsGroup.position.set(hearthW/2 + 0.8, hearthH * 0.7, 0.2);
        bellowsGroup.rotation.z = 0.2;
        group.add(bellowsGroup);

        // Frame
        const bFrame = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.15, 0.7), woodMat);
        bellowsGroup.add(bFrame);
        // Accordion (Leather)
        const bLeather = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8), leatherMat);
        bLeather.rotation.z = Math.PI/2;
        bLeather.scale.set(1, 0.8, 1.5);
        bLeather.position.y = -0.2;
        bellowsGroup.add(bLeather);
        // Nozzle
        const bNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, 0.8), metalMat);
        bNozzle.rotation.z = Math.PI/2;
        bNozzle.position.x = -0.9;
        bNozzle.position.y = -0.2;
        bellowsGroup.add(bNozzle);
        
        // Handle / Lever
        const leverBase = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1), woodMat);
        leverBase.position.set(0.6, 0.4, 0);
        bellowsGroup.add(leverBase);
        
        const bHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2), woodMat);
        bHandle.rotation.x = Math.PI/2;
        bHandle.position.set(0.6, 0.7, 0);
        bellowsGroup.add(bHandle);

        // --- ANVIL & STUMP ---
        const anvilGroup = new THREE.Group();
        anvilGroup.position.set(0, 0, 1.8); // In front of forge
        group.add(anvilGroup);

        // Stump
        const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.6, 12), woodMat);
        stump.position.y = 0.3;
        stump.castShadow = true;
        stump.userData = { type: 'hard', material: 'wood' };
        anvilGroup.add(stump);
        obstacles.push(stump);

        // Anvil Base
        const anvilBase = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.4), metalMat);
        anvilBase.position.y = 0.6 + 0.075;
        anvilGroup.add(anvilBase);
        
        // Waist
        const anvilWaist = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.15, 0.28), metalMat);
        anvilWaist.position.y = 0.6 + 0.15 + 0.075;
        // concave sides fake
        anvilGroup.add(anvilWaist);
        
        // Top
        const anvilTop = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.6), metalMat);
        anvilTop.position.y = 0.6 + 0.3 + 0.06;
        anvilGroup.add(anvilTop);
        
        // Horn
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 12), metalMat);
        horn.rotation.x = -Math.PI/2; // Point forward Z+
        horn.position.set(0, 0.6 + 0.32, 0.3);
        horn.scale.set(0.8, 1, 0.6); // Flatten cone
        anvilGroup.add(horn);

        // --- WATER BARREL ---
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.3, 0.8, 10), woodMat);
        barrel.position.set(-1.8, 0.4, 1.2);
        barrel.castShadow = true;
        barrel.userData = { type: 'hard', material: 'wood' };
        group.add(barrel);
        obstacles.push(barrel);
        
        // Bands
        const bandMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const b1 = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.02, 4, 12), bandMat);
        b1.rotation.x = Math.PI/2; b1.position.y = 0.6;
        barrel.add(b1);
        const b2 = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.02, 4, 12), bandMat);
        b2.rotation.x = Math.PI/2; b2.position.y = 0.2;
        barrel.add(b2);

        // Water surface
        const water = new THREE.Mesh(new THREE.CircleGeometry(0.32, 10), new THREE.MeshStandardMaterial({ color: 0x224466, roughness: 0.1 }));
        water.rotation.x = -Math.PI/2;
        water.position.set(-1.8, 0.75, 1.2);
        group.add(water);

        return { group, obstacles };
    }
}
