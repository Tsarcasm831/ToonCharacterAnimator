
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class RenderManager {
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer;
    public controls: OrbitControls;
    private baseHemiLight: THREE.HemisphereLight;
    private baseDirLight: THREE.DirectionalLight;
    private disposed: boolean = false;
    
    private container: HTMLElement;

    constructor(container: HTMLElement) {
        this.container = container;

        // Scene Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050505); 
        
        // Base fog for far distance
        this.scene.fog = new THREE.Fog(0x000000, 30, 80);

        // Camera Setup
        this.camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 200);
        this.camera.position.set(-24, 3.2, 55.0);

        // Renderer Setup
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance",
            precision: "mediump"
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25)); // Slightly lower for stability
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        
        // Shadow Performance Optimization
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        // Controls Setup
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.target.set(-24, 1.7, 50);
        this.controls.mouseButtons = { LEFT: null as any, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.ROTATE };

        // Lighting
        this.baseHemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        this.scene.add(this.baseHemiLight);

        this.baseDirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.baseDirLight.position.set(5, 15, 5);
        this.baseDirLight.castShadow = true;
        
        // Optimization: Low resolution shadows for high FPS
        this.baseDirLight.shadow.mapSize.width = 512;
        this.baseDirLight.shadow.mapSize.height = 512;
        this.baseDirLight.shadow.camera.near = 0.5;
        this.baseDirLight.shadow.camera.far = 40; 
        this.baseDirLight.shadow.camera.left = -25;
        this.baseDirLight.shadow.camera.right = 25;
        this.baseDirLight.shadow.camera.top = 25;
        this.baseDirLight.shadow.camera.bottom = -25;
        this.baseDirLight.shadow.bias = -0.005; // Slightly deeper bias for lower resolution
        this.scene.add(this.baseDirLight);
    }

    resize() {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    render() {
        if (this.disposed) return;

        const context = this.renderer.getContext();
        if (context && typeof context.isContextLost === 'function' && context.isContextLost()) {
            return;
        }

        // OrbitControls can still mutate camera transforms while disabled if update()
        // is called, which breaks first-person camera orientation.
        if (this.controls.enabled) {
            this.controls.update();
        }
        this.renderer.render(this.scene, this.camera);
    }

    setBaseLightingEnabled(enabled: boolean) {
        this.baseHemiLight.visible = enabled;
        this.baseDirLight.visible = enabled;
        this.baseDirLight.castShadow = enabled;
    }

    dispose() {
        if (this.disposed) return;
        this.disposed = true;

        this.controls.dispose();
        
        this.scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                if (object.geometry) {
                    object.geometry.dispose();
                }

                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => this.disposeMaterial(material));
                    } else {
                        this.disposeMaterial(object.material);
                    }
                }
            }
        });

        this.renderer.dispose();
        this.renderer.forceContextLoss();
        if (this.container.contains(this.renderer.domElement)) {
            this.container.removeChild(this.renderer.domElement);
        }
    }

    private disposeMaterial(material: THREE.Material) {
        material.dispose();
        for (const key in material) {
            const value = (material as any)[key];
            if (value && value instanceof THREE.Texture) {
                value.dispose();
            }
        }
    }
}
