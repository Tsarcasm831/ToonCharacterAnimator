import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { applyGraphicsSettings } from '../utils/settings.js';
import { getAsset } from '../assets.js';

function setupLights(scene) {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
}

function createPath(scene, currentLevelData) {
    const pathTextureKey = `${currentLevelData.id}_path`;
    const pathTexture = getAsset(pathTextureKey);
    const pathMaterial = new THREE.MeshPhongMaterial({
        map: pathTexture,
        color: pathTexture ? 0xffffff : 0x4a4a4a // Use texture if available, otherwise fallback color
    });
    if (pathTexture) {
        pathTexture.wrapS = THREE.RepeatWrapping;
        pathTexture.wrapT = THREE.RepeatWrapping;
    }

    const borderMaterial = new THREE.MeshPhongMaterial({ color: 0x6a6a6a });
    const borderWidth = 0.2;
    const borderHeight = 0.2;
    const pathBaseY = -0.1;
    const borderY = pathBaseY + borderHeight / 2;

    // Path Segments
    const pathSegments = [
        { size: [3, 0.1, 24], position: [11.5, pathBaseY, 0] }, // Right
        { size: [20, 0.1, 3], position: [0, pathBaseY, -13.5] },  // Top
        { size: [3, 0.1, 24], position: [-11.5, pathBaseY, 0] },  // Left
        // Add corner pieces
        { size: [3, 0.1, 3], position: [11.5, pathBaseY, -13.5] }, // Top-Right Corner
        { size: [3, 0.1, 3], position: [-11.5, pathBaseY, -13.5] }  // Top-Left Corner
    ];

    pathSegments.forEach(seg => {
        const geo = new THREE.BoxGeometry(...seg.size);
        if (pathTexture) {
            // Adjust UVs based on segment size to make texture tiling look good
            const uvs = geo.attributes.uv;
            for (let i = 0; i < uvs.count; i++) {
                 uvs.setXY(i, uvs.getX(i) * seg.size[0] / 4, uvs.getY(i) * seg.size[2] / 4);
            }
        }
        const mesh = new THREE.Mesh(geo, pathMaterial);
        mesh.position.set(...seg.position);
        mesh.receiveShadow = true;
        scene.add(mesh);
    });

    // Add borders
    const borderSegments = [
        // Right path borders
        { size: [0.2, 0.2, 24], position: [10.15, borderY, 0] },
        { size: [0.2, 0.2, 24], position: [12.85, borderY, 0] },
        // Top path borders
        { size: [20, 0.2, 0.2], position: [0, borderY, -14.85] },
        { size: [20, 0.2, 0.2], position: [0, borderY, -12.15] },
        // Left path borders
        { size: [0.2, 0.2, 24], position: [-12.85, borderY, 0] },
        { size: [0.2, 0.2, 24], position: [-10.15, borderY, 0] },
        
        // Corner borders
        // Top-right outer corner
        { size: [3.2, 0.2, 0.2], position: [11.5, borderY, -14.85] },
        { size: [0.2, 0.2, 3.2], position: [12.85, borderY, -13.5] },
        // Top-left outer corner
        { size: [3.2, 0.2, 0.2], position: [-11.5, borderY, -14.85] },
        { size: [0.2, 0.2, 3.2], position: [-12.85, borderY, -13.5] },
        // Top-right inner corner
        { size: [1.3, 0.2, 0.2], position: [10.75, borderY, -12.15] },
        { size: [0.2, 0.2, 1.3], position: [10.15, borderY, -12.75] },
        // Top-left inner corner
        { size: [1.3, 0.2, 0.2], position: [-10.75, borderY, -12.15] },
        { size: [0.2, 0.2, 1.3], position: [-10.15, borderY, -12.75] },
    ];

    borderSegments.forEach(seg => {
        const geo = new THREE.BoxGeometry(...seg.size);
        const mesh = new THREE.Mesh(geo, borderMaterial);
        mesh.position.set(...seg.position);
        mesh.receiveShadow = true;
        scene.add(mesh);
    });

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(35, 35); // Slightly larger
    const groundTextureKey = `${currentLevelData.id}_ground`;
    const groundTexture = getAsset(groundTextureKey);
    
    let groundMat;
    if (groundTexture) {
        groundTexture.wrapS = THREE.RepeatWrapping;
        groundTexture.wrapT = THREE.RepeatWrapping;
        groundTexture.repeat.set(4, 4);
        groundMat = new THREE.MeshPhongMaterial({ map: groundTexture, side: THREE.DoubleSide });
    } else {
        groundMat = new THREE.MeshPhongMaterial({ color: 0x3a4d3b, side: THREE.DoubleSide });
    }
    
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.15; // Lowered slightly
    ground.receiveShadow = true;
    scene.add(ground);
}

export function initScene(currentLevelData) {
    const scene = new THREE.Scene();
    
    // Set background based on selected level
    if (currentLevelData && currentLevelData.background) {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(currentLevelData.background, (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.background = texture;
            scene.environment = texture; // For reflective materials
        });
    } else {
        scene.background = new THREE.Color(0x282c34);
    }
    
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 25, 25);

    const renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('game-canvas'),
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    // Apply graphics settings from the menu
    applyGraphicsSettings(renderer);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.minDistance = 15;
    controls.maxDistance = 50;

    setupLights(scene);
    createPath(scene, currentLevelData);
    
    return { scene, camera, renderer, controls };
}