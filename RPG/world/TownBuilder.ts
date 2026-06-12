import * as THREE from 'three';
import { BuildingParts } from '../../game/builder/BuildingParts';
import type { Blueprint } from '../../game/building/BlueprintTypes';
import { getCottage } from '../../game/building/Cottage';
import { getLonghouse } from '../../game/building/Longhouse';
import { getTheForge } from '../../game/building/TheForge';
import { ObjectFactory } from '../../game/environment/ObjectFactory';
import { Door } from '../../game/environment/objects/Door';
import { EventTent } from '../../game/environment/objects/event_tent';
import { SupplyCart } from '../../game/environment/objects/supply_cart';
import {
    TOWN_CENTER,
    TOWN_GATE,
    TOWN_GATE_WIDTH,
    TOWN_PLATEAU_HEIGHT,
    TOWN_RECT,
} from '../data/worldLayout';

// ============================================================================
// Briarhollow. Everything in here sits on the flat town plateau, so every
// Y coordinate is TOWN_PLATEAU_HEIGHT + local offset. Placement math for
// blueprint buildings is copied from game/builder/LevelGenerator.buildStructure
// (per-part half-cell offsets), with the plateau height added to part Y.
//
// NPC anchors (RPG/data/npcs.ts) the layout frames:
//   Marta  [-14,-110] market   | Borin [26,-128] forge   | Hale  [9,-90]
//   Yara   [4,-116]   plaza    | Sera  [-24,-132] inn    | Garrick [-6,-82] gate
//   Wren   [-30,-100] cottage  | Toma  [12,-140] cottage | Pip   [-6,-106]
// ============================================================================

export interface TownBuildResult {
    doors: Door[];
}

const GRID = 1.3333;
const WALL_SEGMENT = GRID * 4; // ObjectFactory.createWall length
const Y = TOWN_PLATEAU_HEIGHT;

type AddObstacle = (o: THREE.Object3D) => void;

interface DoorwaySpot {
    x: number;
    z: number;
    rotation: number;
}

function prepareStatic(object: THREE.Object3D, castShadows: boolean = true, receiveShadows: boolean = true) {
    object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            child.castShadow = castShadows;
            child.receiveShadow = receiveShadows;
            child.updateMatrix();
            child.matrixAutoUpdate = false;
        }
    });
}

// ----------------------------------------------------------------------------
// Palisade
// ----------------------------------------------------------------------------

function placeWallRun(
    group: THREE.Group,
    addObstacle: AddObstacle,
    x0: number, z0: number,
    x1: number, z1: number
) {
    const dx = x1 - x0;
    const dz = z1 - z0;
    const len = Math.hypot(dx, dz);
    if (len < 0.5) return;
    const count = Math.max(1, Math.ceil(len / WALL_SEGMENT));
    const rotation = -Math.atan2(dz, dx);

    for (let i = 0; i < count; i++) {
        const t = (i + 0.5) / count;
        const pos = new THREE.Vector3(x0 + dx * t, Y, z0 + dz * t);
        const wall = ObjectFactory.createWall(pos, rotation);
        // Stretch slightly so segments always touch end-to-end.
        const stretch = (len / count) / WALL_SEGMENT;
        wall.group.scale.x = stretch * 1.02;
        prepareStatic(wall.group);
        group.add(wall.group);
        addObstacle(wall.obstacle);
    }
}

function buildPalisade(group: THREE.Group, addObstacle: AddObstacle) {
    const { minX, maxX, minZ, maxZ } = TOWN_RECT;
    const [gateX] = TOWN_GATE;
    const halfGate = TOWN_GATE_WIDTH / 2;

    // North wall (full span).
    placeWallRun(group, addObstacle, minX, minZ, maxX, minZ);
    // South wall, split around the gate.
    placeWallRun(group, addObstacle, minX, maxZ, gateX - halfGate, maxZ);
    placeWallRun(group, addObstacle, gateX + halfGate, maxZ, maxX, maxZ);
    // East / west walls.
    placeWallRun(group, addObstacle, minX, minZ, minX, maxZ);
    placeWallRun(group, addObstacle, maxX, minZ, maxX, maxZ);

    // Watchtower posts flanking the gate.
    buildWatchtower(group, addObstacle, gateX - halfGate - 1.6, maxZ - 1.2);
    buildWatchtower(group, addObstacle, gateX + halfGate + 1.6, maxZ - 1.2);
}

