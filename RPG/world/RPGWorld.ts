import * as THREE from 'three';
import { Container } from '../../game/environment/objects/Container';
import type { Door } from '../../game/environment/objects/Door';
import { ObjectFactory } from '../../game/environment/ObjectFactory';
import { PlayerUtils } from '../../game/player/PlayerUtils';
import type { RPGContainerDef } from '../types';
import {
    CONTAINERS,
    LAKE,
    ROAD_HALF_WIDTH,
    ROAD_PATH,
    SPAWN_CAMP,
    TOWN_RECT,
    WATER_LEVEL,
    WOLF_DENS,
    WORLD_EXTENT,
    WORLD_POLYGON,
    distToRoad,
    isClearForProps,
    isInTown,
    roadMaskAt,
    terrainHeightAt,
    waterDepthAt,
} from '../data/worldLayout';
import { FlowerPatches, InstancedGrass } from './InstancedGrass';
import { TownBuilder } from './TownBuilder';

// ============================================================================
// Thornwood Vale — the RPG overworld. Terrain geometry, painted ground
// texture, lake, prop scatter, the spawn camp, Briarhollow (via TownBuilder),
// loot containers and item drops. Driven by the engine:
//   build() once, update(dt, playerPos) per frame, dispose() on teardown.
// All physics math comes from data/worldLayout (registered into PlayerUtils).
// ============================================================================

export interface ContainerRuntime {
    def: RPGContainerDef;
    object: Container;
}

interface ItemDrop {
    group: THREE.Group;
    baseY: number;
    phase: number;
}

interface FlameRef {
    mesh: THREE.Mesh;
    baseScale: number;
    baseY: number;
    phase: number;
}

const TERRAIN_SIZE = (WORLD_EXTENT + 30) * 2;
const TERRAIN_SEGMENTS = 200;
const CANVAS_SIZE = 2048;

const TREE_COUNT = 120;
const ROCK_COUNT = 28;
const SHRUB_COUNT = 30;
const GRASS_COUNT = 5500;
const FLOWER_COUNT = 250;
const SPAWN_ATTEMPT_MULTIPLIER = 12;

export class RPGWorld {
    public group: THREE.Group;
    public obstacles: THREE.Object3D[] = [];
    public containers: ContainerRuntime[] = [];

