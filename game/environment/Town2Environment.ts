import * as THREE from 'three';
import { BuildingParts } from '../builder/BuildingParts';
import type { Blueprint } from '../building/BlueprintTypes';
import { getCottage } from '../building/Cottage';
import { getGatehouse } from '../building/Gatehouse';
import { getLShape } from '../building/LShape';
import { getLonghouse } from '../building/Longhouse';
import { getRoundhouse } from '../building/Roundhouse';
import { getTheForge } from '../building/TheForge';
import { PlayerConfig } from '../../types';
import { LightingManager } from './LightingManager';
import { ObjectFactory } from './ObjectFactory';
import { WorldGridManager } from './WorldGridManager';

export class Town2Environment {
    public group: THREE.Group;
    public obstacles: THREE.Object3D[] = [];

    private scene: THREE.Scene;
    private ground: THREE.Mesh | null = null;
    private lightingManager: LightingManager;
    private worldGrid: WorldGridManager;

    private readonly GRID_SIZE = 1.3333;
    private readonly MIN_X = -200;
    private readonly MIN_Z = -100;
    private readonly WIDTH = 400;
    private readonly DEPTH = 200;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.group.visible = true;
        this.scene.add(this.group);

        this.lightingManager = new LightingManager(this.scene);
        this.lightingManager.setShadowCoverage(220);
        this.worldGrid = new WorldGridManager(this.group, {
            bounds: {
                minX: -this.WIDTH / 2,
                maxX: this.WIDTH / 2,
                minZ: -this.DEPTH / 2,
                maxZ: this.DEPTH / 2
            }
        });

