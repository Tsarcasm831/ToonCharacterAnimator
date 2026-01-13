
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

const FogShader = {
    uniforms: {
        tDiffuse: { value: null },
        tDepth: { value: null },
        cameraNear: { value: 0.1 },
        cameraFar: { value: 200 },
        uTime: { value: 0.0 },
        resolution: { value: new THREE.Vector2() }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        #include <packing>
        varying vec2 vUv;
        uniform sampler2D tDiffuse;
        uniform sampler2D tDepth;
        uniform float cameraNear;
        uniform float cameraFar;
        uniform float uTime;
        uniform vec2 resolution;

        float readDepth(const in vec2 coord) {
            float fragCoordZ = texture2D(tDepth, coord).x;
            float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
            return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
        }

        // Simplex 2D noise
        vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
        float snoise(vec2 v){
            const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                    -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v -   i + dot(i, C.xx);
            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod(i, 289.0);
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                + i.x + vec3(0.0, i1.x, 1.0 ));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
            m = m*m ;
            m = m*m ;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
        }

        void main() {
            vec4 diffuse = texture2D(tDiffuse, vUv);
            float depth = readDepth(vUv);
            float linearDist = depth * (cameraFar - cameraNear);

            // Fog Logic: Starts at 18m, fully thick by 28m
            float fogStart = 18.0;
            float fogEnd = 28.0;
            float fogFactor = smoothstep(fogStart, fogEnd, linearDist);

            if (fogFactor > 0.0) {
                // 1. BLUR
                // Simple box blur that scales with fog factor
                vec4 blurColor = vec4(0.0);
                float total = 0.0;
                float radius = 1.5 * fogFactor; 
                vec2 pixel = vec2(1.0) / resolution;
                
                // 9 samples
                for (float x = -1.0; x <= 1.0; x++) {
                    for (float y = -1.0; y <= 1.0; y++) {
                        vec2 offset = vec2(x, y) * radius * pixel;
                        blurColor += texture2D(tDiffuse, vUv + offset);
                        total += 1.0;
                    }
                }
                blurColor /= total;
                
                // Mix diffuse with blur based on depth
                vec4 baseColor = mix(diffuse, blurColor, fogFactor);

                // 2. ANIMATED FOG
                // Scrolling noise layers
                float n1 = snoise(vUv * 8.0 + vec2(uTime * 0.1, uTime * 0.05));
                float n2 = snoise(vUv * 15.0 - vec2(uTime * 0.08, uTime * 0.12));
                float noiseVal = (n1 + n2) * 0.5; // -1 to 1
                
                // Dark mist color with slight variation
                vec3 fogColor = vec3(0.01, 0.01, 0.02) + vec3(0.02) * noiseVal;
                
                // Apply fog
                gl_FragColor = mix(baseColor, vec4(fogColor, 1.0), fogFactor * 0.98);
            } else {
                gl_FragColor = diffuse;
            }
        }
    `
};

export class RenderManager {
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer;
    public controls: OrbitControls;
    public composer: EffectComposer;
    
    private container: HTMLElement;
    private fogPass: ShaderPass;

    constructor(container: HTMLElement) {
        this.container = container;

        // Scene Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050505); 
        
        // Base fog for far distance (fallback)
        this.scene.fog = new THREE.Fog(0x000000, 30, 60);

        // Camera Setup
        this.camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 200);
        this.camera.position.set(-24, 3.2, 55.0);

        // Renderer Setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
        dirLight.shadow.mapSize.width = 4096;
        dirLight.shadow.mapSize.height = 4096;
        this.scene.add(dirLight);

        // --- POST PROCESSING SETUP ---
        const renderTarget = new THREE.WebGLRenderTarget(
            container.clientWidth,
            container.clientHeight,
            {
                depthTexture: new THREE.DepthTexture(container.clientWidth, container.clientHeight),
                depthBuffer: true
            }
        );

        this.composer = new EffectComposer(this.renderer, renderTarget);
        
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        this.fogPass = new ShaderPass(FogShader);
        this.fogPass.uniforms.cameraNear.value = this.camera.near;
        this.fogPass.uniforms.cameraFar.value = this.camera.far;
        this.fogPass.uniforms.tDepth.value = renderTarget.depthTexture;
        this.fogPass.uniforms.resolution.value.set(container.clientWidth, container.clientHeight);
        
        this.composer.addPass(this.fogPass);
    }

    resize() {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        this.composer.setSize(w, h);
        this.fogPass.uniforms.resolution.value.set(w, h);
    }

    render() {
        this.fogPass.uniforms.uTime.value = performance.now() * 0.001;
        this.composer.render();
    }

    dispose() {
        this.controls.dispose();
        
        // Traverse and dispose of all objects in the scene
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
        if (this.container.contains(this.renderer.domElement)) {
            this.container.removeChild(this.renderer.domElement);
        }
    }

    private disposeMaterial(material: THREE.Material) {
        material.dispose();

        // Dispose of textures
        for (const key in material) {
            const value = (material as any)[key];
            if (value && value instanceof THREE.Texture) {
                value.dispose();
            }
        }
    }
}
