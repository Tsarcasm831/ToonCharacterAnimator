import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RenderManager } from '../game/core/RenderManager';
import { PlayerModel } from '../game/model/PlayerModel';
import type { PlayerConfig } from '../types';

interface DefenseProps {
  config: PlayerConfig;
  onReady?: () => void;
}

type Team = 'player' | 'enemy';

type CharacterMarker = {
  x: number;
  z: number;
  rot: number;
  scale: number;
  tint: string;
  team: Team;
};

type DefenseUnit = {
  group: THREE.Group;
  team: Team;
  target: THREE.Vector3;
  speed: number;
};

type RectBlocker = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

type DefenseSceneObjects = {
  playerUnits: DefenseUnit[];
  enemyUnits: DefenseUnit[];
  walkablePlane: THREE.Mesh;
  blockers: RectBlocker[];
};

const gridCellSize = 0.8;
const wallZ = -8;
const gateHalfWidth = 2.2;

const walkableBounds = {
  minX: -28,
  maxX: 28,
  minZ: -42,
  maxZ: 24,
};

const enemyMarkers: CharacterMarker[] = [
  { x: -10, z: -33, rot: 0.04, scale: 0.86, tint: '#f97316', team: 'enemy' },
  { x: 0, z: -36, rot: -0.02, scale: 0.9, tint: '#ef4444', team: 'enemy' },
  { x: 10, z: -33.5, rot: 0.08, scale: 0.86, tint: '#facc15', team: 'enemy' },
];

const playerMarkers: CharacterMarker[] = [
  { x: -8, z: 12, rot: Math.PI, scale: 1.05, tint: '#fed7aa', team: 'player' },
  { x: 0, z: 14, rot: Math.PI, scale: 0.98, tint: '#d9f99d', team: 'player' },
  { x: 8, z: 12, rot: Math.PI, scale: 1.08, tint: '#bfdbfe', team: 'player' },
];

function makeMaterial(color: number, roughness = 0.82) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.04 });
}

function addBox(
  parent: THREE.Scene | THREE.Group,
  size: [number, number, number],
  position: [number, number, number],
  color: number
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), makeMaterial(color));
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addRectBlocker(blockers: RectBlocker[], centerX: number, centerZ: number, width: number, depth: number) {
  blockers.push({
    minX: centerX - width / 2,
    maxX: centerX + width / 2,
    minZ: centerZ - depth / 2,
    maxZ: centerZ + depth / 2,
  });
}

function isInGate(point: THREE.Vector3) {
  return Math.abs(point.x) <= gateHalfWidth && Math.abs(point.z - wallZ) <= 1.3;
}

function isBlocked(point: THREE.Vector3, blockers: RectBlocker[]) {
  if (point.x < walkableBounds.minX || point.x > walkableBounds.maxX) return true;
  if (point.z < walkableBounds.minZ || point.z > walkableBounds.maxZ) return true;
  if (isInGate(point)) return false;

  return blockers.some((blocker) => (
    point.x >= blocker.minX &&
    point.x <= blocker.maxX &&
    point.z >= blocker.minZ &&
    point.z <= blocker.maxZ
  ));
}

function snapToGrid(point: THREE.Vector3, blockers: RectBlocker[]) {
  const snapped = new THREE.Vector3(
    Math.round(point.x / gridCellSize) * gridCellSize,
    0.08,
    Math.round(point.z / gridCellSize) * gridCellSize
  );

  snapped.x = THREE.MathUtils.clamp(snapped.x, walkableBounds.minX, walkableBounds.maxX);
  snapped.z = THREE.MathUtils.clamp(snapped.z, walkableBounds.minZ, walkableBounds.maxZ);

  if (!isBlocked(snapped, blockers)) return snapped;

  const searchRadiusCells = 5;
  for (let radius = 1; radius <= searchRadiusCells; radius += 1) {
    for (let dz = -radius; dz <= radius; dz += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (Math.abs(dx) !== radius && Math.abs(dz) !== radius) continue;
        const candidate = new THREE.Vector3(
          snapped.x + dx * gridCellSize,
          0.08,
          snapped.z + dz * gridCellSize
        );
        if (!isBlocked(candidate, blockers)) return candidate;
      }
    }
  }

  return null;
}

function createSelectionMarker() {
  const marker = new THREE.Group();

  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.42, 0.9, 4),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.92 })
  );
  cone.rotation.x = Math.PI;
  cone.position.y = 0.46;
  marker.add(cone);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.035, 8, 40),
    new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.78 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -2.2;
  marker.add(ring);

  marker.visible = false;
  return marker;
}