function buildWatchtower(group: THREE.Group, addObstacle: AddObstacle, x: number, z: number) {
    const tower = new THREE.Group();
    tower.position.set(x, Y, z);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6f4f37, roughness: 0.85, metalness: 0.03 });
    woodMat.color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.04);
    const postGeo = new THREE.BoxGeometry(0.32, 6.4, 0.32);
    const offsets: [number, number][] = [[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]];
    for (const [px, pz] of offsets) {
        const post = new THREE.Mesh(postGeo, woodMat);
        post.position.set(px, 3.2, pz);
        post.castShadow = true;
        post.userData = { type: 'hard', material: 'wood', structureType: 'watchtower' };
        tower.add(post);
        addObstacle(post);
    }

    const deck = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 0.32, 3.2),
        new THREE.MeshStandardMaterial({ color: 0x8b6b4c, roughness: 0.88, metalness: 0.02 })
    );
    deck.position.y = 6.1;
    deck.castShadow = true;
    deck.userData = { type: 'hard', material: 'wood', structureType: 'watchtower' };
    tower.add(deck);
    addObstacle(deck);

    const roof = new THREE.Mesh(
        new THREE.ConeGeometry(2.6, 1.9, 4),
        new THREE.MeshStandardMaterial({ color: 0x4c2b1c, roughness: 0.87, metalness: 0.02 })
    );
    roof.position.y = 7.4;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    tower.add(roof);

    prepareStatic(tower);
    group.add(tower);
}

// ----------------------------------------------------------------------------
// Blueprint buildings (placement math copied from LevelGenerator.buildStructure)
// ----------------------------------------------------------------------------

function buildBlueprint(
    group: THREE.Group,
    addObstacle: AddObstacle,
    blueprint: Blueprint,
    originX: number,
    originZ: number,
    blueprintRotation: number = 0,
    color?: number,
    /** Blueprint-grid coords of the doorway that should receive a real Door. */
    doorCell?: { x: number; z: number }
): DoorwaySpot | null {
    let doorSpot: DoorwaySpot | null = null;

    blueprint.forEach((part) => {
        let localX = part.x;
        let localZ = part.z;

        // Center adjustment logic — copied exactly from LevelGenerator.
        if (part.type === 'foundation' || part.type === 'roof' || part.type === 'round_foundation' || part.type === 'round_wall') {
            localX += 0.5; localZ += 0.5;
        } else if (part.type !== 'pillar') {
            if (part.rotation === Math.PI / 2) localZ += 0.5; else localX += 0.5;
        }

        const rx = localX * Math.cos(blueprintRotation) - localZ * Math.sin(blueprintRotation);
        const rz = localX * Math.sin(blueprintRotation) + localZ * Math.cos(blueprintRotation);

        const finalX = originX + (rx * GRID);
        const finalZ = originZ + (rz * GRID);
        const finalRot = (part.rotation || 0) + blueprintRotation;

        const FOUNDATION_HEIGHT = 0.4;
        let y = 0;
        if (part.type === 'foundation' || part.type === 'round_foundation') y = 0.2;
        else if (part.type === 'wall' || part.type === 'pillar' || part.type === 'round_wall') y = FOUNDATION_HEIGHT + 1.65;
        else if (part.type === 'doorway') y = FOUNDATION_HEIGHT + 1.65;
        else if (part.type === 'door') y = FOUNDATION_HEIGHT + 1.175;
        else if (part.type === 'roof') y = FOUNDATION_HEIGHT + 3.3;

        // The chosen doorway gets a real (animated) Door instead of a static
        // frame; record its world transform and skip the static part.
        if (part.type === 'doorway' && doorCell && part.x === doorCell.x && part.z === doorCell.z) {
            doorSpot = { x: finalX, z: finalZ, rotation: finalRot };
            return;
        }

        placeStructurePart(group, addObstacle, part.type, finalX, Y + y, finalZ, finalRot, color);
    });

    return doorSpot;
}

function placeStructurePart(
    group: THREE.Group,
    addObstacle: AddObstacle,
    type: any,
    x: number, y: number, z: number,
    rotation: number,
    color?: number
) {
    const mesh = BuildingParts.createStructureMesh(type, false, color);
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotation;

    const applyUserData = (obj: THREE.Object3D) => {
        obj.userData = { ...obj.userData, type: 'hard', material: 'wood', structureType: type };
    };

    if (mesh instanceof THREE.Group) {
        mesh.traverse(applyUserData);
        mesh.traverse((child) => {
            if (child instanceof THREE.Mesh && child.userData.type === 'hard') addObstacle(child);
        });
    } else {
        applyUserData(mesh);
        addObstacle(mesh);
    }

    prepareStatic(mesh);
    group.add(mesh);
}

