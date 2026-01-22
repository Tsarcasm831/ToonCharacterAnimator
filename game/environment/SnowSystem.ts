
import * as THREE from 'three';

const SNOW_VERTEX_SHADER = `
uniform float uTime;
uniform float uIntensity; 
uniform float uGaleForce; 
uniform float uPresence; 
attribute float size;
attribute float speed;
attribute vec3 offset; 

varying float vOpacity;

void main() {
    vec3 pos = position;
    float boxWidth = 40.0;
    float boxHeight = 25.0; 
    
    float fallSpeed = mix(0.8, 3.5, uIntensity);
    float fallDistance = uTime * speed * fallSpeed;
    
    pos.y = mod(pos.y - fallDistance, boxHeight);
    
    float driftX = sin(uTime * 0.2 + offset.x) * 1.0 * uIntensity;
    float driftZ = cos(uTime * 0.15 + offset.z) * 1.0 * uIntensity;
    
    float windDirectional = uGaleForce * 6.0; 
    float windTurbulence = sin(uTime * 0.8 + pos.y * 0.2) * 1.5 * uGaleForce;
    
    pos.x = mod(pos.x + driftX + windDirectional + windTurbulence + (boxWidth * 0.5), boxWidth) - (boxWidth * 0.5);
    pos.z = mod(pos.z + driftZ + (boxWidth * 0.5), boxWidth) - (boxWidth * 0.5);
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float finalSize = size * mix(0.6, 1.3, uIntensity);
    gl_PointSize = finalSize * (350.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
    
    float vFade = smoothstep(0.0, 3.0, pos.y) * smoothstep(boxHeight, boxHeight - 3.0, pos.y);
    float edgeX = 1.0 - abs(pos.x / (boxWidth * 0.5));
    float edgeZ = 1.0 - abs(pos.z / (boxWidth * 0.5));
    float hFade = smoothstep(0.0, 0.1, edgeX) * smoothstep(0.0, 0.1, edgeZ);
    
    vOpacity = uIntensity * vFade * hFade * uPresence;
}
`;

const SNOW_FRAGMENT_SHADER = `
varying float vOpacity;

void main() {
    if (vOpacity < 0.01) discard;
    vec2 uv = gl_PointCoord.xy - 0.5;
    float dist = length(uv);
    float alpha = smoothstep(0.5, 0.4, dist) * vOpacity;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(0.95, 0.98, 1.0, alpha);
}
`;

type WeatherState = 'NONE' | 'LIGHT' | 'STORM' | 'GALE';

export class SnowSystem {
    private particleSystem: THREE.Points;
    private count = 1200; // Optimized count
    private weatherTimer = 0;
    private targetIntensity = 0.2;
    private currentIntensity = 0;
    private targetGale = 0;
    private currentGale = 0;
    private presence = 0; 
    private state: WeatherState = 'LIGHT';

    constructor(parent: THREE.Object3D) {
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(this.count * 3);
        const sizes = new Float32Array(this.count);
        const speeds = new Float32Array(this.count);
        const offsets = new Float32Array(this.count * 3);

        const range = 40; 
        const height = 25;

        for (let i = 0; i < this.count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * range;
            positions[i * 3 + 1] = Math.random() * height;
            positions[i * 3 + 2] = (Math.random() - 0.5) * range;
            
            sizes[i] = 1.2 + Math.random() * 2.0;
            speeds[i] = 0.7 + Math.random() * 0.6;

            offsets[i * 3] = Math.random() * Math.PI * 2;
            offsets[i * 3 + 1] = Math.random() * Math.PI * 2;
            offsets[i * 3 + 2] = Math.random() * Math.PI * 2;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geo.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
        geo.setAttribute('offset', new THREE.BufferAttribute(offsets, 3));

        const mat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uIntensity: { value: 0.2 },
                uGaleForce: { value: 0.0 },
                uPresence: { value: 0.0 }
            },
            vertexShader: SNOW_VERTEX_SHADER,
            fragmentShader: SNOW_FRAGMENT_SHADER,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        this.particleSystem = new THREE.Points(geo, mat);
        this.particleSystem.position.set(0, 0, -40); 
        parent.add(this.particleSystem);
        this.setWeather('LIGHT');
    }

    private setWeather(state: WeatherState) {
        this.state = state;
        switch(state) {
            case 'NONE': this.targetIntensity = 0.0; this.targetGale = 0.0; break;
            case 'LIGHT': this.targetIntensity = 0.25; this.targetGale = 0.0; break;
            case 'STORM': this.targetIntensity = 0.5; this.targetGale = 0.25; break;
            case 'GALE': this.targetIntensity = 0.8; this.targetGale = 0.6; break;
        }
    }

    update(dt: number, playerPosition: THREE.Vector3) {
        this.weatherTimer += dt;
        if (this.weatherTimer > 60 + Math.random() * 60) {
            this.weatherTimer = 0;
            const states: WeatherState[] = ['NONE', 'LIGHT', 'STORM', 'GALE'];
            this.setWeather(states[Math.floor(Math.random() * states.length)]);
        }

        const inSnowBiome = playerPosition.x >= -20 && playerPosition.x <= 20 &&
                            playerPosition.z >= -60 && playerPosition.z <= -20;
        
        const presenceTarget = inSnowBiome ? 1.0 : 0.0;
        this.presence = THREE.MathUtils.lerp(this.presence, presenceTarget, dt * 0.8);

        const transitionSpeed = 0.1 * dt;
        this.currentIntensity = THREE.MathUtils.lerp(this.currentIntensity, this.targetIntensity, transitionSpeed);
        this.currentGale = THREE.MathUtils.lerp(this.currentGale, this.targetGale, transitionSpeed);

        const mat = this.particleSystem.material as THREE.ShaderMaterial;
        mat.uniforms.uTime.value += dt;
        mat.uniforms.uIntensity.value = this.currentIntensity;
        mat.uniforms.uGaleForce.value = this.currentGale;
        mat.uniforms.uPresence.value = this.presence;
        
        this.particleSystem.visible = this.presence > 0.001 && this.currentIntensity > 0.01;
    }

    dispose() {
        this.particleSystem.geometry.dispose();
        if (Array.isArray(this.particleSystem.material)) {
            this.particleSystem.material.forEach(m => m.dispose());
        } else {
            this.particleSystem.material.dispose();
        }
    }
}
