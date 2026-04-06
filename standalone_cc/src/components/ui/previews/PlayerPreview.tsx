
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { PlayerConfig, PlayerInput } from '../../../types';
import { PlayerModel } from '../../../game/model/PlayerModel';
import { IdleAction } from '../../../game/animator/actions/IdleAction';
import { WeaponAction } from '../../../game/animator/actions/WeaponAction';
import { UnarmedPunchAction } from '../../../game/animator/actions/UnarmedPunchAction';
import { MovementAction } from '../../../game/animator/actions/MovementAction';
import { FireArrowAction } from '../../../game/animator/actions/FireArrowAction';

interface PlayerPreviewProps {
    config: PlayerConfig;
    manualInput?: Partial<PlayerInput>;
    onZoomChange?: (zoom: number) => void;
}

type PreviewModelKey = NonNullable<PlayerConfig['impersonationModel']>;

type CreaturePreviewModel = {
    group: THREE.Group;
    animate: (time: number) => void;
    applyColor: (colorHex: string) => void;
};

const createOwlPreviewModel = (colorHex: string): CreaturePreviewModel => {
    const baseColor = new THREE.Color(parseColor(colorHex, 0xa57d57));
    const backMat = new THREE.MeshStandardMaterial({ color: baseColor, flatShading: true, roughness: 0.9, metalness: 0.02 });
    const wingMat = new THREE.MeshStandardMaterial({ color: baseColor.clone().multiplyScalar(0.78), flatShading: true, roughness: 0.92, metalness: 0.01 });
    const faceMat = new THREE.MeshStandardMaterial({ color: 0xf3efe6, flatShading: true, roughness: 0.96, metalness: 0.0 });
    const chestMat = new THREE.MeshStandardMaterial({ color: 0xf6f2e8, flatShading: true, roughness: 0.96, metalness: 0.0 });
    const beakMat = new THREE.MeshStandardMaterial({ color: 0xd6c7a2, flatShading: true, roughness: 0.85, metalness: 0.02 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f0f0f });
    const talonMat = new THREE.MeshStandardMaterial({ color: 0x51473b, flatShading: true, roughness: 0.8, metalness: 0.05 });

    const group = new THREE.Group();

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.33, 12, 10), backMat);
    body.scale.set(0.95, 1.2, 0.92);
    body.position.y = 0.78;
    body.castShadow = true;
    group.add(body);

    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), chestMat);
    chest.scale.set(0.85, 1.15, 0.62);
    chest.position.set(0, 0.72, 0.18);
    group.add(chest);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.12, 0.08);
    group.add(headGroup);

    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), backMat);
    skull.scale.set(1.0, 0.95, 0.95);
    headGroup.add(skull);

    const faceDisk = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.07, 18), faceMat);
    faceDisk.rotation.x = Math.PI / 2;
    faceDisk.position.set(0, -0.01, 0.15);
    headGroup.add(faceDisk);

    const heartL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), faceMat);
    const heartR = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), faceMat);
    heartL.scale.set(1, 1.12, 0.6);
    heartR.scale.set(1, 1.12, 0.6);
    heartL.position.set(-0.07, -0.05, 0.16);
    heartR.position.set(0.07, -0.05, 0.16);
    headGroup.add(heartL, heartR);

    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), eyeMat);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), eyeMat);
    eyeL.position.set(-0.05, 0.02, 0.2);
    eyeR.position.set(0.05, 0.02, 0.2);
    headGroup.add(eyeL, eyeR);

    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.08, 6), beakMat);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, -0.03, 0.24);
    headGroup.add(beak);

    const wingGeo = new THREE.BoxGeometry(0.08, 0.38, 0.45);
    const wingL = new THREE.Mesh(wingGeo, wingMat);
    const wingR = new THREE.Mesh(wingGeo, wingMat);
    wingL.position.set(-0.3, 0.8, 0.02);
    wingR.position.set(0.3, 0.8, 0.02);
    wingL.rotation.z = 0.32;
    wingR.rotation.z = -0.32;
    wingL.rotation.y = 0.12;
    wingR.rotation.y = -0.12;
    group.add(wingL, wingR);

    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.26), wingMat);
    tail.position.set(0, 0.58, -0.23);
    tail.rotation.x = -0.28;
    group.add(tail);

    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.22, 0.045), talonMat);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.22, 0.045), talonMat);
    legL.position.set(-0.08, 0.35, 0.08);
    legR.position.set(0.08, 0.35, 0.08);
    group.add(legL, legR);

    const clawL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.085), talonMat);
    const clawR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.085), talonMat);
    clawL.position.set(-0.08, 0.24, 0.1);
    clawR.position.set(0.08, 0.24, 0.1);
    group.add(clawL, clawR);

    return {
        group,
        animate: (time) => {
            const t = time * 1.1;
            headGroup.rotation.y = Math.sin(t * 0.55) * 0.12;
            headGroup.rotation.x = Math.sin(t * 0.35) * 0.04;
            wingL.rotation.z = 0.3 + Math.sin(t * 1.3) * 0.08;
            wingR.rotation.z = -0.3 - Math.sin(t * 1.3) * 0.08;
            body.position.y = 0.78 + Math.sin(t * 0.8) * 0.02;
        },
        applyColor: (nextColorHex) => {
            const nextBase = new THREE.Color(parseColor(nextColorHex, 0xa57d57));
            backMat.color.copy(nextBase);
            wingMat.color.copy(nextBase).multiplyScalar(0.78);
        },
    };
};

