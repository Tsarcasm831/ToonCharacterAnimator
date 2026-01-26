import * as THREE from 'three';

// --- Configuration ---
interface ArenaConfig {
  radius: number;
  wallHeight: number;
  towerCount: number;
  colors: {
    wall: number;
    roof: number;
    floor: number;
    accent: number;
    wood: number;
  };
}

const DEFAULT_CONFIG: ArenaConfig = {
  radius: 20,
  wallHeight: 14,
  towerCount: 5, 
  colors: {
    wall: 0xE3DCC2, // Sand/Beige plaster
    roof: 0xD98E54, // Burnt Orange tile
    floor: 0x222222, // Dark pit floor
    accent: 0x5a5a5a, // Stone grey
    wood: 0x8b5a2b   // Wood for walkways/beams
  }
};

export class ArenaBuilder {
  private scene: THREE.Scene;
  private config: ArenaConfig;
  private materials: { [key: string]: THREE.Material } = {};

  constructor(scene: THREE.Scene, config: Partial<ArenaConfig> = {}) {
    this.scene = scene;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initMaterials();
  }

  private initMaterials() {
    const commonSettings = { side: THREE.DoubleSide, shadowSide: THREE.DoubleSide };
    
    this.materials['wall'] = new THREE.MeshStandardMaterial({ 
      color: this.config.colors.wall, roughness: 0.9, ...commonSettings 
    });
    this.materials['roof'] = new THREE.MeshStandardMaterial({ 
      color: this.config.colors.roof, roughness: 0.6, ...commonSettings 
    });
    this.materials['wood'] = new THREE.MeshStandardMaterial({ 
      color: this.config.colors.wood, roughness: 0.8, ...commonSettings 
    });
    this.materials['floor'] = new THREE.MeshStandardMaterial({ 
      color: this.config.colors.floor, ...commonSettings 
    });
    this.materials['accent'] = new THREE.MeshStandardMaterial({ 
      color: this.config.colors.accent, ...commonSettings 
    });
    this.materials['fence'] = new THREE.MeshBasicMaterial({ 
      color: 0x5599ff, wireframe: true, transparent: true, opacity: 0.2, side: THREE.DoubleSide
    });
  }

  public build(): THREE.Group {
    const arenaGroup = new THREE.Group();

    // 1. The Main Circular Fortification (Wall + Pillars + Walkway)
    arenaGroup.add(this.createMainFortification());

    // 2. The Towers (Pagodas integrated into the wall)
    arenaGroup.add(this.createTowers());

    // 3. The Central Pit Floor
    arenaGroup.add(this.createFloor());

    // 4. Outer Perimeter Fence
    arenaGroup.add(this.createFence());

    this.scene.add(arenaGroup);
    return arenaGroup;
  }

  /**
   * Creates the main wall ring, including the gap for the gate,
   * vertical structural ribs, and the internal walkway.
   */
  private createMainFortification(): THREE.Group {
    const group = new THREE.Group();
    
    // -- A. The Main Wall Cylinder (with a gap for the gate) --
    // We leave a 45-degree gap (PI/4) for the entrance
    const wallArc = Math.PI * 2 - (Math.PI / 4); 
    const startAngle = (Math.PI / 4) / 2; // Center the gap

    const wallGeo = new THREE.CylinderGeometry(
      this.config.radius, 
      this.config.radius, 
      this.config.wallHeight, 
      64, 1, true, 
      startAngle, wallArc
    );
    const wall = new THREE.Mesh(wallGeo, this.materials['wall']);
    wall.position.y = this.config.wallHeight / 2;
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);

    // -- B. Vertical Ribs/Pillars --
    // Add structural columns every few degrees to mimic the reference buttresses
    const ribCount = 24; 
    const ribStep = wallArc / ribCount;

    for (let i = 0; i <= ribCount; i++) {
      const angle = startAngle + (i * ribStep);
      const x = Math.cos(angle) * this.config.radius;
      const z = Math.sin(angle) * this.config.radius;

      const ribGeo = new THREE.BoxGeometry(1.5, this.config.wallHeight, 2);
      const rib = new THREE.Mesh(ribGeo, this.materials['wall']);
      
      // Position on the wall circumference
      rib.position.set(x, this.config.wallHeight / 2, z);
      rib.lookAt(0, this.config.wallHeight / 2, 0);
      group.add(rib);
    }

