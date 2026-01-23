
import React, { useState } from 'react';
import { MenuBackground } from './MenuBackground';
import { LoginModal } from './LoginModal';

export const Home: React.FC = () => {
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    return (
        <div className="w-full h-full flex flex-col items-center justify-start relative">
            <div className="w-full flex-1 bg-black border-x border-t border-white/10 shadow-2xl overflow-hidden relative group">
                <MenuBackground />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 z-10">
                    <h1 className="text-6xl font-black mb-4">HOME</h1>
                    <p className="text-slate-400 uppercase tracking-[0.3em] mb-8">Welcome back, Commander</p>
                    
                    <button 
                        onClick={() => setIsLoginOpen(true)}
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg font-bold uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 hover:from-blue-500 hover:to-blue-400 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        Login
                    </button>
                </div>
            </div>

            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        </div>
    );
};