    private scene: THREE.Scene;
    private terrainMesh: THREE.Mesh | null = null;
    private lakeWater: THREE.Mesh | null = null;
    private lakeTexture: THREE.CanvasTexture | null = null;
    private grass: InstancedGrass | null = null;
    private flowers: FlowerPatches | null = null;
    private doors: Door[] = [];
    private fountainWater: THREE.Mesh | null = null;
    private campfireFlames: FlameRef[] = [];
    private campfireLight: THREE.PointLight | null = null;
    private itemDrops: ItemDrop[] = [];
    private time = 0;
    private built = false;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.group.name = 'rpg_world';
        this.scene.add(this.group);
    }

    // ------------------------------------------------------------------ build

    public build(): void {
        if (this.built) return;
        this.built = true;

        // 1. Physics: the world layout IS the ground truth.
        PlayerUtils.setCustomLandPolygon(WORLD_POLYGON);
        PlayerUtils.setCustomTerrainSamplers(
            (x, z) => terrainHeightAt(x, z),
            (x, z) => waterDepthAt(x, z)
        );

        // 2. Visuals.
        this.buildTerrain();
        this.buildLake();
        this.buildScatter();
        this.buildWolfDenDressing();
        this.buildCamp();

        const townResult = TownBuilder.build(this.group, this.obstacles, this.addObstacle);
        this.doors = townResult.doors;
        this.fountainWater = (this.group.getObjectByName('rpg_fountain_water') as THREE.Mesh) ?? null;

        this.buildContainers();
        this.buildGrassAndFlowers();
    }

    public addObstacle = (o: THREE.Object3D): void => {
        if (!o.parent) this.group.add(o);
        this.obstacles.push(o);
    };

    public removeObstacle(o: THREE.Object3D): void {
        const idx = this.obstacles.indexOf(o);
        if (idx >= 0) this.obstacles.splice(idx, 1);
    }

    public getDoors(): Door[] {
        return this.doors;
    }

    public getWaterSurfaceAt(x: number, z: number): number | null {
        const dx = x - LAKE.x;
        const dz = z - LAKE.z;
        if (dx * dx + dz * dz <= LAKE.radius * LAKE.radius) return WATER_LEVEL;
        return null;
    }

    public setContainerVisualState(id: string, opts: { open?: boolean; looted?: boolean }): void {
        for (const runtime of this.containers) {
            if (runtime.def.id !== id) continue;
            if (opts.open !== undefined) runtime.object.setOpen(opts.open);
            if (opts.looted !== undefined) runtime.object.setLooted(opts.looted);
            return;
        }
    }

    // ---------------------------------------------------------------- terrain

    private buildTerrain(): void {
        const geometry = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS);
        geometry.rotateX(-Math.PI / 2);

        const positions = geometry.attributes.position as THREE.BufferAttribute;
        const colors = new Float32Array(positions.count * 3);
        const c = new THREE.Color();

        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);
            const h = terrainHeightAt(x, z);
            positions.setY(i, h);

            // Subtle vertex tint for depth: valleys darker, crests lighter,
            // road warmed up, lake bed darkened. Multiplies with the map.
            const road = roadMaskAt(x, z);
            const lakeD = Math.hypot(x - LAKE.x, z - LAKE.z);
            let lum = 0.9 + THREE.MathUtils.clamp((h + 2) / 16, 0, 1) * 0.18;
            if (lakeD < LAKE.radius + 4) lum *= 0.78 + 0.22 * THREE.MathUtils.clamp((lakeD - LAKE.radius + 4) / 8, 0, 1);
            const r = lum * (1 + road * 0.1);
            const g = lum * (1 + road * 0.04);
            const b = lum * (1 - road * 0.08);
            c.setRGB(Math.min(r, 1.15), Math.min(g, 1.12), Math.max(b, 0));
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();

        const texture = this.paintTerrainTexture();
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            vertexColors: true,
            roughness: 0.92,
            metalness: 0.02,
        });

        this.terrainMesh = new THREE.Mesh(geometry, material);
        this.terrainMesh.receiveShadow = true;
        this.terrainMesh.castShadow = false;
        this.terrainMesh.userData = { type: 'ground', terrainType: 'Grass' };
        this.group.add(this.terrainMesh);
        this.obstacles.push(this.terrainMesh);
    }

    /** 2048px painted ground: grass tones, road strip, dry patches, lake soil, town earth. */
    private paintTerrainTexture(): THREE.CanvasTexture {
        const canvas = document.createElement('canvas');
        canvas.width = CANVAS_SIZE;
        canvas.height = CANVAS_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) return new THREE.CanvasTexture(canvas);

        const half = TERRAIN_SIZE / 2;
        const toCanvasX = (x: number) => ((x + half) / TERRAIN_SIZE) * CANVAS_SIZE;
        const toCanvasY = (z: number) => ((z + half) / TERRAIN_SIZE) * CANVAS_SIZE;
        const metersToPx = CANVAS_SIZE / TERRAIN_SIZE;

        // -- Base grass -------------------------------------------------------
        ctx.fillStyle = '#4f7434';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // Large soft tonal blobs (multi-tone greens).
        const greens = ['#577d38', '#46682e', '#5d8340', '#4a703a', '#63884a'];
        for (let i = 0; i < 240; i++) {
            const x = Math.random() * CANVAS_SIZE;
            const y = Math.random() * CANVAS_SIZE;
            const radius = 40 + Math.random() * 150;
            const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
            const tone = greens[(Math.random() * greens.length) | 0];
            grad.addColorStop(0, tone + '55');
            grad.addColorStop(1, tone + '00');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Dry-grass patches (lighter, warmer).
        for (let i = 0; i < 70; i++) {
            const x = Math.random() * CANVAS_SIZE;
            const y = Math.random() * CANVAS_SIZE;
            const radius = 30 + Math.random() * 90;
            const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
            grad.addColorStop(0, 'rgba(154, 152, 84, 0.30)');
            grad.addColorStop(1, 'rgba(154, 152, 84, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Fine speckle noise.
        for (let i = 0; i < 14000; i++) {
            const v = (Math.random() - 0.5) * 36;
            const g = 110 + v;
            ctx.fillStyle = `rgba(${Math.floor(g * 0.62)}, ${Math.floor(g)}, ${Math.floor(g * 0.42)}, 0.22)`;
            ctx.fillRect(Math.random() * CANVAS_SIZE, Math.random() * CANVAS_SIZE, 1 + Math.random() * 2.4, 1 + Math.random() * 2.4);
        }

        // -- Lake: dark soil basin with a sandy ring ---------------------------
        {
            const lx = toCanvasX(LAKE.x);
            const ly = toCanvasY(LAKE.z);
            const rPx = (LAKE.radius + 6) * metersToPx;
            const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, rPx);
            grad.addColorStop(0, 'rgba(46, 38, 26, 0.95)');
            grad.addColorStop(0.62, 'rgba(64, 52, 33, 0.9)');
            grad.addColorStop(0.8, 'rgba(150, 130, 88, 0.75)'); // sand/mud ring
            grad.addColorStop(1, 'rgba(150, 130, 88, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(lx, ly, rPx, 0, Math.PI * 2);
            ctx.fill();
        }

        // -- The road: stroke the world polyline (feather pass, then core) -----
        const strokeRoad = (widthMeters: number, style: string) => {
            ctx.strokeStyle = style;
            ctx.lineWidth = widthMeters * metersToPx;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.beginPath();
            ROAD_PATH.forEach(([x, z], i) => {
                if (i === 0) ctx.moveTo(toCanvasX(x), toCanvasY(z));
                else ctx.lineTo(toCanvasX(x), toCanvasY(z));
            });
            ctx.stroke();
        };
        strokeRoad((ROAD_HALF_WIDTH + 3.5) * 2, 'rgba(141, 122, 80, 0.45)'); // trampled feather
        strokeRoad(ROAD_HALF_WIDTH * 2, 'rgba(146, 117, 74, 0.95)');         // packed dirt core
        strokeRoad(ROAD_HALF_WIDTH * 0.9, 'rgba(160, 132, 86, 0.5)');        // worn center

        // Road speckle: pebbles & ruts along the path.
        for (let i = 0; i < ROAD_PATH.length - 1; i++) {
            const [ax, az] = ROAD_PATH[i];
            const [bx, bz] = ROAD_PATH[i + 1];
            const segLen = Math.hypot(bx - ax, bz - az);
            const n = Math.floor(segLen * 2.2);
            for (let k = 0; k < n; k++) {
                const t = Math.random();
                const jx = (Math.random() - 0.5) * ROAD_HALF_WIDTH * 1.7;
                const jz = (Math.random() - 0.5) * ROAD_HALF_WIDTH * 1.7;
                const px = toCanvasX(ax + (bx - ax) * t + jx);
                const py = toCanvasY(az + (bz - az) * t + jz);
                const shade = 96 + Math.random() * 56;
                ctx.fillStyle = `rgba(${shade}, ${shade * 0.82}, ${shade * 0.56}, 0.5)`;
                ctx.fillRect(px, py, 1.5 + Math.random() * 2.5, 1.5 + Math.random() * 2.5);
            }
        }

        // -- Town: warm packed earth inside TOWN_RECT ---------------------------
        {
            const x0 = toCanvasX(TOWN_RECT.minX);
            const y0 = toCanvasY(TOWN_RECT.minZ);
            const w = (TOWN_RECT.maxX - TOWN_RECT.minX) * metersToPx;
            const h = (TOWN_RECT.maxZ - TOWN_RECT.minZ) * metersToPx;
            ctx.fillStyle = 'rgba(148, 124, 86, 0.55)';
            ctx.fillRect(x0, y0, w, h);
            // Earthy speckle inside the town so it doesn't read as a flat decal.
            for (let i = 0; i < 1600; i++) {
                const shade = 110 + Math.random() * 60;
                ctx.fillStyle = `rgba(${shade}, ${shade * 0.84}, ${shade * 0.6}, 0.3)`;
                ctx.fillRect(x0 + Math.random() * w, y0 + Math.random() * h, 1 + Math.random() * 3, 1 + Math.random() * 3);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.anisotropy = 8;
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    // ------------------------------------------------------------------- lake

    private buildLake(): void {
        // Scrolling noise texture for a cheap shimmer.
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#3e8aa6';
            ctx.fillRect(0, 0, size, size);
            for (let i = 0; i < 900; i++) {
                const v = 110 + Math.random() * 90;
                ctx.fillStyle = `rgba(${Math.floor(v * 0.55)}, ${Math.floor(v)}, ${Math.floor(v * 1.12)}, 0.18)`;
                const w = 6 + Math.random() * 26;
                ctx.fillRect(Math.random() * size, Math.random() * size, w, 1.5 + Math.random() * 2.5);
            }
        }
        this.lakeTexture = new THREE.CanvasTexture(canvas);
        this.lakeTexture.wrapS = THREE.RepeatWrapping;
        this.lakeTexture.wrapT = THREE.RepeatWrapping;
        this.lakeTexture.repeat.set(3, 3);

        const geometry = new THREE.CircleGeometry(LAKE.radius + 2, 48);
        geometry.rotateX(-Math.PI / 2);
        const material = new THREE.MeshStandardMaterial({
            color: 0x3f93b0,
            map: this.lakeTexture,
            transparent: true,
            opacity: 0.74,
            roughness: 0.16,
            metalness: 0.05,
            emissive: 0x10333e,
            emissiveIntensity: 0.45,
            depthWrite: false,
        });
        this.lakeWater = new THREE.Mesh(geometry, material);
        this.lakeWater.position.set(LAKE.x, WATER_LEVEL, LAKE.z);
        this.lakeWater.receiveShadow = false;
        this.lakeWater.userData = { type: 'soft', isWater: true };
        this.group.add(this.lakeWater);

        // Shore dressing: reeds where the bank sits just above the water,
        // and a few half-sunk rocks.
        for (let i = 0; i < 14; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = LAKE.radius + 0.5 + Math.random() * 2.5;
            const x = LAKE.x + Math.cos(a) * r;
            const z = LAKE.z + Math.sin(a) * r;
            const y = terrainHeightAt(x, z);
            if (y < WATER_LEVEL - 0.1 || y > WATER_LEVEL + 1.4) continue;
            const reeds = ObjectFactory.createReeds(new THREE.Vector3(x, y, z));
            this.prepareStatic(reeds, true, false);
            this.group.add(reeds);
        }
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2 + Math.random() * 0.8;
            const r = LAKE.radius + 1.2 + Math.random() * 2.2;
            const x = LAKE.x + Math.cos(a) * r;
            const z = LAKE.z + Math.sin(a) * r;
            const y = terrainHeightAt(x, z);
            const rock = ObjectFactory.createRockFormation(new THREE.Vector3(x, y - 0.15, z), 0.45 + Math.random() * 0.25);
            if (rock.group && rock.obstacle) {
                this.prepareStatic(rock.group, true, true);
                this.group.add(rock.group);
                this.obstacles.push(rock.obstacle);
            }
        }
    }

    // ---------------------------------------------------------------- scatter

    private randomClearPoint(margin: number = 6): THREE.Vector3 | null {
        const limit = WORLD_EXTENT - margin;
        const x = -limit + Math.random() * limit * 2;
        const z = -limit + Math.random() * limit * 2;
        if (!isClearForProps(x, z)) return null;
        return new THREE.Vector3(x, terrainHeightAt(x, z), z);
    }

    private prepareStatic(object: THREE.Object3D, castShadows: boolean, receiveShadows: boolean = false): void {
        object.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = castShadows;
                child.receiveShadow = receiveShadows;
                child.updateMatrix();
                child.matrixAutoUpdate = false;
            }
        });
    }

    private placeTree(pos: THREE.Vector3, pine: boolean): void {
        const result = pine
            ? ObjectFactory.createPineTree(pos, 0.8 + Math.random() * 0.7)
            : ObjectFactory.createTree(pos);
        if (!result || !result.group || !result.trunk) return;
        this.prepareStatic(result.group, true);
        this.group.add(result.group);
        this.obstacles.push(result.trunk);
    }

    private buildScatter(): void {
        // Trees — denser in the east half (wolf country).
        let spawned = 0;
        const maxAttempts = TREE_COUNT * SPAWN_ATTEMPT_MULTIPLIER;
        for (let attempt = 0; attempt < maxAttempts && spawned < TREE_COUNT; attempt++) {
            const pos = this.randomClearPoint();
            if (!pos) continue;
            // East bias: keep ~45% of west-half candidates.
            if (pos.x < 0 && Math.random() > 0.45) continue;
            this.placeTree(pos, Math.random() < 0.55);
            spawned++;
        }

        // Rock formations.
        spawned = 0;
        for (let attempt = 0; attempt < ROCK_COUNT * SPAWN_ATTEMPT_MULTIPLIER && spawned < ROCK_COUNT; attempt++) {
            const pos = this.randomClearPoint();
            if (!pos) continue;
            const rock = ObjectFactory.createRockFormation(pos, 0.85 + Math.random() * 0.35);
            if (!rock.group || !rock.obstacle) continue;
            this.prepareStatic(rock.group, true, true);
            this.group.add(rock.group);
            this.obstacles.push(rock.obstacle);
            spawned++;
        }

        // Bushes / berry bushes / mushrooms, favoring the roadside.
        spawned = 0;
        for (let attempt = 0; attempt < SHRUB_COUNT * SPAWN_ATTEMPT_MULTIPLIER && spawned < SHRUB_COUNT; attempt++) {
            const pos = this.randomClearPoint();
            if (!pos) continue;
            if (distToRoad(pos.x, pos.z) > 12 && Math.random() > 0.25) continue;
            const roll = Math.random();
            let prop: THREE.Object3D;
            if (roll < 0.42) prop = ObjectFactory.createBush(pos, 0.8 + Math.random() * 0.5);
            else if (roll < 0.74) prop = ObjectFactory.createBerryBush(pos, 0.9 + Math.random() * 0.3);
            else prop = ObjectFactory.createMushroom(pos);
            this.prepareStatic(prop, true, false);
            this.group.add(prop);
            spawned++;
        }
    }

    /** Loose pine rings + bone-white sticks around each wolf den. */
    private buildWolfDenDressing(): void {
        const boneMat = new THREE.MeshStandardMaterial({ color: 0xdfd8c2, roughness: 0.9, metalness: 0.02 });
        const boneGeo = new THREE.CylinderGeometry(0.035, 0.05, 0.9, 6);

        for (const den of WOLF_DENS) {
            const [cx, cz] = den.center;

            // Pine ring.
            const ringCount = 7;
            for (let i = 0; i < ringCount; i++) {
                const a = (i / ringCount) * Math.PI * 2 + Math.random() * 0.6;
                const r = 12 + Math.random() * 6;
                const x = cx + Math.cos(a) * r;
                const z = cz + Math.sin(a) * r;
                if (!isClearForProps(x, z)) continue;
                if (Math.abs(x) > WORLD_EXTENT - 5 || Math.abs(z) > WORLD_EXTENT - 5) continue;
                this.placeTree(new THREE.Vector3(x, terrainHeightAt(x, z), z), true);
            }

            // Bone sticks jutting from the dirt (decorative, non-blocking).
            for (let i = 0; i < 4; i++) {
                const a = Math.random() * Math.PI * 2;
                const r = 1.5 + Math.random() * 4;
                const x = cx + Math.cos(a) * r;
                const z = cz + Math.sin(a) * r;
                const bone = new THREE.Mesh(boneGeo, boneMat);
                bone.position.set(x, terrainHeightAt(x, z) + 0.28, z);
                bone.rotation.set((Math.random() - 0.5) * 0.9, Math.random() * Math.PI, (Math.random() - 0.5) * 0.9);
                bone.castShadow = true;
                bone.userData = { type: 'soft' };
                bone.updateMatrix();
                bone.matrixAutoUpdate = false;
                this.group.add(bone);
            }

            // One menace rock by the den mouth.
            const rock = ObjectFactory.createRockFormation(
                new THREE.Vector3(cx + 2.5, terrainHeightAt(cx + 2.5, cz - 2), cz - 2),
                0.7
            );
            if (rock.group && rock.obstacle) {
                this.prepareStatic(rock.group, true, true);
                this.group.add(rock.group);
                this.obstacles.push(rock.obstacle);
            }
        }
    }

    // ------------------------------------------------------------------- camp

    private buildCamp(): void {
        const [campX, campZ] = SPAWN_CAMP;

        // Campfire (flames + light animated in update()).
        const firePos = new THREE.Vector3(campX, terrainHeightAt(campX, campZ), campZ);
        const campfire = ObjectFactory.createCampfire(firePos);
        this.group.add(campfire);
        this.addObstacle(campfire);
        campfire.traverse((child) => {
            if (child instanceof THREE.Mesh && child.userData.isFlame) {
                this.campfireFlames.push({
                    mesh: child,
                    baseScale: child.userData.baseScale ?? child.scale.x,
                    baseY: child.userData.baseY ?? child.position.y,
                    phase: child.userData.phase ?? 0,
                });
            }
            if (child instanceof THREE.PointLight && child.userData.isFlameLight) {
                this.campfireLight = child;
            }
        });

        // Bedroll: flattened rounded box + pillow, warm blanket color.
        const bedroll = new THREE.Group();
        const bx = campX + 2.4;
        const bz = campZ - 1.6;
        bedroll.position.set(bx, terrainHeightAt(bx, bz), bz);
        bedroll.rotation.y = Math.PI / 5;
        const blanket = new THREE.Mesh(
            new THREE.BoxGeometry(0.85, 0.16, 1.95, 1, 1, 2),
            new THREE.MeshStandardMaterial({ color: 0x9a4f38, roughness: 0.95 })
        );
        blanket.position.y = 0.08;
        blanket.castShadow = true;
        blanket.receiveShadow = true;
        bedroll.add(blanket);
        const pillow = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.14, 0.4),
            new THREE.MeshStandardMaterial({ color: 0xcdbb98, roughness: 0.95 })
        );
        pillow.position.set(0, 0.2, -0.75);
        pillow.rotation.x = -0.12;
        pillow.castShadow = true;
        bedroll.add(pillow);
        bedroll.traverse((c) => { c.userData = { ...c.userData, type: 'soft' }; });
        this.prepareStatic(bedroll, true, true);
        this.group.add(bedroll);

        // Log seat by the fire.
        const lx = campX - 1.9;
        const lz = campZ + 1.2;
        const log = new THREE.Mesh(
            new THREE.CylinderGeometry(0.22, 0.24, 1.7, 9),
            new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 0.92 })
        );
        log.position.set(lx, terrainHeightAt(lx, lz) + 0.22, lz);
        log.rotation.z = Math.PI / 2;
        log.rotation.y = Math.PI / 3;
        log.castShadow = true;
        log.receiveShadow = true;
        log.userData = { type: 'hard', material: 'wood' };
        log.updateMatrix();
        log.matrixAutoUpdate = false;
        this.group.add(log);
        this.obstacles.push(log);

        // Small A-frame tent.
        const tent = new THREE.Group();
        const tx = campX - 2.6;
        const tz = campZ - 2.4;
        tent.position.set(tx, terrainHeightAt(tx, tz), tz);
        tent.rotation.y = Math.PI / 2.6;
        const clothMat = new THREE.MeshStandardMaterial({ color: 0x9a8460, roughness: 0.95, side: THREE.DoubleSide });
        const panelGeo = new THREE.PlaneGeometry(2.2, 1.7);
        for (const side of [-1, 1]) {
            const panel = new THREE.Mesh(panelGeo, clothMat);
            panel.position.set(0, 0.72, side * 0.62);
            panel.rotation.x = side * (Math.PI / 2 - 0.72);
            panel.castShadow = true;
            panel.userData = { type: 'hard', material: 'fabric' };
            tent.add(panel);
            this.obstacles.push(panel);
        }
        const back = new THREE.Mesh(
            new THREE.CircleGeometry(0.95, 3),
            new THREE.MeshStandardMaterial({ color: 0x84714f, roughness: 0.95, side: THREE.DoubleSide })
        );
        back.position.set(-1.1, 0.62, 0);
        back.rotation.y = Math.PI / 2;
        back.rotation.z = Math.PI / 2;
        back.userData = { type: 'soft' };
        tent.add(back);
        const ridge = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6),
            new THREE.MeshStandardMaterial({ color: 0x5b4330, roughness: 0.9 })
        );
        ridge.rotation.z = Math.PI / 2;
        ridge.position.y = 1.42;
        ridge.userData = { type: 'soft' };
        tent.add(ridge);
        this.prepareStatic(tent, true, true);
        this.group.add(tent);
    }

    // ------------------------------------------------------------- containers

    private buildContainers(): void {
        for (const def of CONTAINERS) {
            const [x, z] = def.position;
            const y = terrainHeightAt(x, z); // town defs land on the plateau automatically
            const object = new Container(new THREE.Vector3(x, y, z), def.rotationY ?? 0, {
                kind: def.kind,
                id: def.id,
                label: def.label,
            });
            this.group.add(object.mesh);
            this.addObstacle(object.mesh);
            this.containers.push({ def, object });
        }
    }

    // ---------------------------------------------------------- grass/flowers

    private buildGrassAndFlowers(): void {
        // Same keep-outs as isClearForProps but relaxed near the road edge so
        // grass feathers up to the dirt instead of leaving a sterile band.
        const grassAllow = (x: number, z: number): boolean => {
            if (isInTown(x, z)) return false;
            const dx = Math.max(TOWN_RECT.minX - x, 0, x - TOWN_RECT.maxX);
            const dz = Math.max(TOWN_RECT.minZ - z, 0, z - TOWN_RECT.maxZ);
            if (Math.hypot(dx, dz) < 6) return false;
            if (distToRoad(x, z) < ROAD_HALF_WIDTH + 0.6) return false;
            if (Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.radius + 1.5) return false;
            if (Math.hypot(x - SPAWN_CAMP[0], z - SPAWN_CAMP[1]) < 4) return false;
            return true;
        };

        this.grass = new InstancedGrass(this.group, {
            count: GRASS_COUNT,
            areaExtent: WORLD_EXTENT - 4,
            allowAt: grassAllow,
            heightAt: terrainHeightAt,
        });

        this.flowers = new FlowerPatches(this.group, {
            count: FLOWER_COUNT,
            areaExtent: WORLD_EXTENT - 4,
            allowAt: isClearForProps,
            heightAt: terrainHeightAt,
        });
    }

    // ------------------------------------------------------------- item drops

    public spawnItemDrop(itemName: string, count: number, position: THREE.Vector3): void {
        const dropCount = Math.max(1, Math.floor(count));
        const group = new THREE.Group();
        const baseY = terrainHeightAt(position.x, position.z) + 0.08;
        group.position.set(position.x, baseY, position.z);
        group.rotation.y = Math.random() * Math.PI * 2;

        const color = itemName === 'Porkchop'
            ? 0xb83a3a
            : itemName === 'Leather' || itemName === 'Wolf Pelt'
                ? 0x8a5a2b
                : itemName === 'Bone Fragments'
                    ? 0xd8d0bd
                    : itemName === 'Raw Meat'
                        ? 0xa83c3c
                        : 0xf5f5f5;
        const material = new THREE.MeshStandardMaterial({ color, roughness: 0.82 });
        const geometry = itemName === 'Bone Fragments'
            ? new THREE.BoxGeometry(0.16, 0.08, 0.36)
            : new THREE.BoxGeometry(0.34, 0.12, 0.28);

        const visiblePieces = Math.min(3, dropCount);
        for (let i = 0; i < visiblePieces; i++) {
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set((Math.random() - 0.5) * 0.28, 0.08 + i * 0.025, (Math.random() - 0.5) * 0.28);
            mesh.rotation.set(Math.random() * 0.35, Math.random() * Math.PI, Math.random() * 0.35);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            group.add(mesh);
        }

        group.userData = {
            type: 'pickup',
            pickupItem: itemName,
            pickupCount: dropCount,
            interactionLabel: `Press F to Pick Up ${itemName}`,
        };
        // PlayerInteraction calls userData.onPickup() after a successful pickup;
        // we use it to fully despawn the drop (same contract as SingleBiome).
        group.userData.onPickup = () => {
            this.group.remove(group);
            this.obstacles = this.obstacles.filter((o) => o.uuid !== group.uuid);
            this.itemDrops = this.itemDrops.filter((d) => d.group.uuid !== group.uuid);
            group.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose();
                    if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
                    else child.material.dispose();
                }
            });
        };

        this.group.add(group);
        this.obstacles.push(group);
        this.itemDrops.push({ group, baseY, phase: Math.random() * Math.PI * 2 });
    }

    // ----------------------------------------------------------------- update

    public update(dt: number, playerPos: THREE.Vector3): void {
        void playerPos; // distance-based culling hooks could use this later
        this.time += dt;

        this.grass?.update(dt);
        this.flowers?.update(dt);

        // Lake shimmer: slowly scroll the noise map.
        if (this.lakeTexture) {
            this.lakeTexture.offset.x += dt * 0.006;
            this.lakeTexture.offset.y += dt * 0.0035;
        }

        // Fountain water spin + pulse.
        if (this.fountainWater) {
            this.fountainWater.rotation.y += dt * 0.35;
            const mat = this.fountainWater.material as THREE.MeshStandardMaterial;
            if (mat.emissive) mat.emissiveIntensity = 0.4 + Math.sin(this.time * 1.8) * 0.12;
        }

        // Campfire flicker.
        for (let i = 0; i < this.campfireFlames.length; i++) {
            const f = this.campfireFlames[i];
            const flicker = 1 + Math.sin(this.time * 9 + f.phase) * 0.13 + Math.sin(this.time * 23 + f.phase * 2) * 0.06;
            f.mesh.scale.set(f.baseScale * flicker, f.baseScale * 1.8 * (2 - flicker), f.baseScale * flicker);
            f.mesh.position.y = f.baseY + Math.sin(this.time * 7 + f.phase) * 0.03;
            f.mesh.rotation.y += dt * 1.4;
        }
        if (this.campfireLight) {
            this.campfireLight.intensity = 1.35 + Math.sin(this.time * 11) * 0.3 + Math.sin(this.time * 27) * 0.12;
        }

        // Containers (lid animation + glow pulse).
        for (let i = 0; i < this.containers.length; i++) {
            this.containers[i].object.update(dt);
        }

        // Item drop bob & spin.
        for (let i = 0; i < this.itemDrops.length; i++) {
            const drop = this.itemDrops[i];
            drop.group.position.y = drop.baseY + 0.04 + Math.sin(this.time * 2.2 + drop.phase) * 0.04;
            drop.group.rotation.y += dt * 0.8;
        }
    }

    // ---------------------------------------------------------------- dispose

    public dispose(): void {
        this.grass?.dispose();
        this.grass = null;
        this.flowers?.dispose();
        this.flowers = null;

        for (const runtime of this.containers) {
            runtime.object.dispose();
        }
        this.containers = [];

        this.scene.remove(this.group);
        this.group.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                for (const m of materials) {
                    if (!m) continue;
                    const std = m as THREE.MeshStandardMaterial;
                    if (std.map) std.map.dispose();
                    m.dispose();
                }
            }
        });
        this.group.clear();

        this.terrainMesh = null;
        this.lakeWater = null;
        this.lakeTexture = null;
        this.fountainWater = null;
        this.campfireFlames = [];
        this.campfireLight = null;
        this.itemDrops = [];
        this.doors = [];
        this.obstacles = [];
        this.built = false;

        PlayerUtils.setCustomLandPolygon(null);
        PlayerUtils.setCustomTerrainSamplers(null);
    }
}