const createYetiPreviewModel = (colorHex: string): CreaturePreviewModel => {
    const baseColor = new THREE.Color(parseColor(colorHex, 0xdce7ef));
    const furMat = new THREE.MeshStandardMaterial({ color: baseColor, flatShading: true, roughness: 0.95, metalness: 0.01 });
    const shadowFurMat = new THREE.MeshStandardMaterial({ color: 0x8f9aa8, flatShading: true, roughness: 0.95, metalness: 0.01 });
    const faceMat = new THREE.MeshStandardMaterial({ color: 0x5a6676, flatShading: true, roughness: 0.9, metalness: 0.02 });
    const clawMat = new THREE.MeshStandardMaterial({ color: 0x1d1d22, flatShading: true, roughness: 0.8, metalness: 0.08 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xc94141 });

    const group = new THREE.Group();

    const torsoGeo = new THREE.BoxGeometry(0.64, 0.78, 0.4);
    const torso = new THREE.Mesh(torsoGeo, furMat);
    torso.position.set(0, 0.88, 0.02);
    torso.castShadow = true;
    group.add(torso);

    const chestMane = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.42, 0.28), shadowFurMat);
    chestMane.position.set(0, 0.9, 0.2);
    group.add(chestMane);

    const hump = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.26, 0.28), shadowFurMat);
    hump.position.set(0, 1.16, -0.05);
    group.add(hump);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.34, 0.1);
    group.add(headGroup);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.28), furMat);
    head.position.y = 0.02;
    head.castShadow = true;
    headGroup.add(head);

    const face = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.18), faceMat);
    face.position.set(0, -0.04, 0.16);
    headGroup.add(face);

    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.06), shadowFurMat);
    brow.position.set(0, 0.06, 0.14);
    headGroup.add(brow);

    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.02), eyeMat);
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.02), eyeMat);
    eyeL.position.set(-0.06, 0.03, 0.19);
    eyeR.position.set(0.06, 0.03, 0.19);
    headGroup.add(eyeL, eyeR);

    const createArm = (isLeft: boolean) => {
        const arm = new THREE.Group();
        arm.position.set(isLeft ? -0.33 : 0.33, 1.02, 0.02);

        const upper = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.44, 0.14), furMat);
        upper.position.y = -0.22;
        const fore = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.4, 0.13), shadowFurMat);
        fore.position.set(0, -0.62, 0.04);
        const hand = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.16), faceMat);
        hand.position.set(0, -0.86, 0.08);

        arm.add(upper, fore, hand);

        for (let i = 0; i < 3; i++) {
            const claw = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.08, 4), clawMat);
            claw.rotation.x = Math.PI * 0.6;
            claw.position.set(-0.05 + i * 0.05, -0.9, 0.14);
            arm.add(claw);
        }

        group.add(arm);
        return arm;
    };

    const leftArm = createArm(true);
    const rightArm = createArm(false);

    const createLeg = (isLeft: boolean) => {
        const leg = new THREE.Group();
        leg.position.set(isLeft ? -0.16 : 0.16, 0.52, 0.01);

        const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.2), furMat);
        thigh.position.y = -0.15;
        const shin = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.34, 0.17), shadowFurMat);
        shin.position.set(0, -0.46, 0.03);
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.34), faceMat);
        foot.position.set(0, -0.65, 0.1);

        leg.add(thigh, shin, foot);

        for (let i = 0; i < 4; i++) {
            const toe = new THREE.Mesh(new THREE.ConeGeometry(0.013, 0.06, 4), clawMat);
            toe.rotation.x = Math.PI * 0.55;
            toe.position.set(-0.075 + i * 0.05, -0.68, 0.23);
            leg.add(toe);
        }

        group.add(leg);
        return leg;
    };

    const leftLeg = createLeg(true);
    const rightLeg = createLeg(false);

    return {
        group,
        animate: (time) => {
            const t = time * 1.05;
            leftArm.rotation.x = Math.sin(t) * 0.12 - 0.15;
            rightArm.rotation.x = -Math.sin(t) * 0.12 - 0.05;
            leftLeg.rotation.x = -Math.sin(t) * 0.08;
            rightLeg.rotation.x = Math.sin(t) * 0.08;
            headGroup.rotation.y = Math.sin(t * 0.5) * 0.06;
            torso.rotation.y = Math.sin(t * 0.5) * 0.03;
        },
        applyColor: (nextColorHex) => {
            const next = new THREE.Color(parseColor(nextColorHex, 0xdce7ef));
            furMat.color.copy(next);
            shadowFurMat.color.copy(next).multiplyScalar(0.7);
        },
    };
};