// ----------------------------------------------------------------------------
// Plaza, fountain & paths
// ----------------------------------------------------------------------------

function buildFountain(group: THREE.Group, addObstacle: AddObstacle, position: THREE.Vector3) {
    const fountain = new THREE.Group();
    fountain.position.copy(position);

    const basin = new THREE.Mesh(
        new THREE.CylinderGeometry(3.2, 3.6, 0.8, 24),
        new THREE.MeshStandardMaterial({ color: 0x8a8d93, roughness: 0.92, metalness: 0.04 })
    );
    basin.position.y = 0.4;
    basin.castShadow = true;
    basin.receiveShadow = true;
    basin.userData = { type: 'hard', material: 'stone', structureType: 'fountain' };
    fountain.add(basin);
    addObstacle(basin);

    const water = new THREE.Mesh(
        new THREE.CylinderGeometry(2.55, 2.75, 0.16, 24),
        new THREE.MeshStandardMaterial({
            color: 0x5ba4c7,
            roughness: 0.15,
            metalness: 0.1,
            emissive: 0x16384a,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.9,
        })
    );
    water.position.y = 0.72;
    water.receiveShadow = true;
    water.name = 'rpg_fountain_water'; // RPGWorld.update animates this.
    fountain.add(water);

    const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 1.0, 2.4, 12),
        new THREE.MeshStandardMaterial({ color: 0xa49a86, roughness: 0.88, metalness: 0.03 })
    );
    pedestal.position.y = 1.6;
    pedestal.castShadow = true;
    pedestal.userData = { type: 'hard', material: 'stone', structureType: 'fountain' };
    fountain.add(pedestal);
    addObstacle(pedestal);

    const spire = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.8, 0),
        new THREE.MeshStandardMaterial({ color: 0xc6b27c, roughness: 0.72, metalness: 0.18 })
    );
    spire.position.y = 3.15;
    spire.castShadow = true;
    fountain.add(spire);

    const jet = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.09, 1.7, 10),
        new THREE.MeshStandardMaterial({
            color: 0x9fd4ef,
            roughness: 0.1,
            metalness: 0,
            emissive: 0x4a7e9c,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.85,
        })
    );
    jet.position.y = 2.1;
    fountain.add(jet);

    group.add(fountain);
}

