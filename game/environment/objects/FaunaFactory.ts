import * as THREE from 'three';

export class FaunaFactory {
    private static materials: Map<string, THREE.Material> = new Map();
    private static geometries: Map<string, THREE.BufferGeometry> = new Map();

    private static getMaterial(color: number, name: string): THREE.Material {
        if (!this.materials.has(name)) {
            this.materials.set(name, new THREE.MeshStandardMaterial({ color, flatShading: true }));
        }
        return this.materials.get(name)!;
    }

    private static getGeometry(name: string, createFn: () => THREE.BufferGeometry): THREE.BufferGeometry {
        if (!this.geometries.has(name)) {
            this.geometries.set(name, createFn());
        }
        return this.geometries.get(name)!;
    }

    static createDeadWolf(position: THREE.Vector3, rotationY: number) {
        const group = new THREE.Group();
        group.position.copy(position);
        group.rotation.y = rotationY;

        const wolf = this.createWolfModel(0x555555);
        group.add(wolf.group);
        
        wolf.group.rotation.z = Math.PI / 2; 
        wolf.group.position.y = 0.15;
        
        if (wolf.parts.legFR) wolf.parts.legFR.rotation.x = 0.8;
        if (wolf.parts.legFL) wolf.parts.legFL.rotation.x = -0.8;
        if (wolf.parts.legBR) wolf.parts.legBR.rotation.x = 1.2;
        if (wolf.parts.legBL) wolf.parts.legBL.rotation.x = -1.2;
        if (wolf.parts.head) wolf.parts.head.rotation.x = 0.5;

        // Hitbox geometry can be cached
        const hitBoxGeo = this.getGeometry('wolf_hitbox', () => new THREE.BoxGeometry(1.5, 1.0, 1.5));
        const hitBoxMat = this.materials.get('invisible_hitbox') || (() => {
            const m = new THREE.MeshBasicMaterial({ visible: false });
            this.materials.set('invisible_hitbox', m);
            return m;
        })();

        const hitBox = new THREE.Mesh(hitBoxGeo, hitBoxMat);
        hitBox.userData = { type: 'hard', material: 'flesh', isSkinnable: true };
        group.add(hitBox);

        return { group, obstacle: hitBox };
    }

    static createWolfModel(color: number = 0x555555) {
        const group = new THREE.Group();
        const mat = this.getMaterial(color, `wolf_${color}`);
        const parts: any = {};

        const bodyGeo = this.getGeometry('wolf_body', () => new THREE.BoxGeometry(0.5, 0.6, 1.1));
        const body = new THREE.Mesh(bodyGeo, mat);
        body.position.y = 0.6;
        body.castShadow = true;
        group.add(body);
        parts.body = body;

        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.9, 0.5);
        group.add(headGroup);
        parts.head = headGroup;

        const headGeo = this.getGeometry('wolf_head', () => new THREE.BoxGeometry(0.4, 0.4, 0.5));
        const head = new THREE.Mesh(headGeo, mat);
        head.position.z = 0.2;
        head.castShadow = true;
        headGroup.add(head);

        const snoutGeo = this.getGeometry('wolf_snout', () => new THREE.BoxGeometry(0.2, 0.2, 0.3));
        const snout = new THREE.Mesh(snoutGeo, mat);
        snout.position.set(0, -0.05, 0.55);
        snout.castShadow = true;
        headGroup.add(snout);

        const earGeo = this.getGeometry('wolf_ear', () => new THREE.BoxGeometry(0.1, 0.2, 0.05));
        const earR = new THREE.Mesh(earGeo, mat);
        earR.position.set(0.15, 0.25, 0.1);
        headGroup.add(earR);
        const earL = new THREE.Mesh(earGeo, mat);
        earL.position.set(-0.15, 0.25, 0.1);
        headGroup.add(earL);

        const legGeo = this.getGeometry('wolf_leg', () => new THREE.BoxGeometry(0.15, 0.6, 0.15));
        const createLeg = (lx: number, lz: number) => {
            const leg = new THREE.Mesh(legGeo, mat);
            leg.position.set(lx, 0.3, lz);
            leg.castShadow = true;
            group.add(leg);
            return leg;
        };

