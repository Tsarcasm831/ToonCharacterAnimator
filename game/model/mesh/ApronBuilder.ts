import * as THREE from 'three';
import { PlayerConfig } from '../../../types';

export class ApronBuilder {
    static build(parts: any, config: PlayerConfig) {
        if (!config.equipment.blacksmithApron) return null;

        const createdMeshes: THREE.Object3D[] = [];
        
        // --- TEXTURE GENERATION ---
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const baseColor = config.apronColor || '#4e342e';
        const detailColor = config.apronDetailColor || '#212121';
        
        // Base leather color
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, 512, 512);

        // Add leather texture with more realistic variation
        for (let i = 0; i < 5000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.03)';
            ctx.fillRect(Math.random() * 512, Math.random() * 512, 1.5, 1.5);
        }

        // Add stitching detail
        ctx.strokeStyle = detailColor;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.5;
        ctx.setLineDash([8, 6]);
        ctx.strokeRect(5, 5, 502, 502);
        ctx.setLineDash([]);
        ctx.globalAlpha = 1.0;

        // Add pocket detail on bib
        ctx.fillStyle = detailColor;
        ctx.globalAlpha = 0.2;
        ctx.fillRect(150, 100, 212, 150);
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = detailColor;
        ctx.strokeRect(150, 100, 212, 150);

        // Add additional pockets for realism
        ctx.globalAlpha = 0.15;
        ctx.fillRect(50, 200, 80, 60);
        ctx.fillRect(382, 200, 80, 60);
        ctx.globalAlpha = 1.0;
        ctx.strokeRect(50, 200, 80, 60);
        ctx.strokeRect(382, 200, 80, 60);

        const apronTex = new THREE.CanvasTexture(canvas);
        const apronMat = new THREE.MeshToonMaterial({ 
            map: apronTex,
            side: THREE.DoubleSide
        });
        
        const strapMat = new THREE.MeshStandardMaterial({ 
            color: detailColor, 
            roughness: 0.8 
        });
        
        const metalMat = new THREE.MeshStandardMaterial({ 
            color: 0xaaaaaa, 
            metalness: 0.8, 
            roughness: 0.2 
        });

        // --- MESH GENERATION ---
        const apronGroup = new THREE.Group();
        apronGroup.name = 'BlacksmithApron';

        const torsoRadiusTop = 0.305; 
        const torsoRadiusBottom = 0.245; 
        const torsoDepthScale = 0.68;

        // 1. Bib (Upper Part) - More realistic shape
        const bibWidth = 0.36;
        const bibHeight = 0.38;
        const bibGeo = new THREE.PlaneGeometry(bibWidth, bibHeight, 16, 16);
        
        // Add realistic curve to bib
        const bibPos = bibGeo.attributes.position;
        for (let i = 0; i < bibPos.count; i++) {
            const x = bibPos.getX(i);
            const y = bibPos.getY(i);
            const xNorm = x / (bibWidth / 2);
            const yNorm = (y + bibHeight/2) / bibHeight;
            
            // More pronounced curve for realistic leather drape
            const curve = Math.cos(xNorm * Math.PI * 0.3) * 0.08;
            const verticalTaper = Math.sin(yNorm * Math.PI) * 0.02;
            
            // Add slight wave to simulate leather flexibility
            const wave = Math.sin(xNorm * Math.PI * 2) * 0.005 * (1 - yNorm);
            
            bibPos.setZ(i, curve + verticalTaper + wave);
        }
        bibGeo.computeVertexNormals();
        
        const bib = new THREE.Mesh(bibGeo, apronMat);
        bib.name = 'apronBib';
        bib.position.set(config.apronBibX, config.apronBibY, config.apronBibZ || 0.126);
        bib.scale.setScalar(config.apronBibScale);
        apronGroup.add(bib);

        // 2. Skirt (Lower Part) - More realistic apron skirt
        const skirtHeight = 0.6;
        const skirtGeo = new THREE.CylinderGeometry(
            torsoRadiusBottom * 1.12, 
            torsoRadiusBottom * 1.35, 
            skirtHeight, 
            24, 8, true, 
            -Math.PI * 0.45, Math.PI * 0.9 
        );
        skirtGeo.scale(1, 1, torsoDepthScale * 1.15);
        skirtGeo.translate(0, -skirtHeight / 2, 0);
        
        // Add slight wave to skirt bottom for realism
        const skirtPos = skirtGeo.attributes.position;
        for (let i = 0; i < skirtPos.count; i++) {
            const y = skirtPos.getY(i);
            const angle = Math.atan2(skirtPos.getZ(i), skirtPos.getX(i));
            const wave = Math.sin(angle * 8) * 0.005 * Math.max(0, -y / skirtHeight);
            skirtPos.setX(i, skirtPos.getX(i) + wave * Math.cos(angle + Math.PI/2));
            skirtPos.setZ(i, skirtPos.getZ(i) + wave * Math.sin(angle + Math.PI/2));
        }
        skirtGeo.computeVertexNormals();
        
        const skirt = new THREE.Mesh(skirtGeo, apronMat);
        skirt.name = 'apronSkirt';
        skirt.position.set(config.apronSkirtX, config.apronSkirtY, config.apronSkirtZ);
        skirt.scale.set(config.apronSkirtScaleX, config.apronSkirtScaleY, config.apronSkirtScaleZ);
        apronGroup.add(skirt);

        // 3. Straps - More realistic shoulder straps
        const strapWidth = 0.055;
        const strapThick = 0.012;
        const strapShape = new THREE.Shape();
        strapShape.moveTo(-strapWidth/2, -strapThick/2);
        strapShape.lineTo(strapWidth/2, -strapThick/2);
        strapShape.lineTo(strapWidth/2, strapThick/2);
        strapShape.lineTo(-strapWidth/2, strapThick/2);
        strapShape.lineTo(-strapWidth/2, -strapThick/2);

        [-1, 1].forEach(side => {
            // A. Bib Connection Point (Top of bib where buckle attaches)
            const scale = config.apronBibScale;
            
            // Calculate X offset on the unscaled geometry
            const rawBibConnectX = side * (bibWidth/2 - 0.04);
            // Calculate Z curve on the unscaled geometry
            const xNorm = rawBibConnectX / (bibWidth / 2);
            const rawBibCurveZ = Math.cos(xNorm * Math.PI * 0.3) * 0.08;

            // Apply Scale to get World/Group offsets
            const bibConnectX = rawBibConnectX * scale;
            const bibCurveZ = rawBibCurveZ * scale;
            
            // Position at the TOP of the bib where straps connect
            const bibTopY = config.apronBibY + (bibHeight / 2 * scale) - 0.03;
            
            // Base Z on the bib surface
            const bibSurfaceZ = (config.apronBibZ || 0.126) + bibCurveZ;

            // Strap Start: From the top of the bib
            const startPoint = new THREE.Vector3(
                config.apronBibX + bibConnectX,
                bibTopY, // Start from the top edge of the bib
                bibSurfaceZ + 0.02
            );

            // B. Waist Connection Point (Back)
            const backAngle = side * Math.PI * 0.25; 
            const beltRadiusX = torsoRadiusBottom * 1.15;
            const beltRadiusZ = beltRadiusX * torsoDepthScale * 1.15;
            
            const beltSurfaceOffset = 1.05; 
            
            const endPoint = new THREE.Vector3(
                Math.sin(backAngle) * beltRadiusX * beltSurfaceOffset,
                config.apronSkirtY + 0.02, 
                -Math.cos(backAngle) * beltRadiusZ * beltSurfaceOffset
            );

            // C. Control Points for realistic strap curve
            const shoulderX = side * 0.16;
            const shoulderY = 0.50;

            // Create a more natural curve for the straps
            const startControl = startPoint.clone().add(new THREE.Vector3(0, 0.08, 0.02));
            const endControl = endPoint.clone().add(new THREE.Vector3(0, 0.05, 0.01));

            const curve = new THREE.CatmullRomCurve3([
                startPoint,
                startControl,
                new THREE.Vector3(shoulderX, 0.46, 0.18), // Front shoulder
                new THREE.Vector3(shoulderX * 1.1, shoulderY, 0.0), // Top of shoulder
                new THREE.Vector3(shoulderX, 0.44, -0.18), // Back shoulder
                endControl,
                endPoint
            ]);

            const strapGeo = new THREE.ExtrudeGeometry(strapShape, {
                steps: 24,
                extrudePath: curve,
                bevelEnabled: false
            });
            
            const strap = new THREE.Mesh(strapGeo, strapMat);
            strap.name = `apronStrap_${side}`;
            apronGroup.add(strap);

            // 4. Buckles and Rivets - More realistic hardware
            const buttonMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
            
            // Front Buckle - Connected to the TOP of the bib
            const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.025), buttonMat);
            buckle.position.set(
                config.apronBibX + bibConnectX,
                bibTopY, // Position at the top of the bib
                bibSurfaceZ + 0.015
            );
            buckle.rotation.x = -0.2;
            buckle.rotation.z = side * -0.1;
            apronGroup.add(buckle);

            // Add a metal pin through the buckle for realism
            const bucklePin = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.08, 8), metalMat);
            bucklePin.position.set(
                config.apronBibX + bibConnectX,
                bibTopY,
                bibSurfaceZ + 0.025
            );
            bucklePin.rotation.z = side * Math.PI / 2;
            apronGroup.add(bucklePin);

            // Front Rivet (Ball on bib)
            const rivetFront = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), metalMat);
            rivetFront.name = `apronRivetFront_${side}`;
            rivetFront.position.set(
                config.apronBibX + bibConnectX,
                bibTopY - 0.02,
                bibSurfaceZ + 0.06
            );
            apronGroup.add(rivetFront);

            // Back Rivet (Button on skirt belt)
            const rivetBack = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.01, 16), buttonMat);
            rivetBack.name = `apronRivetBack_${side}`;
            
            // Position on top of belt
            const backNormal = new THREE.Vector3(endPoint.x, 0, endPoint.z).normalize();
            rivetBack.position.copy(endPoint).add(backNormal.multiplyScalar(0.015));
            // Rotate to face outward
            rivetBack.lookAt(rivetBack.position.clone().add(backNormal));
            rivetBack.rotateX(Math.PI / 2);
            
            apronGroup.add(rivetBack);
        });

        // 4. Waist Belt - More realistic belt with buckle
        const beltGeo = new THREE.TorusGeometry(torsoRadiusBottom * 1.15, 0.02, 8, 32, Math.PI * 1.85);
        beltGeo.scale(1, 0.8, torsoDepthScale * 1.15);
        const belt = new THREE.Mesh(beltGeo, strapMat);
        belt.name = 'apronBelt';
        belt.rotation.x = Math.PI / 2;
        belt.rotation.z = -Math.PI * 0.925;
        belt.position.y = config.apronSkirtY;
        apronGroup.add(belt);

        // Add center buckle to belt
        const beltBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.02), metalMat);
        beltBuckle.position.set(
            (torsoRadiusBottom * 1.15) + 0.01,
            config.apronSkirtY,
            0
        );
        beltBuckle.rotation.y = Math.PI / 2;
        apronGroup.add(beltBuckle);

        // Rivets down the center of the apron skirt
        for (let i = 0; i < 5; i++) {
            const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), metalMat);
            rivet.name = `apronSkirtRivet_${i}`;
            rivet.position.set(0, config.apronSkirtY - 0.1 - (i * 0.12), (torsoRadiusBottom * torsoDepthScale * 1.18 + 0.02) * 1.1);
            apronGroup.add(rivet);
        }

        const torsoY = parts.torso?.position?.y ?? 0.38;
        apronGroup.position.y = torsoY;
        parts.torsoContainer.add(apronGroup);
        createdMeshes.push(apronGroup);

        return { meshes: createdMeshes, group: apronGroup };
    }
}