function buildPlazaAndPaths(group: THREE.Group, addObstacle: AddObstacle) {
    const [cx, cz] = TOWN_CENTER;
    const [gateX, gateZ] = TOWN_GATE;

    // Stone-toned circular plaza patch.
    const plazaGeo = new THREE.CircleGeometry(9.5, 40);
    plazaGeo.rotateX(-Math.PI / 2);
    const plaza = new THREE.Mesh(
        plazaGeo,
        new THREE.MeshStandardMaterial({
            color: 0x97917f,
            roughness: 0.95,
            metalness: 0.02,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
        })
    );
    plaza.position.set(cx, Y + 0.02, cz);
    plaza.receiveShadow = true;
    plaza.userData = { type: 'ground' };
    prepareStatic(plaza, false, true);
    group.add(plaza);

    buildFountain(group, addObstacle, new THREE.Vector3(cx, Y, cz));

    // Flat path planes, warm sandy/cobble color with slight per-patch variation.
    const buildPath = (x0: number, z0: number, x1: number, z1: number, width: number) => {
        const dx = x1 - x0;
        const dz = z1 - z0;
        const len = Math.hypot(dx, dz);
        const geo = new THREE.PlaneGeometry(width, len);
        geo.rotateX(-Math.PI / 2);
        const color = new THREE.Color(0x96825f);
        color.offsetHSL((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.06, (Math.random() - 0.5) * 0.05);
        const path = new THREE.Mesh(
            geo,
            new THREE.MeshStandardMaterial({ color, roughness: 0.98, metalness: 0.01 })
        );
        path.position.set((x0 + x1) / 2, Y + 0.02, (z0 + z1) / 2);
        path.rotation.y = Math.atan2(dx, dz);
        path.receiveShadow = true;
        path.userData = { type: 'ground' };
        prepareStatic(path, false, true);
        group.add(path);
    };

    // Gate -> plaza main street.
    buildPath(gateX, gateZ - 0.5, cx, cz + 8.5, 5.2);
    // Plaza -> inn (Sera, west).
    buildPath(cx - 8.5, cz - 4, -26, -132.5, 3.6);
    // Plaza -> forge (Borin, east).
    buildPath(cx + 8.5, cz - 5, 33.7, -127.8, 3.6);
    // Plaza -> south-east cottage / stash (Toma).
    buildPath(cx + 4, cz - 8, 14, -144.4, 3.0);
    // Plaza -> north-west cottage (Wren).
    buildPath(cx - 7, cz + 5.5, -35.8, -105, 3.0);
    // Plaza -> market (Marta).
    buildPath(cx - 9, cz + 7.5, -16, -109, 3.2);
    // Plaza -> north-east cottage.
    buildPath(cx + 8, cz + 4.5, 33.8, -97.2, 3.0);
}

// ----------------------------------------------------------------------------
// Market & props
// ----------------------------------------------------------------------------

function addFactoryResult(group: THREE.Group, addObstacle: AddObstacle, result: any) {
    if (!result) return;
    const g: THREE.Object3D | undefined = result.group ?? (result instanceof THREE.Object3D ? result : undefined);
    if (!g) return;
    prepareStatic(g);
    group.add(g);
    const obstacle = result.obstacle ?? result.trunk ?? (g.userData?.type === 'hard' ? g : null);
    if (obstacle) {
        addObstacle(obstacle);
    } else {
        // Groups with internal 'hard' collision children (e.g. campfire).
        g.traverse((child) => {
            if (child instanceof THREE.Mesh && child.userData.type === 'hard') addObstacle(child);
        });
    }
}

function buildMarketAndProps(group: THREE.Group, addObstacle: AddObstacle) {
    // -- Market stalls near Marta [-14,-110] ---------------------------------
    const tent = EventTent.create(false);
    tent.position.set(-20.5, Y, -107);
    tent.rotation.y = Math.PI / 2;
    prepareStatic(tent);
    group.add(tent);
    tent.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.type === 'hard') addObstacle(child);
    });

    const cart = SupplyCart.create(false);
    cart.position.set(-12, Y, -114.5);
    cart.rotation.y = -Math.PI / 3;
    prepareStatic(cart);
    group.add(cart);
    cart.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.type === 'hard') addObstacle(child);
    });

    addFactoryResult(group, addObstacle, ObjectFactory.createCrate(new THREE.Vector3(-17.5, Y, -111.5)));
    addFactoryResult(group, addObstacle, ObjectFactory.createBarrel(new THREE.Vector3(-18.6, Y, -113)));

    // -- Lightpoles along the main street and plaza --------------------------
    const lightpoleSpots: [number, number][] = [
        [3.2, -84], [-3.2, -94], [3.2, -104], [-7, -112.5], [7, -123.5], [-22, -129],
    ];
    for (const [x, z] of lightpoleSpots) {
        addFactoryResult(group, addObstacle, ObjectFactory.createLightpole(new THREE.Vector3(x, Y, z)));
    }

    // -- Barrel / crate clusters near the forge and the inn -------------------
    addFactoryResult(group, addObstacle, ObjectFactory.createBarrel(new THREE.Vector3(30.5, Y, -125.6)));
    addFactoryResult(group, addObstacle, ObjectFactory.createBarrel(new THREE.Vector3(31.6, Y, -126.3)));
    addFactoryResult(group, addObstacle, ObjectFactory.createCrate(new THREE.Vector3(36.8, Y, -128.5)));
    addFactoryResult(group, addObstacle, ObjectFactory.createCrate(new THREE.Vector3(-31.3, Y, -135.8)));
    addFactoryResult(group, addObstacle, ObjectFactory.createBarrel(new THREE.Vector3(-25.2, Y, -138.2)));

    // -- Fences & greenery for life -------------------------------------------
    addFactoryResult(group, addObstacle, ObjectFactory.createFence(new THREE.Vector3(-33, Y, -102.4), 0));
    addFactoryResult(group, addObstacle, ObjectFactory.createFence(new THREE.Vector3(-30.8, Y, -102.4), 0));
    addFactoryResult(group, addObstacle, ObjectFactory.createFence(new THREE.Vector3(18.4, Y, -147), Math.PI / 2));
    addFactoryResult(group, addObstacle, ObjectFactory.createFence(new THREE.Vector3(18.4, Y, -149.1), Math.PI / 2));

    const bushSpots: [number, number, number][] = [
        [-9, -85, 0.9], [9.5, -84.5, 1.05], [-20, -120, 0.85], [22, -113, 1.0],
        [-36, -114, 0.9], [38, -104, 0.95], [6, -132, 0.8], [-15, -141, 1.0],
    ];
    for (const [x, z, s] of bushSpots) {
        const bush = ObjectFactory.createBush(new THREE.Vector3(x, Y, z), s);
        bush.userData = { ...bush.userData, type: 'soft' };
        prepareStatic(bush, true, false);
        group.add(bush);
    }
}

