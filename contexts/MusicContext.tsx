import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';

export interface Track {
    id: string;
    title: string;
    artist: string;
    duration: string;
    fileUrl: string;
}

type RepeatMode = 'off' | 'all' | 'one';

interface MusicContextType {
    currentTrack: Track | null;
    isPlaying: boolean;
    volume: number;
    currentTime: number;
    duration: number;
    playTrack: (track: Track, queue?: Track[]) => void;
    togglePlayPause: () => void;
    setVolume: (volume: number) => void;
    seek: (time: number) => void;
    playNextTrack: () => void;
    playPreviousTrack: () => void;
    isShuffleEnabled: boolean;
    toggleShuffle: () => void;
    repeatMode: RepeatMode;
    cycleRepeatMode: () => void;
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
    const [playbackQueue, setPlaybackQueue] = useState<Track[]>([]);
    const [queueIndex, setQueueIndex] = useState<number>(-1);
    const [isShuffleEnabled, setIsShuffleEnabled] = useState(false);
    const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
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

    const startPlayback = (track: Track) => {
        if (!audioRef.current) return;

        const audio = audioRef.current;
        if (audio.src !== track.fileUrl) {
            audio.src = track.fileUrl;
        }
        audio.currentTime = 0;
        audio.play().catch(() => setIsPlaying(false));

        setCurrentTrack(track);
        setIsPlaying(true);
    };

    const playTrack = (track: Track, queue?: Track[]) => {
        let targetQueue = queue && queue.length ? queue : playbackQueue;
        if (!targetQueue.length) {
            targetQueue = [track];
        }

        // fileUrl is globally unique across albums; track ids are not.
        let nextIndex = targetQueue.findIndex((t) => t.fileUrl === track.fileUrl);
        if (nextIndex === -1) {
            targetQueue = [...targetQueue, track];
            nextIndex = targetQueue.length - 1;
        }

        setPlaybackQueue(targetQueue);
        setQueueIndex(nextIndex);
        setCurrentTime(0);
        startPlayback(targetQueue[nextIndex]);
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

    const getSequentialIndex = (direction: 1 | -1) => {
        if (!playbackQueue.length) return -1;
        if (queueIndex === -1) return direction === 1 ? 0 : playbackQueue.length - 1;

        let nextIndex = queueIndex + direction;
        if (nextIndex >= playbackQueue.length) {
            nextIndex = repeatMode === 'all' ? 0 : -1;
        } else if (nextIndex < 0) {
            nextIndex = repeatMode === 'all' ? playbackQueue.length - 1 : 0;
        }

        return nextIndex;
    };

    const getShuffleIndex = () => {
        if (playbackQueue.length <= 1) return queueIndex;
        let randomIndex = queueIndex;
        while (randomIndex === queueIndex) {
            randomIndex = Math.floor(Math.random() * playbackQueue.length);
        }
        return randomIndex;
    };

    const startTrackAtIndex = (index: number) => {
        if (index < 0 || index >= playbackQueue.length) return false;
        const track = playbackQueue[index];
        setQueueIndex(index);
        setCurrentTime(0);
        startPlayback(track);
        return true;
    };

    const playNextTrackInternal = () => {
        if (!playbackQueue.length) return false;
        const nextIndex = isShuffleEnabled ? getShuffleIndex() : getSequentialIndex(1);
        if (nextIndex === -1 || nextIndex === queueIndex) {
            return false;
        }
        return startTrackAtIndex(nextIndex);
    };

    const playPreviousTrack = () => {
        if (!playbackQueue.length) return;
        if (isShuffleEnabled) {
            const randomIndex = getShuffleIndex();
            if (randomIndex !== -1) {
                startTrackAtIndex(randomIndex);
            }
            return;
        }

        const prevIndex = getSequentialIndex(-1);
        if (prevIndex !== -1) {
            startTrackAtIndex(prevIndex);
        }
    };

    const playNextTrack = () => {
        playNextTrackInternal();
    };

    const handleEnded = () => {
        if (repeatMode === 'one') {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play();
            }
            return;
        }

        const advanced = playNextTrackInternal();
        if (!advanced) {
            setIsPlaying(false);
        }
    };

    const toggleShuffle = () => {
        setIsShuffleEnabled((prev) => !prev);
    };

    const cycleRepeatMode = () => {
        setRepeatMode((prev) => {
            if (prev === 'off') return 'all';
            if (prev === 'all') return 'one';
            return 'off';
        });
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
                playNextTrack,
                playPreviousTrack,
                isShuffleEnabled,
                toggleShuffle,
                repeatMode,
                cycleRepeatMode,
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
