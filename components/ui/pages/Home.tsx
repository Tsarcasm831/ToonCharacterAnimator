
import React, { useState, useEffect, useRef } from 'react';
import { MenuBackground } from '../menus/MenuBackground';
import { LoginModal } from '../modals/LoginModal';
import { useIsIphoneLayout } from '../../../hooks/useIsIphoneLayout';

export const Home: React.FC = () => {
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const isIphoneLayout = useIsIphoneLayout();
    const keySequenceRef = useRef('');

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
                <MenuBackground />
                {isIphoneLayout ? (
                    <div
                        className="absolute inset-0 z-10 flex flex-col items-center justify-between text-white px-6 pt-12 pb-10 text-center"
                        style={{ paddingTop: 'env(safe-area-inset-top)' }}
                    >
                        <div className="space-y-3">
                            <p className="text-[10px] text-slate-400 uppercase tracking-[0.5em]">Command Link</p>
                            <h1 className="text-4xl font-black tracking-tight">HOME</h1>
                            <p className="text-xs text-slate-400 uppercase tracking-[0.3em]">Welcome back, Commander</p>
                        </div>
                        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4">
                            <p className="text-xs text-slate-300 uppercase tracking-[0.3em]">Signal Status</p>
                            <p className="mt-2 text-sm font-bold text-white">Stable • Ready to deploy</p>
                        </div>
                    </div>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 z-10">
                        <h1 className="text-6xl font-black mb-4">HOME</h1>
                        <p className="text-slate-400 uppercase tracking-[0.3em] mb-8">Welcome back, Commander</p>
                    </div>
                )}
            </div>

            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        </div>
    );
};
