
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { ObjectFactory } from '../../game/environment/ObjectFactory';

interface AnimalPreviewProps {
    type: string;
}

export const AnimalPreview: React.FC<AnimalPreviewProps> = ({ type }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const frameIdRef = useRef<number>(0);

    useEffect(() => {
        if (!containerRef.current) return;

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 20);
        camera.position.set(0, 1.5, 3.5);
        camera.lookAt(0, 0.5, 0);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(1);
        containerRef.current.appendChild(renderer.domElement);

        const light = new THREE.DirectionalLight(0xffffff, 2.0);
        light.position.set(2, 4, 3);
        scene.add(light);
        scene.add(new THREE.AmbientLight(0xffffff, 0.8));

        let model: THREE.Group | null = null;
        const t = type.toLowerCase();
        
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
            scene.add(model);
        }

        const animate = () => {
            frameIdRef.current = requestAnimationFrame(animate);
            if (model) model.rotation.y += 0.01;
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(frameIdRef.current);
            if (rendererRef.current && containerRef.current) {
                containerRef.current.removeChild(rendererRef.current.domElement);
                rendererRef.current.dispose();
            }
        };
    }, [type]);

    return <div ref={containerRef} className="w-full h-full" />;
};
