import * as THREE from 'three';
// Note: Ensure BufferGeometryUtils is available via your bundler setup.
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * A large, clean white marquee event tent with windows and a hipped roof.
 */
export class EventTent {
    private static readonly GRID_SIZE = 1.3333;
    // Tent dimensions (approx 3 grids wide x 5 grids long)
    private static readonly WIDTH = 4.0; 
    private static readonly LENGTH = 6.6;
    private static readonly WALL_HEIGHT = 2.2;
    private static readonly ROOF_HEIGHT = 1.5;

    private static fabricMaterial: THREE.MeshStandardMaterial;
    private static windowMaterial: THREE.MeshStandardMaterial;

    private static mergeGeometriesSafe(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
        const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
        geometries.forEach(g => g.dispose());
        return merged ?? new THREE.BufferGeometry();
    }

    private static initMaterials() {
        if (this.fabricMaterial) return;

        this.fabricMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            roughness: 0.6,
            metalness: 0.05,
            side: THREE.DoubleSide
        });

        // Simulates the clear plastic windows often found on these tents
        this.windowMaterial = new THREE.MeshStandardMaterial({
            color: 0x88CCFF,
            roughness: 0.1,
            metalness: 0.5,
            transparent: true,
            opacity: 0.3
        });
    }

    static create(isGhost: boolean = false): THREE.Group {
        this.initMaterials();
        const group = new THREE.Group();

        // 1. Create Main Tent Body (Walls + Roof)
        const tentMesh = this.createTentBody();
        group.add(tentMesh);

        // 2. Create Windows
        const windowMesh = this.createWindows();
        group.add(windowMesh);

        if (isGhost) {
            group.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0x44ff44,
                        transparent: true,
                        opacity: 0.4,
                        wireframe: true
                    });
                    child.castShadow = false;
                    child.receiveShadow = false;
                }
            });
        } else {
            group.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.userData = { 
                        type: 'hard', 
                        structureType: 'event_tent',
                        material: 'fabric'
                    };
                }
            });
        }

        // Situate on ground
        group.position.y = 0;

        return group;
    }

    private static createTentBody(): THREE.Mesh {
        const geometries: THREE.BufferGeometry[] = [];

        // --- Walls ---
        // Create 4 separate planes for walls so we can punch holes (conceptually) or just layer them
        // Actually, we'll make a hollow box frame
        const wallThickness = 0.05;
        
        // Left Wall
        const wallL = new THREE.BoxGeometry(wallThickness, this.WALL_HEIGHT, this.LENGTH);
        wallL.translate(-this.WIDTH/2, this.WALL_HEIGHT/2, 0);
        geometries.push(wallL);

        // Right Wall
        const wallR = new THREE.BoxGeometry(wallThickness, this.WALL_HEIGHT, this.LENGTH);
        wallR.translate(this.WIDTH/2, this.WALL_HEIGHT/2, 0);
        geometries.push(wallR);

        // Back Wall
        const wallB = new THREE.BoxGeometry(this.WIDTH, this.WALL_HEIGHT, wallThickness);
        wallB.translate(0, this.WALL_HEIGHT/2, -this.LENGTH/2);
        geometries.push(wallB);

        // Front Wall (Leave opening in middle)
        const doorWidth = 2.0;
        const sidePanelWidth = (this.WIDTH - doorWidth) / 2;
        
        const wallF_Left = new THREE.BoxGeometry(sidePanelWidth, this.WALL_HEIGHT, wallThickness);
        wallF_Left.translate(-(this.WIDTH/2 - sidePanelWidth/2), this.WALL_HEIGHT/2, this.LENGTH/2);
        geometries.push(wallF_Left);

        const wallF_Right = new THREE.BoxGeometry(sidePanelWidth, this.WALL_HEIGHT, wallThickness);
        wallF_Right.translate((this.WIDTH/2 - sidePanelWidth/2), this.WALL_HEIGHT/2, this.LENGTH/2);
        geometries.push(wallF_Right);

        // --- Roof (Hipped Roof) ---
        // We construct a pyramid-like shape. 
        // A Cylinder with 4 sides (rotated) can work, but scaling it to be rectangular is tricky.
        // Easiest is to manually specify a roof geometry or merge ramps.
        
        // Top Ridge length = Length - Width (standard hip roof approx)
        const ridgeLength = Math.max(0.1, this.LENGTH - this.WIDTH * 0.8);
        
        // Create a custom geometry for the roof
        const roofGeo = new THREE.BufferGeometry();
        // 6 vertices: 2 top ridge points, 4 corner eaves points
        const topY = this.WALL_HEIGHT + this.ROOF_HEIGHT;
        const eavesY = this.WALL_HEIGHT;
        const w = this.WIDTH / 2 + 0.2; // Overhang
        const l = this.LENGTH / 2 + 0.2; // Overhang
        const rl = ridgeLength / 2;

        const vertices = new Float32Array([
            // Front Face (Trapezoid or Triangle)
            -w, eavesY, l,   w, eavesY, l,   rl, topY, 0,
            -w, eavesY, l,   rl, topY, 0,   -rl, topY, 0,
            
            // Back Face
            w, eavesY, -l,   -w, eavesY, -l,  -rl, topY, 0,
            w, eavesY, -l,   -rl, topY, 0,    rl, topY, 0,

            // Left Face
            -w, eavesY, -l,  -w, eavesY, l,   -rl, topY, 0,
            -w, eavesY, l,   -rl, topY, 0,     -rl, topY, 0, // (degenerate triangle fix or simple quad logic)
            // Actually, let's just do triangle fan logic for simplicity or use Cone geometry scaled.
            // Let's use 4 planes rotated:
        ]);
        
        // Alternative: Use 4 BoxGeometries rotated to form the slopes
        // Side Slopes
        const sideHyp = Math.sqrt((this.WIDTH/2)**2 + this.ROOF_HEIGHT**2);
        const sideAngle = Math.atan2(this.ROOF_HEIGHT, this.WIDTH/2);
        
        const roofSide = new THREE.BoxGeometry(this.LENGTH + 0.4, 0.05, sideHyp);
        roofSide.rotateX(sideAngle);
        roofSide.translate(0, this.WALL_HEIGHT + this.ROOF_HEIGHT/2, -this.WIDTH/4); // Approx positioning
        // Because hipped roofs are complex to construct with primitives, we will use a single scaled Cone (Pyramid) 
        // and stretch it. It won't have a ridge line (it will come to a point), but it looks close enough for low poly.
        
        const roofPyramid = new THREE.ConeGeometry(1, this.ROOF_HEIGHT, 4);
        // Rotate so flat sides face axes
        roofPyramid.rotateY(Math.PI / 4); 
        // Scale to dimensions
        roofPyramid.scale(this.WIDTH * 0.7, 1, this.LENGTH * 0.7); 
        roofPyramid.translate(0, this.WALL_HEIGHT + this.ROOF_HEIGHT/2, 0);
        
        geometries.push(roofPyramid);

        const merged = this.mergeGeometriesSafe(geometries);
        return new THREE.Mesh(merged, this.fabricMaterial);
    }

    private static createWindows(): THREE.Mesh {
        const geometries: THREE.BufferGeometry[] = [];
        const winHeight = 1.2;
        const winWidth = 0.8;
        const spacing = 1.5;

        // Add 3 windows on each long side
        for(let i = -1; i <= 1; i++) {
            const z = i * spacing;
            
            // Left side window
            const winL = new THREE.PlaneGeometry(winWidth, winHeight);
            winL.rotateY(-Math.PI / 2);
            // Position slightly outside wall
            winL.translate(-this.WIDTH/2 - 0.06, this.WALL_HEIGHT/2, z);
            geometries.push(winL);

            // Right side window
            const winR = new THREE.PlaneGeometry(winWidth, winHeight);
            winR.rotateY(Math.PI / 2);
            winR.translate(this.WIDTH/2 + 0.06, this.WALL_HEIGHT/2, z);
            geometries.push(winR);
        }

        // Add arched top texture coordinates or geometry?
        // For low poly, simple rects with the transparent material work well.
        
        const merged = this.mergeGeometriesSafe(geometries);
        return new THREE.Mesh(merged, this.windowMaterial);
    }
}