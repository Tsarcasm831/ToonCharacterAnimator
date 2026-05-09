import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { SettlementState } from './SettlementTypes';

const CELL_SIZE = 1;

export class SettlementRenderer {
  public readonly renderer: THREE.WebGLRenderer;
  public readonly camera: THREE.PerspectiveCamera;
  public readonly scene: THREE.Scene;
  public readonly controls: OrbitControls;

  private container: HTMLElement;
  private ground: THREE.Mesh;
  private gridGroup = new THREE.Group();
  private dynamicGroup = new THREE.Group();
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private lastState: SettlementState | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x10151a);
    this.scene.fog = new THREE.Fog(0x10151a, 32, 68);

    this.camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 160);
    this.camera.position.set(17, 24, 24);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.domElement.setAttribute('data-engine', 'three');
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.target.set(0, 0, 0);
    this.controls.maxPolarAngle = Math.PI * 0.48;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 56;

    const hemi = new THREE.HemisphereLight(0xe7f3ff, 0x303020, 1.8);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(8, 18, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    this.scene.add(sun);

    this.ground = new THREE.Mesh(
      new THREE.PlaneGeometry(32, 32),
      new THREE.MeshStandardMaterial({ color: 0x52624b, roughness: 0.95 }),
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.ground.userData.type = 'settlement-ground';
    this.scene.add(this.ground);
    this.scene.add(this.gridGroup);
    this.scene.add(this.dynamicGroup);
  }

  sync(state: SettlementState): void {
    this.lastState = state;
    this.rebuildGrid(state);
    this.clearGroup(this.dynamicGroup);
    this.renderStockpiles(state);
    this.renderResourceNodes(state);
    this.renderBuildings(state);
    this.renderSettlers(state);
    this.renderThreat(state);
  }

  render(): void {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  resize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width <= 0 || height <= 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  pickCell(clientX: number, clientY: number): { x: number; y: number } | null {
    if (!this.lastState) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObject(this.ground, false)[0];
    if (!hit) return null;
    const x = Math.floor(hit.point.x + this.lastState.width / 2);
    const y = Math.floor(hit.point.z + this.lastState.height / 2);
    if (x < 0 || y < 0 || x >= this.lastState.width || y >= this.lastState.height) return null;
    return { x, y };
  }

  dispose(): void {
    this.controls.dispose();
    this.clearGroup(this.dynamicGroup);
    this.clearGroup(this.gridGroup);
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        this.disposeMaterial(object.material);
      }
    });
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  private rebuildGrid(state: SettlementState): void {
    if (this.gridGroup.children.length > 0) return;
    const lineMat = new THREE.LineBasicMaterial({ color: 0x9fb7c8, transparent: true, opacity: 0.24 });
    const points: THREE.Vector3[] = [];
    const halfW = state.width / 2;
    const halfH = state.height / 2;
    for (let x = 0; x <= state.width; x += 1) {
      points.push(new THREE.Vector3(x - halfW, 0.025, -halfH));
      points.push(new THREE.Vector3(x - halfW, 0.025, halfH));
    }
    for (let y = 0; y <= state.height; y += 1) {
      points.push(new THREE.Vector3(-halfW, 0.025, y - halfH));
      points.push(new THREE.Vector3(halfW, 0.025, y - halfH));
    }
    const grid = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), lineMat);
    this.gridGroup.add(grid);
  }

  private renderStockpiles(state: SettlementState): void {
    const mat = new THREE.MeshStandardMaterial({ color: 0xd7b46a, transparent: true, opacity: 0.82, roughness: 0.8 });
    state.cells.forEach((cell) => {
      if (!cell.stockpile) return;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.08, 0.86), mat.clone());
      mesh.position.copy(this.cellToWorld(cell.x, cell.y, 0.04));
      this.dynamicGroup.add(mesh);
    });
  }

  private renderResourceNodes(state: SettlementState): void {
    state.resourceNodes.forEach((node) => {
      if (node.depleted) return;
      const color = node.type === 'tree' ? 0x2f7d32 : node.type === 'rock' ? 0x8f969a : 0xb84c39;
      const mesh = node.type === 'tree'
        ? new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.25, 8), new THREE.MeshStandardMaterial({ color }))
        : new THREE.Mesh(new THREE.DodecahedronGeometry(0.42), new THREE.MeshStandardMaterial({ color }));
      mesh.position.copy(this.cellToWorld(node.x, node.y, node.type === 'tree' ? 0.68 : 0.42));
      mesh.castShadow = true;
      this.dynamicGroup.add(mesh);
      if (node.designated) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.48, 0.035, 8, 24),
          new THREE.MeshBasicMaterial({ color: 0xfff27a }),
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.copy(this.cellToWorld(node.x, node.y, 0.06));
        this.dynamicGroup.add(ring);
      }
    });
  }

  private renderBuildings(state: SettlementState): void {
    state.buildings.forEach((building) => {
      const isBlueprint = building.status === 'blueprint';
      const color = building.type === 'wall' ? 0x856244 : 0x695f50;
      const opacity = isBlueprint ? 0.42 : 1;
      const geometry = building.type === 'wall'
        ? new THREE.BoxGeometry(0.82, 1.35, 0.22)
        : new THREE.BoxGeometry(0.92, 0.12, 0.92);
      const material = new THREE.MeshStandardMaterial({ color, transparent: isBlueprint, opacity, roughness: 0.9 });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(this.cellToWorld(building.x, building.y, building.type === 'wall' ? 0.68 : 0.08));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.dynamicGroup.add(mesh);
    });
  }

  private renderSettlers(state: SettlementState): void {
    state.settlers.forEach((settler) => {
      const group = new THREE.Group();
      group.position.copy(this.cellToWorld(settler.x, settler.y, 0));
      const bodyColor = settler.role === 'Builder' ? 0x67a7d8 : settler.role === 'Gatherer' ? 0x83b36a : 0xd9a65f;
      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.18, 0.55, 4, 8),
        new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.75 }),
      );
      body.position.y = 0.48;
      body.castShadow = true;
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xd8b48a, roughness: 0.85 }),
      );
      head.position.y = 0.98;
      head.castShadow = true;
      group.add(body, head);
      if (settler.carrying) {
        const pack = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 0.22, 0.22),
          new THREE.MeshStandardMaterial({ color: settler.carrying.type === 'stone' ? 0xb8c0c4 : 0x8b5a2b }),
        );
        pack.position.set(0.22, 0.7, 0);
        group.add(pack);
      }
      this.dynamicGroup.add(group);
    });
  }

  private renderThreat(state: SettlementState): void {
    const threat = state.threat;
    if (!threat || threat.status !== 'approaching') return;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.36, 0.32),
      new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.75 }),
    );
    mesh.position.copy(this.cellToWorld(threat.x, threat.y, 0.24));
    mesh.castShadow = true;
    this.dynamicGroup.add(mesh);
  }

  private cellToWorld(x: number, y: number, elevation: number): THREE.Vector3 {
    if (!this.lastState) return new THREE.Vector3(x, elevation, y);
    return new THREE.Vector3(
      (x + 0.5 - this.lastState.width / 2) * CELL_SIZE,
      elevation,
      (y + 0.5 - this.lastState.height / 2) * CELL_SIZE,
    );
  }

  private clearGroup(group: THREE.Group): void {
    while (group.children.length > 0) {
      const child = group.children[0];
      if (!child) continue;
      group.remove(child);
      child.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          this.disposeMaterial(object.material);
        }
      });
    }
  }

  private disposeMaterial(material: THREE.Material | THREE.Material[]): void {
    if (Array.isArray(material)) {
      material.forEach((item) => item.dispose());
    } else {
      material.dispose();
    }
  }
}
