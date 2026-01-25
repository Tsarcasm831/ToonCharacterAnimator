
import React, { useState, useEffect, useRef } from 'react';
import { MenuBackground } from '../menus/MenuBackground';
import { LoginModal } from '../modals/LoginModal';
import { useIsIphoneLayout } from '../../../hooks/useIsIphoneLayout';

export const Home: React.FC = () => {
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const isIphoneLayout = useIsIphoneLayout();
    const keySequenceRef = useRef('');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const images = [
        '/assets/images/lands/Birds.jpg',
        '/assets/images/lands/Cloud.jpg',
        '/assets/images/lands/Earth.jpg',
        '/assets/images/lands/Fire.jpg',
        '/assets/images/lands/Frost.jpg',
        '/assets/images/lands/Ghosts.jpg',
        '/assets/images/lands/Grass.jpg',
        '/assets/images/lands/Hotsprings.jpg',
        '/assets/images/lands/NagaIsland.jpg',
        '/assets/images/lands/Rain.jpg',
        '/assets/images/lands/RicePaddies.jpg',
        '/assets/images/lands/Rivers.jpg',
        '/assets/images/lands/Tea.jpg',
        '/assets/images/lands/Water.jpg',
        '/assets/images/lands/Waterfalls.jpg',
        '/assets/images/lands/Wind.jpg',
        '/assets/images/lands/Woods.jpg',
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [images.length]);

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
                {images.map((src, index) => (
                    <div
                        key={src}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                            index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        <img
                            src={src}
                            alt="Background"
                            className="w-full h-full object-cover opacity-60"
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
