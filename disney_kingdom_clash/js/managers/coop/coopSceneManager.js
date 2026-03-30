import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

function setupLights(scene) {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
}

function createCoopPath(scene) {
    const pathMaterial = new THREE.MeshPhongMaterial({ color: 0x444444, side: THREE.DoubleSide });
    const stemGeo = new THREE.BoxGeometry(22, 0.2, 4);
    const stemMesh = new THREE.Mesh(stemGeo, pathMaterial);
    stemMesh.position.set(-2, 0, 0);
    stemMesh.receiveShadow = true;
    scene.add(stemMesh);

    const barGeo = new THREE.BoxGeometry(4, 0.2, 50);
    const barMesh = new THREE.Mesh(barGeo, pathMaterial);
    barMesh.position.set(-13, 0, 0);
    barMesh.receiveShadow = true;
    scene.add(barMesh);

    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshPhongMaterial({ color: 0x3a4d3b, side: THREE.DoubleSide });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.15;
    ground.receiveShadow = true;
    scene.add(ground);
}

export function initScene() {
    const canvas = document.getElementById('game-canvas');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a2b34);
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 35, 30);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.minDistance = 15;
    controls.maxDistance = 60;
    
    setupLights(scene);
    createCoopPath(scene);
    
    return { scene, camera, renderer, controls };
}

