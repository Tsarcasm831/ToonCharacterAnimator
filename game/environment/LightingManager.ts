import * as THREE from 'three';
import { PlayerConfig } from '../../types';
import { SKY_VERTEX_SHADER, SKY_FRAGMENT_SHADER } from './Shaders';

export class LightingManager {
    private scene: THREE.Scene;
    private sunLight: THREE.DirectionalLight;
    private hemiLight: THREE.HemisphereLight;
    private skySphere: THREE.Mesh;
    
    private cycleTimer: number = 0;
    private readonly CYCLE_DURATION = 600; 
    private readonly DAY_RATIO = 0.6;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.initLights();
        this.initSky();
    }

    private initLights() {
        // Hemi Light
        this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        this.hemiLight.position.set(0, 20, 0);
        this.scene.add(this.hemiLight);

        // Sun Light
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.sunLight.position.set(50, 100, 50);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 150;
        this.sunLight.shadow.camera.left = -50;
        this.sunLight.shadow.camera.right = 50;
        this.sunLight.shadow.camera.top = 50;
        this.sunLight.shadow.camera.bottom = -50;
        this.scene.add(this.sunLight);
    }

    private initSky() {
        const uniforms = {
            topColor: { value: new THREE.Color(0x0077ff) },
            bottomColor: { value: new THREE.Color(0xf0f5ff) },
            sunColor: { value: new THREE.Color(0xffffff) },
            sunPos: { value: new THREE.Vector3(1, 1, 1) },
            sunSize: { value: 0.999 }
        };
        
        const skyGeo = new THREE.SphereGeometry(150, 32, 16);
        const skyMat = new THREE.ShaderMaterial({
            vertexShader: SKY_VERTEX_SHADER,
            fragmentShader: SKY_FRAGMENT_SHADER,
            uniforms,
            side: THREE.BackSide,
            fog: false
        });
        this.skySphere = new THREE.Mesh(skyGeo, skyMat);
        this.skySphere.name = 'skysphere';
        this.scene.add(this.skySphere);
    }

    update(dt: number, config: PlayerConfig) {
        this.updateDayNight(dt, config);
    }

    dispose() {
        this.scene.remove(this.hemiLight);
        this.scene.remove(this.sunLight);
        this.scene.remove(this.skySphere);
        this.hemiLight.dispose();
        this.sunLight.dispose();
        this.skySphere.geometry.dispose();
        if (Array.isArray(this.skySphere.material)) {
            this.skySphere.material.forEach(m => m.dispose());
        } else {
            this.skySphere.material.dispose();
        }
    }

    private updateDayNight(dt: number, config: PlayerConfig) {
        if (config.isAutoTime) {
            this.cycleTimer = (this.cycleTimer + dt * config.timeSpeed) % this.CYCLE_DURATION;
            config.timeOfDay = (this.cycleTimer / this.CYCLE_DURATION) * 24.0;
        } else {
            this.cycleTimer = (config.timeOfDay / 24.0) * this.CYCLE_DURATION;
        }

        const cyclePercent = this.cycleTimer / this.CYCLE_DURATION;

        let sunAltitude = 0;
        if (cyclePercent < this.DAY_RATIO) {
            const dayP = cyclePercent / this.DAY_RATIO;
            sunAltitude = Math.sin(dayP * Math.PI);
        } else {
            const nightP = (cyclePercent - this.DAY_RATIO) / (1.0 - this.DAY_RATIO);
            sunAltitude = -Math.sin(nightP * Math.PI);
        }

        const angle = (cyclePercent * Math.PI * 2) - Math.PI / 2;
        const sunX = Math.cos(angle) * 40;
        const sunY = sunAltitude * 40;
        const sunZ = 20;

        // Update Sun
        this.sunLight.position.set(sunX, sunY, sunZ);
        const lightIntensity = Math.max(0, sunAltitude * 0.8 + 0.1);
        this.sunLight.intensity = lightIntensity;
        
        if (sunAltitude > 0 && sunAltitude < 0.2) {
            this.sunLight.color.setHSL(0.08, 0.8, 0.7);
        } else if (sunAltitude <= 0) {
            this.sunLight.color.setHSL(0.6, 0.4, 0.3);
            this.sunLight.intensity = 0.1;
        } else {
            this.sunLight.color.set(0xffffff);
        }

        // Update Sky Shader
        if (this.skySphere.material instanceof THREE.ShaderMaterial) {
            const uniforms = this.skySphere.material.uniforms;
            uniforms.sunPos.value.set(sunX, sunY, sunZ);
            
            let topColor = new THREE.Color();
            let bottomColor = new THREE.Color();
            let sunColor = new THREE.Color();

            // Calculate atmospheric colors based on sun position
            if (sunAltitude > 0.2) {
                topColor.setHex(0x0077ff);
                bottomColor.setHex(0xa0cfff);
                sunColor.setHex(0xffffff);
            } else if (sunAltitude > -0.1) {
                const mix = THREE.MathUtils.clamp((sunAltitude + 0.1) / 0.3, 0, 1);
                topColor.lerpColors(new THREE.Color(0x1a237e), new THREE.Color(0x0077ff), mix);
                bottomColor.lerpColors(new THREE.Color(0xff7043), new THREE.Color(0xa0cfff), mix);
                sunColor.setHex(0xffa726);
            } else {
                topColor.setHex(0x020205);
                bottomColor.setHex(0x050510);
                sunColor.setHex(0x90caf9);
            }

            bottomColor.setHex(0x000000); 

            uniforms.topColor.value.copy(topColor);
            uniforms.bottomColor.value.copy(bottomColor);
            uniforms.sunColor.value.copy(sunColor);
        }

        // Update Hemi
        const hemiIntensity = Math.max(0.1, sunAltitude * 0.5 + 0.3);
        this.hemiLight.intensity = hemiIntensity;
    }
}