const createWolfPreviewModel = (colorHex: string): CreaturePreviewModel => {
    const baseColor = new THREE.Color(parseColor(colorHex, 0x8a8f98));
    const darkColor = baseColor.clone().multiplyScalar(0.55);
    const lightColor = new THREE.Color(0xd9d3c5);

    const group = new THREE.Group();
    const furMat = new THREE.MeshStandardMaterial({ color: baseColor, flatShading: true, roughness: 0.9, metalness: 0.02 });
    const darkFurMat = new THREE.MeshStandardMaterial({ color: darkColor, flatShading: true, roughness: 0.92, metalness: 0.02 });
    const lightFurMat = new THREE.MeshStandardMaterial({ color: lightColor, flatShading: true, roughness: 0.95, metalness: 0.01 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xf4c542 });
    const noseMat = new THREE.MeshStandardMaterial({ color: 0x121212, roughness: 0.8, metalness: 0.05, flatShading: true });

    const torsoGeo = new THREE.BoxGeometry(0.9, 0.45, 1.45);
    const torso = new THREE.Mesh(torsoGeo, furMat);
    torso.position.set(0, 0.74, -0.03);
    torso.castShadow = true;
    group.add(torso);

    const backRidge = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.16, 1.35), darkFurMat);
    backRidge.position.set(0, 0.98, -0.04);
    group.add(backRidge);

    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.34, 0.42), lightFurMat);
    chest.position.set(0, 0.66, 0.5);
    group.add(chest);

    const neckRuff = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.32, 0.36), lightFurMat);
    neckRuff.position.set(0, 0.9, 0.62);
    group.add(neckRuff);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.96, 0.78);
    group.add(headGroup);

    const skull = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.32, 0.42), furMat);
    skull.position.set(0, 0.06, 0.03);
    skull.castShadow = true;
    headGroup.add(skull);

    const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.34), lightFurMat);
    muzzle.position.set(0, -0.02, 0.34);
    headGroup.add(muzzle);

    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.08), noseMat);
    nose.position.set(0, -0.01, 0.54);
    headGroup.add(nose);

    const earGeo = new THREE.ConeGeometry(0.08, 0.2, 3);
    const earL = new THREE.Mesh(earGeo, darkFurMat);
    const earR = new THREE.Mesh(earGeo, darkFurMat);
    earL.position.set(-0.14, 0.25, 0.08);
    earR.position.set(0.14, 0.25, 0.08);
    earL.rotation.z = 0.2;
    earR.rotation.z = -0.2;
    headGroup.add(earL, earR);

    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.02), eyeMat);
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.02), eyeMat);
    eyeL.position.set(-0.09, 0.08, 0.25);
    eyeR.position.set(0.09, 0.08, 0.25);
    headGroup.add(eyeL, eyeR);

    const createLeg = (x: number, z: number, front: boolean) => {
        const leg = new THREE.Group();
        leg.position.set(x, 0.53, z);

        const upperGeo = new THREE.BoxGeometry(0.12, front ? 0.28 : 0.24, 0.12);
        const lowerGeo = new THREE.BoxGeometry(0.1, front ? 0.36 : 0.34, 0.1);
        const pawGeo = new THREE.BoxGeometry(0.13, 0.06, 0.2);

        const upper = new THREE.Mesh(upperGeo, furMat);
        upper.position.y = -0.14;
        const lower = new THREE.Mesh(lowerGeo, darkFurMat);
        lower.position.y = -0.44;
        const paw = new THREE.Mesh(pawGeo, lightFurMat);
        paw.position.set(0, -0.63, 0.05);

        leg.add(upper, lower, paw);
        group.add(leg);
        return leg;
    };

    const legFR = createLeg(0.2, 0.4, true);
    const legFL = createLeg(-0.2, 0.4, true);
    const legBR = createLeg(0.2, -0.5, false);
    const legBL = createLeg(-0.2, -0.5, false);

    const tailBase = new THREE.Group();
    tailBase.position.set(0, 0.86, -0.82);
    group.add(tailBase);

    const tailMid = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.38), furMat);
    tailMid.position.z = -0.2;
    tailMid.rotation.x = -0.65;
    tailBase.add(tailMid);

    const tailTip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.34), darkFurMat);
    tailTip.position.z = -0.48;
    tailTip.position.y = -0.06;
    tailTip.rotation.x = -0.25;
    tailBase.add(tailTip);

    return {
        group,
        animate: (time) => {
            const gait = Math.sin(time * 1.25) * 0.38;
            legFR.rotation.x = gait;
            legBL.rotation.x = gait;
            legFL.rotation.x = -gait;
            legBR.rotation.x = -gait;

            headGroup.rotation.x = Math.sin(time * 0.6) * 0.06;
            tailBase.rotation.y = Math.sin(time * 1.5) * 0.25;
            tailBase.rotation.x = -0.12 + Math.cos(time * 1.2) * 0.04;
        },
        applyColor: (nextColorHex) => {
            const nextBase = new THREE.Color(parseColor(nextColorHex, 0x8a8f98));
            furMat.color.copy(nextBase);
            darkFurMat.color.copy(nextBase).multiplyScalar(0.55);
        },
    };
};

type QuadrupedOptions = {
    body: [number, number, number];
    head: [number, number, number];
    snout: [number, number, number];
    earHeight: number;
    legWidth: number;
    legHeight: number;
    legDepth: number;
    legX: number;
    legFrontZ: number;
    legBackZ: number;
    tailLength: number;
    tailY: number;
    tailZ: number;
    gaitSpeed: number;
    gaitAmp: number;
    headBobAmp: number;
    tailSwingAmp: number;
    headY: number;
    headZ: number;
    snoutY: number;
    snoutZ: number;
};

const DEFAULT_QUADRUPED: QuadrupedOptions = {
    body: [0.5, 0.6, 1.1],
    head: [0.4, 0.4, 0.5],
    snout: [0.2, 0.2, 0.3],
    earHeight: 0.2,
    legWidth: 0.15,
    legHeight: 0.6,
    legDepth: 0.15,
    legX: 0.2,
    legFrontZ: 0.4,
    legBackZ: -0.4,
    tailLength: 0.4,
    tailY: 0.7,
    tailZ: -0.6,
    gaitSpeed: 1,
    gaitAmp: 0.35,
    headBobAmp: 0.08,
    tailSwingAmp: 0.25,
    headY: 0.9,
    headZ: 0.5,
    snoutY: -0.05,
    snoutZ: 0.55,
};

const disposeObject3D = (object: THREE.Object3D) => {
    object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
                child.material.forEach((material) => material.dispose());
            } else {
                child.material?.dispose();
            }
        }
    });
};

const parseColor = (colorHex: string, fallback = 0x666666) => {
    const parsed = Number.parseInt(colorHex.replace('#', ''), 16);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const recolorGroup = (group: THREE.Group, colorHex: string) => {
    const nextColor = parseColor(colorHex);
    group.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            child.material.color.setHex(nextColor);
        }
    });
};

