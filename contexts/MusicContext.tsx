import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';

interface Track {
    id: string;
    title: string;
    artist: string;
    duration: string;
    fileUrl: string;
}

interface MusicContextType {
    currentTrack: Track | null;
    isPlaying: boolean;
    volume: number;
    currentTime: number;
    duration: number;
    playTrack: (track: Track) => void;
    togglePlayPause: () => void;
    setVolume: (volume: number) => void;
    seek: (time: number) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const useMusic = () => {
    const context = useContext(MusicContext);
    if (!context) {
        throw new Error('useMusic must be used within a MusicProvider');
    }
    return context;
};

interface MusicProviderProps {
    children: ReactNode;
}

export const MusicProvider: React.FC<MusicProviderProps> = ({ children }) => {
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.7);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    React.useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
    };

    const playTrack = (track: Track) => {
        setCurrentTrack(track);
        setIsPlaying(true);
        if (audioRef.current) {
            audioRef.current.src = track.fileUrl;
            audioRef.current.play();
        }
    };

    const togglePlayPause = () => {
        if (!currentTrack) return;
        
        if (isPlaying) {
            audioRef.current?.pause();
        } else {
            audioRef.current?.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (time: number) => {
        setCurrentTime(time);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
        }
    };

    return (
        <MusicContext.Provider
            value={{
                currentTrack,
                isPlaying,
                volume,
                currentTime,
                duration,
                playTrack,
                togglePlayPause,
                setVolume,
                seek: handleSeek,
            }}
        >
            {children}
            <audio
                ref={audioRef}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
            />
        </MusicContext.Provider>
    );
};
