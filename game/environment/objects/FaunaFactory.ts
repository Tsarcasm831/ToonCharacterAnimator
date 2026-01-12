
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
}
