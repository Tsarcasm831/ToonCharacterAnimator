
import * as THREE from 'three';
import { PlayerConfig } from '../../../types';

const METAL_COLOR = '#b0bec5';
const BRASS_COLOR = '#d4af37';
const LEATHER_COLOR = '#3e2723';

export class PlateMailBuilder {
    static build(parts: any, config: PlayerConfig) {
        const createdMeshes: THREE.Object3D[] = [];
        const refs: any = { torso: null, sleeves: [], details: [] };

        // Materials
        const metalMat = new THREE.MeshStandardMaterial({
            color: METAL_COLOR,
            metalness: 0.95,
            roughness: 0.15,
            flatShading: false,
            envMapIntensity: 1.0
        });

        const brassMat = new THREE.MeshStandardMaterial({
            color: BRASS_COLOR,
            metalness: 1.0,
            roughness: 0.1
        });

        const leatherMat = new THREE.MeshStandardMaterial({
            color: LEATHER_COLOR,
            roughness: 0.9,
            metalness: 0.0
        });

        // Shared Geometry
        const rivetGeo = new THREE.SphereGeometry(0.012, 8, 8);

        // 1. MAIN TORSO GROUP
        const torsoRadiusTop = 0.31;
        const torsoRadiusBottom = 0.26;
        const torsoHeight = 0.54;
        const torsoDepthScale = 0.68;

        const torsoGroup = new THREE.Group();
        torsoGroup.position.y = parts.torso?.position?.y ?? 0.38;
        parts.torsoContainer.add(torsoGroup);
        createdMeshes.push(torsoGroup);
        refs.torso = torsoGroup;

        // A. GORGET (Neck Plate)
        const gorgetGeo = new THREE.TorusGeometry(0.14, 0.03, 8, 24, Math.PI);
        const gorget = new THREE.Mesh(gorgetGeo, metalMat);
        gorget.rotation.x = -Math.PI / 2;
        gorget.position.y = torsoHeight / 2 + 0.04;
        gorget.scale.set(1, 1.2, 0.8);
        torsoGroup.add(gorget);
        createdMeshes.push(gorget);

        // B. BREASTPLATES (Upper segmented plates)
        // We create two curved front plates and two back plates
        const createUpperPlate = (side: number, isBack: boolean) => {
            const plateGeo = new THREE.SphereGeometry(torsoRadiusTop * 1.05, 16, 12, 
                isBack ? Math.PI * 1.1 : -Math.PI * 0.1, 
                Math.PI * 0.4, 
                0.2, 0.8);
            plateGeo.scale(1, 0.6, torsoDepthScale * 1.1);
            const plate = new THREE.Mesh(plateGeo, metalMat);
            plate.position.y = 0.15;
            plate.castShadow = true;
            return plate;
        };

        for (let side of [-1, 1]) {
            const frontUpper = createUpperPlate(side, false);
            const backUpper = createUpperPlate(side, true);
            torsoGroup.add(frontUpper, backUpper);
            createdMeshes.push(frontUpper, backUpper);

            // Connect with shoulder straps (Leather)
            const strapGeo = new THREE.BoxGeometry(0.06, 0.3, 0.015);
            const strap = new THREE.Mesh(strapGeo, leatherMat);
            strap.position.set(side * 0.18, 0.32, 0);
            strap.rotation.x = Math.PI / 2;
            torsoGroup.add(strap);
            createdMeshes.push(strap);

            // Brass hinges on straps
            for (let z of [-0.1, 0.1]) {
                const hinge = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.02, 0.02), brassMat);
                hinge.position.set(side * 0.18, 0.33, z);
                torsoGroup.add(hinge);
            }
        }

        // C. ABDOMINAL SEGMENTS (Horizontal Bands)
        const segments = 6;
        const segHeight = (torsoHeight / (segments + 2));
        for (let i = 0; i < segments; i++) {
            const rTop = THREE.MathUtils.lerp(torsoRadiusTop, torsoRadiusBottom, (i / segments));
            const rBot = THREE.MathUtils.lerp(torsoRadiusTop, torsoRadiusBottom, ((i + 1) / segments));
            
            // Bands wrap around but have a slight gap in front for leather lacing
            const bandGeo = new THREE.CylinderGeometry(rTop * 1.04, rBot * 1.04, segHeight * 1.1, 24, 1, true, 0.1, Math.PI * 2 - 0.2);
            bandGeo.scale(1, 1, torsoDepthScale * 1.04);
            
            const band = new THREE.Mesh(bandGeo, metalMat);
            band.position.y = (torsoHeight / 2) - 0.18 - (i * (segHeight * 0.9));
            band.rotation.y = Math.PI / 2 + 0.1; // Center the gap
            band.castShadow = true;
            torsoGroup.add(band);
            createdMeshes.push(band);

            // Central vertical leather strap over the band gaps
            const vStrap = new THREE.Mesh(new THREE.BoxGeometry(0.05, segHeight, 0.01), leatherMat);
            vStrap.position.set(0, band.position.y, torsoRadiusTop * torsoDepthScale * 1.05);
            torsoGroup.add(vStrap);
            createdMeshes.push(vStrap);

            // Rivets on each band
            for (let s of [-1, 1]) {
                const rivet = new THREE.Mesh(rivetGeo, brassMat);
                rivet.position.set(s * 0.1, 0, torsoRadiusTop * torsoDepthScale * 1.06);
                band.add(rivet);
            }
        }

        // 2. PAULDRONS (Shoulder Lames)
        const createPauldron = (isLeft: boolean) => {
            const group = new THREE.Group();
            const pCount = 5;
            const pRad = 0.21;
            
            for (let i = 0; i < pCount; i++) {
                // Arched shoulder plates
                const arc = Math.PI * 0.75;
                const lameGeo = new THREE.SphereGeometry(pRad - i * 0.005, 16, 8, (Math.PI - arc) / 2, arc, 0, Math.PI * 0.4);
                lameGeo.scale(1.1, 0.35, 1.25);
                
                const lame = new THREE.Mesh(lameGeo, metalMat);
                lame.position.y = -i * 0.065 + 0.08;
                lame.rotation.y = -Math.PI / 2; 
                lame.castShadow = true;
                group.add(lame);
                
                // Trim on the edge of the lame
                const trim = new THREE.Mesh(new THREE.TorusGeometry(pRad - i * 0.005, 0.008, 4, 16, arc), brassMat);
                trim.rotation.y = -Math.PI / 2;
                trim.rotation.x = Math.PI / 2;
                trim.position.y = 0.01;
                lame.add(trim);

                // Rivet on center top of lame
                const r = new THREE.Mesh(rivetGeo, brassMat);
                r.position.y = 0.05;
                lame.add(r);
            }
            return group;
        };

        const lPauldron = createPauldron(true);
        lPauldron.position.set(0.06, 0.05, 0);
        lPauldron.rotation.z = -0.15;
        parts.leftShoulderMount.add(lPauldron);
        createdMeshes.push(lPauldron);

        const rPauldron = createPauldron(false);
        rPauldron.position.set(-0.06, 0.05, 0);
        rPauldron.rotation.z = 0.15;
        rPauldron.scale.x = -1;
        parts.rightShoulderMount.add(rPauldron);
        createdMeshes.push(rPauldron);

        // 3. VAMBRACES & GAUNTLETS
        const createArmPlate = (isUpper: boolean) => {
            const rad = isUpper ? 0.085 : 0.065;
            const len = isUpper ? 0.16 : 0.14;
            const geo = new THREE.CylinderGeometry(rad, rad * 0.95, len, 16, 1, true);
            geo.translate(0, -len / 2, 0);
            const mesh = new THREE.Mesh(geo, metalMat);
            mesh.castShadow = true;
            
            // Brass decorative cuff
            const cuff = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.012, 6, 16), brassMat);
            cuff.rotation.x = Math.PI / 2;
            cuff.position.y = -len;
            mesh.add(cuff);

            // Add rivets
            for(let a=0; a<Math.PI*2; a+=Math.PI/2) {
                const r = new THREE.Mesh(rivetGeo, brassMat);
                r.position.set(Math.cos(a)*rad, -len/2, Math.sin(a)*rad);
                mesh.add(r);
            }
            
            return mesh;
        };

        [parts.rightArm, parts.leftArm].forEach(arm => {
            if (!arm) return;
            const up = createArmPlate(true);
            up.position.y = -0.05;
            arm.add(up);
            createdMeshes.push(up);
            refs.sleeves.push(up);
        });

        [parts.rightForeArm, parts.leftForeArm].forEach(fore => {
            if (!fore) return;
            const down = createArmPlate(false);
            down.position.y = -0.05;
            fore.add(down);
            createdMeshes.push(down);
            refs.sleeves.push(down);
        });

        return { meshes: createdMeshes, refs };
    }
}
