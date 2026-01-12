import * as THREE from 'three';

export class FaunaFactory {
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

        const hitBox = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 1.5), new THREE.MeshBasicMaterial({ visible: false }));
        hitBox.userData = { type: 'hard', material: 'flesh', isSkinnable: true };
        group.add(hitBox);

        return { group, obstacle: hitBox };
    }

    static createWolfModel(color: number = 0x555555) {
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color, flatShading: true });
        const parts: any = {};

        const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 1.1), mat);
        body.position.y = 0.6;
        body.castShadow = true;
        group.add(body);
        parts.body = body;

        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.9, 0.5);
        group.add(headGroup);
        parts.head = headGroup;

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.5), mat);
        head.position.z = 0.2;
        head.castShadow = true;
        headGroup.add(head);

        const snout = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.3), mat);
        snout.position.set(0, -0.05, 0.55);
        snout.castShadow = true;
        headGroup.add(snout);

        const earGeo = new THREE.BoxGeometry(0.1, 0.2, 0.05);
        const earR = new THREE.Mesh(earGeo, mat);
        earR.position.set(0.15, 0.25, 0.1);
        headGroup.add(earR);
        const earL = new THREE.Mesh(earGeo, mat);
        earL.position.set(-0.15, 0.25, 0.1);
        headGroup.add(earL);

        const legGeo = new THREE.BoxGeometry(0.15, 0.6, 0.15);
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

        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.4), mat);
        tail.position.set(0, 0.7, -0.6);
        tail.rotation.x = -0.5;
        tail.castShadow = true;
        group.add(tail);
        parts.tail = tail;

        return { group, parts };
    }

    static createBearModel(color: number = 0x5C4033) {
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color, flatShading: true });
        const parts: any = {};

        const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 2.0), mat);
        body.position.y = 0.9;
        body.castShadow = true;
        group.add(body);
        parts.body = body;

        const headGroup = new THREE.Group();
        headGroup.position.set(0, 1.3, 1.0);
        group.add(headGroup);
        parts.head = headGroup;

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), mat);
        head.castShadow = true;
        headGroup.add(head);

        const snout = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.4), mat);
        snout.position.set(0, -0.15, 0.55);
        snout.castShadow = true;
        headGroup.add(snout);

        const earGeo = new THREE.BoxGeometry(0.2, 0.2, 0.1);
        const earR = new THREE.Mesh(earGeo, mat); earR.position.set(0.3, 0.45, 0); headGroup.add(earR);
        const earL = new THREE.Mesh(earGeo, mat); earL.position.set(-0.3, 0.45, 0); headGroup.add(earL);

        const legGeo = new THREE.BoxGeometry(0.4, 0.8, 0.4);
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
        const mat = new THREE.MeshStandardMaterial({ color, flatShading: true });
        const parts: any = {};
        const thorax = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.4), mat);
        thorax.position.y = 0.3; group.add(thorax); parts.body = thorax;
        const abdomen = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.8), mat);
        abdomen.position.set(0, 0.5, -0.6); group.add(abdomen); parts.abdomen = abdomen;
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.3), mat);
        head.position.set(0, 0.35, 0.3); group.add(head);
        for(let i=1; i<=4; i++) {
            const side = i % 2 === 0 ? 1 : -1;
            const z = (i-2.5) * 0.3;
            const legGeo = new THREE.BoxGeometry(1.2, 0.08, 0.08);
            const lL = new THREE.Mesh(legGeo, mat); lL.position.set(-0.6, 0.2, z); group.add(lL); parts[`legL${i}`] = lL;
            const lR = new THREE.Mesh(legGeo, mat); lR.position.set(0.6, 0.2, z); group.add(lR); parts[`legR${i}`] = lR;
        }
        return { group, parts };
    }

    static createLizardModel(color: number = 0x6B8E23) {
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color, flatShading: true });
        const parts: any = {};
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.8), mat);
        body.position.y = 0.15; group.add(body); parts.body = body;
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.3), mat);
        head.position.set(0, 0.2, 0.5); group.add(head); parts.head = head;
        const legGeo = new THREE.BoxGeometry(0.3, 0.05, 0.1);
        parts.legFR = new THREE.Mesh(legGeo, mat); parts.legFR.position.set(0.25, 0.1, 0.3); group.add(parts.legFR);
        parts.legFL = new THREE.Mesh(legGeo, mat); parts.legFL.position.set(-0.25, 0.1, 0.3); group.add(parts.legFL);
        parts.legBR = new THREE.Mesh(legGeo, mat); parts.legBR.position.set(0.25, 0.1, -0.3); group.add(parts.legBR);
        parts.legBL = new THREE.Mesh(legGeo, mat); parts.legBL.position.set(-0.25, 0.1, -0.3); group.add(parts.legBL);
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.8), mat);
        tail.position.set(0, 0.1, -0.8); group.add(tail); parts.tail = tail;
        return { group, parts };
    }

    static createHorseModel(color: number = 0x8B4513) {
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color, flatShading: true });
        const parts: any = {};
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 1.6), mat);
        body.position.y = 1.0; group.add(body); parts.body = body;
        const neck = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, 0.4), mat);
        neck.position.set(0, 1.7, 0.9); neck.rotation.x = -Math.PI/6; group.add(neck);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.6), mat);
        head.position.set(0, 2.2, 1.2); group.add(head); parts.head = head;
        const legGeo = new THREE.BoxGeometry(0.15, 1.0, 0.15);
        parts.legFR = new THREE.Mesh(legGeo, mat); parts.legFR.position.set(0.25, 0.5, 0.6); group.add(parts.legFR);
        parts.legFL = new THREE.Mesh(legGeo, mat); parts.legFL.position.set(-0.25, 0.5, 0.6); group.add(parts.legFL);
        parts.legBR = new THREE.Mesh(legGeo, mat); parts.legBR.position.set(0.25, 0.5, -0.6); group.add(parts.legBR);
        parts.legBL = new THREE.Mesh(legGeo, mat); parts.legBL.position.set(-0.25, 0.5, -0.6); group.add(parts.legBL);
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), mat);
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
        const antlerMat = new THREE.MeshStandardMaterial({color: 0xDEB887});
        for(let side of [-1, 1]) {
            const antler = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.05), antlerMat);
            antler.position.set(side * 0.15, 0.25, 0); antler.rotation.z = side * 0.4;
            parts.head.add(antler);
            const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.04), antlerMat);
            t1.position.set(side * 0.1, 0.2, 0.1); t1.rotation.x = 0.8; antler.add(t1);
        }
        return { group, parts };
    }
}