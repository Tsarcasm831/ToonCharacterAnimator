import React, { useState } from 'react';
import { Music as MusicIcon, Play, Pause, Volume2, SkipForward, SkipBack, X, ChevronUp } from 'lucide-react';
import { useMusic } from '../../../contexts/MusicContext';
import { useIsIphoneLayout } from '../../../hooks/useIsIphoneLayout';

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
    coverImage?: string;
    tracks: Track[];
}

const ALBUMS: Album[] = [
    {
        id: 'journeys',
        title: 'Journeys',
        artist: 'Lord Tsarcasm',
        year: '2026',
        genre: 'Ambient',
        coverColor: 'bg-gradient-to-br from-blue-500 to-purple-600',
        tracks: [
            {
                id: 'beyond-the-pale',
                title: 'Beyond the Pale',
                artist: 'Lord Tsarcasm',
                duration: '4:12',
                fileUrl: '/assets/musicshrunk/Journeys/Beyond the Pale.opus'
            },
            {
                id: 'discovery',
                title: 'Discovery',
                artist: 'Lord Tsarcasm',
                duration: '4:03',
                fileUrl: '/assets/musicshrunk/Journeys/Discovery.opus'
            },
            {
                id: 'travel-1',
                title: 'Travel 1',
                artist: 'Lord Tsarcasm',
                duration: '2:58',
                fileUrl: '/assets/musicshrunk/Journeys/Travel 1.opus'
            }
        ]
    },
    {
        id: 'echoes',
        title: 'Echoes of Tomorrow',
        artist: 'Lord Tsarcasm',
        year: '2026',
        genre: 'Electronic',
        coverColor: 'bg-gradient-to-br from-cyan-500 to-teal-600',
        tracks: [
            {
                id: 'digital-dawn',
                title: 'Digital Dawn',
                artist: 'Lord Tsarcasm',
                duration: '3:56',
                fileUrl: '/assets/musicshrunk/Echoes of Tomorrow/Digital Dawn.opus'
            },
            {
                id: 'eerie-chant',
                title: 'Eerie Chant',
                artist: 'Lord Tsarcasm',
                duration: '2:40',
                fileUrl: '/assets/musicshrunk/Echoes of Tomorrow/Eerie Chant.opus'
            }
        ]
    },
    {
        id: 'legends',
        title: 'Legends of the Realm',
        artist: 'Lord Tsarcasm',
        year: '2026',
        genre: 'Orchestral',
        coverColor: 'bg-gradient-to-br from-orange-500 to-red-600',
        tracks: [
            {
                id: 'combat-battle',
                title: 'Combat Battle Music',
                artist: 'Lord Tsarcasm',
                duration: '4:15',
                fileUrl: '/assets/musicshrunk/Legends of the Realm/Combat Battle Music.opus'
            },
            {
                id: 'hidden-wings',
                title: 'Hidden Wings _ 隠した翼 _ Kakushita Tsubasa',
                artist: 'Lord Tsarcasm',
                duration: '2:58',
                fileUrl: '/assets/musicshrunk/Legends of the Realm/Hidden Wings _ 隠した翼 _ Kakushita Tsubasa.opus'
            },
            {
                id: 'service-tunnels',
                title: 'In the Service Tunnels',
                artist: 'Lord Tsarcasm',
                duration: '2:04',
                fileUrl: '/assets/musicshrunk/Legends of the Realm/In the Service Tunnels.opus'
            },
            {
                id: 'kurogane',
                title: 'Kurogane',
                artist: 'Lord Tsarcasm',
                duration: '3:16',
                fileUrl: '/assets/musicshrunk/Legends of the Realm/Kurogane.opus'
            },
            {
                id: 'nikolai-theme',
                title: 'Nikolai Theme',
                artist: 'Lord Tsarcasm',
                duration: '6:12',
                fileUrl: '/assets/musicshrunk/Legends of the Realm/Nikolai Theme.opus'
            },
            {
                id: 'overworld-bg-2',
                title: 'Overworld BG 2',
                artist: 'Lord Tsarcasm',
                duration: '3:04',
                fileUrl: '/assets/musicshrunk/Legends of the Realm/Overworld BG 2.opus'
            },
            {
                id: 'sairon-curious',
                title: 'Sairon - Curious',
                artist: 'Lord Tsarcasm',
                duration: '2:40',
                fileUrl: '/assets/musicshrunk/Legends of the Realm/Sairon - Curious.opus'
            },
            {
                id: 'sairon-emotional-2',
                title: 'Sairon - Emotional 2',
                artist: 'Lord Tsarcasm',
                duration: '3:18',
                fileUrl: '/assets/musicshrunk/Legends of the Realm/Sairon - Emotional 2.opus'
            },
            {
                id: 'sairon-emotional',
                title: 'Sairon - Emotional',
                artist: 'Lord Tsarcasm',
                duration: '3:00',
                fileUrl: '/assets/musicshrunk/Legends of the Realm/Sairon - Emotional.opus'
            },
            {
                id: 'sairon-end-game',
                title: 'Sairon - End Game',
                artist: 'Lord Tsarcasm',
                duration: '3:56',
                fileUrl: '/assets/musicshrunk/Legends of the Realm/Sairon - End Game.opus'
            },
            {
                id: 'sairon-enemy-incoming',
                title: 'Sairon - Enemy Incoming',
                artist: 'Lord Tsarcasm',
                duration: '2:12',
                fileUrl: '/assets/musicshrunk/Legends of the Realm/Sairon - Enemy Incoming.opus'
            },
            {
                id: 'sairon-homura-theme',
                title: "Sairon - Homura's Theme",
                artist: 'Lord Tsarcasm',
                duration: '3:16',
                fileUrl: "/assets/musicshrunk/Legends of the Realm/Sairon - Homura's Theme.opus"
            },
            {
                id: 'sairon-incoming-threat',
                title: 'Sairon - Incoming Threat',
                artist: 'Lord Tsarcasm',
                duration: '2:18',
                fileUrl: '/assets/musicshrunk/Legends of the Realm/Sairon - Incoming Threat.opus'
            },
            {
                id: 'sairon-intro-original',
                title: 'Sairon - Intro Original',
                artist: 'Lord Tsarcasm',
                duration: '4:12',
                fileUrl: '/assets/musicshrunk/Legends of the Realm/Sairon - Intro Original.opus'
            },
            {
                id: 'sairon-intro-remaster',
                title: 'Sairon - Intro Remaster',
                artist: 'Lord Tsarcasm',
                duration: '2:52',
                fileUrl: '/assets/musicshrunk/Legends of the Realm/Sairon - Intro Remaster.opus'
            },
            {
                id: 'sairon-intro-v2',
                title: 'Sairon - Intro v2',
                artist: 'Lord Tsarcasm',
                duration: '3:30',
                fileUrl: '/assets/musicshrunk/Legends of the Realm/Sairon - Intro v2.opus'
            },
            {
                id: 'sairon-seena-theme',
                title: 'Sairon - Seena Theme',
                artist: 'Lord Tsarcasm',
                duration: '1:22',
                fileUrl: '/assets/musicshrunk/Legends of the Realm/Sairon - Seena Theme.opus'
            },
            {
                id: 'sairon-to-the-rescue',
                title: 'Sairon - To the Rescue',
                artist: 'Lord Tsarcasm',
                duration: '1:28',
                fileUrl: '/assets/musicshrunk/Legends of the Realm/Sairon - To the Rescue.opus'
            },
            {
                id: 'sairon-yureigakure-theme',
                title: 'Sairon - Yureigakure Theme',
                artist: 'Lord Tsarcasm',
                duration: '1:22',
                fileUrl: '/assets/musicshrunk/Legends of the Realm/Sairon - Yureigakure Theme.opus'
            },
            {
                id: 'sairon-overworld',
                title: 'Sairon Overworld',
                artist: 'Lord Tsarcasm',
                duration: '6:52',
                fileUrl: '/assets/musicshrunk/Legends of the Realm/Sairon Overworld.opus'
            },
            {
                id: 'combat',
                title: 'Combat',
                artist: 'Lord Tsarcasm',
                duration: '4:02',
                fileUrl: '/assets/musicshrunk/Legends of the Realm/Combat.opus'
            }
        ]
    },
    {
        id: 'grey-matter-tavern',
        title: 'Grey Matter Tavern',
        artist: 'Lord Tsarcasm',
        year: '2026',
        genre: 'Tavern Music',
        coverColor: 'bg-gradient-to-br from-amber-600 to-orange-700',
        coverImage: '/assets/images/albums/GreyMatterTavern.jpg',
        tracks: [
            {
                id: 'success-the-obsession',
                title: 'Success the Obsession',
                artist: 'Lord Tsarcasm',
                duration: '3:45',
                fileUrl: '/assets/musicshrunk/Grey Matter Tavern/1 - Success the Obsession.opus'
            },
            {
                id: 'team-of-one',
                title: 'Team of One',
                artist: 'Lord Tsarcasm',
                duration: '4:12',
                fileUrl: '/assets/musicshrunk/Grey Matter Tavern/2 - Team of One.opus'
            },
            {
                id: 'grey-matter-tavern',
                title: 'Grey Matter Tavern',
                artist: 'Lord Tsarcasm',
                duration: '3:28',
                fileUrl: '/assets/musicshrunk/Grey Matter Tavern/3 - Grey Matter Tavern.opus'
            },
            {
                id: 'bonnie-clyde',
                title: 'Bonnie & Clyde',
                artist: 'Lord Tsarcasm',
                duration: '3:56',
                fileUrl: '/assets/musicshrunk/Grey Matter Tavern/4 - Bonnie & Clyde.opus'
            },
            {
                id: 'little-airplane',
                title: 'Little Airplane',
                artist: 'Lord Tsarcasm',
                duration: '4:03',
                fileUrl: '/assets/musicshrunk/Grey Matter Tavern/5 - Little Airplane.opus'
            },
            {
                id: 'out-of-control',
                title: 'Out Of Control',
                artist: 'Lord Tsarcasm',
                duration: '3:32',
                fileUrl: '/assets/musicshrunk/Grey Matter Tavern/6 - Out Of Control.opus'
            },
            {
                id: 'all-my-best-days',
                title: 'All My Best Days',
                artist: 'Lord Tsarcasm',
                duration: '4:18',
                fileUrl: '/assets/musicshrunk/Grey Matter Tavern/7 - All My Best Days.opus'
            },
            {
                id: 'glorious',
                title: 'Glorious',
                artist: 'Lord Tsarcasm',
                duration: '3:44',
                fileUrl: '/assets/musicshrunk/Grey Matter Tavern/8 - Glorious.opus'
            },
            {
                id: 'riddle-me',
                title: 'Riddle Me',
                artist: 'Lord Tsarcasm',
                duration: '3:15',
                fileUrl: '/assets/musicshrunk/Grey Matter Tavern/9 - Riddle Me.opus'
            },
            {
                id: 'below-zero',
                title: 'Below Zero (feat. Meathook)',
                artist: 'MeatHook',
                duration: '4:27',
                fileUrl: '/assets/musicshrunk/Grey Matter Tavern/10 - Below Zero (feat. Meathook).opus'
            },
            {
                id: 'success-the-obsession-cover',
                title: 'Success the Obsession (Selfless Cut Cover)',
                artist: 'Lord Tsarcasm',
                duration: '3:52',
                fileUrl: '/assets/musicshrunk/Grey Matter Tavern/11 - Success the Obsession (Selfless Cut Cover).opus'
            }
        ]
    }
];