function findDefenseUnit(object: THREE.Object3D | null): DefenseUnit | null {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (current.userData.defenseUnit) {
      return current.userData.defenseUnit as DefenseUnit;
    }
    current = current.parent;
  }
  return null;
}

function addGrid(scene: THREE.Scene, blockers: RectBlocker[]) {
  const group = new THREE.Group();
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.18 });
  const blockedMaterial = new THREE.LineBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.12 });

  for (let x = walkableBounds.minX; x <= walkableBounds.maxX + 0.001; x += gridCellSize) {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, 0.055, walkableBounds.minZ),
      new THREE.Vector3(x, 0.055, walkableBounds.maxZ),
    ]);
    group.add(new THREE.Line(geometry, lineMaterial));
  }

  for (let z = walkableBounds.minZ; z <= walkableBounds.maxZ + 0.001; z += gridCellSize) {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(walkableBounds.minX, 0.055, z),
      new THREE.Vector3(walkableBounds.maxX, 0.055, z),
    ]);
    group.add(new THREE.Line(geometry, lineMaterial));
  }

  blockers.forEach((blocker) => {
    const shape = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(blocker.minX, 0.065, blocker.minZ),
      new THREE.Vector3(blocker.maxX, 0.065, blocker.minZ),
      new THREE.Vector3(blocker.maxX, 0.065, blocker.maxZ),
      new THREE.Vector3(blocker.minX, 0.065, blocker.maxZ),
      new THREE.Vector3(blocker.minX, 0.065, blocker.minZ),
    ]);
    group.add(new THREE.Line(shape, blockedMaterial));
  });

  scene.add(group);
}

function addWall(scene: THREE.Scene, blockers: RectBlocker[]) {
  const wallHeight = 3.2;
  const wallDepth = 1.4;
  const wallColor = 0x475569;

  addBox(scene, [24, wallHeight, wallDepth], [-16, wallHeight / 2, wallZ], wallColor);
  addBox(scene, [24, wallHeight, wallDepth], [16, wallHeight / 2, wallZ], wallColor);
  addBox(scene, [3.8, 4.5, 1.8], [-gateHalfWidth - 1.8, 2.25, wallZ], 0x5b677a);
  addBox(scene, [3.8, 4.5, 1.8], [gateHalfWidth + 1.8, 2.25, wallZ], 0x5b677a);

  const gate = addBox(scene, [gateHalfWidth * 2, 2.4, 0.35], [0, 1.2, wallZ + 0.65], 0x4b2f20);
  gate.rotation.x = -0.16;

  addRectBlocker(blockers, -16, wallZ, 24, wallDepth + 0.35);
  addRectBlocker(blockers, 16, wallZ, 24, wallDepth + 0.35);
  addRectBlocker(blockers, -gateHalfWidth - 1.8, wallZ, 3.8, 2.1);
  addRectBlocker(blockers, gateHalfWidth + 1.8, wallZ, 3.8, 2.1);
}

function addWatchtower(scene: THREE.Scene, blockers: RectBlocker[], x: number, z: number, mirror: 1 | -1) {
  const tower = new THREE.Group();
  scene.add(tower);

  addBox(tower, [5, 5.4, 5], [x, 2.7, z], 0x334155);
  addBox(tower, [6.4, 0.55, 6.4], [x, 5.68, z], 0x64748b);

  const railColor = 0x94a3b8;
  addBox(tower, [6.6, 0.55, 0.35], [x, 6.25, z - 3.1], railColor);
  addBox(tower, [6.6, 0.55, 0.35], [x, 6.25, z + 3.1], railColor);
  addBox(tower, [0.35, 0.55, 6.6], [x - 3.1, 6.25, z], railColor);
  addBox(tower, [0.35, 0.55, 6.6], [x + 3.1, 6.25, z], railColor);

  const stepCount = 9;
  const stepWidth = 3.6;
  const stepDepth = 0.75;
  for (let i = 0; i < stepCount; i += 1) {
    const t = i / (stepCount - 1);
    const stepX = x + mirror * (3.6 + t * 5.2);
    const stepZ = z + 1.8 + t * 1.4;
    addBox(tower, [stepWidth, 0.22 + t * 0.26, stepDepth], [stepX, 0.11 + t * 2.65, stepZ], 0x526071);
  }

  addRectBlocker(blockers, x, z, 5.2, 5.2);
}

