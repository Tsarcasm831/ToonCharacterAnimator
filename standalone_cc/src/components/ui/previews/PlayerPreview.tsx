
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { PlayerConfig, PlayerInput } from '../../../types';
import { PlayerModel } from '../../../game/model/PlayerModel';
import { IdleAction } from '../../../game/animator/actions/IdleAction';

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
    const mat = new THREE.MeshStandardMaterial({ color, flatShading: true });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.75, 0.3), mat);
    torso.position.y = 0.85;
    group.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.34), mat);
    head.position.y = 1.4;
    group.add(head);

    const hornGeo = new THREE.ConeGeometry(0.06, 0.18, 5);
    const hornL = new THREE.Mesh(hornGeo, mat);
    const hornR = new THREE.Mesh(hornGeo, mat);
    hornL.position.set(-0.12, 1.6, 0.02);
    hornR.position.set(0.12, 1.6, 0.02);
    hornL.rotation.z = 0.25;
    hornR.rotation.z = -0.25;
    group.add(hornL, hornR);

    const armGeo = new THREE.BoxGeometry(0.12, 0.48, 0.12);
    const armL = new THREE.Mesh(armGeo, mat);
    const armR = new THREE.Mesh(armGeo, mat);
    armL.position.set(-0.3, 0.93, 0);
    armR.position.set(0.3, 0.93, 0);
    group.add(armL, armR);

    const legGeo = new THREE.BoxGeometry(0.14, 0.55, 0.14);
    const legL = new THREE.Mesh(legGeo, mat);
    const legR = new THREE.Mesh(legGeo, mat);
    legL.position.set(-0.12, 0.28, 0);
    legR.position.set(0.12, 0.28, 0);
    group.add(legL, legR);

    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.45), mat);
    tail.position.set(0, 0.72, -0.28);
    tail.rotation.x = -0.5;
    group.add(tail);

    return {
        group,
        animate: (time) => {
            const t = time * 1.6;
            armL.rotation.x = Math.sin(t) * 0.25;
            armR.rotation.x = -Math.sin(t) * 0.25;
            legL.rotation.x = -Math.sin(t) * 0.22;
            legR.rotation.x = Math.sin(t) * 0.22;
            tail.rotation.y = Math.sin(t * 1.2) * 0.3;
        },
        applyColor: (nextColorHex) => recolorGroup(group, nextColorHex),
    };
};

const createCreaturePreviewModel = (type: Exclude<PreviewModelKey, 'humanoid'>, colorHex: string): CreaturePreviewModel => {
    switch (type) {
        case 'wolf':
            return createQuadrupedPreviewModel(colorHex);
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
            return createQuadrupedPreviewModel(colorHex, {
                body: [0.66, 0.78, 1.2],
                head: [0.48, 0.46, 0.52],
                legWidth: 0.22,
                legHeight: 0.64,
                gaitAmp: 0.2,
                tailLength: 0.14,
                tailSwingAmp: 0.08,
            });
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
            return createBirdPreviewModel(colorHex, false);
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
    yeti: { scale: 1.45, y: -0.2, rotY: 0.35 },
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

export const PlayerPreview: React.FC<PlayerPreviewProps> = ({ config }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const modelRef = useRef<PlayerModel | null>(null);
    const creatureModelRef = useRef<CreaturePreviewModel | null>(null);
    const activePreviewTypeRef = useRef<PreviewModelKey | null>(null);
    const configRef = useRef<PlayerConfig>(config);
    const controlsRef = useRef<OrbitControls | null>(null);
    const frameIdRef = useRef<number>(0);

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

            if (modelRef.current) {
                const mockPlayer = {
                    config: configRef.current,
                    isCombatStance: false,
                    model: modelRef.current,
                };
                IdleAction.animate(mockPlayer, modelRef.current.parts, 0.1, false);
                modelRef.current.update(0.016, new THREE.Vector3(0, 0, 0));
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

    return <div ref={containerRef} className="w-full h-full" />;
};
