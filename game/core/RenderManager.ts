
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class RenderManager {
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer;
    public controls: OrbitControls;
    
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
        this.renderer.shadowMap.type = THREE.PCFShadowMap; 
        container.appendChild(this.renderer.domElement);

        // Controls Setup
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.target.set(-24, 1.7, 50);
        this.controls.mouseButtons = { LEFT: null as any, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };

        // Lighting
        this.scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.6));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 15, 5);
        dirLight.castShadow = true;
        
        // Optimization: Low resolution shadows for high FPS
        dirLight.shadow.mapSize.width = 512;
        dirLight.shadow.mapSize.height = 512;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 40; 
        dirLight.shadow.camera.left = -25;
        dirLight.shadow.camera.right = 25;
        dirLight.shadow.camera.top = 25;
        dirLight.shadow.camera.bottom = -25;
        dirLight.shadow.bias = -0.005; // Slightly deeper bias for lower resolution
        this.scene.add(dirLight);
    }

    resize() {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    render() {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
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