function addCoverAndSupplies(scene: THREE.Scene, blockers: RectBlocker[]) {
  const props: Array<[number, number, number, number, number]> = [
    [-14, 11, 3.8, 2.2, 0x4b5563],
    [14, 10, 3.8, 2.2, 0x4b5563],
    [-5.2, 5, 3, 2, 0x59412f],
    [6.4, 3.5, 2.7, 2.2, 0x59412f],
    [-18, -22, 4.4, 2.2, 0x3f3f46],
    [17, -28, 3.8, 2.8, 0x3f3f46],
  ];

  props.forEach(([x, z, width, depth, color]) => {
    addBox(scene, [width, 1.15, depth], [x, 0.58, z], color);
    addRectBlocker(blockers, x, z, width + 0.2, depth + 0.2);
  });
}

function addCharacter(scene: THREE.Scene, baseConfig: PlayerConfig, marker: CharacterMarker, index: number): DefenseUnit {
  const characterConfig: PlayerConfig = {
    ...baseConfig,
    tintColor: marker.tint,
    shirtColor: index % 2 === 0 ? marker.tint : baseConfig.shirtColor,
    shirtColor2: index % 2 === 0 ? '#1f2937' : marker.tint,
    pantsColor: index % 3 === 0 ? '#1f2937' : baseConfig.pantsColor,
    selectedItem: index % 2 === 0 ? 'Sword' : baseConfig.selectedItem,
    equipment: {
      ...baseConfig.equipment,
      shirt: true,
      pants: true,
      shoes: true,
      ...(index % 2 === 0 ? { shield: true } : {}),
    },
  };

  const model = new PlayerModel(characterConfig);
  model.sync(characterConfig, true);
  model.group.position.set(marker.x, 0.08, marker.z);
  model.group.rotation.y = marker.rot;
  model.group.scale.setScalar(marker.scale);
  model.group.userData.defenseCharacter = true;
  model.group.userData.baseY = model.group.position.y;
  model.group.userData.defenseTeam = marker.team;

  const unit: DefenseUnit = {
    group: model.group,
    team: marker.team,
    target: model.group.position.clone(),
    speed: marker.team === 'player' ? 7.5 : 0,
  };

  model.group.userData.defenseUnit = unit;
  model.group.traverse((object) => {
    object.castShadow = true;
    object.receiveShadow = true;
    object.userData.defenseUnit = unit;
    object.userData.defenseTeam = marker.team;
  });

  scene.add(model.group);
  return unit;
}

function addDefenseScene(scene: THREE.Scene, config: PlayerConfig): DefenseSceneObjects {
  const blockers: RectBlocker[] = [];
  scene.background = new THREE.Color(0x0b1118);
  scene.fog = new THREE.Fog(0x0b1118, 76, 150);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(walkableBounds.maxX - walkableBounds.minX, walkableBounds.maxZ - walkableBounds.minZ),
    makeMaterial(0x1f2933, 0.95)
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.02, (walkableBounds.minZ + walkableBounds.maxZ) / 2);
  ground.receiveShadow = true;
  scene.add(ground);

  const walkablePlane = new THREE.Mesh(
    new THREE.PlaneGeometry(walkableBounds.maxX - walkableBounds.minX, walkableBounds.maxZ - walkableBounds.minZ),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.001, depthWrite: false })
  );
  walkablePlane.rotation.x = -Math.PI / 2;
  walkablePlane.position.copy(ground.position);
  walkablePlane.position.y = 0.04;
  walkablePlane.userData.hitType = 'ground';
  scene.add(walkablePlane);

  addWall(scene, blockers);
  addWatchtower(scene, blockers, -21, wallZ + 0.5, 1);
  addWatchtower(scene, blockers, 21, wallZ + 0.5, -1);
  addCoverAndSupplies(scene, blockers);
  addGrid(scene, blockers);

  const enemyUnits = enemyMarkers.map((marker, index) => addCharacter(scene, config, marker, index));
  const playerUnits = playerMarkers.map((marker, index) => addCharacter(scene, config, marker, index + enemyMarkers.length));

  return { playerUnits, enemyUnits, walkablePlane, blockers };
}

