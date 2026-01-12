import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
    isVisible: boolean;
    message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isVisible, message = "Loading Scene..." }) => {
    const [progress, setProgress] = useState(0);
    const [shouldRender, setShouldRender] = useState(isVisible);

    useEffect(() => {
        if (isVisible) {
            setShouldRender(true);
            setProgress(0);
            const interval = setInterval(() => {
                setProgress(prev => Math.min(prev + Math.random() * 30, 90));
            }, 200);
            return () => clearInterval(interval);
        } else {
            setProgress(100);
            const timer = setTimeout(() => setShouldRender(false), 500);
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    if (!shouldRender) return null;

    return (
        <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="relative w-64 h-1 bg-white/10 rounded-full overflow-hidden mb-4">
                <div 
                    className="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <div className="text-white font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">
                {message}
            </div>
        </div>
    );
};

export default LoadingScreen;