    // -- C. Internal Walkway (The wooden ring inside) --
    // A flat ring shelf on the inside of the wall
    const walkwayRadius = this.config.radius - 2; 
    const walkwayGeo = new THREE.RingGeometry(walkwayRadius, this.config.radius - 0.1, 64, 1, startAngle, wallArc);
    const walkway = new THREE.Mesh(walkwayGeo, this.materials['wood']);
    walkway.rotation.x = -Math.PI / 2;
    walkway.position.y = this.config.wallHeight - 4; // 4 units down from top
    group.add(walkway);

    return group;
  }

  /**
   * Creates the Pagoda-style towers sitting ON the wall.
   */
  private createTowers(): THREE.Group {
    const group = new THREE.Group();
    
    // We place towers within the wall arc area
    const wallArc = Math.PI * 2 - (Math.PI / 4);
    const startAngle = (Math.PI / 4) / 2;
    
    // Distribute towers evenly along the arc
    // We skip the very edges so they don't hang off the gate
    const step = wallArc / (this.config.towerCount - 1);

    for (let i = 0; i < this.config.towerCount; i++) {
      const angle = startAngle + (i * step);
      const tower = new THREE.Group();

      // Position: On the wall radius, at the top
      const x = Math.cos(angle) * this.config.radius;
      const z = Math.sin(angle) * this.config.radius;

      // Anchor at the walkway level so they look built-in
      const BaseY = this.config.wallHeight - 4; 
      tower.position.set(x, BaseY, z);
      tower.lookAt(0, BaseY, 0);

      // 1. Tower Base (Extending down the wall)
      // This rectangle merges into the wall
      const baseGeo = new THREE.BoxGeometry(8, 10, 6);
      const base = new THREE.Mesh(baseGeo, this.materials['wall']);
      base.position.y = 5; // Center is half-height up
      tower.add(base);

      // 2. Upper Room (The wooden part under the main roof)
      const roomGeo = new THREE.BoxGeometry(7, 5, 5);
      const room = new THREE.Mesh(roomGeo, this.materials['wall']);
      room.position.y = 12.5; // On top of base
      tower.add(room);

      // 3. Lower Roof (The "skirt" roof)
      const lowerRoof = this.createPagodaRoof(8.5, 9.5);
      lowerRoof.position.y = 10; // Between base and room
      tower.add(lowerRoof);

      // 4. Main Top Roof
      const topRoof = this.createPagodaRoof(8, 10);
      topRoof.position.y = 15; // Top of room
      tower.add(topRoof);

      group.add(tower);
    }
    return group;
  }

  /**
   * Helper to create a stylized Asian/Pagoda roof
   * Combines a steep top pyramid with a flatter wide base for the "flare" look.
   */
  private createPagodaRoof(widthTop: number, widthBottom: number): THREE.Group {
    const roofGroup = new THREE.Group();

    // A. The main steep pyramid
    const steepGeo = new THREE.ConeGeometry(widthTop * 0.8, 3, 4);
    const steepMesh = new THREE.Mesh(steepGeo, this.materials['roof']);
    steepMesh.rotation.y = Math.PI / 4; // Align square
    steepMesh.scale.set(1, 1, 0.7); // Flatten depth
    roofGroup.add(steepMesh);

    // B. The wide flared eaves (flatter pyramid underneath)
    const flareGeo = new THREE.ConeGeometry(widthBottom, 1.5, 4);
    const flareMesh = new THREE.Mesh(flareGeo, this.materials['roof']);
    flareMesh.position.y = -1.0; // Shift down slightly
    flareMesh.rotation.y = Math.PI / 4;
    flareMesh.scale.set(1.1, 1, 0.8); // Wider than the top
    roofGroup.add(flareMesh);

    return roofGroup;
  }

  private createFloor(): THREE.Mesh {
    const geometry = new THREE.CircleGeometry(this.config.radius + 1, 64);
    const mesh = new THREE.Mesh(geometry, this.materials['floor']);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.05;
    return mesh;
  }

  private createFence(): THREE.Mesh {
    // A taller, wider fence to bound the map
    const geometry = new THREE.CylinderGeometry(
      this.config.radius * 2.5, 
      this.config.radius * 2.5, 
      20, 32, 1, true
    );
    const mesh = new THREE.Mesh(geometry, this.materials['fence']);
    mesh.position.y = 10;
    return mesh;
  }
}