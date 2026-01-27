
import React, { useState, useEffect, useRef } from 'react';
import { MenuBackground } from '../menus/MenuBackground';
import { LoginModal } from '../modals/LoginModal';
import { useIsIphoneLayout } from '../../../hooks/useIsIphoneLayout';

export const Home: React.FC = () => {
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const isIphoneLayout = useIsIphoneLayout();
    const keySequenceRef = useRef('');
    
    const videos = [
        '/assets/videos/lands/Birds.mp4',
        '/assets/videos/lands/Cloud.mp4',
        '/assets/videos/lands/Earth.mp4',
        '/assets/videos/lands/Fire.mp4',
        '/assets/videos/lands/Frost.mp4',
        '/assets/videos/lands/Ghosts.mp4',
        '/assets/videos/lands/Grass.mp4',
        '/assets/videos/lands/Hotsprings.mp4',
        '/assets/videos/lands/NagaIsland.mp4',
        '/assets/videos/lands/Rain.mp4',
        '/assets/videos/lands/RicePaddies.mp4',
        '/assets/videos/lands/Rivers.mp4',
        '/assets/videos/lands/Tea.mp4',
        '/assets/videos/lands/Water.mp4',
        '/assets/videos/lands/Waterfalls.mp4',
        '/assets/videos/lands/Woods.mp4',
    ];

    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
    const [videoDurations, setVideoDurations] = useState<number[]>(new Array(videos.length).fill(0));
    const [isTransitioning, setIsTransitioning] = useState(false);
    const nextVideoIndex = (currentVideoIndex + 1) % videos.length;

    // Update video durations when loaded
    useEffect(() => {
        videos.forEach((_, index) => {
            const video = videoRefs.current[index];
            if (video && !videoDurations[index]) {
                const handleLoadedMetadata = () => {
                    const newDurations = [...videoDurations];
                    newDurations[index] = video.duration / 0.5; // Adjusted for playback rate
                    setVideoDurations(newDurations);
                    console.log(`Video ${index} duration: ${video.duration}s, adjusted: ${newDurations[index]}s`);
                };
                
                if (video.readyState >= 1) {
                    handleLoadedMetadata();
                } else {
                    video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
                }
            }
        });
    }, [videoRefs.current, videoDurations]);

    // Handle dynamic transitions with fallback
    useEffect(() => {
        const currentDuration = videoDurations[currentVideoIndex];
        const currentVideo = videoRefs.current[currentVideoIndex];
        
        // Fallback: if no duration detected after 3 seconds, use default
        const fallbackTimeout = setTimeout(() => {
            if (currentDuration === 0 && currentVideo) {
                console.log('Using fallback duration for video', currentVideoIndex);
                const newDurations = [...videoDurations];
                newDurations[currentVideoIndex] = 10; // 10 second fallback
                setVideoDurations(newDurations);
            }
        }, 3000);

        return () => clearTimeout(fallbackTimeout);
    }, [currentVideoIndex, videoDurations]);

    // Handle transitions
    useEffect(() => {
        const currentDuration = videoDurations[currentVideoIndex];
        if (currentDuration === 0) return;

        console.log(`Setting transition for video ${currentVideoIndex} in ${currentDuration - 0.5}s`);
        
        const transitionTimeout = setTimeout(() => {
            console.log('Starting transition...');
            const nextVideo = videoRefs.current[nextVideoIndex];
            if (nextVideo) {
                nextVideo.currentTime = 0;
                nextVideo.playbackRate = 0.5;
                nextVideo.play().catch(e => console.log('Video play error:', e));
            }
            setIsTransitioning(true);
            
            // Switch to next video immediately after starting transition
            // The CSS transition will handle the crossfade
            setTimeout(() => {
                console.log('Switching to next video');
                setCurrentVideoIndex(nextVideoIndex);
                setIsTransitioning(false);
            }, 500); // Match the CSS transition duration
        }, (currentDuration - 0.5) * 1000); // Convert to milliseconds

        return () => clearTimeout(transitionTimeout);
    }, [currentVideoIndex, nextVideoIndex, videoDurations, videos.length]);

    // Reset video to beginning when it becomes active
    useEffect(() => {
        const currentVideo = videoRefs.current[currentVideoIndex];
        if (currentVideo) {
            currentVideo.currentTime = 0;
            currentVideo.playbackRate = 0.5;
            currentVideo.play().catch(e => console.log('Video play error:', e));
        }
    }, [currentVideoIndex]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            console.log('Key down:', event.key, 'NODE_ENV:', import.meta.env.MODE);
            
            // Check for development mode or allow for testing
            const isDev = import.meta.env.MODE === 'development' || import.meta.env.DEV;
            if (!isDev) {
                console.log('Not in development mode, current mode:', import.meta.env.MODE);
                return;
            }
            
            console.log('Key pressed:', event.key);
            const newSequence = (keySequenceRef.current + event.key).slice(-3);
            keySequenceRef.current = newSequence;
            console.log('Current sequence:', newSequence);
            
            if (newSequence === '777') {
                console.log('Shop unlocked!');
                window.dispatchEvent(new CustomEvent('shopUnlocked'));
                keySequenceRef.current = '';
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="w-full h-full flex flex-col items-center justify-start relative">
            <div className="w-full flex-1 bg-black border-x border-t border-white/10 shadow-2xl overflow-hidden relative group">
                {videos.map((src, index) => (
                    <div
                        key={src}
                        className={`absolute inset-0 transition-opacity ${
                            isTransitioning ? 'duration-500' : 'duration-0'
                        } ease-in-out ${
                            index === currentVideoIndex
                                ? (isTransitioning ? 'opacity-0' : 'opacity-100')
                                : index === nextVideoIndex
                                    ? (isTransitioning ? 'opacity-100' : 'opacity-0')
                                    : 'opacity-0'
                        }`}
                    >
                        <video
                            ref={(el) => { videoRefs.current[index] = el; }}
                            src={src}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover opacity-60"
                            onLoadedData={() => {
                                const video = videoRefs.current[index];
                                if (video) {
                                    video.currentTime = 0;
                                    video.playbackRate = 0.5;
                                }
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
                    </div>
                ))}
                {isIphoneLayout ? (
                    <div
                        className="absolute inset-0 z-10 flex flex-col items-center justify-between text-white px-6 pt-12 pb-10 text-center"
                        style={{ paddingTop: 'env(safe-area-inset-top)' }}
                    >
                        <div className="space-y-3">
                            <p className="text-[10px] text-indigo-400 uppercase tracking-[0.5em] font-bold">LordTsarcasm.com</p>
                            <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">WELCOME</h1>
                            <div className="space-y-1">
                                <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em]">Home of</p>
                                <p className="text-xs text-indigo-300 font-bold uppercase tracking-[0.3em]">RootWraith Studios</p>
                                <p className="text-[10px] text-slate-500 italic tracking-widest">&</p>
                                <p className="text-xs text-rose-400 font-bold uppercase tracking-[0.3em]">Sairon RPG</p>
                            </div>
                        </div>
                        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4">
                            <p className="text-xs text-slate-300 uppercase tracking-[0.3em]">Signal Status</p>
                            <p className="mt-2 text-sm font-bold text-white">Stable • Ready to deploy</p>
                        </div>
                    </div>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 z-10 text-center">
                        <p className="text-sm text-indigo-400 uppercase tracking-[0.8em] mb-2 font-bold opacity-80">LordTsarcasm.com</p>
                        <h1 className="text-7xl font-black mb-6 tracking-tighter bg-gradient-to-br from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
                            WELCOME
                        </h1>
                        <div className="flex flex-col items-center space-y-4">
                            <p className="text-slate-400 uppercase tracking-[0.4em] text-xs">The Proving Grounds of</p>
                            <div className="flex items-center space-x-8">
                                <div className="flex flex-col items-center">
                                    <span className="text-xl font-bold tracking-[0.3em] text-indigo-300">ROOTWRAITH</span>
                                    <span className="text-[10px] text-indigo-500/60 uppercase tracking-[0.2em]">Studios</span>
                                </div>
                                <div className="h-8 w-[1px] bg-white/10 rotate-12"></div>
                                <div className="flex flex-col items-center">
                                    <span className="text-xl font-bold tracking-[0.3em] text-rose-500">SAIRON</span>
                                    <span className="text-[10px] text-rose-700/60 uppercase tracking-[0.2em]">RPG</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        </div>
    );
};
