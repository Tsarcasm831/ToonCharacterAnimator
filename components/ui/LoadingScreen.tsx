
import React, { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { PlayerModel } from '../../game/PlayerModel';
import { MovementAction } from '../../game/animator/actions/MovementAction';
import { DEFAULT_CONFIG } from '../../types';

interface LoadingScreenProps {
    isVisible: boolean;
    isSystemReady: boolean; // Passed from App to indicate environment build is done
    onFinished?: () => void;
}

const MESSAGES = [
    "Initializing Render Engine...",
    "Building Procedural Biomes...",
    "Generating Terrain Textures...",
    "Instancing Flora Systems...",
    "Populating Wildlife...",
    "Simulating Physics Mesh...",
    "Finalizing World Geometry...",
    "System Synchronized."
];

const LoadingRunner: React.FC<{ progress: number }> = ({ progress }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<{
        renderer: THREE.WebGLRenderer;
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        model: PlayerModel;
        clock: THREE.Clock;
    } | null>(null);

    useEffect(() => {
        if (!mountRef.current) return;

        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
        camera.position.set(0, 1.2, 5.5);
        camera.lookAt(0, 0.8, 0);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mountRef.current.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 1.2));
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(2, 5, 5);
        scene.add(dirLight);

        // Character without pants (Naked variant shows base underwear)
        const config = { 
            ...DEFAULT_CONFIG, 
            outfit: 'naked' as const,
            equipment: { ...DEFAULT_CONFIG.equipment, pants: false, shoes: false, shirt: false, mask: false, hood: false },
            bodyVariant: 'slim' as const,
            skinColor: '#ffdbac'
        };
        const model = new PlayerModel(config);
        // Face forward progress (Right)
        model.group.rotation.y = Math.PI / 2;
        scene.add(model.group);

        const clock = new THREE.Clock();
        sceneRef.current = { renderer, scene, camera, model, clock };

        let frameId: number;
        const mockInput = { x: 0, y: -1, isRunning: true };
        const mockPlayer = {
            config,
            walkTime: 0,
            lastStepCount: 0,
            didStep: false,
            isPureStrafe: false,
            isJumping: false,
            isCombatStance: false,
            model
        };

        const animate = () => {
            frameId = requestAnimationFrame(animate);
            const dt = sceneRef.current?.clock.getDelta() || 0.016;
            
            MovementAction.animate(mockPlayer, model.parts, dt, 0.1, mockInput as any);
            model.update(dt, new THREE.Vector3(0, 0, 0));
            model.sync(config, false);

            renderer.render(scene, camera);
        };

        animate();

        return () => {
            cancelAnimationFrame(frameId);
            renderer.dispose();
            if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
                mountRef.current.removeChild(renderer.domElement);
            }
        };
    }, []);

    return (
        <div 
            ref={mountRef} 
            className="absolute top-[-100px] w-32 h-32 pointer-events-none z-10"
            style={{ 
                left: `${progress}%`,
                transform: 'translateX(-50%)',
                transition: 'left 0.1s linear'
            }}
        />
    );
};

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isVisible, isSystemReady, onFinished }) => {
    const [runnerProgress, setRunnerProgress] = useState(0);
    const [messageIndex, setMessageIndex] = useState(0);
    const [shouldRender, setShouldRender] = useState(isVisible);
    const hasCalledFinished = useRef(false);

    useEffect(() => {
        if (isVisible) {
            setShouldRender(true);
            setRunnerProgress(0);
            setMessageIndex(0);
            hasCalledFinished.current = false;

            // Runner progress simulation
            const interval = setInterval(() => {
                setRunnerProgress(prev => {
                    if (prev >= 100) return 100;
                    return prev + 0.8; // Approx 6 seconds to fill
                });
            }, 50);

            // Message cycling
            const msgInterval = setInterval(() => {
                setMessageIndex(prev => Math.min(prev + 1, MESSAGES.length - 1));
            }, 800);

            return () => {
                clearInterval(interval);
                clearInterval(msgInterval);
            };
        } else {
            const timer = setTimeout(() => setShouldRender(false), 500);
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    // Check completion gate
    useEffect(() => {
        if (runnerProgress >= 100 && isSystemReady && !hasCalledFinished.current) {
            // Add a small artificial delay to ensure everything is settled visually
            const settleTimeout = setTimeout(() => {
                hasCalledFinished.current = true;
                onFinished?.();
            }, 500);
            return () => clearTimeout(settleTimeout);
        }
    }, [runnerProgress, isSystemReady, onFinished]);

    if (!shouldRender) return null;

    return (
        <div className={`fixed inset-0 z-[150] flex flex-col items-center justify-center bg-slate-950 transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="relative w-full max-w-2xl px-12 flex flex-col items-center">
                
                {/* Secondary Loading Track with Runner */}
                <div className="relative w-full h-1.5 bg-white/5 rounded-full mb-12">
                    <div className="absolute -top-6 left-0 text-[8px] font-black text-blue-500/50 uppercase tracking-widest">
                        Secondary Runner Track
                    </div>

                    <div 
                        className="absolute inset-y-0 left-0 bg-blue-500/20 blur-sm transition-all duration-300"
                        style={{ width: `${runnerProgress}%` }}
                    />
                    <div 
                        className="absolute inset-y-0 left-0 bg-blue-600 transition-all duration-300 shadow-[0_0_10px_#2563eb]"
                        style={{ width: `${runnerProgress}%` }}
                    />
                    
                    <LoadingRunner progress={runnerProgress} />
                </div>

                {/* Primary System Status Bar */}
                <div className="relative w-72 h-1 bg-white/10 rounded-full overflow-hidden mb-6 shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-white/5">
                    <div 
                        className={`absolute inset-y-0 left-0 transition-all duration-1000 ease-out ${isSystemReady ? 'bg-green-500 shadow-[0_0_15px_#22c55e] w-full' : 'bg-blue-400 w-4/5 animate-pulse'}`}
                    />
                </div>

                <div className="flex flex-col items-center gap-2">
                    <div className="text-white font-black uppercase tracking-[0.6em] text-[11px] animate-pulse drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                        {isSystemReady && runnerProgress >= 100 ? "Ready to begin" : MESSAGES[messageIndex]}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${isSystemReady ? 'text-green-500' : 'text-slate-600'}`}>
                            Assets: {isSystemReady ? 'Loaded' : 'Mounting...'}
                        </div>
                        <div className="w-[1px] h-3 bg-white/10" />
                        <div className="text-blue-500 font-mono text-[9px] font-bold uppercase tracking-widest">
                            Runner: {Math.floor(runnerProgress)}%
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-12 flex flex-col items-center gap-4 opacity-30">
                <div className="flex items-center gap-6">
                    <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-white" />
                    <span className="text-[9px] font-black uppercase tracking-[0.8em] text-white">Interactive Character Studio</span>
                    <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-white" />
                </div>
                <div className="text-[8px] font-mono text-slate-500 tracking-tighter">
                    VIRTUAL_BUFFER_0x{Math.floor(runnerProgress * 2.5).toString(16).toUpperCase()}
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