const createQuadrupedPreviewModel = (colorHex: string, options: Partial<QuadrupedOptions> = {}): CreaturePreviewModel => {
    const o = { ...DEFAULT_QUADRUPED, ...options };
    const color = parseColor(colorHex);
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color, flatShading: true });

    const body = new THREE.Mesh(new THREE.BoxGeometry(...o.body), mat);
    body.position.y = o.body[1];
    body.castShadow = true;
    group.add(body);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, o.headY, o.headZ);
    group.add(headGroup);

    const head = new THREE.Mesh(new THREE.BoxGeometry(...o.head), mat);
    head.position.z = 0.2;
    head.castShadow = true;
    headGroup.add(head);

    const snout = new THREE.Mesh(new THREE.BoxGeometry(...o.snout), mat);
    snout.position.set(0, o.snoutY, o.snoutZ);
    snout.castShadow = true;
    headGroup.add(snout);

    const earGeo = new THREE.BoxGeometry(0.1, o.earHeight, 0.05);
    const earR = new THREE.Mesh(earGeo, mat);
    earR.position.set(0.15, 0.16 + o.earHeight * 0.45, 0.1);
    headGroup.add(earR);
    const earL = new THREE.Mesh(earGeo, mat);
    earL.position.set(-0.15, 0.16 + o.earHeight * 0.45, 0.1);
    headGroup.add(earL);

    const legGeo = new THREE.BoxGeometry(o.legWidth, o.legHeight, o.legDepth);
    const createLeg = (x: number, z: number) => {
        const leg = new THREE.Mesh(legGeo, mat);
        leg.position.set(x, o.legHeight / 2, z);
        leg.castShadow = true;
        group.add(leg);
        return leg;
    };

    const legFR = createLeg(o.legX, o.legFrontZ);
    const legFL = createLeg(-o.legX, o.legFrontZ);
    const legBR = createLeg(o.legX, o.legBackZ);
    const legBL = createLeg(-o.legX, o.legBackZ);

    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, o.tailLength), mat);
    tail.position.set(0, o.tailY, o.tailZ);
    tail.rotation.x = -0.5;
    tail.castShadow = true;
    group.add(tail);

    return {
        group,
        animate: (time) => {
            const gait = Math.sin(time * o.gaitSpeed) * o.gaitAmp;
            legFR.rotation.x = gait;
            legBL.rotation.x = gait;
            legFL.rotation.x = -gait;
            legBR.rotation.x = -gait;
            headGroup.rotation.x = Math.sin(time * 0.5 * o.gaitSpeed) * o.headBobAmp;
            tail.rotation.y = Math.sin(time * 1.6 * o.gaitSpeed) * o.tailSwingAmp;
        },
        applyColor: (nextColorHex) => recolorGroup(group, nextColorHex),
    };
};

const createBirdPreviewModel = (colorHex: string, flightless = false): CreaturePreviewModel => {
    const color = parseColor(colorHex, 0x8b7355);
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color, flatShading: true });

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), mat);
    body.scale.set(1.0, 0.85, 1.3);
    body.position.y = 0.78;
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mat);
    head.position.set(0, 1.05, 0.34);
    group.add(head);

    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.24, 5), mat);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 1.03, 0.56);
    group.add(beak);

    const wingGeo = new THREE.BoxGeometry(0.12, 0.28, 0.5);
    const wingR = new THREE.Mesh(wingGeo, mat);
    const wingL = new THREE.Mesh(wingGeo, mat);
    wingR.position.set(0.34, 0.8, 0.03);
    wingL.position.set(-0.34, 0.8, 0.03);
    group.add(wingR, wingL);

    const legGeo = new THREE.BoxGeometry(0.06, 0.42, 0.06);
    const legR = new THREE.Mesh(legGeo, mat);
    const legL = new THREE.Mesh(legGeo, mat);
    legR.position.set(0.1, 0.23, 0.06);
    legL.position.set(-0.1, 0.23, 0.06);
    group.add(legR, legL);

    return {
        group,
        animate: (time) => {
            const t = time * 1.2;
            const bob = Math.sin(t) * 0.02;
            head.position.y = 1.05 + bob;
            legR.rotation.x = Math.sin(t) * 0.2;
            legL.rotation.x = -Math.sin(t) * 0.2;
            if (!flightless) {
                wingR.rotation.z = Math.sin(t * 1.6) * 0.35;
                wingL.rotation.z = -Math.sin(t * 1.6) * 0.35;
            }
        },
        applyColor: (nextColorHex) => recolorGroup(group, nextColorHex),
    };
};

const createSpiderPreviewModel = (colorHex: string): CreaturePreviewModel => {
    const color = parseColor(colorHex, 0x1a1a1a);
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color, flatShading: true });

    const abdomen = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), mat);
    abdomen.scale.set(1.2, 0.9, 1.3);
    abdomen.position.set(0, 0.45, -0.1);
    group.add(abdomen);

    const cephalothorax = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), mat);
    cephalothorax.scale.set(1.1, 0.8, 1.1);
    cephalothorax.position.set(0, 0.43, 0.22);
    group.add(cephalothorax);

    const legPairs: Array<{ left: THREE.Group; right: THREE.Group }> = [];
    for (let i = 0; i < 4; i++) {
        const z = 0.26 - i * 0.18;
        const left = new THREE.Group();
        const right = new THREE.Group();
        left.position.set(-0.12, 0.44, z);
        right.position.set(0.12, 0.44, z);

        const seg1Geo = new THREE.BoxGeometry(0.3, 0.04, 0.04);
        const seg2Geo = new THREE.BoxGeometry(0.34, 0.035, 0.035);
        const l1 = new THREE.Mesh(seg1Geo, mat);
        const r1 = new THREE.Mesh(seg1Geo, mat);
        l1.position.x = -0.15;
        r1.position.x = 0.15;
        l1.rotation.z = 0.35 + i * 0.1;
        r1.rotation.z = -(0.35 + i * 0.1);
        left.add(l1);
        right.add(r1);

        const l2 = new THREE.Mesh(seg2Geo, mat);
        const r2 = new THREE.Mesh(seg2Geo, mat);
        l2.position.set(-0.3, -0.05, 0);
        r2.position.set(0.3, -0.05, 0);
        l2.rotation.z = -0.35;
        r2.rotation.z = 0.35;
        left.add(l2);
        right.add(r2);

        group.add(left, right);
        legPairs.push({ left, right });
    }

    return {
        group,
        animate: (time) => {
            const t = time * 1.2;
            legPairs.forEach((pair, i) => {
                const phase = i * 0.7;
                pair.left.rotation.y = Math.sin(t + phase) * 0.2;
                pair.right.rotation.y = -Math.sin(t + phase) * 0.2;
            });
        },
        applyColor: (nextColorHex) => recolorGroup(group, nextColorHex),
    };
};