// ----------------------------------------------------------------------------
// Hunt post, banners & notice board
// ----------------------------------------------------------------------------

function buildHuntPost(group: THREE.Group, addObstacle: AddObstacle) {
    // Hale's hunt post near [9,-90]: pole frame with pelt planes hanging.
    // Offset behind Hale's NPC anchor so the pelts frame him instead of
    // clipping through him.
    const post = new THREE.Group();
    post.position.set(10.4, Y, -92.2);
    post.rotation.y = -Math.PI / 7;

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b4a30, roughness: 0.9, metalness: 0.02 });
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 2.6, 8);
    for (const px of [-1.4, 1.4]) {
        const pole = new THREE.Mesh(poleGeo, woodMat);
        pole.position.set(px, 1.3, 0);
        pole.castShadow = true;
        pole.userData = { type: 'hard', material: 'wood', structureType: 'hunt_post' };
        post.add(pole);
        addObstacle(pole);
    }
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.1, 8), woodMat);
    beam.rotation.z = Math.PI / 2;
    beam.position.y = 2.5;
    beam.castShadow = true;
    post.add(beam);

    // Pelts: slightly warped planes in fur tones.
    const peltColors = [0x8a6b4a, 0x615047, 0x9c8568];
    for (let i = 0; i < 3; i++) {
        const pelt = new THREE.Mesh(
            new THREE.PlaneGeometry(0.62, 1.0, 1, 2),
            new THREE.MeshStandardMaterial({ color: peltColors[i], roughness: 1.0, side: THREE.DoubleSide })
        );
        pelt.position.set(-0.95 + i * 0.95, 1.95, 0);
        pelt.rotation.x = 0.07;
        pelt.rotation.y = (Math.random() - 0.5) * 0.16;
        pelt.castShadow = true;
        pelt.userData = { type: 'soft' };
        post.add(pelt);
    }

    prepareStatic(post);
    group.add(post);
}

function buildBanner(group: THREE.Group, x: number, z: number, colorHex: number, rotationY: number) {
    const banner = new THREE.Group();
    banner.position.set(x, Y, z);
    banner.rotation.y = rotationY;

    const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.07, 3.4, 8),
        new THREE.MeshStandardMaterial({ color: 0x5b4330, roughness: 0.9 })
    );
    pole.position.y = 1.7;
    pole.castShadow = true;
    banner.add(pole);

    const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 0.85, 6),
        new THREE.MeshStandardMaterial({ color: 0x5b4330, roughness: 0.9 })
    );
    arm.rotation.z = Math.PI / 2;
    arm.position.set(0.38, 3.25, 0);
    banner.add(arm);

    const cloth = new THREE.Mesh(
        new THREE.PlaneGeometry(0.66, 1.5, 1, 3),
        new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.92, side: THREE.DoubleSide })
    );
    cloth.position.set(0.42, 2.48, 0);
    cloth.castShadow = true;
    banner.add(cloth);

    banner.traverse((c) => { c.userData = { ...c.userData, type: 'soft' }; });
    prepareStatic(banner);
    group.add(banner);
}