        this.buildGround();
        this.buildStreets();
        this.buildStructures();
    }

    private buildGround() {
        const geometry = new THREE.PlaneGeometry(this.WIDTH, this.DEPTH, 1, 1);
        const material = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.9,
            metalness: 0.05
        });
        const plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = -Math.PI / 2;
        plane.receiveShadow = true;
        plane.userData = { type: 'ground' };

        this.group.add(plane);
        this.obstacles.push(plane);
        this.ground = plane;
    }

    private cellStartToWorldX(cellX: number) {
        return this.MIN_X + cellX * this.GRID_SIZE;
    }

    private cellStartToWorldZ(cellZ: number) {
        return this.MIN_Z + cellZ * this.GRID_SIZE;
    }

    private cellCenterToWorldX(cellX: number, widthCells: number) {
        return this.cellStartToWorldX(cellX) + (widthCells * this.GRID_SIZE) * 0.5;
    }

    private cellCenterToWorldZ(cellZ: number, depthCells: number) {
        return this.cellStartToWorldZ(cellZ) + (depthCells * this.GRID_SIZE) * 0.5;
    }

    addObstacle(obj: THREE.Object3D) {
        if (!obj.parent) {
            this.group.add(obj);
        }
        this.obstacles.push(obj);
    }

    private buildStreets() {
        this.buildPathPatch(198, 74, 6, 62, 0x404348, 0.02); // Main street to gate
        this.buildPathPatch(198, 88, 16, 24, 0x575247, 0.025); // Market square
        this.buildPathPatch(181, 101, 17, 3, 0x45413a, 0.021); // West branch to forge/shop
        this.buildPathPatch(206, 101, 9, 3, 0x45413a, 0.021); // East market edge
        this.buildPathPatch(214, 98, 24, 4, 0x3e4146, 0.021, -0.18); // Training grounds lane
        this.buildPathPatch(185, 86, 18, 3, 0x45413a, 0.021, 0.14); // Chapel lane
        this.buildPathPatch(204, 86, 18, 3, 0x45413a, 0.021, -0.12); // Barracks lane
        this.buildTrainingGround(224, 84, 40, 28);
    }

    private buildStructures() {
        this.buildGridHouse(190, 96, 8, 8); // Inn
        this.buildBlueprintStructure(getCottage(), 180, 105, Math.PI / 2, 0xc7cfac); // Shop
        this.buildBlueprintStructure(getTheForge(), 170, 94, Math.PI / 2, 0xb87156); // Forge
        this.buildBlueprintStructure(getRoundhouse(), 182, 83, 0.15, 0xd4d0c6); // Chapel
        this.buildBlueprintStructure(getLonghouse(), 209, 84, -0.08, 0x7f91a8); // Barracks
        this.buildBlueprintStructure(getLShape(), 210, 101, Math.PI / 2, 0xa67c52); // Market hall
        this.buildBlueprintStructure(getCottage(), 220, 110, Math.PI, 0xb9c59d); // House
        this.buildBlueprintStructure(getGatehouse(), 198, 134, 0, 0xcfb86c); // South gate

        this.placeTownWall(176, 133, 4, 0);
        this.placeTownWall(180, 133, 4, 0);
        this.placeTownWall(184, 133, 4, 0);
        this.placeTownWall(188, 133, 4, 0);
        this.placeTownWall(210, 133, 4, 0);
        this.placeTownWall(214, 133, 4, 0);
        this.placeTownWall(218, 133, 4, 0);
        this.placeTownWall(222, 133, 4, 0);
        this.placeTownWall(174, 84, 1, Math.PI / 2);
        this.placeTownWall(174, 88, 1, Math.PI / 2);
        this.placeTownWall(174, 92, 1, Math.PI / 2);
        this.placeTownWall(174, 96, 1, Math.PI / 2);
        this.placeTownWall(174, 100, 1, Math.PI / 2);
        this.placeTownWall(174, 104, 1, Math.PI / 2);
        this.placeTownWall(174, 108, 1, Math.PI / 2);
        this.placeTownWall(174, 112, 1, Math.PI / 2);
        this.placeTownWall(174, 116, 1, Math.PI / 2);
        this.placeTownWall(174, 120, 1, Math.PI / 2);
        this.placeTownWall(174, 124, 1, Math.PI / 2);
        this.placeTownWall(176, 80, 4, 0);
        this.placeTownWall(180, 80, 4, 0);
        this.placeTownWall(184, 80, 4, 0);
        this.placeTownWall(188, 80, 4, 0);
        this.placeTownWall(192, 80, 4, 0);
        this.placeTownWall(196, 80, 4, 0);
        this.placeTownWall(200, 80, 4, 0);
        this.placeTownWall(204, 80, 4, 0);
        this.placeTownWall(208, 80, 4, 0);
        this.placeTownWall(212, 80, 4, 0);
        this.placeTownWall(216, 80, 4, 0);
        this.placeTownWall(220, 80, 4, 0);

        const { group: barrelA, obstacle: barrelObstacleA } = ObjectFactory.createBarrel(new THREE.Vector3(this.cellCenterToWorldX(201, 1), 0, this.cellCenterToWorldZ(99, 1)));
        this.group.add(barrelA);
        this.addObstacle(barrelObstacleA);

        const { group: barrelB, obstacle: barrelObstacleB } = ObjectFactory.createBarrel(new THREE.Vector3(this.cellCenterToWorldX(204, 1), 0, this.cellCenterToWorldZ(100, 1)));
        this.group.add(barrelB);
        this.addObstacle(barrelObstacleB);

        const { group: crateA, obstacle: crateObstacleA } = ObjectFactory.createCrate(new THREE.Vector3(this.cellCenterToWorldX(207, 1), 0, this.cellCenterToWorldZ(103, 1)));
        this.group.add(crateA);
        this.addObstacle(crateObstacleA);

        const { group: lightpoleA, obstacle: lightpoleObstacleA } = ObjectFactory.createLightpole(new THREE.Vector3(this.cellCenterToWorldX(196, 1), 0, this.cellCenterToWorldZ(96, 1)));
        this.group.add(lightpoleA);
        this.addObstacle(lightpoleObstacleA);

        const { group: lightpoleB, obstacle: lightpoleObstacleB } = ObjectFactory.createLightpole(new THREE.Vector3(this.cellCenterToWorldX(211, 1), 0, this.cellCenterToWorldZ(96, 1)));
        this.group.add(lightpoleB);
        this.addObstacle(lightpoleObstacleB);

        this.buildLandmarks();
        this.buildDecorativeProps();
        this.buildGreenery();
        this.buildHistoricQuarter();
    }

    private getCellPosition(cellX: number, cellZ: number, y: number = 0, widthCells: number = 1, depthCells: number = 1) {
        return new THREE.Vector3(
            this.cellCenterToWorldX(cellX, widthCells),
            y,
            this.cellCenterToWorldZ(cellZ, depthCells)
        );
    }

    private addFactoryGroup(result: any, obstacle: THREE.Object3D | null = null) {
        if (!result) return;
        const group = result.group ?? result;
        if (group) {
            this.group.add(group);
        }
        const resolvedObstacle = obstacle
            ?? result.obstacle
            ?? result.trunk
            ?? ((group?.userData?.type === 'hard') ? group : null);
        if (resolvedObstacle) {
            this.addObstacle(resolvedObstacle);
        }
    }

    private buildLandmarks() {
        this.buildFountain(this.getCellPosition(202, 98, 0, 6, 6));
        this.buildWindmill(this.getCellPosition(158, 88, 0));
        this.buildWatchtower(this.getCellPosition(255, 104, 0));
        this.buildAncientTree(this.getCellPosition(186, 79, 0));
    }

    private buildFountain(position: THREE.Vector3) {
        const group = new THREE.Group();
        group.position.copy(position);

        const basin = new THREE.Mesh(
            new THREE.CylinderGeometry(3.4, 3.8, 0.8, 24),
            new THREE.MeshStandardMaterial({ color: 0x8a8d93, roughness: 0.92, metalness: 0.04 })
        );
        basin.position.y = 0.4;
        basin.castShadow = true;
        basin.receiveShadow = true;
        group.add(basin);

        const water = new THREE.Mesh(
            new THREE.CylinderGeometry(2.7, 2.9, 0.16, 24),
            new THREE.MeshStandardMaterial({ color: 0x5ba4c7, roughness: 0.2, metalness: 0.1 })
        );
        water.position.y = 0.72;
        water.receiveShadow = true;
        group.add(water);

        const pedestal = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 1.1, 2.6, 12),
            new THREE.MeshStandardMaterial({ color: 0xa49a86, roughness: 0.88, metalness: 0.03 })
        );
        pedestal.position.y = 1.75;
        pedestal.castShadow = true;
        group.add(pedestal);

        const spire = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.9, 0),
            new THREE.MeshStandardMaterial({ color: 0xc6b27c, roughness: 0.72, metalness: 0.18 })
        );
        spire.position.y = 3.45;
        spire.castShadow = true;
        group.add(spire);

        const jet = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.09, 1.8, 10),
            new THREE.MeshStandardMaterial({ color: 0x9fd4ef, roughness: 0.1, metalness: 0 })
        );
        jet.position.y = 2.35;
        group.add(jet);

        const glow = new THREE.PointLight(0x7ec8ff, 1.2, 10);
        glow.position.y = 2.6;
        group.add(glow);

        this.group.add(group);
        this.addObstacle(basin);
        this.addObstacle(pedestal);
    }

    private buildWindmill(position: THREE.Vector3) {
        const group = new THREE.Group();
        group.position.copy(position);

        const tower = new THREE.Mesh(
            new THREE.CylinderGeometry(1.7, 2.4, 8.5, 8),
            new THREE.MeshStandardMaterial({ color: 0xd8ceb8, roughness: 0.92, metalness: 0.02 })
        );
        tower.position.y = 4.25;
        tower.castShadow = true;
        group.add(tower);

        const cap = new THREE.Mesh(
            new THREE.ConeGeometry(2.2, 2.4, 8),
            new THREE.MeshStandardMaterial({ color: 0x5e3421, roughness: 0.86, metalness: 0.02 })
        );
        cap.position.y = 9.6;
        cap.castShadow = true;
        group.add(cap);

        const hub = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.25, 0.8, 8),
            new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.8, metalness: 0.04 })
        );
        hub.rotation.z = Math.PI / 2;
        hub.position.set(0, 8.4, 1.85);
        group.add(hub);

        for (let i = 0; i < 4; i += 1) {
            const blade = new THREE.Group();
            blade.rotation.z = i * (Math.PI / 2);
            const arm = new THREE.Mesh(
                new THREE.BoxGeometry(0.16, 4.6, 0.12),
                new THREE.MeshStandardMaterial({ color: 0x7d5a3c, roughness: 0.82, metalness: 0.02 })
            );
            arm.position.y = 2.2;
            arm.castShadow = true;
            blade.add(arm);

            const sail = new THREE.Mesh(
                new THREE.PlaneGeometry(1.5, 2.3),
                new THREE.MeshStandardMaterial({ color: 0xd9d1b7, roughness: 1.0, side: THREE.DoubleSide })
            );
            sail.position.set(0.55, 2.3, 0.05);
            blade.add(sail);

            blade.position.copy(hub.position);
            group.add(blade);
        }

        this.group.add(group);
        this.addObstacle(tower);
    }

    private buildWatchtower(position: THREE.Vector3) {
        const group = new THREE.Group();
        group.position.copy(position);

        const woodMat = new THREE.MeshStandardMaterial({ color: 0x6f4f37, roughness: 0.85, metalness: 0.03 });
        const postGeo = new THREE.BoxGeometry(0.35, 7.5, 0.35);
        const postOffsets = [
            [-1.5, -1.5],
            [1.5, -1.5],
            [-1.5, 1.5],
            [1.5, 1.5]
        ];

        postOffsets.forEach(([x, z]) => {
            const post = new THREE.Mesh(postGeo, woodMat);
            post.position.set(x, 3.75, z);
            post.castShadow = true;
            group.add(post);
            this.addObstacle(post);
        });

        const deck = new THREE.Mesh(
            new THREE.BoxGeometry(4.2, 0.4, 4.2),
            new THREE.MeshStandardMaterial({ color: 0x8b6b4c, roughness: 0.88, metalness: 0.02 })
        );
        deck.position.y = 7.1;
        deck.castShadow = true;
        group.add(deck);
        this.addObstacle(deck);

        const roof = new THREE.Mesh(
            new THREE.ConeGeometry(3.3, 2.4, 4),
            new THREE.MeshStandardMaterial({ color: 0x4c2b1c, roughness: 0.87, metalness: 0.02 })
        );
        roof.position.y = 8.8;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        group.add(roof);

        this.group.add(group);
    }

    private buildAncientTree(position: THREE.Vector3) {
        const tree = ObjectFactory.createTree(position);
        tree.group.scale.setScalar(1.45);
        this.group.add(tree.group);
        this.addObstacle(tree.trunk);

        for (let i = 0; i < 6; i += 1) {
            const bush = ObjectFactory.createBush(
                new THREE.Vector3(
                    position.x + Math.cos((i / 6) * Math.PI * 2) * 3.6,
                    0,
                    position.z + Math.sin((i / 6) * Math.PI * 2) * 3.2
                ),
                0.9 + (i % 2) * 0.2
            );
            this.group.add(bush);
        }
    }

    private buildDecorativeProps() {
        this.addFactoryGroup(ObjectFactory.createCampfire(this.getCellPosition(231, 91, 0)));
        this.addFactoryGroup(ObjectFactory.createRoadSign(this.getCellPosition(200, 133, 0), 'stop'));
        this.addFactoryGroup(ObjectFactory.createRoadSign(this.getCellPosition(220, 99, 0), 'yield'));

        this.addFactoryGroup(ObjectFactory.createFence(this.getCellPosition(241, 116, 0), 0));
        this.addFactoryGroup(ObjectFactory.createFence(this.getCellPosition(243, 116, 0), 0));
        this.addFactoryGroup(ObjectFactory.createFence(this.getCellPosition(245, 116, 0), 0));
        this.addFactoryGroup(ObjectFactory.createFence(this.getCellPosition(247, 116, 0), 0));
        this.addFactoryGroup(ObjectFactory.createFence(this.getCellPosition(249, 116, 0), 0));
        this.addFactoryGroup(ObjectFactory.createFence(this.getCellPosition(251, 116, 0), 0));

        this.addFactoryGroup(ObjectFactory.createBarrel(this.getCellPosition(176, 97, 0)));
        this.addFactoryGroup(ObjectFactory.createBarrel(this.getCellPosition(178, 98, 0)));
        this.addFactoryGroup(ObjectFactory.createCrate(this.getCellPosition(181, 107, 0)));
        this.addFactoryGroup(ObjectFactory.createCrate(this.getCellPosition(183, 106, 0)));
        this.addFactoryGroup(ObjectFactory.createLightpole(this.getCellPosition(204, 112, 0)));
        this.addFactoryGroup(ObjectFactory.createLightpole(this.getCellPosition(197, 90, 0)));
        this.addFactoryGroup(ObjectFactory.createLightpole(this.getCellPosition(188, 103, 0)));
    }

    private buildGreenery() {
        this.addFactoryGroup(ObjectFactory.createPineTree(this.getCellPosition(166, 121, 0), 1.3));
        this.addFactoryGroup(ObjectFactory.createPineTree(this.getCellPosition(170, 125, 0), 1.1));
        this.addFactoryGroup(ObjectFactory.createPineTree(this.getCellPosition(235, 126, 0), 1.4));
        this.addFactoryGroup(ObjectFactory.createAutumnTree(this.getCellPosition(180, 82, 0)));
        this.addFactoryGroup(ObjectFactory.createAutumnTree(this.getCellPosition(214, 113, 0)));
        this.addFactoryGroup(ObjectFactory.createTree(this.getCellPosition(224, 76, 0)));

        [
            [176, 85], [179, 87], [188, 111], [212, 111], [226, 84], [232, 86], [238, 109], [171, 116]
        ].forEach(([x, z], idx) => {
            this.group.add(ObjectFactory.createBush(this.getCellPosition(x, z, 0), 0.8 + (idx % 3) * 0.15));
        });
    }

    private buildHistoricQuarter() {
        const basePos = this.getCellPosition(157, 78, 0);
        const deadTree = ObjectFactory.createDeadTree(new THREE.Vector3(basePos.x + 2.4, 0, basePos.z - 1.6));
        this.group.add(deadTree.group);
        this.addObstacle(deadTree.obstacle);

        for (let i = 0; i < 4; i += 1) {
            const stone = new THREE.Mesh(
                new THREE.BoxGeometry(0.45, 1.0 + i * 0.18, 0.16),
                new THREE.MeshStandardMaterial({ color: 0x919297, roughness: 0.94, metalness: 0.02 })
            );
            stone.position.set(basePos.x + i * 0.95, 0.5, basePos.z + (i % 2) * 0.4);
            stone.rotation.z = (i % 2 === 0 ? -1 : 1) * 0.08;
            stone.castShadow = true;
            this.group.add(stone);
            this.addObstacle(stone);
        }

        for (let i = 0; i < 3; i += 1) {
            const column = new THREE.Mesh(
                new THREE.CylinderGeometry(0.22, 0.28, 1.6 - i * 0.35, 8),
                new THREE.MeshStandardMaterial({ color: 0x7c7f86, roughness: 0.95, metalness: 0.02 })
            );
            column.position.set(basePos.x + 6 + i * 0.9, 0.8 - i * 0.15, basePos.z + 1.5 - i * 0.3);
            column.rotation.z = 0.12 - i * 0.05;
            column.castShadow = true;
            this.group.add(column);
            this.addObstacle(column);
        }

        this.addFactoryGroup(ObjectFactory.createFence(new THREE.Vector3(basePos.x - 1.2, 0, basePos.z + 2.2), Math.PI / 2));
        this.addFactoryGroup(ObjectFactory.createFence(new THREE.Vector3(basePos.x - 1.2, 0, basePos.z + 4.3), Math.PI / 2));
        this.addFactoryGroup(ObjectFactory.createFence(new THREE.Vector3(basePos.x + 0.8, 0, basePos.z + 5.3), 0));
        this.addFactoryGroup(ObjectFactory.createFence(new THREE.Vector3(basePos.x + 2.8, 0, basePos.z + 5.3), 0));
    }

    private buildPathPatch(startCellX: number, startCellZ: number, widthCells: number, depthCells: number, color: number, y: number, rotationY: number = 0) {
        const path = new THREE.Mesh(
            new THREE.PlaneGeometry(widthCells * this.GRID_SIZE, depthCells * this.GRID_SIZE),
            new THREE.MeshStandardMaterial({
                color,
                roughness: 0.96,
                metalness: 0.02
            })
        );
        path.rotation.x = -Math.PI / 2;
        path.rotation.y = rotationY;
        path.position.set(this.cellCenterToWorldX(startCellX, widthCells), y, this.cellCenterToWorldZ(startCellZ, depthCells));
        path.receiveShadow = true;
        path.userData = { type: 'ground' };
        this.group.add(path);
    }

    private buildTrainingGround(startCellX: number, startCellZ: number, widthCells: number, depthCells: number) {
        const yard = new THREE.Mesh(
            new THREE.PlaneGeometry(widthCells * this.GRID_SIZE, depthCells * this.GRID_SIZE),
            new THREE.MeshStandardMaterial({
                color: 0x72644b,
                roughness: 1.0,
                metalness: 0.01
            })
        );
        yard.rotation.x = -Math.PI / 2;
        yard.position.set(this.cellCenterToWorldX(startCellX, widthCells), 0.018, this.cellCenterToWorldZ(startCellZ, depthCells));
        yard.receiveShadow = true;
        yard.userData = { type: 'ground' };
        this.group.add(yard);

        this.placeTownWall(startCellX, startCellZ, 1, Math.PI / 2);
        this.placeTownWall(startCellX, startCellZ + 4, 1, Math.PI / 2);
        this.placeTownWall(startCellX, startCellZ + 8, 1, Math.PI / 2);
        this.placeTownWall(startCellX, startCellZ + 12, 1, Math.PI / 2);
        this.placeTownWall(startCellX, startCellZ + 16, 1, Math.PI / 2);
        this.placeTownWall(startCellX, startCellZ + 20, 1, Math.PI / 2);
        this.placeTownWall(startCellX, startCellZ + 24, 1, Math.PI / 2);
        this.placeTownWall(startCellX + widthCells - 1, startCellZ, 1, Math.PI / 2);
        this.placeTownWall(startCellX + widthCells - 1, startCellZ + 4, 1, Math.PI / 2);
        this.placeTownWall(startCellX + widthCells - 1, startCellZ + 8, 1, Math.PI / 2);
        this.placeTownWall(startCellX + widthCells - 1, startCellZ + 12, 1, Math.PI / 2);
        this.placeTownWall(startCellX + widthCells - 1, startCellZ + 16, 1, Math.PI / 2);
        this.placeTownWall(startCellX + widthCells - 1, startCellZ + 20, 1, Math.PI / 2);
        this.placeTownWall(startCellX + widthCells - 1, startCellZ + 24, 1, Math.PI / 2);
        this.placeTownWall(startCellX + 4, startCellZ, 4, 0);
        this.placeTownWall(startCellX + 8, startCellZ, 4, 0);
        this.placeTownWall(startCellX + 12, startCellZ, 4, 0);
        this.placeTownWall(startCellX + 16, startCellZ, 4, 0);
        this.placeTownWall(startCellX + 20, startCellZ, 4, 0);
        this.placeTownWall(startCellX + 24, startCellZ, 4, 0);
        this.placeTownWall(startCellX + 4, startCellZ + depthCells - 1, 4, 0);
        this.placeTownWall(startCellX + 8, startCellZ + depthCells - 1, 4, 0);
        this.placeTownWall(startCellX + 12, startCellZ + depthCells - 1, 4, 0);
        this.placeTownWall(startCellX + 16, startCellZ + depthCells - 1, 4, 0);
        this.placeTownWall(startCellX + 20, startCellZ + depthCells - 1, 4, 0);
        this.placeTownWall(startCellX + 24, startCellZ + depthCells - 1, 4, 0);
    }

    private buildBlueprintStructure(blueprint: Blueprint, startCellX: number, startCellZ: number, blueprintRotation: number = 0, color?: number) {
        const originX = this.cellStartToWorldX(startCellX);
        const originZ = this.cellStartToWorldZ(startCellZ);

        blueprint.forEach((part) => {
            let localX = part.x;
            let localZ = part.z;

            if (part.type === 'foundation' || part.type === 'roof' || part.type === 'round_foundation' || part.type === 'round_wall') {
                localX += 0.5;
                localZ += 0.5;
            } else if (part.type !== 'pillar') {
                if (part.rotation === Math.PI / 2) localZ += 0.5;
                else localX += 0.5;
            }

            const rx = localX * Math.cos(blueprintRotation) - localZ * Math.sin(blueprintRotation);
            const rz = localX * Math.sin(blueprintRotation) + localZ * Math.cos(blueprintRotation);
            const finalX = originX + (rx * this.GRID_SIZE);
            const finalZ = originZ + (rz * this.GRID_SIZE);
            const finalRot = (part.rotation || 0) + blueprintRotation;

            const FOUNDATION_HEIGHT = 0.4;
            let y = 0;
            if (part.type === 'foundation' || part.type === 'round_foundation') y = 0.2;
            else if (part.type === 'wall' || part.type === 'pillar' || part.type === 'round_wall') y = FOUNDATION_HEIGHT + 1.65;
            else if (part.type === 'doorway') y = FOUNDATION_HEIGHT + 1.65;
            else if (part.type === 'door') y = FOUNDATION_HEIGHT + 1.175;
            else if (part.type === 'roof') y = FOUNDATION_HEIGHT + 3.3;

            this.placeStructurePart(part.type, finalX, y, finalZ, finalRot, color);
        });
    }

    private placeStructurePart(type: any, x: number, y: number, z: number, rotation: number, color?: number) {
        const mesh = BuildingParts.createStructureMesh(type, false, color);
        mesh.position.set(x, y, z);
        mesh.rotation.y = rotation;

        const registerObstacle = (obj: THREE.Object3D) => {
            obj.userData = { ...obj.userData, type: 'hard', material: 'wood', structureType: type };
            this.addObstacle(obj);
        };

        if (mesh instanceof THREE.Group) {
            mesh.traverse((child) => {
                if (child instanceof THREE.Mesh && child.userData.type === 'hard') {
                    registerObstacle(child);
                }
            });
        } else {
            registerObstacle(mesh);
        }

        this.group.add(mesh);
    }

    private placeTownWall(startCellX: number, startCellZ: number, _spanCells: number, rotationY: number) {
        const wallLengthCells = 4;
        const widthCells = rotationY === 0 ? wallLengthCells : 1;
        const depthCells = rotationY === 0 ? 1 : wallLengthCells;
        const position = new THREE.Vector3(
            this.cellCenterToWorldX(startCellX, widthCells),
            0,
            this.cellCenterToWorldZ(startCellZ, depthCells)
        );
        const wall = ObjectFactory.createWall(position, rotationY);
        this.group.add(wall.group);
        this.addObstacle(wall.obstacle);
    }

    private buildGridHouse(startCellX: number, startCellZ: number, widthCells: number, depthCells: number) {
        const house = new THREE.Group();
        const footprintWidth = widthCells * this.GRID_SIZE;
        const footprintDepth = depthCells * this.GRID_SIZE;
        const centerX = this.cellCenterToWorldX(startCellX, widthCells);
        const centerZ = this.cellCenterToWorldZ(startCellZ, depthCells);
        const baseHeight = 0.35;
        const wallHeight = 3.4;
        const roofHeight = 1.2;
        const wallThickness = 0.18;
        const doorWidth = this.GRID_SIZE * 1.2;
        const doorHeight = 2.35;
        const southWallZ = centerZ + footprintDepth * 0.5 - wallThickness * 0.5;

        const registerObstacle = (mesh: THREE.Mesh) => {
            mesh.userData = { ...mesh.userData, type: 'hard', structureType: 'town2_house' };
            this.obstacles.push(mesh);
        };

        const foundation = new THREE.Mesh(
            new THREE.BoxGeometry(footprintWidth, baseHeight, footprintDepth),
            new THREE.MeshStandardMaterial({ color: 0x7f6957, roughness: 0.95, metalness: 0.03 })
        );
        foundation.position.set(centerX, baseHeight * 0.5, centerZ);
        foundation.receiveShadow = false;
        foundation.castShadow = false;
        foundation.userData = { ...foundation.userData, structureType: 'town2_house_foundation' };
        house.add(foundation);

        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0xc7b299,
            roughness: 0.92,
            metalness: 0.02
        });

        const northWall = new THREE.Mesh(
            new THREE.BoxGeometry(footprintWidth, wallHeight, wallThickness),
            wallMaterial.clone()
        );
        northWall.position.set(centerX, baseHeight + wallHeight * 0.5, centerZ - footprintDepth * 0.5 + wallThickness * 0.5);
        northWall.castShadow = true;
        northWall.receiveShadow = false;
        house.add(northWall);
        registerObstacle(northWall);

        const southSegmentWidth = (footprintWidth - doorWidth) * 0.5;
        const southWallLeft = new THREE.Mesh(
            new THREE.BoxGeometry(southSegmentWidth, wallHeight, wallThickness),
            wallMaterial.clone()
        );
        southWallLeft.position.set(centerX - (doorWidth * 0.5 + southSegmentWidth * 0.5), baseHeight + wallHeight * 0.5, southWallZ);
        southWallLeft.castShadow = true;
        southWallLeft.receiveShadow = false;
        house.add(southWallLeft);
        registerObstacle(southWallLeft);

        const southWallRight = new THREE.Mesh(
            new THREE.BoxGeometry(southSegmentWidth, wallHeight, wallThickness),
            wallMaterial.clone()
        );
        southWallRight.position.set(centerX + (doorWidth * 0.5 + southSegmentWidth * 0.5), baseHeight + wallHeight * 0.5, southWallZ);
        southWallRight.castShadow = true;
        southWallRight.receiveShadow = false;
        house.add(southWallRight);
        registerObstacle(southWallRight);

        const doorLintel = new THREE.Mesh(
            new THREE.BoxGeometry(doorWidth, Math.max(0.3, wallHeight - doorHeight), wallThickness),
            wallMaterial.clone()
        );
        doorLintel.position.set(centerX, baseHeight + doorHeight + (wallHeight - doorHeight) * 0.5, southWallZ);
        doorLintel.castShadow = true;
        doorLintel.receiveShadow = false;
        house.add(doorLintel);
        registerObstacle(doorLintel);

        const eastWall = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, wallHeight, footprintDepth),
            wallMaterial.clone()
        );
        eastWall.position.set(centerX + footprintWidth * 0.5 - wallThickness * 0.5, baseHeight + wallHeight * 0.5, centerZ);
        eastWall.castShadow = true;
        eastWall.receiveShadow = false;
        house.add(eastWall);
        registerObstacle(eastWall);

        const westWall = new THREE.Mesh(
            new THREE.BoxGeometry(wallThickness, wallHeight, footprintDepth),
            wallMaterial.clone()
        );
        westWall.position.set(centerX - footprintWidth * 0.5 + wallThickness * 0.5, baseHeight + wallHeight * 0.5, centerZ);
        westWall.castShadow = true;
        westWall.receiveShadow = false;
        house.add(westWall);
        registerObstacle(westWall);

        const door = new THREE.Mesh(
            new THREE.BoxGeometry(doorWidth + 0.04, doorHeight + 0.02, wallThickness * 0.9),
            new THREE.MeshStandardMaterial({ color: 0x5c3420, roughness: 0.78, metalness: 0.08 })
        );
        door.position.set(centerX, baseHeight + (doorHeight + 0.02) * 0.5, southWallZ);
        door.castShadow = true;
        door.receiveShadow = false;
        registerObstacle(door);
        door.userData = { ...door.userData, structureType: 'town2_house_door' };
        house.add(door);

        const roof = new THREE.Mesh(
            new THREE.BoxGeometry(footprintWidth + 0.35, roofHeight, footprintDepth + 0.35),
            new THREE.MeshStandardMaterial({ color: 0x5b3a29, roughness: 0.88, metalness: 0.02 })
        );
        roof.position.set(centerX, baseHeight + wallHeight + roofHeight * 0.5, centerZ);
        roof.castShadow = true;
        roof.receiveShadow = false;
        roof.userData = { ...roof.userData, structureType: 'town2_house_roof' };
        house.add(roof);

        this.group.add(house);
    }

    setVisible(visible: boolean) {
        this.group.visible = visible;
    }

    dispose() {
        if (this.scene && this.group) {
            this.scene.remove(this.group);
        }

        this.group.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach((m) => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });

        this.ground = null;
        this.obstacles = [];
        this.lightingManager.dispose();
        this.worldGrid.dispose();
    }

    toggleWorldGrid(visible?: boolean) {
        if (typeof visible === 'boolean') {
            this.worldGrid.setVisible(visible);
            return;
        }
        this.worldGrid.toggle();
    }

    getBiomeAt(_pos: THREE.Vector3): { name: string; color: string } {
        return { name: 'Town 2', color: '#9e9e9e' };
    }

    damageObstacle(_object: THREE.Object3D, _amount: number): string | null {
        return null;
    }

    update(dt: number, config: PlayerConfig, playerPosition: THREE.Vector3) {
        this.lightingManager.update(dt, config, playerPosition);
        this.worldGrid.update(playerPosition);
    }
}