const createImpPreviewModel = (colorHex: string): CreaturePreviewModel => {
    const color = parseColor(colorHex, 0x8b1f1f);
    const group = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, metalness: 0.05 });
    const darkSkinMat = new THREE.MeshStandardMaterial({ color: 0x5f0f1d, flatShading: true, roughness: 0.9, metalness: 0.02 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffb347 });
    const toothMat = new THREE.MeshBasicMaterial({ color: 0xe7dfcf });
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x1d0508 });
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xc7ccd6, roughness: 0.25, metalness: 0.9, flatShading: true });
    const hiltMat = new THREE.MeshStandardMaterial({ color: 0x4f4030, roughness: 0.9, metalness: 0.1, flatShading: true });

    const torsoGeo = new THREE.CylinderGeometry(0.22, 0.18, 0.62, 8);
    torsoGeo.scale(1, 1, 0.78);
    const torso = new THREE.Mesh(torsoGeo, skinMat);
    torso.position.y = 0.84;
    torso.castShadow = true;
    group.add(torso);

    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.06), darkSkinMat);
    chest.position.set(0, 0.92, 0.16);
    group.add(chest);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.28, 0.03);
    group.add(headGroup);

    const skull = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.28), skinMat);
    skull.castShadow = true;
    headGroup.add(skull);

    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.08), darkSkinMat);
    brow.position.set(0, 0.06, 0.14);
    headGroup.add(brow);

    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.17), darkSkinMat);
    snout.position.set(0, -0.04, 0.17);
    headGroup.add(snout);

    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.11), mouthMat);
    mouth.position.set(0, -0.1, 0.18);
    headGroup.add(mouth);

    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.02), eyeMat);
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.02), eyeMat);
    eyeL.position.set(-0.07, 0.02, 0.18);
    eyeR.position.set(0.07, 0.02, 0.18);
    headGroup.add(eyeL, eyeR);

    for (let i = 0; i < 6; i++) {
        const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.025, 0.01), toothMat);
        tooth.position.set(-0.055 + i * 0.022, -0.1, 0.24);
        headGroup.add(tooth);
    }

    const earGeo = new THREE.ConeGeometry(0.08, 0.18, 3);
    const earL = new THREE.Mesh(earGeo, darkSkinMat);
    const earR = new THREE.Mesh(earGeo, darkSkinMat);
    earL.position.set(-0.2, -0.01, 0.02);
    earR.position.set(0.2, -0.01, 0.02);
    earL.rotation.z = 1.35;
    earR.rotation.z = -1.35;
    earL.rotation.x = -0.35;
    earR.rotation.x = -0.35;
    headGroup.add(earL, earR);

    const hornGeo = new THREE.ConeGeometry(0.045, 0.18, 5);
    const hornL = new THREE.Mesh(hornGeo, darkSkinMat);
    const hornR = new THREE.Mesh(hornGeo, darkSkinMat);
    hornL.position.set(-0.1, 0.2, -0.03);
    hornR.position.set(0.1, 0.2, -0.03);
    hornL.rotation.z = 0.15;
    hornR.rotation.z = -0.15;
    hornL.rotation.x = -0.2;
    hornR.rotation.x = -0.2;
    headGroup.add(hornL, hornR);

    const leftArm = new THREE.Group();
    leftArm.position.set(-0.2, 0.95, 0.01);
    const rightArm = new THREE.Group();
    rightArm.position.set(0.2, 0.95, 0.01);

    const upperArmGeo = new THREE.BoxGeometry(0.1, 0.26, 0.1);
    const forearmGeo = new THREE.BoxGeometry(0.09, 0.24, 0.09);
    const upperArmL = new THREE.Mesh(upperArmGeo, skinMat);
    const upperArmR = new THREE.Mesh(upperArmGeo, skinMat);
    upperArmL.position.y = -0.13;
    upperArmR.position.y = -0.13;
    leftArm.add(upperArmL);
    rightArm.add(upperArmR);

    const forearmL = new THREE.Mesh(forearmGeo, darkSkinMat);
    const forearmR = new THREE.Mesh(forearmGeo, darkSkinMat);
    forearmL.position.set(0, -0.32, 0.02);
    forearmR.position.set(0, -0.32, 0.02);
    forearmL.rotation.x = -0.22;
    forearmR.rotation.x = -0.08;
    leftArm.add(forearmL);
    rightArm.add(forearmR);

    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.09, 0.52, 0);
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.09, 0.52, 0);

    const thighGeo = new THREE.BoxGeometry(0.11, 0.22, 0.11);
    const shinGeo = new THREE.BoxGeometry(0.1, 0.28, 0.1);
    const footGeo = new THREE.BoxGeometry(0.13, 0.06, 0.2);

    const thighL = new THREE.Mesh(thighGeo, skinMat);
    const thighR = new THREE.Mesh(thighGeo, skinMat);
    thighL.position.y = -0.11;
    thighR.position.y = -0.11;
    leftLeg.add(thighL);
    rightLeg.add(thighR);

    const shinL = new THREE.Mesh(shinGeo, darkSkinMat);
    const shinR = new THREE.Mesh(shinGeo, darkSkinMat);
    shinL.position.set(0, -0.34, 0.02);
    shinR.position.set(0, -0.34, 0.02);
    shinL.rotation.x = 0.06;
    shinR.rotation.x = -0.06;
    leftLeg.add(shinL);
    rightLeg.add(shinR);

    const footL = new THREE.Mesh(footGeo, darkSkinMat);
    const footR = new THREE.Mesh(footGeo, darkSkinMat);
    footL.position.set(0, -0.5, 0.06);
    footR.position.set(0, -0.5, 0.06);
    leftLeg.add(footL);
    rightLeg.add(footR);

    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.42, 6), darkSkinMat);
    tail.position.set(0, 0.7, -0.2);
    tail.rotation.x = -1.15;
    group.add(tail);

    const rightHandGrip = new THREE.Group();
    rightHandGrip.position.set(0.008, -0.46, 0.06);
    rightHandGrip.rotation.set(-0.15, 0.12, 0);
    rightArm.add(rightHandGrip);

    const sword = new THREE.Group();
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.58, 0.015), bladeMat);
    blade.position.y = -0.35;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.08, 4), bladeMat);
    tip.position.y = -0.68;
    tip.rotation.x = Math.PI;
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.02, 0.03), hiltMat);
    guard.position.y = -0.03;
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.14, 0.025), hiltMat);
    grip.position.y = 0.06;
    sword.add(blade, tip, guard, grip);
    sword.rotation.set(0, Math.PI / 2, -Math.PI / 2);
    sword.position.set(0, 0.01, 0.01);
    rightHandGrip.add(sword);

    group.add(leftArm, rightArm, leftLeg, rightLeg);

    return {
        group,
        animate: (time) => {
            const t = time * 1.45;
            leftArm.rotation.x = Math.sin(t) * 0.12 - 0.08;
            rightArm.rotation.x = -Math.sin(t) * 0.08 + 0.06;
            leftLeg.rotation.x = -Math.sin(t) * 0.12;
            rightLeg.rotation.x = Math.sin(t) * 0.12;
            headGroup.rotation.y = Math.sin(t * 0.6) * 0.08;
            tail.rotation.y = Math.sin(t * 1.2) * 0.35;
        },
        applyColor: (nextColorHex) => recolorGroup(group, nextColorHex),
    };
};