function buildNoticeBoard(group: THREE.Group, addObstacle: AddObstacle) {
    // Notice board just inside the gate, by Garrick [-6,-82].
    const board = new THREE.Group();
    board.position.set(-4.6, Y, -83.5);
    board.rotation.y = Math.PI - 0.25;

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6f5138, roughness: 0.88 });
    const legGeo = new THREE.BoxGeometry(0.12, 2.2, 0.12);
    for (const lx of [-0.85, 0.85]) {
        const leg = new THREE.Mesh(legGeo, woodMat);
        leg.position.set(lx, 1.1, 0);
        leg.castShadow = true;
        leg.userData = { type: 'hard', material: 'wood', structureType: 'notice_board' };
        board.add(leg);
        addObstacle(leg);
    }
    const panel = new THREE.Mesh(
        new THREE.BoxGeometry(1.9, 1.15, 0.07),
        new THREE.MeshStandardMaterial({ color: 0x8a6a48, roughness: 0.95 })
    );
    panel.position.y = 1.62;
    panel.castShadow = true;
    panel.userData = { type: 'soft' };
    board.add(panel);

    const roofBeam = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.1, 0.42), woodMat);
    roofBeam.position.y = 2.3;
    roofBeam.rotation.x = 0.18;
    roofBeam.castShadow = true;
    roofBeam.userData = { type: 'soft' };
    board.add(roofBeam);

    // A few pinned parchment notes.
    const noteMat = new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 1.0 });
    const noteSpots: [number, number, number][] = [[-0.55, 1.72, 0.05], [0.1, 1.5, -0.04], [0.62, 1.76, 0.08]];
    for (const [nx, ny, tilt] of noteSpots) {
        const note = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), noteMat);
        note.position.set(nx, ny, 0.045);
        note.rotation.z = tilt;
        note.userData = { type: 'soft' };
        board.add(note);
    }

    prepareStatic(board);
    group.add(board);
}

// ----------------------------------------------------------------------------
// Entry point
// ----------------------------------------------------------------------------

function buildTown(
    group: THREE.Group,
    obstacles: THREE.Object3D[],
    addObstacle: (o: THREE.Object3D) => void
): TownBuildResult {
    void obstacles; // registration goes through addObstacle
    const doors: Door[] = [];

    buildPalisade(group, addObstacle);
    buildPlazaAndPaths(group, addObstacle);

    const spawnDoor = (spot: DoorwaySpot | null) => {
        if (!spot) return;
        const door = new Door(new THREE.Vector3(spot.x, Y + 0.4, spot.z), spot.rotation, GRID);
        group.add(door.mesh);
        doors.push(door);
    };

    // Inn (longhouse) west of the plaza — Sera [-24,-132] stands at its east door.
    spawnDoor(buildBlueprint(group, addObstacle, getLonghouse(), -30, -137, 0, 0xc9a96d, { x: 3, z: 3 }));

    // Forge building east of the plaza — Borin [26,-128] works out front.
    spawnDoor(buildBlueprint(group, addObstacle, getTheForge(), 29, -134, 0, 0xb87156, { x: 3, z: 5 }));

    // Forge props (anvil/furnace etc.) between Borin and the building.
    const forgeProps = ObjectFactory.createForge(new THREE.Vector3(24.5, Y, -132.5), Math.PI / 2);
    prepareStatic(forgeProps.group);
    group.add(forgeProps.group);
    forgeProps.obstacles.forEach((o) => addObstacle(o));

    // Cottages — near Wren [-30,-100], Toma [12,-140] and the NE quarter.
    spawnDoor(buildBlueprint(group, addObstacle, getCottage(), -38, -110, 0, 0xc7cfac, { x: 1, z: 4 }));
    spawnDoor(buildBlueprint(group, addObstacle, getCottage(), 12, -150, 0, 0xb9c59d, { x: 1, z: 4 }));
    spawnDoor(buildBlueprint(group, addObstacle, getCottage(), 32, -102, 0, 0xd4c49a, { x: 1, z: 4 }));

    buildMarketAndProps(group, addObstacle);
    buildHuntPost(group, addObstacle);
    buildNoticeBoard(group, addObstacle);

    // Ambient banners: gate entrance pair + one at the plaza.
    buildBanner(group, -5.4, -80.5, 0x7a3030, Math.PI);
    buildBanner(group, 5.4, -80.5, 0x32556e, Math.PI);
    buildBanner(group, TOWN_CENTER[0] - 10.6, TOWN_CENTER[1] + 1, 0x6e5a2e, Math.PI / 2);

    return { doors };
}

export class TownBuilder {
    static build(
        group: THREE.Group,
        obstacles: THREE.Object3D[],
        addObstacle: (o: THREE.Object3D) => void
    ): TownBuildResult {
        return buildTown(group, obstacles, addObstacle);
    }
}
