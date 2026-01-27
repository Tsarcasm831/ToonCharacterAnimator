
import React, { useEffect, useState, useRef, CSSProperties } from 'react';
import * as THREE from 'three';
import { PlayerModel } from '../../../game/model/PlayerModel';
import { MovementAction } from '../../../game/animator/actions/MovementAction';
import { DEFAULT_CONFIG } from '../../../types';

interface LoadingScreenProps {
    isVisible: boolean;
    isSystemReady: boolean; // Passed from App to indicate environment build is done
    onFinished?: () => void;
    onVideoStable?: () => void; // Callback when video is playing and stable
    isLoadingScene?: boolean; // Scene initialization in progress
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

interface LoadingRunnerProps {
    progress: number;
    progressScale?: number;
    mirror?: boolean;
    className?: string;
    style?: CSSProperties;
}

const LoadingRunner: React.FC<LoadingRunnerProps> = ({ 
    progress, 
    progressScale = 1, 
    mirror = false, 
    className = '', 
    style = {}
}) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<{
        renderer: THREE.WebGLRenderer;
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        model: PlayerModel;
        clock: THREE.Clock;
    } | null>(null);

    useEffect(() => {
        const mountNode = mountRef.current;
        if (!mountNode) return;

        // Force explicit dimensions for the mount node if they aren't set
        if (mountNode.clientWidth === 0) {
            mountNode.style.width = '100px';
            mountNode.style.height = '100px';
        }

        const width = mountNode.clientWidth || 100;
        const height = mountNode.clientHeight || 100;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
        camera.position.set(0, 1.2, 5.5);
        camera.lookAt(0, 0.8, 0);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mountNode.appendChild(renderer.domElement);

        const disposeRenderer = () => {
            if (renderer) {
                renderer.dispose();
                renderer.forceContextLoss();
                if (renderer.domElement && renderer.domElement.parentNode === mountNode) {
                    mountNode.removeChild(renderer.domElement);
                }
            }
        };

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
        // Face progress direction
        model.group.rotation.y = mirror ? -Math.PI / 2 : Math.PI / 2;
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
            disposeRenderer();
        };
    }, [mirror]);

    const clamped = Math.min(100, Math.max(0, progress * progressScale));

    return (
        <div 
            ref={mountRef} 
            className={`z-10 ${className}`}
            style={{ 
                position: 'absolute',
                left: `${clamped}%`,
                bottom: '100%',
                transform: 'translateX(-50%)',
                transition: 'left 0.12s linear',
                width: '96px',
                height: '96px',
                display: 'block',
                visibility: 'visible',
                pointerEvents: 'none',
                ...style
            }}
        />
    );
};

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isVisible, isSystemReady, onFinished, onVideoStable, isLoadingScene = false }) => {
    const [runnerProgress, setRunnerProgress] = useState(0);
    const [messageIndex, setMessageIndex] = useState(0);
    const [shouldRender, setShouldRender] = useState(isVisible);
    const [isEnemiesPreloaded, setIsEnemiesPreloaded] = useState(false);
    const [showClickToStart, setShowClickToStart] = useState(false);
    const [isVideoReady, setIsVideoReady] = useState(false);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [isFullyLoaded, setIsFullyLoaded] = useState(false);
    const [showRunnerTrack, setShowRunnerTrack] = useState(false);
    const [showLoadingTrack, setShowLoadingTrack] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const hasCalledFinished = useRef(false);
    const sequenceTimers = useRef<number[]>([]);

    useEffect(() => {
        if (isVisible) {
            setShouldRender(true);
            setRunnerProgress(0);
            setMessageIndex(0);
            hasCalledFinished.current = false;
            setIsEnemiesPreloaded(false);
            setShowClickToStart(false);
            setIsVideoReady(false);
            setIsVideoPlaying(false);
            setIsFullyLoaded(false);
            setShowRunnerTrack(false);
            setShowLoadingTrack(false);
            setLoadingProgress(0);

            return () => {
                sequenceTimers.current.forEach((timer) => window.clearTimeout(timer));
                sequenceTimers.current = [];
            };
        } else {
            const timer = setTimeout(() => setShouldRender(false), 500);
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    const videoRef = useRef<HTMLVideoElement>(null);

    // Handle video start and preload enemies after video starts playing
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Auto-show tracks even if video hasn't played yet to avoid hanging on load
        const trackTimeout1 = window.setTimeout(() => {
            setShowRunnerTrack(true);
        }, 150);
        const trackTimeout2 = window.setTimeout(() => {
            setShowLoadingTrack(true);
        }, 650);
        sequenceTimers.current.push(trackTimeout1, trackTimeout2);

        const handlePlay = () => {
            setIsVideoPlaying(true);
            
            // Notify parent that video is stable after a short delay
            const stableTimeout = window.setTimeout(() => {
                onVideoStable?.();
            }, 500);
            sequenceTimers.current.push(stableTimeout);
            
            // Start loading enemies in chunks to reduce resource contention
            const loadEnemiesInChunks = async () => {
                // Skip enemy preloading during loading to avoid blocking
                // Enemies will be lazy-loaded when first encountered
                console.log('Skipping enemy preloading - will lazy load on demand');
                setIsEnemiesPreloaded(true);
            };
            
            loadEnemiesInChunks();
        };

        const handleCanPlayThrough = () => {
            setIsVideoReady(true);
        };

        video.addEventListener('play', handlePlay);
        video.addEventListener('canplaythrough', handleCanPlayThrough);

        // Fallback for video ready
        const videoFallback = setTimeout(() => {
            if (!isVideoReady) setIsVideoReady(true);
            if (!isVideoPlaying) setIsVideoPlaying(true);
        }, 2000);
        sequenceTimers.current.push(videoFallback as unknown as number);

        return () => {
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('canplaythrough', handleCanPlayThrough);
        };
    }, []);

    useEffect(() => {
        if (!showLoadingTrack || !isVisible) return;

        const interval = window.setInterval(() => {
            setLoadingProgress((prev) => {
                if (isSystemReady) return 100;
                const next = prev + 1.2;
                return Math.min(92, next);
            });
        }, 120);

        return () => window.clearInterval(interval);
    }, [showLoadingTrack, isVisible, isSystemReady]);

    useEffect(() => {
        if (isSystemReady) {
            setLoadingProgress(100);
            setMessageIndex(MESSAGES.length - 1);
        }
    }, [isSystemReady]);

    useEffect(() => {
        if (!showLoadingTrack || !isVisible) return;
        const msgInterval = setInterval(() => {
            setMessageIndex(prev => Math.min(prev + 1, MESSAGES.length - 1));
        }, 800);

        return () => clearInterval(msgInterval);
    }, [showLoadingTrack, isVisible]);

    useEffect(() => {
        if (!showRunnerTrack || !isVisible) return;

        const interval = window.setInterval(() => {
            setRunnerProgress((prev) => {
                const baseTarget = showLoadingTrack ? Math.max(10, loadingProgress * 0.9) : 15;
                const target = isSystemReady ? 100 : Math.min(95, baseTarget);
                const step = isSystemReady ? 4 : 1.2; // Larger steps
                return Math.min(target, prev + step);
            });
        }, 120); // Slower interval (was 60)

        return () => window.clearInterval(interval);
    }, [showRunnerTrack, showLoadingTrack, isVisible, loadingProgress, isSystemReady]);

    // Check completion gate
    useEffect(() => {
        if (isSystemReady && loadingProgress >= 100 && runnerProgress >= 100 && !isFullyLoaded) {
            setIsFullyLoaded(true);
            // Small extra delay to ensure everything is really settled
            const settleTimeout = window.setTimeout(() => {
                setShowClickToStart(true);
            }, 200);
            sequenceTimers.current.push(settleTimeout);
        }
    }, [isSystemReady, loadingProgress, runnerProgress, isFullyLoaded]);

    if (!shouldRender) return null;

    return (
        <div className={`absolute inset-0 z-[150] flex flex-col items-center justify-center transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0">
                <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                    loop
                    preload="auto"
                >
                    <source src="/assets/videos/loading_compressed.mp4" type="video/mp4" />
                </video>
            </div>
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative w-full max-w-2xl px-12 flex flex-col items-center">
                <div className="h-[20vh]" />
                
                {!isVideoReady ? (
                    <div className="text-white/80 font-black uppercase tracking-[0.6em] text-[11px] animate-pulse">
                        Loading Cinematic...
                    </div>
                ) : !isVideoPlaying ? (
                    <div className="text-white/80 font-black uppercase tracking-[0.6em] text-[11px] animate-pulse">
                        Preparing Assets...
                    </div>
                ) : (
                    <>
                        {isLoadingScene && (
                            <div className="text-white/80 font-black uppercase tracking-[0.6em] text-[11px] animate-pulse mb-6">
                                Initializing Scene...
                            </div>
                        )}

                        {/* Secondary Loading Track with Runner */}
                        {showRunnerTrack && (
                            <div className="relative w-full h-1.5 bg-white/5 rounded-full mb-8">
                                <div 
                                    className="absolute inset-y-0 left-0 bg-blue-500/20 blur-sm transition-[width] duration-[120ms] ease-linear"
                                    style={{ width: `${runnerProgress}%` }}
                                />
                                <div 
                                    className="absolute inset-y-0 left-0 bg-blue-600 transition-[width] duration-[120ms] ease-linear shadow-[0_0_10px_#2563eb]"
                                    style={{ width: `${runnerProgress}%` }}
                                />
                                
                                {runnerProgress < 100 && (
                                    <LoadingRunner 
                                        progress={runnerProgress} 
                                        className="w-24 h-24" 
                                    />
                                )}
                            </div>
                        )}

                        {/* Primary System Status Bar */}
                        {showLoadingTrack && (
                            <div className="relative w-80 h-1.5 bg-white/10 rounded-full mb-6 shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-white/5">
                                <div 
                                    className="absolute inset-y-0 left-0 bg-green-500/80 shadow-[0_0_15px_#22c55e] transition-[width] duration-[200ms] ease-linear"
                                    style={{ width: `${loadingProgress}%` }}
                                />
                            </div>
                        )}

                        <div className="flex flex-col items-center gap-4">
                            {showClickToStart ? (
                                <button
                                    className="px-12 py-4 bg-white text-black font-black text-xl uppercase tracking-widest rounded-full hover:bg-blue-500 hover:text-white transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] active:scale-95 transform hover:-translate-y-1 animate-pulse"
                                    onClick={() => {
                                        hasCalledFinished.current = true;
                                        onFinished?.();
                                    }}
                                >
                                    Click to Start
                                </button>
                            ) : (
                                <div className="text-white font-black uppercase tracking-[0.6em] text-[11px] animate-pulse drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                                    {showLoadingTrack ? (isSystemReady && runnerProgress >= 100 ? "Finalizing..." : MESSAGES[messageIndex]) : "Booting World Systems..."}
                                </div>
                            )}
                            <div className="flex items-center gap-4">
                                <div className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${isSystemReady ? 'text-green-500' : 'text-slate-600'}`}>
                                    Assets: {isSystemReady ? 'Loaded' : 'Mounting...'}
                                </div>
                                <div className="w-[1px] h-3 bg-white/10" />
                                <div className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${isEnemiesPreloaded ? 'text-green-500' : 'text-slate-600'}`}>
                                    Bestiary: {isEnemiesPreloaded ? 'Preloaded' : 'Indexing...'}
                                </div>
                                <div className="w-[1px] h-3 bg-white/10" />
                                <div className="text-blue-500 font-mono text-[9px] font-bold uppercase tracking-widest">
                                    Runner: {Math.floor(runnerProgress)}%
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="absolute bottom-12 flex flex-col items-center gap-4 opacity-30">
                <div className="flex items-center gap-6">
                    <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-white" />
                    <span className="text-[9px] font-black uppercase tracking-[0.8em] text-white">© Lord Tsarcasm 2026</span>
                    <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-white" />
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