const Defense: React.FC<DefenseProps> = ({ config, onReady }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initialConfigRef = useRef(config);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderManager = new RenderManager(container);
    renderManager.setBaseLightingEnabled(false);
    renderManager.camera.fov = 45;
    renderManager.camera.position.set(0, 34, 52);
    renderManager.camera.updateProjectionMatrix();
    renderManager.controls.target.set(0, 1.8, -9);
    renderManager.controls.enablePan = true;
    renderManager.controls.enableZoom = true;
    renderManager.controls.enableRotate = true;
    renderManager.controls.update();

    const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x101820, 1.2);
    renderManager.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(-14, 28, 20);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -50;
    key.shadow.camera.right = 50;
    key.shadow.camera.top = 50;
    key.shadow.camera.bottom = -50;
    renderManager.scene.add(key);

    const rim = new THREE.DirectionalLight(0x7dd3fc, 0.8);
    rim.position.set(28, 20, -26);
    renderManager.scene.add(rim);

    const sceneObjects = addDefenseScene(renderManager.scene, initialConfigRef.current);
    const selectionMarker = createSelectionMarker();
    renderManager.scene.add(selectionMarker);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let selectedUnit: DefenseUnit | null = sceneObjects.playerUnits[0] ?? null;
    let selectedUnitIndex = selectedUnit ? 0 : -1;

    const selectUnit = (unit: DefenseUnit | null) => {
      if (!unit || unit.team !== 'player') return;
      selectedUnit = unit;
      selectedUnitIndex = sceneObjects.playerUnits.indexOf(unit);
      selectionMarker.visible = true;
    };

    const cycleUnit = () => {
      if (sceneObjects.playerUnits.length === 0) return;
      selectedUnitIndex = (selectedUnitIndex + 1 + sceneObjects.playerUnits.length) % sceneObjects.playerUnits.length;
      selectUnit(sceneObjects.playerUnits[selectedUnitIndex]);
    };

    selectUnit(selectedUnit);
    onReadyRef.current?.();

    let frame = 0;
    const startTime = performance.now();
    let lastFrameTime = startTime;

    const animate = () => {
      const now = performance.now();
      const elapsed = (now - startTime) / 1000;
      const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
      lastFrameTime = now;

      for (const unit of sceneObjects.playerUnits) {
        const deltaToTarget = unit.target.clone().sub(unit.group.position);
        deltaToTarget.y = 0;
        const distance = deltaToTarget.length();
        if (distance > 0.05) {
          const step = Math.min(distance, unit.speed * dt);
          const direction = deltaToTarget.normalize();
          unit.group.position.addScaledVector(direction, step);
          unit.group.rotation.y = Math.atan2(direction.x, direction.z);
        }
      }

      if (selectedUnit) {
        selectionMarker.position.set(
          selectedUnit.group.position.x,
          selectedUnit.group.position.y + 3.15,
          selectedUnit.group.position.z
        );
        selectionMarker.rotation.y += 0.035;
      }

      renderManager.scene.traverse((object) => {
        if (object.userData.defenseCharacter) {
          object.position.y = object.userData.baseY + Math.sin(elapsed * 1.4 + object.position.x * 0.2) * 0.025;
        }
      });

      renderManager.render();
      frame = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => renderManager.resize();
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement | null)?.closest('input, textarea, select, .no-capture')) return;
      if (event.key !== 'Tab') return;
      event.preventDefault();
      cycleUnit();
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;

      const rect = renderManager.renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, renderManager.camera);

      const unitIntersections = raycaster.intersectObjects(
        [...sceneObjects.playerUnits, ...sceneObjects.enemyUnits].map((unit) => unit.group),
        true
      );

      if (unitIntersections.length > 0) {
        const clickedUnit = findDefenseUnit(unitIntersections[0].object);
        if (clickedUnit?.team === 'player') {
          selectUnit(clickedUnit);
          return;
        }
        if (clickedUnit?.team === 'enemy' && selectedUnit) {
          console.log('[Defense] Enemy selected as target:', clickedUnit.group.position);
          return;
        }
      }

      const groundIntersections = raycaster.intersectObject(sceneObjects.walkablePlane, false);
      if (groundIntersections.length > 0 && selectedUnit) {
        const target = snapToGrid(groundIntersections[0].point, sceneObjects.blockers);
        if (target) {
          selectedUnit.target.copy(target);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    renderManager.renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      renderManager.renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      cancelAnimationFrame(frame);
      renderManager.dispose();
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" onContextMenu={(event) => event.preventDefault()} />;
};

export default Defense;