        parts.legFR = createLeg(0.2, 0.4);
        parts.legFL = createLeg(-0.2, 0.4);
        parts.legBR = createLeg(0.2, -0.4);
        parts.legBL = createLeg(-0.2, -0.4);

        const tailGeo = this.getGeometry('wolf_tail', () => new THREE.BoxGeometry(0.1, 0.1, 0.4));
        const tail = new THREE.Mesh(tailGeo, mat);
        tail.position.set(0, 0.7, -0.6);
        tail.rotation.x = -0.5;
        tail.castShadow = true;
        group.add(tail);
        parts.tail = tail;

        return { group, parts };
    }

    static createBearModel(color: number = 0x5C4033) {
        const group = new THREE.Group();
        const mat = this.getMaterial(color, `bear_${color}`);
        const parts: any = {};

        const bodyGeo = this.getGeometry('bear_body', () => new THREE.BoxGeometry(1.2, 1.2, 2.0));
        const body = new THREE.Mesh(bodyGeo, mat);
        body.position.y = 0.9;
        body.castShadow = true;
        group.add(body);
        parts.body = body;

        const headGroup = new THREE.Group();
        headGroup.position.set(0, 1.3, 1.0);
        group.add(headGroup);
        parts.head = headGroup;

        const headGeo = this.getGeometry('bear_head', () => new THREE.BoxGeometry(0.8, 0.8, 0.8));
        const head = new THREE.Mesh(headGeo, mat);
        head.castShadow = true;
        headGroup.add(head);

        const snoutGeo = this.getGeometry('bear_snout', () => new THREE.BoxGeometry(0.5, 0.4, 0.4));
        const snout = new THREE.Mesh(snoutGeo, mat);
        snout.position.set(0, -0.15, 0.55);
        snout.castShadow = true;
        headGroup.add(snout);

        const earGeo = this.getGeometry('bear_ear', () => new THREE.BoxGeometry(0.2, 0.2, 0.1));
        const earR = new THREE.Mesh(earGeo, mat); earR.position.set(0.3, 0.45, 0); headGroup.add(earR);
        const earL = new THREE.Mesh(earGeo, mat); earL.position.set(-0.3, 0.45, 0); headGroup.add(earL);

        const legGeo = this.getGeometry('bear_leg', () => new THREE.BoxGeometry(0.4, 0.8, 0.4));
        const createLeg = (lx: number, lz: number) => {
            const leg = new THREE.Mesh(legGeo, mat);
            leg.position.set(lx, 0.4, lz);
            leg.castShadow = true;
            group.add(leg);
            return leg;
        };
        parts.legFR = createLeg(0.45, 0.7);
        parts.legFL = createLeg(-0.45, 0.7);
        parts.legBR = createLeg(0.45, -0.7);
        parts.legBL = createLeg(-0.45, -0.7);

        return { group, parts };
    }

    static createOwlModel(color: number = 0x8B4513) {
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color, flatShading: true });
        const parts: any = {};

        const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.6), mat);
        body.castShadow = true;
        group.add(body);
        parts.body = body;

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), mat);
        head.position.set(0, 0.2, 0.35);
        head.castShadow = true;
        group.add(head);
        parts.head = head;

        const beak = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 4), new THREE.MeshStandardMaterial({color: 0x333333}));
        beak.rotation.x = -Math.PI/2;
        beak.position.set(0, 0, 0.2);
        head.add(beak);

        const wingGeo = new THREE.BoxGeometry(0.6, 0.05, 0.4);
        const wingL = new THREE.Mesh(wingGeo, mat);
        wingL.position.set(-0.3, 0.1, 0);
        group.add(wingL);
        parts.wingL = wingL;

        const wingR = new THREE.Mesh(wingGeo, mat);
        wingR.position.set(0.3, 0.1, 0);
        group.add(wingR);
        parts.wingR = wingR;

        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.3), mat);
        tail.position.set(0, -0.1, -0.4);
        tail.rotation.x = 0.2;
        group.add(tail);
        parts.tail = tail;

        return { group, parts };
    }

    static createChickenModel(color: number = 0xFFFFFF) {
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color, flatShading: true });
        const parts: any = {};
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.4), mat);
        body.position.y = 0.4;
        group.add(body);
        parts.body = body;
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.15), mat);
        head.position.set(0, 0.7, 0.15);
        group.add(head);
        parts.head = head;
        const comb = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.1), new THREE.MeshStandardMaterial({color: 0xFF0000}));
        comb.position.y = 0.15; head.add(comb);
        const beak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 4), new THREE.MeshStandardMaterial({color: 0xFFA500}));
        beak.rotation.x = Math.PI/2; beak.position.set(0, -0.05, 0.12); head.add(beak);
        const legGeo = new THREE.BoxGeometry(0.03, 0.25, 0.03);
        const lR = new THREE.Mesh(legGeo, new THREE.MeshStandardMaterial({color: 0xFFA500}));
        lR.position.set(0.08, 0.12, 0); group.add(lR); parts.legFR = lR;
        const lL = new THREE.Mesh(legGeo, new THREE.MeshStandardMaterial({color: 0xFFA500}));
        lL.position.set(-0.08, 0.12, 0); group.add(lL); parts.legFL = lL;
        parts.legBR = lR; parts.legBL = lL; // Stub for script compatibility
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.15), mat);
        tail.position.set(0, 0.55, -0.2); tail.rotation.x = -0.5; group.add(tail);
        parts.tail = tail;
        return { group, parts };
    }

    static createPigModel(color: number = 0xFFC0CB) {
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color, flatShading: true });
        const parts: any = {};
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 1.2), mat);
        body.position.y = 0.6; group.add(body); parts.body = body;
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), mat);
        head.position.set(0, 0.8, 0.7); group.add(head); parts.head = head;
        const snout = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.15), mat);
        snout.position.z = 0.3; head.add(snout);
        const legGeo = new THREE.BoxGeometry(0.12, 0.4, 0.12);
        parts.legFR = new THREE.Mesh(legGeo, mat); parts.legFR.position.set(0.25, 0.2, 0.4); group.add(parts.legFR);
        parts.legFL = new THREE.Mesh(legGeo, mat); parts.legFL.position.set(-0.25, 0.2, 0.4); group.add(parts.legFL);
        parts.legBR = new THREE.Mesh(legGeo, mat); parts.legBR.position.set(0.25, 0.2, -0.4); group.add(parts.legBR);
        parts.legBL = new THREE.Mesh(legGeo, mat); parts.legBL.position.set(-0.25, 0.2, -0.4); group.add(parts.legBL);
        return { group, parts };
    }

    static createSheepModel(color: number = 0xFFFDD0) {
        const group = new THREE.Group();
        const woolMat = new THREE.MeshStandardMaterial({ color, flatShading: true });
        const skinMat = new THREE.MeshStandardMaterial({ color: 0x333333, flatShading: true });
        const parts: any = {};
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 1.1), woolMat);
        body.position.y = 0.7; group.add(body); parts.body = body;
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.4), skinMat);
        head.position.set(0, 1.0, 0.6); group.add(head); parts.head = head;
        const woolHead = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.15, 0.2), woolMat);
        woolHead.position.y = 0.2; head.add(woolHead);
        const legGeo = new THREE.BoxGeometry(0.1, 0.5, 0.1);
        parts.legFR = new THREE.Mesh(legGeo, skinMat); parts.legFR.position.set(0.25, 0.25, 0.35); group.add(parts.legFR);
        parts.legFL = new THREE.Mesh(legGeo, skinMat); parts.legFL.position.set(-0.25, 0.25, 0.35); group.add(parts.legFL);
        parts.legBR = new THREE.Mesh(legGeo, skinMat); parts.legBR.position.set(0.25, 0.25, -0.35); group.add(parts.legBR);
        parts.legBL = new THREE.Mesh(legGeo, skinMat); parts.legBL.position.set(-0.25, 0.25, -0.35); group.add(parts.legBL);
        return { group, parts };
    }

    static createSpiderModel(color: number = 0x1a1a1a) {
        const group = new THREE.Group();
        const mat = this.getMaterial(color, `spider_${color}`);
        const parts: any = {};
        
        // Lift the body slightly off the ground (thorax was at 0.3, abdomen at 0.5)
        const bodyHeight = 0.45;
        const thoraxGeo = this.getGeometry('spider_thorax', () => new THREE.BoxGeometry(0.4, 0.3, 0.4));
        const thorax = new THREE.Mesh(thoraxGeo, mat);
        thorax.position.y = bodyHeight; 
        thorax.castShadow = true;
        group.add(thorax); 
        parts.body = thorax;
        
        const abdomenGeo = this.getGeometry('spider_abdomen', () => new THREE.BoxGeometry(0.7, 0.6, 0.8));
        const abdomen = new THREE.Mesh(abdomenGeo, mat);
        abdomen.position.set(0, bodyHeight + 0.2, -0.6); 
        abdomen.castShadow = true;
        group.add(abdomen); 
        parts.abdomen = abdomen;
        
        const headGeo = this.getGeometry('spider_head', () => new THREE.BoxGeometry(0.3, 0.25, 0.3));
        const head = new THREE.Mesh(headGeo, mat);
        head.position.set(0, bodyHeight + 0.05, 0.3); 
        head.castShadow = true;
        group.add(head);
        parts.head = head;
        
        // 3-segment legs: Femur (inner), Tibia (middle), Tarsus (outer)
        // Lengths adjusted for a better curve: 0.5 (femur), 0.6 (tibia), 0.4 (tarsus)
        const femurGeo = this.getGeometry('spider_femur', () => new THREE.BoxGeometry(0.5, 0.08, 0.08));
        const tibiaGeo = this.getGeometry('spider_tibia', () => new THREE.BoxGeometry(0.6, 0.07, 0.07));
        const tarsusGeo = this.getGeometry('spider_tarsus', () => new THREE.BoxGeometry(0.4, 0.06, 0.06));

        for(let i=1; i<=4; i++) {
            const z = (i-2.5) * 0.35;
            
            for(let side of [-1, 1]) {
                const sidePrefix = side === -1 ? 'L' : 'R';
                const legKey = `leg${sidePrefix}${i}`;
                
                // Femur (connected to thorax)
                const femur = new THREE.Mesh(femurGeo, mat);
                femur.castShadow = true;
                // Move pivot to end
                femur.geometry = femur.geometry.clone();
                femur.geometry.translate(0.25 * side, 0, 0);
                femur.position.set(0.15 * side, bodyHeight, z);
                // Default pose: angle UP
                femur.rotation.z = side * 0.6; 
                group.add(femur);
                
                // Tibia
                const tibia = new THREE.Mesh(tibiaGeo, mat);
                tibia.castShadow = true;
                tibia.geometry = tibia.geometry.clone();
                tibia.geometry.translate(0.3 * side, 0, 0);
                tibia.position.set(0.5 * side, 0, 0);
                // Default pose: angle DOWN sharply
                tibia.rotation.z = side * -1.2;
                femur.add(tibia);
                
                // Tarsus
                const tarsus = new THREE.Mesh(tarsusGeo, mat);
                tarsus.castShadow = true;
                tarsus.geometry = tarsus.geometry.clone();
                tarsus.geometry.translate(0.2 * side, 0, 0);
                tarsus.position.set(0.6 * side, 0, 0);
                // Default pose: angle DOWN further
                tarsus.rotation.z = side * -0.4; 
                tibia.add(tarsus);
                
                parts[legKey] = femur;
                parts[`${legKey}_tibia`] = tibia;
                parts[`${legKey}_tarsus`] = tarsus;
            }
        }
        return { group, parts };
    }

    static createLizardModel(color: number = 0x6B8E23) {
        const group = new THREE.Group();
        const mat = this.getMaterial(color, `lizard_${color}`);
        const parts: any = {};
        
        const bodyGeo = this.getGeometry('lizard_body', () => new THREE.BoxGeometry(0.3, 0.2, 0.8));
        const body = new THREE.Mesh(bodyGeo, mat);
        body.position.y = 0.15; group.add(body); parts.body = body;
        
        const headGeo = this.getGeometry('lizard_head', () => new THREE.BoxGeometry(0.2, 0.15, 0.3));
        const head = new THREE.Mesh(headGeo, mat);
        head.position.set(0, 0.2, 0.5); group.add(head); parts.head = head;
        
        const legGeo = this.getGeometry('lizard_leg', () => new THREE.BoxGeometry(0.3, 0.05, 0.1));
        parts.legFR = new THREE.Mesh(legGeo, mat); parts.legFR.position.set(0.25, 0.1, 0.3); group.add(parts.legFR);
        parts.legFL = new THREE.Mesh(legGeo, mat); parts.legFL.position.set(-0.25, 0.1, 0.3); group.add(parts.legFL);
        parts.legBR = new THREE.Mesh(legGeo, mat); parts.legBR.position.set(0.25, 0.1, -0.3); group.add(parts.legBR);
        parts.legBL = new THREE.Mesh(legGeo, mat); parts.legBL.position.set(-0.25, 0.1, -0.3); group.add(parts.legBL);
        
        const tailGeo = this.getGeometry('lizard_tail', () => new THREE.BoxGeometry(0.15, 0.1, 0.8));
        const tail = new THREE.Mesh(tailGeo, mat);
        tail.position.set(0, 0.1, -0.8); group.add(tail); parts.tail = tail;
        return { group, parts };
    }

    static createHorseModel(color: number = 0x8B4513) {
        const group = new THREE.Group();
        const mat = this.getMaterial(color, `horse_${color}`);
        const parts: any = {};
        
        const bodyGeo = this.getGeometry('horse_body', () => new THREE.BoxGeometry(0.7, 0.9, 1.6));
        const body = new THREE.Mesh(bodyGeo, mat);
        body.position.y = 1.0; group.add(body); parts.body = body;
        
        const neckGeo = this.getGeometry('horse_neck', () => new THREE.BoxGeometry(0.35, 0.8, 0.4));
        const neck = new THREE.Mesh(neckGeo, mat);
        neck.position.set(0, 1.7, 0.9); neck.rotation.x = -Math.PI/6; group.add(neck);
        
        const headGeo = this.getGeometry('horse_head', () => new THREE.BoxGeometry(0.35, 0.35, 0.6));
        const head = new THREE.Mesh(headGeo, mat);
        head.position.set(0, 2.2, 1.2); group.add(head); parts.head = head;
        
        const legGeo = this.getGeometry('horse_leg', () => new THREE.BoxGeometry(0.15, 1.0, 0.15));
        parts.legFR = new THREE.Mesh(legGeo, mat); parts.legFR.position.set(0.25, 0.5, 0.6); group.add(parts.legFR);
        parts.legFL = new THREE.Mesh(legGeo, mat); parts.legFL.position.set(-0.25, 0.5, 0.6); group.add(parts.legFL);
        parts.legBR = new THREE.Mesh(legGeo, mat); parts.legBR.position.set(0.25, 0.5, -0.6); group.add(parts.legBR);
        parts.legBL = new THREE.Mesh(legGeo, mat); parts.legBL.position.set(-0.25, 0.5, -0.6); group.add(parts.legBL);
        
        const tailGeo = this.getGeometry('horse_tail', () => new THREE.BoxGeometry(0.1, 0.5, 0.1));
        const tail = new THREE.Mesh(tailGeo, mat);
        tail.position.set(0, 1.2, -0.85); tail.rotation.x = -0.4; group.add(tail); parts.tail = tail;
        return { group, parts };
    }

    static createDeerModel(color: number = 0xC19A6B) {
        const horse = this.createHorseModel(color);
        const group = horse.group;
        const parts = horse.parts;
        // Thinner body
        parts.body.scale.set(0.8, 0.9, 1.0);
        // Antlers
        const antlerMat = this.getMaterial(0xDEB887, 'antler');
        const antlerGeo = this.getGeometry('antler_main', () => new THREE.BoxGeometry(0.05, 0.4, 0.05));
        const t1Geo = this.getGeometry('antler_tip', () => new THREE.BoxGeometry(0.04, 0.2, 0.04));
        
        for(let side of [-1, 1]) {
            const antler = new THREE.Mesh(antlerGeo, antlerMat);
            antler.position.set(side * 0.15, 0.25, 0); antler.rotation.z = side * 0.4;
            parts.head.add(antler);
            const t1 = new THREE.Mesh(t1Geo, antlerMat);
            t1.position.set(side * 0.1, 0.2, 0.1); t1.rotation.x = 0.8; antler.add(t1);
        }
        return { group, parts };
    }
}