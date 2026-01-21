import React, { useState } from 'react';
import { Music as MusicIcon, Play, Pause, Volume2, SkipForward, SkipBack } from 'lucide-react';

interface Track {
    id: string;
    title: string;
    artist: string;
    duration: string;
    fileUrl: string;
}

interface Album {
    id: string;
    title: string;
    artist: string;
    year: string;
    genre: string;
    coverColor: string;
    tracks: Track[];
}

const ALBUMS: Album[] = [
    {
        id: 'journeys',
        title: 'Journeys',
        artist: 'Traveler',
        year: '2024',
        genre: 'Ambient',
        coverColor: 'bg-gradient-to-br from-blue-500 to-purple-600',
        tracks: [
            {
                id: 'beyond-the-pale',
                title: 'Beyond the Pale',
                artist: 'Traveler',
                duration: '4:12',
                fileUrl: '/assets/music/Journeys/Beyond the Pale.mp3'
            },
            {
                id: 'discovery',
                title: 'Discovery',
                artist: 'Traveler',
                duration: '4:03',
                fileUrl: '/assets/music/Journeys/Discovery.mp3'
            },
            {
                id: 'travel-1',
                title: 'Travel 1',
                artist: 'Traveler',
                duration: '2:58',
                fileUrl: '/assets/music/Journeys/Travel 1.mp3'
            }
        ]
    },
    {
        id: 'echoes',
        title: 'Echoes of Tomorrow',
        artist: 'Future Sound',
        year: '2024',
        genre: 'Electronic',
        coverColor: 'bg-gradient-to-br from-cyan-500 to-teal-600',
        tracks: [
            {
                id: 'digital-dawn',
                title: 'Digital Dawn',
                artist: 'Future Sound',
                duration: '3:56',
                fileUrl: '/assets/music/Echoes of Tomorrow/Digital Dawn.mp3'
            },
            {
                id: 'eerie-chant',
                title: 'Eerie Chant',
                artist: 'Future Sound',
                duration: '2:40',
                fileUrl: '/assets/music/Echoes of Tomorrow/Eerie Chant.mp3'
            }
        ]
    },
    {
        id: 'legends',
        title: 'Legends of the Realm',
        artist: 'Mythic Orchestra',
        year: '2024',
        genre: 'Orchestral',
        coverColor: 'bg-gradient-to-br from-orange-500 to-red-600',
        tracks: [
            {
                id: 'combat-battle',
                title: 'Combat Battle Music',
                artist: 'Mythic Orchestra',
                duration: '4:15',
                fileUrl: '/assets/music/Legends of the Realm/Combat Battle Music.mp3'
            },
            {
                id: 'hidden-wings',
                title: 'Hidden Wings _ 隠した翼 _ Kakushita Tsubasa',
                artist: 'Mythic Orchestra',
                duration: '2:58',
                fileUrl: '/assets/music/Legends of the Realm/Hidden Wings _ 隠した翼 _ Kakushita Tsubasa.mp3'
            },
            {
                id: 'service-tunnels',
                title: 'In the Service Tunnels',
                artist: 'Mythic Orchestra',
                duration: '2:04',
                fileUrl: '/assets/music/Legends of the Realm/In the Service Tunnels.mp3'
            },
            {
                id: 'kurogane',
                title: 'Kurogane',
                artist: 'Mythic Orchestra',
                duration: '3:16',
                fileUrl: '/assets/music/Legends of the Realm/Kurogane.mp3'
            },
            {
                id: 'nikolai-theme',
                title: 'Nikolai Theme',
                artist: 'Mythic Orchestra',
                duration: '6:12',
                fileUrl: '/assets/music/Legends of the Realm/Nikolai Theme.mp3'
            },
            {
                id: 'overworld-bg-2',
                title: 'Overworld BG 2',
                artist: 'Mythic Orchestra',
                duration: '3:04',
                fileUrl: '/assets/music/Legends of the Realm/Overworld BG 2.mp3'
            },
            {
                id: 'sairon-curious',
                title: 'Sairon - Curious',
                artist: 'Mythic Orchestra',
                duration: '2:40',
                fileUrl: '/assets/music/Legends of the Realm/Sairon - Curious.mp3'
            },
            {
                id: 'sairon-emotional-2',
                title: 'Sairon - Emotional 2',
                artist: 'Mythic Orchestra',
                duration: '3:18',
                fileUrl: '/assets/music/Legends of the Realm/Sairon - Emotional 2.mp3'
            },
            {
                id: 'sairon-emotional',
                title: 'Sairon - Emotional',
                artist: 'Mythic Orchestra',
                duration: '3:00',
                fileUrl: '/assets/music/Legends of the Realm/Sairon - Emotional.mp3'
            },
            {
                id: 'sairon-end-game',
                title: 'Sairon - End Game',
                artist: 'Mythic Orchestra',
                duration: '3:56',
                fileUrl: '/assets/music/Legends of the Realm/Sairon - End Game.mp3'
            },
            {
                id: 'sairon-enemy-incoming',
                title: 'Sairon - Enemy Incoming',
                artist: 'Mythic Orchestra',
                duration: '2:12',
                fileUrl: '/assets/music/Legends of the Realm/Sairon - Enemy Incoming.mp3'
            },
            {
                id: 'sairon-homura-theme',
                title: 'Sairon - Homura\'s Theme',
                artist: 'Mythic Orchestra',
                duration: '3:16',
                fileUrl: '/assets/music/Legends of the Realm/Sairon - Homura\'s Theme.mp3'
            },
            {
                id: 'sairon-incoming-threat',
                title: 'Sairon - Incoming Threat',
                artist: 'Mythic Orchestra',
                duration: '2:18',
                fileUrl: '/assets/music/Legends of the Realm/Sairon - Incoming Threat.mp3'
            },
            {
                id: 'sairon-intro-original',
                title: 'Sairon - Intro Original',
                artist: 'Mythic Orchestra',
                duration: '4:12',
                fileUrl: '/assets/music/Legends of the Realm/Sairon - Intro Original.mp3'
            },
            {
                id: 'sairon-intro-remaster',
                title: 'Sairon - Intro Remaster',
                artist: 'Mythic Orchestra',
                duration: '2:52',
                fileUrl: '/assets/music/Legends of the Realm/Sairon - Intro Remaster.mp3'
            },
            {
                id: 'sairon-intro-v2',
                title: 'Sairon - Intro v2',
                artist: 'Mythic Orchestra',
                duration: '3:30',
                fileUrl: '/assets/music/Legends of the Realm/Sairon - Intro v2.mp3'
            },
            {
                id: 'sairon-seena-theme',
                title: 'Sairon - Seena Theme',
                artist: 'Mythic Orchestra',
                duration: '1:22',
                fileUrl: '/assets/music/Legends of the Realm/Sairon - Seena Theme.mp3'
            },
            {
                id: 'sairon-to-the-rescue',
                title: 'Sairon - To the Rescue',
                artist: 'Mythic Orchestra',
                duration: '1:28',
                fileUrl: '/assets/music/Legends of the Realm/Sairon - To the Rescue.mp3'
            },
            {
                id: 'sairon-yureigakure-theme',
                title: 'Sairon - Yureigakure Theme',
                artist: 'Mythic Orchestra',
                duration: '1:22',
                fileUrl: '/assets/music/Legends of the Realm/Sairon - Yureigakure Theme.mp3'
            },
            {
                id: 'sairon-overworld',
                title: 'Sairon Overworld',
                artist: 'Mythic Orchestra',
                duration: '6:52',
                fileUrl: '/assets/music/Legends of the Realm/Sairon Overworld.mp3'
            },
            {
                id: 'combat',
                title: 'Combat',
                artist: 'Mythic Orchestra',
                duration: '4:02',
                fileUrl: '/assets/music/Legends of the Realm/Combat.mp3'
            }
        ]
    },
    {
        id: 'grey-matter-tavern',
        title: 'Grey Matter Tavern',
        artist: 'Various Artists',
        year: '2024',
        genre: 'Tavern Music',
        coverColor: 'bg-gradient-to-br from-amber-600 to-orange-700',
        tracks: [
            {
                id: 'success-the-obsession',
                title: 'Success the Obsession',
                artist: 'Various Artists',
                duration: '3:45',
                fileUrl: '/assets/music/Grey Matter Tavern/1 - Success the Obsession.mp3'
            },
            {
                id: 'team-of-one',
                title: 'Team of One',
                artist: 'Various Artists',
                duration: '4:12',
                fileUrl: '/assets/music/Grey Matter Tavern/2 - Team of One.mp3'
            },
            {
                id: 'grey-matter-tavern',
                title: 'Grey Matter Tavern',
                artist: 'Various Artists',
                duration: '3:28',
                fileUrl: '/assets/music/Grey Matter Tavern/3 - Grey Matter Tavern.mp3'
            },
            {
                id: 'bonnie-clyde',
                title: 'Bonnie & Clyde',
                artist: 'Various Artists',
                duration: '3:56',
                fileUrl: '/assets/music/Grey Matter Tavern/4 - Bonnie & Clyde.mp3'
            },
            {
                id: 'little-airplane',
                title: 'Little Airplane',
                artist: 'Various Artists',
                duration: '4:03',
                fileUrl: '/assets/music/Grey Matter Tavern/5 - Little Airplane.mp3'
            },
            {
                id: 'out-of-control',
                title: 'Out Of Control',
                artist: 'Various Artists',
                duration: '3:32',
                fileUrl: '/assets/music/Grey Matter Tavern/6 - Out Of Control.mp3'
            },
            {
                id: 'all-my-best-days',
                title: 'All My Best Days',
                artist: 'Various Artists',
                duration: '4:18',
                fileUrl: '/assets/music/Grey Matter Tavern/7 - All My Best Days.mp3'
            },
            {
                id: 'glorious',
                title: 'Glorious',
                artist: 'Various Artists',
                duration: '3:44',
                fileUrl: '/assets/music/Grey Matter Tavern/8 - Glorious.mp3'
            },
            {
                id: 'riddle-me',
                title: 'Riddle Me',
                artist: 'Various Artists',
                duration: '3:15',
                fileUrl: '/assets/music/Grey Matter Tavern/9 - Riddle Me.mp3'
            },
            {
                id: 'below-zero',
                title: 'Below Zero (feat. Meathook)',
                artist: 'Various Artists',
                duration: '4:27',
                fileUrl: '/assets/music/Grey Matter Tavern/10 - Below Zero (feat. Meathook).mp3'
            },
            {
                id: 'success-the-obsession-cover',
                title: 'Success the Obsession (Selfless Cut Cover)',
                artist: 'Various Artists',
                duration: '3:52',
                fileUrl: '/assets/music/Grey Matter Tavern/11 - Success the Obsession (Selfless Cut Cover).mp3'
            }
        ]
    }
];

