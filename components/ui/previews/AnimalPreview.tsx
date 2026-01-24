
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { ObjectFactory } from '../../../game/environment/ObjectFactory';

interface AnimalPreviewProps {
    type: string;
}

export const AnimalPreview: React.FC<AnimalPreviewProps> = ({ type }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const width = 200;
        const height = 200;

        // Use a temporary canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 20);
        camera.position.set(2.5, 2.0, 3.5);
        camera.lookAt(0, 0.5, 0);

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
        const t = type.toLowerCase();
        
        try {
            switch (t) {
                case 'wolf': model = ObjectFactory.createWolfModel(0x666666).group; break;
                case 'bear': model = ObjectFactory.createBearModel(0x5C4033).group; break;
                case 'owl': model = ObjectFactory.createOwlModel(0x8B4513).group; break;
                case 'yeti': model = ObjectFactory.createBearModel(0xEEFFFF).group; break;
                case 'deer': model = ObjectFactory.createDeerModel(0xC19A6B).group; break;
                case 'chicken': model = ObjectFactory.createChickenModel(0xFFFFFF).group; break;
                case 'pig': model = ObjectFactory.createPigModel(0xFFC0CB).group; break;
                case 'sheep': model = ObjectFactory.createSheepModel(0xFFFDD0).group; break;
                case 'spider': model = ObjectFactory.createSpiderModel(0x1a1a1a).group; break;
                case 'lizard': model = ObjectFactory.createLizardModel(0x6B8E23).group; break;
                case 'horse': model = ObjectFactory.createHorseModel(0x8B4513).group; break;
            }

            if (model) {
                model.position.y = 0;
                if (t === 'owl') model.position.y = 0.5;
                if (t === 'yeti') model.scale.setScalar(0.7);
                if (t === 'horse' || t === 'deer') model.scale.setScalar(0.8);
                model.rotation.y = Math.PI / 4;
                scene.add(model);
            }

            renderer.render(scene, camera);
            setPreviewUrl(canvas.toDataURL('image/png'));

        } catch (err) {
            console.error("Failed to render animal preview:", err);
        } finally {
            // Aggressive Cleanup
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
    }, [type]);

    return (
        <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-black/20">
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