export const MusicView: React.FC = () => {
    const { currentTrack, isPlaying, volume, currentTime, duration, playTrack, togglePlayPause, setVolume, seek } = useMusic();
    const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
    const [isMobileTrackListOpen, setIsMobileTrackListOpen] = useState(false);
    const [isMobilePlayerOpen, setIsMobilePlayerOpen] = useState(false);
    const isIphoneLayout = useIsIphoneLayout();
    const previewTrackCount = isIphoneLayout ? 2 : 3;

    const handlePlayTrack = (track: Track) => {
        playTrack(track);
        // Open mobile player when track starts
        setIsMobilePlayerOpen(true);
    };

    const handleTogglePlayPause = () => {
        togglePlayPause();
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value);
        seek(newTime);
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const getAlbumCoverStyle = (album: Album) =>
        album.coverImage
            ? {
                  backgroundImage: `url(${album.coverImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
              }
            : undefined;

    return (
        <div className="w-full h-full flex flex-col bg-slate-950 text-white overflow-hidden">
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
                
                @media (max-width: 640px) {
                    .slider::-webkit-slider-thumb {
                        width: 20px;
                        height: 20px;
                    }
                    
                    .slider::-moz-range-thumb {
                        width: 20px;
                        height: 20px;
                    }
                }
                
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 2px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
            `}</style>
            
            {/* Header */}
            <div className={`border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent ${isIphoneLayout ? 'px-5 py-5' : 'px-4 sm:px-8 py-4 sm:py-8'}`}>
                <div className={`flex flex-col gap-4 ${isIphoneLayout ? '' : 'sm:flex-row sm:items-center sm:justify-between'}`}>
                    <div>
                        <h2 className={`font-black text-white uppercase tracking-tighter leading-tight ${isIphoneLayout ? 'text-3xl' : 'text-2xl sm:text-5xl'}`}>Music Library</h2>
                        <p className={`text-slate-400 font-bold uppercase mt-2 leading-snug ${isIphoneLayout ? 'text-[10px] tracking-[0.25em] max-w-[18ch]' : 'text-xs sm:text-xs tracking-[0.4em]'}`}>
                            Game Soundtracks & Ambient Music
                        </p>
                    </div>
                    <div className={`flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/10 w-fit ${isIphoneLayout ? '' : 'sm:w-auto'}`}>
                        <MusicIcon className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-300">{ALBUMS.length} Albums</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden flex-col lg:flex-row">
                {/* Albums Grid */}
                <div className={`flex-1 overflow-y-auto custom-scrollbar ${isIphoneLayout ? 'p-4' : 'p-4 sm:p-8'}`}>
                    <div className={`grid gap-4 sm:gap-6 ${isIphoneLayout ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                        {ALBUMS.map((album) => (
                            <div
                                key={album.id}
                                className={`group bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden hover:bg-white/[0.05] transition-all duration-500 hover:scale-[1.02] hover:border-white/20 cursor-pointer ${
                                    selectedAlbum?.id === album.id ? 'ring-2 ring-purple-500/50' : ''
                                }`}
                                onClick={() => {
                                    setSelectedAlbum(album);
                                    // Open mobile track list on mobile devices
                                    if (window.innerWidth < 1024) {
                                        setIsMobileTrackListOpen(true);
                                    }
                                }}
                            >
                                {/* Album Cover */}
                                <div
                                    className={`${album.coverImage ? '' : album.coverColor} relative overflow-hidden ${isIphoneLayout ? 'h-36' : 'h-40 sm:h-48'}`}
                                    style={getAlbumCoverStyle(album)}
                                >
                                    {album.coverImage ? (
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                                    ) : (
                                        <div className="absolute inset-0 bg-black/20" />
                                    )}
                                    {!album.coverImage && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <MusicIcon className="w-12 sm:w-16 h-12 sm:h-16 text-white/50" />
                                        </div>
                                    )}
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <h3 className={`font-black text-white uppercase tracking-tight ${isIphoneLayout ? 'text-base' : 'text-lg sm:text-xl'}`}>{album.title}</h3>
                                        <p className="text-xs text-white/70 font-medium">{album.artist}</p>
                                    </div>
                                </div>
                                
                                {/* Album Info */}
                                <div className={`p-3 ${isIphoneLayout ? '' : 'sm:p-4'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase text-slate-500">{album.year}</span>
                                            <span className="text-[10px] font-black uppercase text-purple-400">{album.genre}</span>
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-slate-400">{album.tracks.length} tracks</span>
                                    </div>
                                    
                                    {/* Track List Preview */}
                                    <div className="space-y-1">
                                        {album.tracks.slice(0, previewTrackCount).map((track, index) => (
                                            <div key={track.id} className="flex items-center justify-between text-xs">
                                                <span className="text-slate-400 truncate">{index + 1}. {track.title}</span>
                                                <span className="text-slate-500">{track.duration}</span>
                                            </div>
                                        ))}
                                        {album.tracks.length > previewTrackCount && (
                                            <div className="text-xs text-slate-500 font-medium">
                                                +{album.tracks.length - previewTrackCount} more tracks
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Side Panel - Track List & Player (Desktop) */}
                {selectedAlbum && (
                    <div className="hidden lg:block w-96 bg-slate-900/50 border-l border-white/5 flex flex-col overflow-y-auto custom-scrollbar">
                        {/* Album Header */}
                        <div className="p-6 border-b border-white/5">
                            <div
                                className={`h-32 ${selectedAlbum.coverImage ? '' : selectedAlbum.coverColor} rounded-2xl mb-4 relative overflow-hidden`}
                                style={getAlbumCoverStyle(selectedAlbum)}
                            >
                                {selectedAlbum.coverImage ? (
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                                ) : (
                                    <div className="absolute inset-0 bg-black/20" />
                                )}
                                {!selectedAlbum.coverImage && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <MusicIcon className="w-12 h-12 text-white/50" />
                                    </div>
                                )}
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
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (currentTrack?.id === track.id) {
                                                            handleTogglePlayPause();
                                                        } else {
                                                            handlePlayTrack(track);
                                                        }
                                                    }}
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                                        currentTrack?.id === track.id && isPlaying
                                                            ? 'bg-purple-500'
                                                            : 'bg-white/10'
                                                    }`}
                                                >
                                                    {currentTrack?.id === track.id && isPlaying ? (
                                                        <Pause className="w-4 h-4 text-white" />
                                                    ) : (
                                                        <Play className="w-4 h-4 text-white" />
                                                    )}
                                                </button>
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
                    </div>
                )}

                {/* Mobile Track List Modal */}
                {selectedAlbum && isMobileTrackListOpen && (
                    <div className="lg:hidden fixed inset-0 z-50 bg-black/80 flex items-end">
                        <div className="bg-slate-900 w-full max-h-[70vh] rounded-t-3xl animate-in slide-in-from-bottom duration-300">
                            {/* Modal Header */}
                            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-12 h-12 ${selectedAlbum.coverImage ? '' : selectedAlbum.coverColor} rounded-xl flex items-center justify-center`}
                                        style={getAlbumCoverStyle(selectedAlbum)}
                                    >
                                        {!selectedAlbum.coverImage && <MusicIcon className="w-6 h-6 text-white/50" />}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white uppercase tracking-tight">{selectedAlbum.title}</h3>
                                        <p className="text-xs text-slate-400">{selectedAlbum.artist} • {selectedAlbum.tracks.length} tracks</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsMobileTrackListOpen(false)}
                                    className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>

                            {/* Mobile Track List */}
                            <div className="overflow-y-auto max-h-[50vh] p-4">
                                <div className="space-y-2">
                                    {selectedAlbum.tracks.map((track, index) => (
                                        <div
                                            key={track.id}
                                            className={`group p-3 rounded-xl border transition-all cursor-pointer ${
                                                currentTrack?.id === track.id
                                                    ? 'bg-purple-600/20 border-purple-500/30'
                                                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (currentTrack?.id === track.id) {
                                                                handleTogglePlayPause();
                                                            } else {
                                                                handlePlayTrack(track);
                                                            }
                                                        }}
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                                            currentTrack?.id === track.id && isPlaying
                                                                ? 'bg-purple-500'
                                                                : 'bg-white/10'
                                                        }`}
                                                    >
                                                        {currentTrack?.id === track.id && isPlaying ? (
                                                            <Pause className="w-4 h-4 text-white" />
                                                        ) : (
                                                            <Play className="w-4 h-4 text-white" />
                                                        )}
                                                    </button>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-white truncate">{track.title}</p>
                                                        <p className="text-xs text-slate-400">{track.artist}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-slate-500">{track.duration}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mobile Player */}
                {currentTrack && isMobilePlayerOpen && (
                    <div className="lg:hidden fixed inset-0 z-50 bg-black/90 flex items-end">
                        <div className="bg-slate-900 w-full rounded-t-3xl animate-in slide-in-from-bottom duration-300">
                            {/* Player Header */}
                            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-lg font-black text-white uppercase tracking-tight">Now Playing</h3>
                                <button
                                    onClick={() => setIsMobilePlayerOpen(false)}
                                    className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>

                            {/* Track Info */}
                            <div className="p-6 text-center">
                                <div
                                    className="relative w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center overflow-hidden"
                                    style={selectedAlbum?.coverImage ? getAlbumCoverStyle(selectedAlbum) : undefined}
                                >
                                    {!selectedAlbum?.coverImage && <MusicIcon className="w-16 h-16 text-white/50" />}
                                    {selectedAlbum?.coverImage && (
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent rounded-2xl" />
                                    )}
                                </div>
                                <h4 className="text-xl font-black text-white mb-2">{currentTrack.title}</h4>
                                <p className="text-sm text-slate-400 mb-1">{currentTrack.artist}</p>
                                <p className="text-xs text-purple-400 font-black uppercase tracking-widest">{selectedAlbum?.genre}</p>
                            </div>

                            {/* Progress Bar */}
                            <div className="px-6 mb-6">
                                <input
                                    type="range"
                                    min="0"
                                    max={duration || 0}
                                    value={currentTime}
                                    onChange={handleSeek}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                                />
                                <div className="flex justify-between text-xs text-slate-500 mt-2">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            {/* Mobile Controls */}
                            <div className="px-6 pb-6">
                                <div className="flex items-center justify-center gap-6 mb-6">
                                    <button className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                                        <SkipBack className="w-5 h-5 text-white" />
                                    </button>
                                    <button
                                        onClick={handleTogglePlayPause}
                                        className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors"
                                    >
                                        {isPlaying ? (
                                            <Pause className="w-6 h-6 text-white" />
                                        ) : (
                                            <Play className="w-6 h-6 text-white" />
                                        )}
                                    </button>
                                    <button className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                                        <SkipForward className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                                
                                {/* Volume Control */}
                                <div className="flex items-center justify-center gap-3">
                                    <Volume2 className="w-4 h-4 text-slate-400" />
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={volume}
                                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                                        className="w-32 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mobile Track List Button */}
                {selectedAlbum && (
                    <div className="lg:hidden fixed bottom-20 right-4 z-40">
                        <button
                            onClick={() => setIsMobileTrackListOpen(true)}
                            className="w-14 h-14 bg-purple-500 rounded-full flex items-center justify-center shadow-lg hover:bg-purple-600 transition-colors"
                        >
                            <MusicIcon className="w-6 h-6 text-white" />
                        </button>
                    </div>
                )}

                {/* Mobile Mini Player */}
                {currentTrack && !isMobilePlayerOpen && (
                    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-white/5 backdrop-blur-lg">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3 flex-1">
                                    <div
                                        className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center overflow-hidden relative"
                                        style={selectedAlbum?.coverImage ? getAlbumCoverStyle(selectedAlbum) : undefined}
                                    >
                                        {!selectedAlbum?.coverImage && <MusicIcon className="w-5 h-5 text-white/50" />}
                                        {selectedAlbum?.coverImage && (
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent rounded-lg" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{currentTrack.title}</p>
                                        <p className="text-xs text-slate-400 truncate">{currentTrack.artist}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsMobilePlayerOpen(true)}
                                    className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center ml-2"
                                >
                                    <ChevronUp className="w-4 h-4 text-white" />
                                </button>
                            </div>
                            
                            {/* Mini Progress */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleTogglePlayPause}
                                    className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center"
                                >
                                    {isPlaying ? (
                                        <Pause className="w-3 h-3 text-white" />
                                    ) : (
                                        <Play className="w-3 h-3 text-white" />
                                    )}
                                </button>
                                <div className="flex-1">
                                    <input
                                        type="range"
                                        min="0"
                                        max={duration || 0}
                                        value={currentTime}
                                        onChange={handleSeek}
                                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                                <span className="text-xs text-slate-500 w-10 text-right">{formatTime(currentTime)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
