import React, { useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { useMusic } from '../../../contexts/MusicContext';

interface MusicFooterProps {
    activePage: string;
}

export const MusicFooter: React.FC<MusicFooterProps> = ({ activePage }) => {
    const { currentTrack, isPlaying, volume, currentTime, duration, togglePlayPause, setVolume, seek } = useMusic();

    // Only show on music page
    if (activePage !== 'music' || !currentTrack) return null;

    const formatTime = (time: number) => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value);
        seek(newTime);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-slate-900/95 backdrop-blur-lg">
            <style>{`
                .slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    background: #a855f7;
                    border-radius: 50%;
                    cursor: pointer;
                    border: 2px solid #ffffff;
                }
                
                .slider::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    background: #a855f7;
                    border-radius: 50%;
                    cursor: pointer;
                    border: 2px solid #ffffff;
                }
            `}</style>
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                    {/* Controls and Progress Bar */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <button
                            onClick={togglePlayPause}
                            className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors"
                        >
                            {isPlaying ? (
                                <Pause className="w-4 h-4 text-white" />
                            ) : (
                                <Play className="w-4 h-4 text-white" />
                            )}
                        </button>
                        
                        <div className="flex items-center gap-2">
                            <Volume2 className="w-4 h-4 text-slate-400" />
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className="w-20 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                            />
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex-1 max-w-md">
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500 w-10 text-right">{formatTime(currentTime)}</span>
                            <input
                                type="range"
                                min="0"
                                max={duration || 0}
                                value={currentTime}
                                onChange={handleSeek}
                                className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <span className="text-xs text-slate-500 w-10">{formatTime(duration)}</span>
                        </div>
                    </div>

                    {/* Track Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="min-w-0 text-right">
                            <p className="text-sm font-bold text-white truncate">{currentTrack.title}</p>
                            <p className="text-xs text-slate-400 truncate">{currentTrack.artist}</p>
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <div className="w-5 h-5 bg-white/20 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