const createCreaturePreviewModel = (type: Exclude<PreviewModelKey, 'humanoid'>, colorHex: string): CreaturePreviewModel => {
    switch (type) {
        case 'wolf':
            return createWolfPreviewModel(colorHex);
        case 'bear':
            return createQuadrupedPreviewModel(colorHex, {
                body: [0.62, 0.72, 1.15],
                head: [0.46, 0.42, 0.52],
                legWidth: 0.2,
                legHeight: 0.58,
                gaitAmp: 0.24,
                tailLength: 0.2,
                tailSwingAmp: 0.12,
            });
        case 'yeti':
            return createYetiPreviewModel(colorHex);
        case 'deer':
            return createQuadrupedPreviewModel(colorHex, {
                body: [0.5, 0.56, 1.25],
                head: [0.32, 0.32, 0.4],
                snout: [0.12, 0.12, 0.36],
                legWidth: 0.1,
                legHeight: 0.82,
                legFrontZ: 0.48,
                legBackZ: -0.5,
                headY: 1.04,
                headZ: 0.58,
                gaitAmp: 0.42,
                tailLength: 0.18,
                tailSwingAmp: 0.2,
            });
        case 'horse':
            return createQuadrupedPreviewModel(colorHex, {
                body: [0.58, 0.66, 1.45],
                head: [0.34, 0.34, 0.5],
                snout: [0.14, 0.14, 0.45],
                legWidth: 0.12,
                legHeight: 0.92,
                legFrontZ: 0.55,
                legBackZ: -0.58,
                headY: 1.1,
                headZ: 0.68,
                gaitAmp: 0.5,
                gaitSpeed: 1.25,
                tailLength: 0.55,
                tailY: 0.92,
                tailZ: -0.82,
                tailSwingAmp: 0.35,
            });
        case 'pig':
            return createQuadrupedPreviewModel(colorHex, {
                body: [0.62, 0.5, 0.95],
                head: [0.34, 0.3, 0.34],
                snout: [0.18, 0.14, 0.2],
                legWidth: 0.14,
                legHeight: 0.4,
                gaitAmp: 0.22,
                tailLength: 0.12,
                tailSwingAmp: 0.35,
                headY: 0.68,
                headZ: 0.5,
            });
        case 'sheep':
            return createQuadrupedPreviewModel(colorHex, {
                body: [0.66, 0.58, 1.0],
                head: [0.28, 0.28, 0.32],
                snout: [0.12, 0.1, 0.22],
                legWidth: 0.12,
                legHeight: 0.48,
                gaitAmp: 0.26,
                tailLength: 0.12,
                tailSwingAmp: 0.12,
                headY: 0.78,
                headZ: 0.52,
            });
        case 'lizard':
            return createQuadrupedPreviewModel(colorHex, {
                body: [0.62, 0.32, 1.15],
                head: [0.28, 0.2, 0.34],
                snout: [0.1, 0.08, 0.3],
                earHeight: 0.05,
                legWidth: 0.1,
                legHeight: 0.25,
                legFrontZ: 0.38,
                legBackZ: -0.4,
                tailLength: 0.9,
                tailY: 0.35,
                tailZ: -0.95,
                gaitAmp: 0.2,
                gaitSpeed: 1.4,
                headY: 0.48,
                headZ: 0.55,
                snoutY: -0.02,
                snoutZ: 0.4,
            });
        case 'owl':
            return createOwlPreviewModel(colorHex);
        case 'chicken':
            return createBirdPreviewModel(colorHex, true);
        case 'spider':
            return createSpiderPreviewModel(colorHex);
        case 'imp':
            return createImpPreviewModel(colorHex);
    }
};

const CREATURE_PLACEMENT: Record<Exclude<PreviewModelKey, 'humanoid'>, { scale: number; y: number; rotY?: number }> = {
    wolf: { scale: 1.4, y: -0.15, rotY: 0.35 },
    bear: { scale: 1.4, y: -0.15, rotY: 0.35 },
    yeti: { scale: 1.35, y: -0.3, rotY: 0.2 },
    owl: { scale: 1.6, y: -0.22, rotY: 0.25 },
    deer: { scale: 1.25, y: -0.2, rotY: 0.35 },
    chicken: { scale: 1.75, y: -0.25, rotY: 0.25 },
    pig: { scale: 1.55, y: -0.22, rotY: 0.25 },
    sheep: { scale: 1.45, y: -0.2, rotY: 0.3 },
    spider: { scale: 1.55, y: -0.28, rotY: 0.25 },
    lizard: { scale: 1.45, y: -0.32, rotY: 0.35 },
    horse: { scale: 1.15, y: -0.22, rotY: 0.35 },
    imp: { scale: 1.45, y: -0.2, rotY: 0.2 },
};