export const MusicView: React.FC = () => {
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.7);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    React.useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const handlePlayTrack = (track: Track) => {
        setCurrentTrack(track);
        setIsPlaying(true);
        if (audioRef.current) {
            audioRef.current.src = track.fileUrl;
            audioRef.current.play();
        }
    };

    const handleTogglePlayPause = () => {
        if (!currentTrack) return;
        
        if (isPlaying) {
            audioRef.current?.pause();
        } else {
            audioRef.current?.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value);
        setCurrentTime(newTime);
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full h-full flex flex-col bg-slate-950 text-white overflow-hidden">
            <audio
                ref={audioRef}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
            />
            
            {/* Header */}
            <div className="px-8 py-8 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-5xl font-black text-white uppercase tracking-tighter">Music Library</h2>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.4em] mt-2">Game Soundtracks & Ambient Music</p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                        <MusicIcon className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-300">{ALBUMS.length} Albums</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Albums Grid */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ALBUMS.map((album) => (
                            <div
                                key={album.id}
                                className={`group bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden hover:bg-white/[0.05] transition-all duration-500 hover:scale-[1.02] hover:border-white/20 cursor-pointer ${
                                    selectedAlbum?.id === album.id ? 'ring-2 ring-purple-500/50' : ''
                                }`}
                                onClick={() => setSelectedAlbum(album)}
                            >
                                {/* Album Cover */}
                                <div className={`h-48 ${album.coverColor} relative overflow-hidden`}>
                                    <div className="absolute inset-0 bg-black/20" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <MusicIcon className="w-16 h-16 text-white/50" />
                                    </div>
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight">{album.title}</h3>
                                        <p className="text-xs text-white/70 font-medium">{album.artist}</p>
                                    </div>
                                </div>
                                
                                {/* Album Info */}
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase text-slate-500">{album.year}</span>
                                            <span className="text-[10px] font-black uppercase text-purple-400">{album.genre}</span>
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-slate-400">{album.tracks.length} tracks</span>
                                    </div>
                                    
                                    {/* Track List Preview */}
                                    <div className="space-y-1">
                                        {album.tracks.slice(0, 3).map((track, index) => (
                                            <div key={track.id} className="flex items-center justify-between text-xs">
                                                <span className="text-slate-400 truncate">{index + 1}. {track.title}</span>
                                                <span className="text-slate-500">{track.duration}</span>
                                            </div>
                                        ))}
                                        {album.tracks.length > 3 && (
                                            <div className="text-xs text-slate-500 font-medium">
                                                +{album.tracks.length - 3} more tracks
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Side Panel - Track List & Player */}
                {selectedAlbum && (
                    <div className="w-96 bg-slate-900/50 border-l border-white/5 flex flex-col">
                        {/* Album Header */}
                        <div className="p-6 border-b border-white/5">
                            <div className={`h-32 ${selectedAlbum.coverColor} rounded-2xl mb-4 relative overflow-hidden`}>
                                <div className="absolute inset-0 bg-black/20" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <MusicIcon className="w-12 h-12 text-white/50" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">{selectedAlbum.title}</h3>
                            <p className="text-sm text-slate-400 font-medium">{selectedAlbum.artist} • {selectedAlbum.year}</p>
                            <p className="text-xs text-purple-400 font-black uppercase tracking-widest mt-1">{selectedAlbum.genre}</p>
                        </div>

                        {/* Track List */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <div className="space-y-2">
                                {selectedAlbum.tracks.map((track, index) => (
                                    <div
                                        key={track.id}
                                        className={`group p-3 rounded-xl border transition-all cursor-pointer ${
                                            currentTrack?.id === track.id
                                                ? 'bg-purple-600/20 border-purple-500/30'
                                                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                                        }`}
                                        onClick={() => handlePlayTrack(track)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                    currentTrack?.id === track.id && isPlaying
                                                        ? 'bg-purple-500'
                                                        : 'bg-white/10'
                                                }`}>
                                                    {currentTrack?.id === track.id && isPlaying ? (
                                                        <Pause className="w-4 h-4 text-white" />
                                                    ) : (
                                                        <Play className="w-4 h-4 text-white" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">{track.title}</p>
                                                    <p className="text-xs text-slate-400">{track.artist}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-500">{track.duration}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Now Playing Bar */}
                        {currentTrack && (
                            <div className="p-4 border-t border-white/5 bg-slate-900/80">
                                <div className="mb-3">
                                    <p className="text-sm font-bold text-white truncate">{currentTrack.title}</p>
                                    <p className="text-xs text-slate-400">{currentTrack.artist}</p>
                                </div>
                                
                                {/* Progress Bar */}
                                <div className="mb-3">
                                    <input
                                        type="range"
                                        min="0"
                                        max={duration || 0}
                                        value={currentTime}
                                        onChange={handleSeek}
                                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                                    />
                                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                                        <span>{formatTime(currentTime)}</span>
                                        <span>{formatTime(duration)}</span>
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleTogglePlayPause}
                                            className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors"
                                        >
                                            {isPlaying ? (
                                                <Pause className="w-4 h-4 text-white" />
                                            ) : (
                                                <Play className="w-4 h-4 text-white" />
                                            )}
                                        </button>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <Volume2 className="w-4 h-4 text-slate-400" />
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={volume}
                                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                                            className="w-20 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
