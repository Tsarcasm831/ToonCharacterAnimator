import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Archer } from '../../game/entities/npc/enemy/Archer';
import { Assassin } from '../../game/entities/npc/enemy/Assassin';
import { Bandit } from '../../game/entities/npc/enemy/Bandit';
import { Berserker } from '../../game/entities/npc/enemy/Berserker';
import { Knight } from '../../game/entities/npc/enemy/Knight';
import { Mage } from '../../game/entities/npc/enemy/Mage';
import { Rogue } from '../../game/entities/npc/enemy/Rogue';
import { Warlock } from '../../game/entities/npc/enemy/Warlock';
import { Paladin } from '../../game/entities/npc/friendly/Paladin';
import { Ranger } from '../../game/entities/npc/friendly/Ranger';
import { Monk } from '../../game/entities/npc/friendly/Monk';
import { Cleric } from '../../game/entities/npc/friendly/Cleric';
import { Sentinel } from '../../game/entities/npc/friendly/Sentinel';
import { EnemyCache } from '../../game/EnemyCache';

interface EnemyPreviewProps {
    type: string;
}

export const EnemyPreview: React.FC<EnemyPreviewProps> = ({ type }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(EnemyCache.getPreview(type));
    const modelRef = useRef<THREE.Group | null>(null);

    // Immediate check for cached preview
    useEffect(() => {
        const cached = EnemyCache.getPreview(type);
        if (cached) {
            setPreviewUrl(cached);
        }
    }, [type]);

    useEffect(() => {
        // If we already have a cached version in state, don't run the heavy logic
        if (previewUrl && EnemyCache.has(type)) {
            return;
        }

        if (!containerRef.current) return;

        const width = 200;
        const height = 200;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const scene = new THREE.Scene();
        // Adjust camera to be closer and more centered on the character
        const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 20);
        camera.position.set(0, 1.2, 3.5); // Center horizontally, lift vertically
        camera.lookAt(0, 0.9, 0); // Look at character's torso area

        const renderer = new THREE.WebGLRenderer({ 
            canvas,
            alpha: true, 
            antialias: true,
            preserveDrawingBuffer: true 
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(1);

        const light = new THREE.DirectionalLight(0xffffff, 2.5);
        light.position.set(5, 10, 7);
        scene.add(light);
        scene.add(new THREE.AmbientLight(0xffffff, 1.2));

        let model: THREE.Group | null = null;
        
        try {
            // Instantiate the enemy class and get its mesh/group
            const dummyScene = new THREE.Scene();
            let enemyInstance: any = null;
            const dummyPos = new THREE.Vector3();

            switch (type) {
                case 'archer': enemyInstance = new Archer(dummyScene, dummyPos); break;
                case 'assassin': enemyInstance = new Assassin(dummyScene, dummyPos); break;
                case 'bandit': enemyInstance = new Bandit(dummyScene, dummyPos); break;
                case 'berserker': enemyInstance = new Berserker(dummyScene, dummyPos); break;
                case 'knight': enemyInstance = new Knight(dummyScene, dummyPos); break;
                case 'mage': enemyInstance = new Mage(dummyScene, dummyPos); break;
                case 'rogue': enemyInstance = new Rogue(dummyScene, dummyPos); break;
                case 'warlock': enemyInstance = new Warlock(dummyScene, dummyPos); break;
                case 'paladin': enemyInstance = new Paladin(dummyScene, dummyPos); break;
                case 'ranger': enemyInstance = new Ranger(dummyScene, dummyPos); break;
                case 'monk': enemyInstance = new Monk(dummyScene, dummyPos); break;
                case 'cleric': enemyInstance = new Cleric(dummyScene, dummyPos); break;
                case 'sentinel': enemyInstance = new Sentinel(dummyScene, dummyPos); break;
            }

            if (enemyInstance && enemyInstance.model && enemyInstance.model.group) {
                model = enemyInstance.model.group;
                
                // Ensure the model is centered and facing the camera
                model.position.set(0, 0, 0);
                model.rotation.set(0, 0, 0); // Face forward for a clean profile
                
                // Force an update to the model to ensure all parts are positioned correctly
                enemyInstance.model.sync(enemyInstance.config, true);
                
                modelRef.current = model;
                scene.add(model);
            }

            renderer.render(scene, camera);
            const dataUrl = canvas.toDataURL('image/png');
            setPreviewUrl(dataUrl);
            EnemyCache.setPreview(type, dataUrl);

        } catch (err) {
            console.error("Failed to render enemy preview:", err);
        } finally {
            // Remove the model from the scene before traversal to avoid disposing shared resources if any
            if (modelRef.current) {
                scene.remove(modelRef.current);
            }

            scene.traverse((object) => {
                if (object instanceof THREE.Mesh) {
                    if (object.geometry) object.geometry.dispose();
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(m => m.dispose());
                        } else {
                            object.material.dispose();
                        }
                    }
                }
            });
            renderer.dispose();
        }
    }, [type, previewUrl]);

    return (
        <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-black/10">
            {previewUrl ? (
                <img 
                    src={previewUrl} 
                    alt={type} 
                    className="w-full h-full object-contain animate-fade-in"
                />
            ) : (
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin opacity-40" />
            )}
        </div>
    );
};