export const PlayerPreview: React.FC<PlayerPreviewProps> = ({ config, manualInput }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const modelRef = useRef<PlayerModel | null>(null);
    const creatureModelRef = useRef<CreaturePreviewModel | null>(null);
    const activePreviewTypeRef = useRef<PreviewModelKey | null>(null);
    const configRef = useRef<PlayerConfig>(config);
    const inputRef = useRef<Partial<PlayerInput>>(manualInput ?? {});
    const controlsRef = useRef<OrbitControls | null>(null);
    const frameIdRef = useRef<number>(0);
    const walkTimeRef = useRef(0);
    const lastStepCountRef = useRef(0);
    const hitTimerRef = useRef(0);
    const prevAttack1Ref = useRef(false);
    const prevAttack2Ref = useRef(false);
    const combatStateRef = useRef({
        isAxeSwing: false,
        axeSwingTimer: 0,
        isPunch: false,
        punchTimer: 0,
        punchVariant: 'cross' as 'cross' | 'hook',
        isFiringBow: false,
        bowAttackTimer: 0,
        bowState: 'draw' as 'draw' | 'release',
        bowCharge: 0,
        isCombatStance: false,
    });

    const getWeaponAttackDuration = (selectedItem: PlayerConfig['selectedItem']) => {
        if (selectedItem === 'Sword') return 0.6;
        if (selectedItem === 'Knife') return 0.4;
        if (selectedItem === 'Staff') return 0.7;
        return 0.9;
    };

    const setPreviewModel = (scene: THREE.Scene, previewConfig: PlayerConfig) => {
        const nextType: PreviewModelKey = previewConfig.impersonationModel ?? 'humanoid';
        const hasActiveModel =
            (nextType === 'humanoid' && !!modelRef.current) ||
            (nextType !== 'humanoid' && !!creatureModelRef.current);

        if (nextType === activePreviewTypeRef.current && hasActiveModel) {
            if (nextType === 'humanoid' && modelRef.current) {
                modelRef.current.sync(previewConfig, false);
            }
            if (nextType !== 'humanoid' && creatureModelRef.current) {
                creatureModelRef.current.applyColor(previewConfig.skinColor);
            }
            return;
        }

        if (modelRef.current) {
            scene.remove(modelRef.current.group);
            disposeObject3D(modelRef.current.group);
            modelRef.current = null;
        }

        if (creatureModelRef.current) {
            scene.remove(creatureModelRef.current.group);
            disposeObject3D(creatureModelRef.current.group);
            creatureModelRef.current = null;
        }

        if (nextType !== 'humanoid') {
            const creature = createCreaturePreviewModel(nextType, previewConfig.skinColor);
            const placement = CREATURE_PLACEMENT[nextType];
            creature.group.rotation.y = placement.rotY ?? 0.3;
            creature.group.position.y = placement.y;
            creature.group.scale.setScalar(placement.scale);
            scene.add(creature.group);
            creatureModelRef.current = creature;
            activePreviewTypeRef.current = nextType;
            return;
        }

        const playerModel = new PlayerModel(previewConfig);
        playerModel.group.rotation.y = 0.2;
        scene.add(playerModel.group);
        modelRef.current = playerModel;
        activePreviewTypeRef.current = 'humanoid';
    };

    useEffect(() => {
        if (!containerRef.current) return;

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const scene = new THREE.Scene();
        scene.background = null; 
        
        const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
        camera.position.set(0, 0.9, 4.6); 
        camera.lookAt(0, 0.9, 0);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setPixelRatio(1); // Performance win in UI
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap; 
        containerRef.current.appendChild(renderer.domElement);
        renderer.domElement.style.touchAction = 'none';
        const handleContextMenu = (event: MouseEvent) => event.preventDefault();
        renderer.domElement.addEventListener('contextmenu', handleContextMenu);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.enableRotate = true;
        controls.enablePan = true;
        controls.enableZoom = true;
        controls.rotateSpeed = 0.9;
        controls.panSpeed = 0.85;
        controls.zoomSpeed = 0.9;
        controls.screenSpacePanning = true;
        controls.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
        };
        controls.target.set(0, 0.9, 0);
        controls.update();
        controlsRef.current = controls;

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
        scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
        dirLight.position.set(2, 2, 5);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 512;
        dirLight.shadow.mapSize.height = 512;
        dirLight.shadow.bias = -0.001;
        scene.add(dirLight);
        
        const backLight = new THREE.DirectionalLight(0x4455ff, 0.6);
        backLight.position.set(-2, 2, -5);
        scene.add(backLight);

        setPreviewModel(scene, config);

        sceneRef.current = scene;
        rendererRef.current = renderer;

        const animate = () => {
            frameIdRef.current = requestAnimationFrame(animate);
            const dt = 0.016;
            const input = inputRef.current;

            const attackPressed = !!input.attack1;
            const getHitPressed = !!input.attack2;
            if (attackPressed && !prevAttack1Ref.current) {
                if (configRef.current.selectedItem === 'Bow') {
                    combatStateRef.current.isFiringBow = true;
                    combatStateRef.current.bowAttackTimer = 0;
                    combatStateRef.current.bowState = 'draw';
                    combatStateRef.current.bowCharge = 0;
                    combatStateRef.current.isAxeSwing = false;
                    combatStateRef.current.axeSwingTimer = 0;
                    combatStateRef.current.isPunch = false;
                    combatStateRef.current.punchTimer = 0;
                } else if (configRef.current.selectedItem) {
                    combatStateRef.current.isAxeSwing = true;
                    combatStateRef.current.axeSwingTimer = 0;
                    combatStateRef.current.isFiringBow = false;
                    combatStateRef.current.bowAttackTimer = 0;
                    combatStateRef.current.bowCharge = 0;
                    combatStateRef.current.isPunch = false;
                    combatStateRef.current.punchTimer = 0;
                } else {
                    combatStateRef.current.isPunch = true;
                    combatStateRef.current.punchTimer = 0;
                    combatStateRef.current.punchVariant = Math.random() > 0.5 ? 'cross' : 'hook';
                    combatStateRef.current.isFiringBow = false;
                    combatStateRef.current.bowAttackTimer = 0;
                    combatStateRef.current.bowCharge = 0;
                    combatStateRef.current.isAxeSwing = false;
                    combatStateRef.current.axeSwingTimer = 0;
                }
            }
            if (getHitPressed && !prevAttack2Ref.current) {
                hitTimerRef.current = 0.26;
            }
            prevAttack1Ref.current = attackPressed;
            prevAttack2Ref.current = getHitPressed;

            hitTimerRef.current = Math.max(0, hitTimerRef.current - dt);

            if (combatStateRef.current.isAxeSwing) {
                combatStateRef.current.axeSwingTimer += dt;
                if (combatStateRef.current.axeSwingTimer >= getWeaponAttackDuration(configRef.current.selectedItem)) {
                    combatStateRef.current.isAxeSwing = false;
                    combatStateRef.current.axeSwingTimer = 0;
                }
            }
            if (combatStateRef.current.isFiringBow) {
                combatStateRef.current.bowAttackTimer += dt;
                const drawDuration = 0.24;
                const holdDuration = 0.14;
                const releaseDuration = 0.2;
                const totalDuration = drawDuration + holdDuration + releaseDuration;
                const t = combatStateRef.current.bowAttackTimer;

                if (t < drawDuration) {
                    combatStateRef.current.bowState = 'draw';
                    combatStateRef.current.bowCharge = t / drawDuration;
                } else if (t < drawDuration + holdDuration) {
                    combatStateRef.current.bowState = 'draw';
                    combatStateRef.current.bowCharge = 1;
                } else if (t < totalDuration) {
                    combatStateRef.current.bowState = 'release';
                    const r = (t - drawDuration - holdDuration) / releaseDuration;
                    combatStateRef.current.bowCharge = Math.max(0, 1 - r);
                } else {
                    combatStateRef.current.isFiringBow = false;
                    combatStateRef.current.bowAttackTimer = 0;
                    combatStateRef.current.bowState = 'draw';
                    combatStateRef.current.bowCharge = 0;
                }
            }
            if (combatStateRef.current.isPunch) {
                combatStateRef.current.punchTimer += dt;
                if (combatStateRef.current.punchTimer >= 0.72) {
                    combatStateRef.current.isPunch = false;
                    combatStateRef.current.punchTimer = 0;
                }
            }

            const isWalking = Math.abs(input.x ?? 0) > 0.05 || Math.abs(input.y ?? 0) > 0.05;
            if (!isWalking && walkTimeRef.current !== 0) {
                // Match runtime locomotion behavior: reset cadence when movement stops.
                walkTimeRef.current = 0;
                lastStepCountRef.current = 0;
            }

            if (modelRef.current) {
                const mockPlayer = {
                    config: configRef.current,
                    isCombatStance: false,
                    model: modelRef.current,
                    locomotion: {
                        walkTime: walkTimeRef.current,
                        lastStepCount: lastStepCountRef.current,
                        didStep: false,
                        isCrouching: false,
                    },
                };
                const parts = modelRef.current.parts;
                const locomotionInput: PlayerInput = {
                    x: input.x ?? 0,
                    y: input.y ?? 0,
                    isRunning: !!input.isRunning,
                    jump: false,
                    isDead: false,
                    isPickingUp: false,
                    attack1: false,
                    attack2: false,
                    interact: false,
                    combat: false,
                    toggleFirstPerson: false,
                    wave: false,
                    leftHandWave: false,
                    summon: false,
                    toggleBuilder: false,
                    rotateGhost: false,
                    fireball: false,
                    crouch: false,
                };

                if (isWalking) {
                    MovementAction.animate(mockPlayer, parts, dt, 0.1, locomotionInput, false);
                } else {
                    IdleAction.animate(mockPlayer, parts, 0.1, false);
                }
                walkTimeRef.current = mockPlayer.locomotion.walkTime ?? 0;
                lastStepCountRef.current = mockPlayer.locomotion.lastStepCount ?? 0;

                const mockPlayerForActions = {
                    config: configRef.current,
                    model: modelRef.current,
                    combat: combatStateRef.current,
                    locomotion: {
                        isJumping: false,
                    },
                    isCombatStance: false,
                };

                if (combatStateRef.current.isFiringBow) {
                    FireArrowAction.animate(mockPlayerForActions, parts, dt, 0.1);
                } else if (combatStateRef.current.isAxeSwing) {
                    WeaponAction.animate(mockPlayerForActions, parts, dt, 0.1, isWalking);
                } else if (combatStateRef.current.isPunch) {
                    UnarmedPunchAction.animate(mockPlayerForActions, parts, dt, 0.1, isWalking);
                }

                if (hitTimerRef.current > 0) {
                    const hitProgress = 1 - (hitTimerRef.current / 0.26);
                    const recoil = Math.sin(hitProgress * Math.PI);
                    parts.torsoContainer.rotation.x += 0.22 * recoil;
                    parts.head.rotation.x += 0.12 * recoil;
                }

                modelRef.current.update(dt, new THREE.Vector3(0, 0, 0));
            }

            if (creatureModelRef.current) {
                creatureModelRef.current.animate(performance.now() * 0.008);
            }

            controls.update();
            renderer.render(scene, camera);
        };

        animate();

        const handleResize = () => {
            if (!containerRef.current || !rendererRef.current) return;
            const w = containerRef.current.clientWidth;
            const h = containerRef.current.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            rendererRef.current.setSize(w, h);
        };
        
        const resizeObserver = new ResizeObserver(() => handleResize());
        resizeObserver.observe(containerRef.current);

        return () => {
            cancelAnimationFrame(frameIdRef.current);
            resizeObserver.disconnect();
            controlsRef.current?.dispose();
            controlsRef.current = null;

            if (modelRef.current) {
                scene.remove(modelRef.current.group);
                disposeObject3D(modelRef.current.group);
                modelRef.current = null;
            }
            if (creatureModelRef.current) {
                scene.remove(creatureModelRef.current.group);
                disposeObject3D(creatureModelRef.current.group);
                creatureModelRef.current = null;
            }

            renderer.domElement.removeEventListener('contextmenu', handleContextMenu);
            if (rendererRef.current && containerRef.current) {
                containerRef.current.removeChild(rendererRef.current.domElement);
                rendererRef.current.dispose();
            }
        };
    }, []);

    useEffect(() => {
        configRef.current = config;
        if (sceneRef.current) {
            setPreviewModel(sceneRef.current, config);
        }
    }, [config]);

    useEffect(() => {
        inputRef.current = manualInput ?? {};
    }, [manualInput]);

    return <div ref={containerRef} className="w-full h-full" />;
};
