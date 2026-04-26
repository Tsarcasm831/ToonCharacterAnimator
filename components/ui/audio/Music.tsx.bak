import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Music as MusicIcon, Play, Pause, Volume2, VolumeX, SkipForward, SkipBack, X, ChevronUp, ChevronLeft, ChevronRight, Shuffle, Repeat, Repeat1, ListMusic, Disc3, Star, Sparkles } from 'lucide-react';
import { useMusic } from '../../../contexts/MusicContext';
import { useIsIphoneLayout } from '../../../hooks/useIsIphoneLayout';
import { supabase } from '../../../lib/supabase';
import { AUTO_GENERATED_FEATURED_TRACKS, AUTO_GENERATED_SINGLE_ALBUMS } from './autoSingles.generated';

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
    spotifyUrl?: string;
    tracks: Track[];
}

const ALBUMS: Album[] = [
    {
        id: 'best-friend-exe-single',
        title: 'best_friend.exe (Single)',
        artist: 'Lord Tsarcasm',
        year: '2026',
        genre: 'Single',
        coverColor: 'bg-gradient-to-br from-fuchsia-900 via-indigo-900 to-slate-950',
        coverImage: '/assets/images/singles/bestfriendexe.png',
        tracks: [
            {
                id: 'best-friend-exe',
                title: 'best_friend.exe',
                artist: 'Lord Tsarcasm',
                duration: '4:00',
                fileUrl: '/assets/musicshrunk/singles/best_friend.exe.opus'
            }
        ]
    },
    {
        id: 'journeys',
        title: 'Journeys',
        artist: 'Lord Tsarcasm',
        year: '2026',
        genre: 'Ambient',
        coverColor: 'bg-gradient-to-br from-blue-500 to-purple-600',
        coverImage: '/assets/images/albums/Journeys.jpg',
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
        coverImage: '/assets/images/albums/Echoes.jpg',
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
        genre: 'various',
        coverColor: 'bg-gradient-to-br from-orange-500 to-red-600',
        coverImage: '/assets/images/albums/Legends.jpg',
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
        coverImage: '/assets/images/albums/GreyMatterTavern.png',
        spotifyUrl: 'https://open.spotify.com/album/747WdTf78nh7fKYeN0CtUT?si=9eEP4-4SSDSe67375ElCeA',
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
    },
    {
        id: 'old-tracks',
        title: 'Old Tracks + Unsorted',
        artist: 'Lord Tsarcasm',
        year: '2025-2026',
        genre: 'Rock / Alt / Various',
        coverColor: 'bg-gradient-to-br from-slate-700 via-slate-800 to-black',
        tracks: [
            {
                id: 'bad-day',
                title: 'Bad Day',
                artist: 'Lord Tsarcasm',
                duration: '3:02',
                fileUrl: '/assets/musicshrunk/OldTracks/Bad Day.opus'
            },
            {
                id: 'glorious-rock-version',
                title: 'Glorious (Rock Version)',
                artist: 'Lord Tsarcasm',
                duration: '4:30',
                fileUrl: '/assets/musicshrunk/OldTracks/Glorious (Rock Version).opus'
            },
            {
                id: 'last-to-fall-speech',
                title: 'Last to Fall (Speech)',
                artist: 'Lord Tsarcasm',
                duration: '4:06',
                fileUrl: '/assets/musicshrunk/OldTracks/Last to Fall (Speech).opus'
            },
            {
                id: 'paper-walls',
                title: 'Paper Walls',
                artist: 'Lord Tsarcasm',
                duration: '4:49',
                fileUrl: '/assets/musicshrunk/OldTracks/Paper Walls.opus'
            },
            {
                id: 'puppet-on-a-wire-cover',
                title: 'Puppet on a Wire (Cover)',
                artist: 'Lord Tsarcasm',
                duration: '2:51',
                fileUrl: '/assets/musicshrunk/OldTracks/Puppet on a Wire (Cover).opus'
            },
            {
                id: 'clusterflux',
                title: 'Clusterflux',
                artist: 'Lord Tsarcasm',
                duration: '3:24',
                fileUrl: '/assets/musicshrunk/Unsorted/Clusterflux.opus'
            },
            {
                id: 'cool-story-bro',
                title: 'Cool Story, Bro',
                artist: 'Lord Tsarcasm',
                duration: '3:42',
                fileUrl: '/assets/musicshrunk/Unsorted/Cool Story, Bro.opus'
            },
            {
                id: 'dnb-focus',
                title: 'DnB Focus',
                artist: 'Lord Tsarcasm',
                duration: '4:18',
                fileUrl: '/assets/musicshrunk/Unsorted/DnB Focus.opus'
            },
            {
                id: 'i-just-hid',
                title: 'I Just Hid (INFJ Anthem)',
                artist: 'Lord Tsarcasm',
                duration: '3:36',
                fileUrl: '/assets/musicshrunk/Unsorted/I Just Hid (INFJ Anthem).opus'
            },
            {
                id: 'minion-remastered',
                title: 'Minion (Remastered)',
                artist: 'Lord Tsarcasm',
                duration: '2:41',
                fileUrl: '/assets/musicshrunk/Unsorted/Minion (Remastered).opus'
            },
            {
                id: 'new-medicine',
                title: 'New Medicine',
                artist: 'Lord Tsarcasm',
                duration: '3:24',
                fileUrl: '/assets/musicshrunk/Unsorted/New Medicine.opus'
            },
            {
                id: 'out-of-control',
                title: 'Out Of Control',
                artist: 'Lord Tsarcasm',
                duration: '3:53',
                fileUrl: '/assets/musicshrunk/Unsorted/Out Of Control.opus'
            },
            {
                id: 'safety-net',
                title: 'Safety Net',
                artist: 'Lord Tsarcasm',
                duration: '3:59',
                fileUrl: '/assets/musicshrunk/Unsorted/Safety Net.opus'
            },
            {
                id: 'twelve',
                title: 'Twelve',
                artist: 'Lord Tsarcasm',
                duration: '3:14',
                fileUrl: '/assets/musicshrunk/Unsorted/Twelve.opus'
            },
            {
                id: 'who-are-you',
                title: 'Who Are You?',
                artist: 'Lord Tsarcasm',
                duration: '3:53',
                fileUrl: '/assets/musicshrunk/Unsorted/Who Are You_.opus'
            },
            {
                id: 'tushka-chubby',
                title: 'Тушка - Chubby',
                artist: 'Lord Tsarcasm',
                duration: '1:34',
                fileUrl: '/assets/musicshrunk/Unsorted/Тушка - Chubby.opus'
            }
        ]
    },
    {
        id: 'gone-single',
        title: 'Gone (Single)',
        artist: 'Lord Tsarcasm',
        year: '2026',
        genre: 'Single',
        coverColor: 'bg-gradient-to-br from-slate-800 via-red-900 to-black',
        coverImage: '/assets/images/singles/gone.png',
        spotifyUrl: 'https://open.spotify.com/track/4tt8reEEs8eqT6KZAd4t3v?si=8295b47d3190423',
        tracks: [
            {
                id: 'gone',
                title: 'GONE',
                artist: 'Lord Tsarcasm',
                duration: '2:04',
                fileUrl: '/assets/musicshrunk/Unsorted/GONE.opus'
            }
        ]
    },
    {
        id: 'fridge-room-single',
        title: 'Fridge Room (Single)',
        artist: 'Lord Tsarcasm',
        year: '2026',
        genre: 'Single',
        coverColor: 'bg-gradient-to-br from-cyan-900 via-slate-800 to-indigo-950',
        coverImage: '/assets/images/singles/fridgeroom.png',
        spotifyUrl: 'https://open.spotify.com/track/4TQ141eI7veKusa920gbof?si=135a51aa02aa47f1',
        tracks: [
            {
                id: 'fridge-room',
                title: 'Fridge Room',
                artist: 'Lord Tsarcasm',
                duration: '2:37',
                fileUrl: '/assets/musicshrunk/singles/Fridge Room.opus'
            }
        ]
    },
    {
        id: 'riding-shotgun-single',
        title: 'Riding Shotgun (Single)',
        artist: 'Lord Tsarcasm',
        year: '2026',
        genre: 'Single',
        coverColor: 'bg-gradient-to-br from-amber-700 via-orange-700 to-red-900',
        coverImage: '/assets/images/singles/ridingshotgun.png',
        spotifyUrl: 'https://open.spotify.com/track/4yQE1TOktuTYEjg9Rx0KOk?si=b5ead6c6d3724151',
        tracks: [
            {
                id: 'riding-shotgun',
                title: 'Riding Shotgun',
                artist: 'Lord Tsarcasm',
                duration: '3:17',
                fileUrl: '/assets/musicshrunk/singles/Riding Shotgun.opus'
            }
        ]
    },
    {
        id: 'falterlight-single',
        title: 'Falterlight (Single)',
        artist: 'Lord Tsarcasm',
        year: '2026',
        genre: 'Single',
        coverColor: 'bg-gradient-to-br from-violet-800 via-fuchsia-800 to-slate-900',
        coverImage: '/assets/images/singles/falterlight.png',
        spotifyUrl: 'https://open.spotify.com/track/3raZiaaYelR9yU1rKT11S8?si=aa1d5f6ac2154d3b',
        tracks: [
            {
                id: 'falterlight',
                title: 'Falterlight',
                artist: 'Lord Tsarcasm',
                duration: '3:44',
                fileUrl: '/assets/musicshrunk/singles/Falterlight.opus'
            }
        ]
    },
    {
        id: 'pests-single',
        title: 'Pests (Single)',
        artist: 'Lord Tsarcasm',
        year: '2026',
        genre: 'Single',
        coverColor: 'bg-gradient-to-br from-lime-900 via-emerald-900 to-slate-950',
        coverImage: '/assets/images/singles/pests.png',
        spotifyUrl: 'https://open.spotify.com/track/513K6iiKykRj5uRT20GxKX?si=f28a07410e6d430b',
        tracks: [
            {
                id: 'pests',
                title: 'Pests',
                artist: 'Lord Tsarcasm',
                duration: '3:08',
                fileUrl: '/assets/musicshrunk/singles/Pests.opus'
            }
        ]
    },
    {
        id: 'witching-hour-single',
        title: 'The Witching Hour (Single)',
        artist: 'Lord Tsarcasm',
        year: '2026',
        genre: 'Single',
        coverColor: 'bg-gradient-to-br from-violet-950 via-purple-900 to-slate-950',
        coverImage: '/assets/images/singles/witchinghour.png',
        tracks: [
            {
                id: 'the-witching-hour',
                title: 'The Witching Hour',
                artist: 'Lord Tsarcasm',
                duration: '4:21',
                fileUrl: '/assets/musicshrunk/singles/The Witching Hour.opus'
            }
        ]
    },
    ...AUTO_GENERATED_SINGLE_ALBUMS
];

// ---------------------------------------------------------------------------
// Featured Tracks Config
// ---------------------------------------------------------------------------
interface FeaturedTrack {
    trackId: string;
    albumId: string;
    coverImage?: string; // placeholder — user will add individual images later
    spotifyUrl?: string;
    accentColor: string;
    tagline: string;
}

const FEATURED_TRACKS: FeaturedTrack[] = [
    {
        trackId: 'dnb-focus',
        albumId: 'old-tracks',
        coverImage: '/assets/images/singles/dnbfocus.png',
        accentColor: 'from-cyan-400 via-blue-500 to-indigo-700',
        tagline: 'Lock in. Drum & Bass focus mode',
    },
    {
        trackId: 'gone',
        albumId: 'gone-single',
        coverImage: '/assets/images/singles/gone.png',
        spotifyUrl: 'https://open.spotify.com/track/4tt8reEEs8eqT6KZAd4t3v?si=8295b47d3190423',
        accentColor: 'from-slate-700 via-rose-800 to-red-950',
        tagline: 'A sharp, stripped-down single release',
    },
    {
        trackId: 'fridge-room',
        albumId: 'fridge-room-single',
        coverImage: '/assets/images/singles/fridgeroom.png',
        spotifyUrl: 'https://open.spotify.com/track/4TQ141eI7veKusa920gbof?si=135a51aa02aa47f1',
        accentColor: 'from-cyan-500 via-slate-600 to-indigo-800',
        tagline: 'Cold room ambience with sharp edges',
    },
    {
        trackId: 'pests',
        albumId: 'pests-single',
        coverImage: '/assets/images/singles/pests.png',
        spotifyUrl: 'https://open.spotify.com/track/513K6iiKykRj5uRT20GxKX?si=f28a07410e6d430b',
        accentColor: 'from-lime-600 via-emerald-700 to-slate-900',
        tagline: 'Dark, crawling tension in motion',
    },
    ...AUTO_GENERATED_FEATURED_TRACKS
];

const resolveFeatured = (ft: FeaturedTrack): { track: Track; album: Album } | null => {
    const album = ALBUMS.find(a => a.id === ft.albumId);
    if (!album) return null;
    const track = album.tracks.find(t => t.id === ft.trackId);
    if (!track) return null;
    return { track, album };
};

const getCoverStyleFromImage = (coverImage?: string) =>
    coverImage
        ? {
              backgroundImage: `url(${coverImage})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
          }
        : undefined;

// ---------------------------------------------------------------------------
// Reusable TrackRow
// ---------------------------------------------------------------------------
const TrackRow: React.FC<{
    track: Track;
    index: number;
    isActive: boolean;
    isPlaying: boolean;
    onPlay: () => void;
    onToggle: () => void;
    compact?: boolean;
}> = ({ track, index, isActive, isPlaying: playing, onPlay, onToggle, compact }) => (
    <div
        className={`group p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
            isActive
                ? 'bg-purple-500/15 border-purple-500/30 shadow-[0_0_20px_-4px_rgba(168,85,247,0.15)]'
                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06] hover:border-white/15'
        }`}
        onClick={isActive ? onToggle : onPlay}
    >
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className={`text-xs font-mono w-5 text-right shrink-0 ${isActive ? 'text-purple-400' : 'text-slate-600'}`}>
                    {index + 1}
                </span>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        isActive ? onToggle() : onPlay();
                    }}
                    className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isActive && playing
                            ? 'bg-purple-500 shadow-lg shadow-purple-500/30'
                            : isActive
                            ? 'bg-purple-500/60'
                            : 'bg-white/10 group-hover:bg-white/20'
                    }`}
                >
                    {isActive && playing ? (
                        <Pause className="w-3.5 h-3.5 text-white" />
                    ) : (
                        <Play className="w-3.5 h-3.5 text-white ml-0.5" />
                    )}
                </button>
                <div className="min-w-0 flex-1">
                    <p className={`font-semibold truncate ${compact ? 'text-xs' : 'text-sm'} ${isActive ? 'text-purple-200' : 'text-white'}`}>
                        {track.title}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{track.artist}</p>
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                {isActive && playing && (
                    <div className="flex items-end gap-[2px] h-3">
                        <span className="w-[2px] bg-purple-400 rounded-full animate-pulse" style={{ height: '60%', animationDelay: '0ms' }} />
                        <span className="w-[2px] bg-purple-400 rounded-full animate-pulse" style={{ height: '100%', animationDelay: '150ms' }} />
                        <span className="w-[2px] bg-purple-400 rounded-full animate-pulse" style={{ height: '40%', animationDelay: '300ms' }} />
                    </div>
                )}
                <span className="text-xs text-slate-600 font-mono">{track.duration}</span>
            </div>
        </div>
    </div>
);

// ---------------------------------------------------------------------------
// Repeat icon helper
// ---------------------------------------------------------------------------
const RepeatIcon: React.FC<{ mode: 'off' | 'all' | 'one'; className?: string }> = ({ mode, className }) => {
    if (mode === 'one') return <Repeat1 className={className} />;
    return <Repeat className={className} />;
};

// ---------------------------------------------------------------------------
// Main MusicView
// ---------------------------------------------------------------------------
export const MusicView: React.FC = () => {
    const {
        currentTrack, isPlaying, volume, currentTime, duration,
        playTrack, togglePlayPause, setVolume, seek,
        playNextTrack, playPreviousTrack,
        isShuffleEnabled, toggleShuffle,
        repeatMode, cycleRepeatMode,
    } = useMusic();

    const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
    const [isMobileTrackListOpen, setIsMobileTrackListOpen] = useState(false);
    const [isMobilePlayerOpen, setIsMobilePlayerOpen] = useState(false);
    const [prevVolume, setPrevVolume] = useState(0.7);
    const [featuredIndex, setFeaturedIndex] = useState(0);
    const [featuredPaused, setFeaturedPaused] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const featuredTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const libraryScrollRef = useRef<HTMLDivElement | null>(null);
    const isIphoneLayout = useIsIphoneLayout();
    const previewTrackCount = isIphoneLayout ? 2 : 3;
    const albumsForDisplay = [...ALBUMS].sort((a, b) => {
        const rank: Record<string, number> = {
            'best-friend-exe-single': -10,
            journeys: 10,
            echoes: 11,
            legends: 12,
            'old-tracks': 99,
        };
        const aRank = rank[a.id] ?? 0;
        const bRank = rank[b.id] ?? 0;
        return aRank - bRank;
    });

    const isFeaturedTrackPlaying = isPlaying && !!currentTrack && FEATURED_TRACKS.some(ft => ft.trackId === currentTrack.id);

    // Featured carousel auto-rotation
    useEffect(() => {
        if (featuredPaused || isFeaturedTrackPlaying) return;
        featuredTimerRef.current = setInterval(() => {
            setFeaturedIndex(prev => (prev + 1) % FEATURED_TRACKS.length);
        }, 12000);
        return () => {
            if (featuredTimerRef.current) clearInterval(featuredTimerRef.current);
        };
    }, [featuredPaused, isFeaturedTrackPlaying]);

    const goFeatured = (dir: 1 | -1) => {
        setFeaturedIndex(prev => (prev + dir + FEATURED_TRACKS.length) % FEATURED_TRACKS.length);
        setFeaturedPaused(true);
        setTimeout(() => setFeaturedPaused(false), 10000);
    };

    const goToFeaturedIndex = (i: number) => {
        setFeaturedIndex(i);
        setFeaturedPaused(true);
        setTimeout(() => setFeaturedPaused(false), 10000);
    };

    const handlePlayTrack = useCallback(async (track: Track, queue?: Track[]) => {
        playTrack(track, queue);

        // Track play in Supabase
        try {
            const { error: incrementError } = await supabase.rpc('increment_music_track_listen', {
                p_track_id: track.id,
                p_track_title: track.title,
                p_track_artist: track.artist,
            });

            if (incrementError) {
                console.error('Analytics increment error:', incrementError);
            }
        } catch (err) {
            console.error('Failed to track play:', err);
        }

        setIsMobilePlayerOpen(true);
    }, [playTrack]);

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        seek(parseFloat(e.target.value));
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const toggleMute = () => {
        if (volume > 0) {
            setPrevVolume(volume);
            setVolume(0);
        } else {
            setVolume(prevVolume || 0.7);
        }
    };

    const handlePlayAll = (album: Album) => {
        if (album.tracks.length) handlePlayTrack(album.tracks[0], album.tracks);
    };

    const handleShufflePlay = (album: Album) => {
        if (!album.tracks.length) return;
        const shuffled = [...album.tracks].sort(() => Math.random() - 0.5);
        handlePlayTrack(shuffled[0], shuffled);
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    // Hourly analytics logging
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const { data, error } = await supabase
                    .from('music_track_listens')
                    .select('*')
                    .order('play_count', { ascending: false })
                    .limit(10);

                if (error) {
                    console.error('Analytics fetch error:', error);
                    return;
                }

                console.log(`🎵 5-Minute Music Analytics (${new Date().toLocaleTimeString()}):`);
                console.table(data?.map(track => ({
                    title: track.track_title,
                    artist: track.track_artist,
                    plays: track.play_count,
                    last_played: new Date(track.last_played).toLocaleString()
                })));
            } catch (err) {
                console.error('Failed to fetch analytics:', err);
            }
        }, 300000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const container = libraryScrollRef.current;
        if (!container) return;

        const handleScroll = () => {
            setShowBackToTop(container.scrollTop > 320);
        };

        handleScroll();
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [selectedAlbum, currentTrack]);

    const getAlbumCoverStyle = (album: Album) => getCoverStyleFromImage(album.coverImage);
    const handleBackToTop = () => {
        libraryScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Find album for current track — use fileUrl which is unique (track IDs can be duplicated across albums)
    const currentAlbum = currentTrack
        ? ALBUMS.find(a => a.tracks.some(t => t.fileUrl === currentTrack.fileUrl)) ?? null
        : null;
    const currentFeatured = currentTrack
        ? FEATURED_TRACKS.find(ft => {
              const resolved = resolveFeatured(ft);
              return resolved?.track.fileUrl === currentTrack.fileUrl;
          }) ?? null
        : null;
    const currentCoverImage = currentFeatured?.coverImage ?? currentAlbum?.coverImage;
    const currentCoverStyle = getCoverStyleFromImage(currentCoverImage);
    const hasCurrentCoverImage = Boolean(currentCoverImage);

    return (
        <div className="w-full h-full flex flex-col bg-slate-950 text-white overflow-hidden">
            <style>{`
                .music-slider {
                    -webkit-appearance: none;
                    appearance: none;
                    background: transparent;
                    cursor: pointer;
                }
                .music-slider::-webkit-slider-runnable-track {
                    height: 4px;
                    border-radius: 2px;
                    background: rgba(255,255,255,0.1);
                }
                .music-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 14px;
                    height: 14px;
                    background: #a855f7;
                    border-radius: 50%;
                    cursor: pointer;
                    border: 2px solid #fff;
                    margin-top: -5px;
                    box-shadow: 0 0 8px rgba(168,85,247,0.5);
                    transition: transform 0.15s ease;
                }
                .music-slider::-webkit-slider-thumb:hover {
                    transform: scale(1.2);
                }
                .music-slider::-moz-range-track {
                    height: 4px;
                    border-radius: 2px;
                    background: rgba(255,255,255,0.1);
                }
                .music-slider::-moz-range-thumb {
                    width: 14px;
                    height: 14px;
                    background: #a855f7;
                    border-radius: 50%;
                    cursor: pointer;
                    border: 2px solid #fff;
                    box-shadow: 0 0 8px rgba(168,85,247,0.5);
                }
                .music-slider.slim::-webkit-slider-runnable-track { height: 3px; }
                .music-slider.slim::-webkit-slider-thumb { width: 10px; height: 10px; margin-top: -3.5px; }
                .music-slider.slim::-moz-range-track { height: 3px; }
                .music-slider.slim::-moz-range-thumb { width: 10px; height: 10px; }

                @media (max-width: 640px) {
                    .music-slider::-webkit-slider-thumb { width: 18px; height: 18px; margin-top: -7px; }
                    .music-slider::-moz-range-thumb { width: 18px; height: 18px; }
                }

                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }

                @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin-slow { animation: spin-slow 4s linear infinite; }

                @keyframes featured-progress { from { width: 0%; } to { width: 100%; } }
            `}</style>

            {/* Header */}
            <div className={`border-b border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent backdrop-blur-sm ${isIphoneLayout ? 'px-5 py-5' : 'px-4 sm:px-8 py-4 sm:py-6'}`}>
                <div className={`flex flex-col gap-3 ${isIphoneLayout ? '' : 'sm:flex-row sm:items-center sm:justify-between'}`}>
                    <div>
                        <h2 className={`font-black text-white uppercase tracking-tighter leading-tight ${isIphoneLayout ? 'text-3xl' : 'text-2xl sm:text-5xl'}`}>
                            Music Library
                        </h2>
                        <div className="flex flex-col gap-1">
                            <p className={`text-slate-400 font-bold uppercase leading-snug ${isIphoneLayout ? 'text-[10px] tracking-[0.25em]' : 'text-xs tracking-[0.4em]'}`}>
                                Game Soundtracks & Ambient Music
                            </p>
                            <p className={`text-red-500/80 font-medium leading-tight ${isIphoneLayout ? 'text-[9px] max-w-[20ch]' : 'text-[11px]'}`}>
                                FYI: all tracks are encoded in .opus format and are less than 2Mb per file. Intentionally testing small file sizes for 'how is this still listenable' shock factor
                            </p>
                        </div>
                    </div>
                    <div className={`flex items-center gap-3 bg-white/[0.04] px-4 py-2 rounded-xl border border-white/10 w-fit ${isIphoneLayout ? '' : 'sm:w-auto'}`}>
                        <Disc3 className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-300">
                            {ALBUMS.length} Albums &bull; {ALBUMS.reduce((n, a) => n + a.tracks.length, 0)} Tracks
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden flex-col lg:flex-row">
                {/* Albums Grid + Featured */}
                <div ref={libraryScrollRef} className={`flex-1 overflow-y-auto custom-scrollbar ${isIphoneLayout ? 'p-4' : 'p-4 sm:p-8'} ${currentTrack ? 'pb-24 lg:pb-8' : ''}`}>

                    {/* --------------------------------------------------------- */}
                    {/* Featured Spotlight                                        */}
                    {/* --------------------------------------------------------- */}
                    {(() => {
                        const ft = FEATURED_TRACKS[featuredIndex];
                        const resolved = resolveFeatured(ft);
                        if (!resolved) return null;
                        const { track: fTrack, album: fAlbum } = resolved;
                        const isFeaturedActive = currentTrack?.fileUrl === fTrack.fileUrl;

                        return (
                            <div className={`relative mb-6 sm:mb-8 rounded-2xl overflow-hidden border border-white/10 ${isIphoneLayout ? '' : ''}`}>
                                {/* Background gradient — changes per featured track */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${ft.accentColor} opacity-20`} />
                                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/50 to-transparent" />

                                {/* Content */}
                                <div className={`relative flex items-center gap-4 ${isIphoneLayout ? 'p-4' : 'p-5 sm:p-8'}`}>
                                    {/* Cover / Placeholder */}
                                    <div
                                        className={`shrink-0 rounded-xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10 flex items-center justify-center ${isIphoneLayout ? 'w-20 h-20' : 'w-28 h-28 sm:w-36 sm:h-36'}`}
                                        style={
                                            ft.coverImage
                                                ? { backgroundImage: `url(${ft.coverImage})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
                                                : undefined
                                        }
                                    >
                                        {!ft.coverImage && (
                                            <div className={`w-full h-full bg-gradient-to-br ${ft.accentColor} flex items-center justify-center`}>
                                                <MusicIcon className={`text-white/40 ${isIphoneLayout ? 'w-8 h-8' : 'w-12 h-12'}`} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400/90">Featured</span>
                                        </div>
                                        <h3 className={`font-black text-white leading-tight truncate ${isIphoneLayout ? 'text-lg' : 'text-xl sm:text-3xl'}`}>
                                            {fTrack.title}
                                        </h3>
                                        <p className={`text-slate-400 font-medium mt-0.5 ${isIphoneLayout ? 'text-xs' : 'text-sm'}`}>
                                            {fTrack.artist} &bull; <span className="text-slate-500">{fAlbum.title}</span>
                                        </p>
                                        {/* Play button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (isFeaturedActive) {
                                                    togglePlayPause();
                                                } else {
                                                    handlePlayTrack(fTrack, fAlbum.tracks);
                                                }
                                            }}
                                            className={`mt-3 flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all active:scale-95 ${
                                                isFeaturedActive && isPlaying
                                                    ? 'bg-white/20 backdrop-blur-sm text-white'
                                                    : 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                                            }`}
                                        >
                                            {isFeaturedActive && isPlaying ? (
                                                <><Pause className="w-4 h-4" /> Playing</>
                                            ) : (
                                                <><Play className="w-4 h-4 ml-0.5" /> Play Now</>
                                            )}
                                            <span className="text-white/50 text-xs font-mono ml-1">{fTrack.duration}</span>
                                        </button>
                                        {ft.spotifyUrl && (
                                            <a
                                                href={ft.spotifyUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs bg-white/10 hover:bg-white/20 transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <MusicIcon className="w-3.5 h-3.5" /> Open on Spotify
                                            </a>
                                        )}
                                    </div>

                                    {/* Nav arrows (desktop) */}
                                    {!isIphoneLayout && (
                                        <div className="hidden sm:flex flex-col gap-2 shrink-0">
                                            <button
                                                onClick={() => goFeatured(-1)}
                                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                            >
                                                <ChevronLeft className="w-4 h-4 text-white" />
                                            </button>
                                            <button
                                                onClick={() => goFeatured(1)}
                                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                            >
                                                <ChevronRight className="w-4 h-4 text-white" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Dot indicators + mobile arrows */}
                                <div className="relative flex items-center justify-center gap-3 pb-3">
                                    {isIphoneLayout && (
                                        <button onClick={() => goFeatured(-1)} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                                            <ChevronLeft className="w-3 h-3 text-white" />
                                        </button>
                                    )}
                                    <div className="flex items-center gap-1.5">
                                        {FEATURED_TRACKS.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => goToFeaturedIndex(i)}
                                                className={`rounded-full transition-all duration-300 ${
                                                    i === featuredIndex
                                                        ? 'w-6 h-1.5 bg-purple-400'
                                                        : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    {isIphoneLayout && (
                                        <button onClick={() => goFeatured(1)} className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                                            <ChevronRight className="w-3 h-3 text-white" />
                                        </button>
                                    )}
                                </div>

                                {/* Auto-rotation progress bar */}
                                {!featuredPaused && !isFeaturedTrackPlaying && (
                                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
                                        <div
                                            className="h-full bg-purple-500/60 rounded-full"
                                            style={{
                                                animation: 'featured-progress 12s linear infinite',
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    <div className={`grid gap-4 sm:gap-6 ${isIphoneLayout ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                        {albumsForDisplay.map((album) => (
                            <div
                                key={album.id}
                                className={`group bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden hover:bg-white/[0.05] transition-all duration-500 hover:scale-[1.01] hover:border-white/15 hover:shadow-xl hover:shadow-purple-500/5 cursor-pointer ${
                                    selectedAlbum?.id === album.id ? 'ring-2 ring-purple-500/40 bg-white/[0.04]' : ''
                                }`}
                                onClick={() => {
                                    setSelectedAlbum(album);
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
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                                    ) : (
                                        <div className="absolute inset-0 bg-black/20" />
                                    )}
                                    {!album.coverImage && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <MusicIcon className="w-12 sm:w-16 h-12 sm:h-16 text-white/40" />
                                        </div>
                                    )}
                                    {/* Hover play overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="w-12 h-12 bg-purple-500/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30">
                                            <Play className="w-5 h-5 text-white ml-0.5" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-3 left-3 right-3">
                                        {(album.id === 'old-tracks' || !album.coverImage) && (
                                            <>
                                                <h3 className={`font-black text-white uppercase tracking-tight drop-shadow-lg ${isIphoneLayout ? 'text-base' : 'text-lg sm:text-xl'}`}>{album.title}</h3>
                                                <p className="text-xs text-white/70 font-medium drop-shadow">{album.artist}</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Album Info */}
                                <div className={`p-3 ${isIphoneLayout ? '' : 'sm:p-4'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase text-slate-500">{album.year}</span>
                                            <span className="text-[10px] font-black uppercase text-purple-400/80">{album.genre}</span>
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-slate-500">{album.tracks.length} tracks</span>
                                    </div>

                                    {/* Track List Preview */}
                                    <div className="space-y-0.5">
                                        {album.tracks.slice(0, previewTrackCount).map((track, index) => (
                                            <div key={track.id} className="flex items-center justify-between text-xs py-0.5">
                                                <span className="text-slate-400 truncate">{index + 1}. {track.title}</span>
                                                <span className="text-slate-600 font-mono text-[10px] ml-2">{track.duration}</span>
                                            </div>
                                        ))}
                                        {album.tracks.length > previewTrackCount && (
                                            <p className="text-[11px] text-slate-600 font-medium pt-0.5">
                                                +{album.tracks.length - previewTrackCount} more tracks
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --------------------------------------------------------- */}
                {/* Side Panel — Desktop                                      */}
                {/* --------------------------------------------------------- */}
                {(selectedAlbum || currentTrack) && (
                    <div className="hidden lg:flex w-[26rem] bg-slate-900/60 backdrop-blur-md border-l border-white/5 flex-col overflow-hidden">
                        {/* Album Header — only when album selected */}
                        {selectedAlbum && (
                            <div className="p-6 border-b border-white/5">
                                <div
                                    className={`h-36 ${selectedAlbum.coverImage ? '' : selectedAlbum.coverColor} rounded-2xl mb-4 relative overflow-hidden`}
                                    style={getAlbumCoverStyle(selectedAlbum)}
                                >
                                    {selectedAlbum.coverImage ? (
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                                    ) : (
                                        <>
                                            <div className="absolute inset-0 bg-black/20" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <MusicIcon className="w-12 h-12 text-white/40" />
                                            </div>
                                        </>
                                    )}
                                </div>
                                {(selectedAlbum.id === 'old-tracks' || !selectedAlbum.coverImage) && (
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">{selectedAlbum.title}</h3>
                                )}
                                {(selectedAlbum.id === 'old-tracks' || !selectedAlbum.coverImage) && (
                                    <p className="text-sm text-slate-400 font-medium">{selectedAlbum.artist} &bull; {selectedAlbum.year}</p>
                                )}
                                <p className="text-xs text-purple-400 font-black uppercase tracking-widest mt-1">{selectedAlbum.genre}</p>
                                {selectedAlbum.spotifyUrl && (
                                    <a
                                        href={selectedAlbum.spotifyUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-emerald-300 hover:text-emerald-200 transition-colors"
                                    >
                                        <MusicIcon className="w-3.5 h-3.5" /> Listen on Spotify
                                    </a>
                                )}

                                {/* Play All / Shuffle Play */}
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handlePlayAll(selectedAlbum); }}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 transition-colors text-sm font-bold"
                                    >
                                        <Play className="w-4 h-4" /> Play All
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleShufflePlay(selectedAlbum); }}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition-colors text-sm font-bold"
                                    >
                                        <Shuffle className="w-4 h-4" /> Shuffle
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Track List — only when album selected */}
                        {selectedAlbum && (
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-1.5">
                                {selectedAlbum.tracks.map((track, index) => (
                                    <TrackRow
                                        key={track.id}
                                        track={track}
                                        index={index}
                                        isActive={currentTrack?.fileUrl === track.fileUrl}
                                        isPlaying={isPlaying}
                                        onPlay={() => handlePlayTrack(track, selectedAlbum.tracks)}
                                        onToggle={togglePlayPause}
                                    />
                                ))}
                            </div>
                        )}

                        {/* When no album selected but track is playing, show expanded now-playing */}
                        {!selectedAlbum && currentTrack && (
                            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
                                <div
                                    className={`w-48 h-48 shrink-0 rounded-2xl overflow-hidden relative shadow-2xl shadow-purple-500/20 flex items-center justify-center ${
                                        hasCurrentCoverImage ? '' : 'bg-gradient-to-br from-purple-500 to-pink-600'
                                    }`}
                                    style={currentCoverStyle}
                                >
                                    {!hasCurrentCoverImage && <MusicIcon className="w-16 h-16 text-white/50" />}
                                    {hasCurrentCoverImage && (
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                                    )}
                                </div>
                                <div className="text-center">
                                    <h4 className="text-xl font-black text-white mb-1">{currentTrack.title}</h4>
                                    <p className="text-sm text-slate-400">{currentTrack.artist}</p>
                                    <p className="text-xs text-purple-400 font-black uppercase tracking-widest mt-1">{currentAlbum?.genre}</p>
                                </div>
                            </div>
                        )}

                        {/* Desktop Now-Playing Bar — always visible when track playing */}
                        {currentTrack && (
                            <div className="border-t border-white/5 bg-slate-900/80 backdrop-blur-lg p-4 space-y-3">
                                {/* Progress */}
                                <div className="relative">
                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-[width] duration-300 ease-linear"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max={duration || 0}
                                        value={currentTime}
                                        onChange={handleSeek}
                                        aria-label="Seek current track"
                                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                                        <span>{formatTime(currentTime)}</span>
                                        <span>{formatTime(duration)}</span>
                                    </div>
                                </div>

                                {/* Track info + controls */}
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-10 h-10 shrink-0 rounded-lg overflow-hidden relative ${hasCurrentCoverImage ? '' : 'bg-gradient-to-br from-purple-500 to-pink-600'} flex items-center justify-center`}
                                        style={currentCoverStyle}
                                    >
                                        {!hasCurrentCoverImage && <MusicIcon className="w-5 h-5 text-white/50" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-white truncate">{currentTrack.title}</p>
                                        <p className="text-xs text-slate-500 truncate">{currentTrack.artist}</p>
                                    </div>
                                </div>

                                {/* Transport */}
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={toggleShuffle}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isShuffleEnabled ? 'text-purple-400 bg-purple-500/20' : 'text-slate-500 hover:text-white'}`}
                                    >
                                        <Shuffle className="w-3.5 h-3.5" />
                                    </button>

                                    <div className="flex items-center gap-3">
                                        <button onClick={playPreviousTrack} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                                            <SkipBack className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={togglePlayPause}
                                            className="w-10 h-10 bg-purple-500 hover:bg-purple-600 rounded-full flex items-center justify-center transition-colors shadow-lg shadow-purple-500/20"
                                        >
                                            {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
                                        </button>
                                        <button onClick={playNextTrack} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                                            <SkipForward className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <button
                                        onClick={cycleRepeatMode}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${repeatMode !== 'off' ? 'text-purple-400 bg-purple-500/20' : 'text-slate-500 hover:text-white'}`}
                                    >
                                        <RepeatIcon mode={repeatMode} className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Volume */}
                                <div className="flex items-center gap-2">
                                    <button onClick={toggleMute} className="text-slate-400 hover:text-white transition-colors">
                                        {volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                                    </button>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={volume}
                                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                                        aria-label="Adjust volume"
                                        className="flex-1 music-slider slim"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --------------------------------------------------------- */}
                {/* Mobile Track List Modal                                   */}
                {/* --------------------------------------------------------- */}
                {selectedAlbum && isMobileTrackListOpen && (
                    <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end" onClick={() => setIsMobileTrackListOpen(false)}>
                        <div className="bg-slate-900 w-full max-h-[75vh] rounded-t-3xl" onClick={(e) => e.stopPropagation()}>
                            {/* Modal Header */}
                            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-12 h-12 ${selectedAlbum.coverImage ? '' : selectedAlbum.coverColor} rounded-xl overflow-hidden flex items-center justify-center`}
                                        style={getAlbumCoverStyle(selectedAlbum)}
                                    >
                                        {!selectedAlbum.coverImage && <MusicIcon className="w-6 h-6 text-white/50" />}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white uppercase tracking-tight">{selectedAlbum.title}</h3>
                                        <p className="text-xs text-slate-400">{selectedAlbum.artist} &bull; {selectedAlbum.tracks.length} tracks</p>
                                        {selectedAlbum.spotifyUrl && (
                                            <a
                                                href={selectedAlbum.spotifyUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 hover:text-emerald-200 transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <MusicIcon className="w-3 h-3" /> Spotify
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsMobileTrackListOpen(false)}
                                    className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>

                            {/* Play All / Shuffle */}
                            <div className="flex gap-2 px-4 pt-3">
                                <button
                                    onClick={() => handlePlayAll(selectedAlbum)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 transition-colors text-sm font-bold"
                                >
                                    <Play className="w-4 h-4" /> Play All
                                </button>
                                <button
                                    onClick={() => handleShufflePlay(selectedAlbum)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition-colors text-sm font-bold"
                                >
                                    <Shuffle className="w-4 h-4" /> Shuffle
                                </button>
                            </div>

                            {/* Mobile Track List */}
                            <div className="overflow-y-auto max-h-[50vh] p-4 space-y-1.5">
                                {selectedAlbum.tracks.map((track, index) => (
                                    <TrackRow
                                        key={track.id}
                                        track={track}
                                        index={index}
                                        isActive={currentTrack?.fileUrl === track.fileUrl}
                                        isPlaying={isPlaying}
                                        onPlay={() => handlePlayTrack(track, selectedAlbum.tracks)}
                                        onToggle={togglePlayPause}
                                        compact
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* --------------------------------------------------------- */}
                {/* Mobile Full Player                                        */}
                {/* --------------------------------------------------------- */}
                {currentTrack && isMobilePlayerOpen && (
                    <div className="lg:hidden fixed inset-0 z-50 flex flex-col" style={{ background: 'linear-gradient(180deg, #0c0a1a 0%, #1a0e2e 40%, #0f172a 100%)' }}>
                        {/* Ambient glow behind artwork */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px]" />
                        </div>

                        {/* Drag handle + close */}
                        <div className="relative flex items-center justify-between px-5 pt-4 pb-2">
                            <button
                                onClick={() => setIsMobilePlayerOpen(false)}
                                className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center active:scale-95 transition-transform"
                            >
                                <ChevronUp className="w-4 h-4 text-white rotate-180" />
                            </button>
                            <div className="w-10 h-1 bg-white/20 rounded-full" />
                            <button
                                onClick={() => {
                                    if (currentAlbum) {
                                        setSelectedAlbum(currentAlbum);
                                        setIsMobilePlayerOpen(false);
                                        setIsMobileTrackListOpen(true);
                                    }
                                }}
                                className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center active:scale-95 transition-transform"
                            >
                                <ListMusic className="w-4 h-4 text-white" />
                            </button>
                        </div>

                        {/* Artwork + Track Info — centered flex area */}
                        <div className="relative flex-1 flex flex-col items-center justify-center px-8 gap-5 min-h-0">
                            <div
                                className={`relative rounded-3xl overflow-hidden shadow-2xl shadow-purple-900/40 border border-white/10 flex items-center justify-center ${
                                    isIphoneLayout ? 'w-56 h-56' : 'w-64 h-64 sm:w-72 sm:h-72'
                                } ${hasCurrentCoverImage ? '' : 'bg-gradient-to-br from-purple-500 to-pink-600'}`}
                                style={currentCoverStyle}
                            >
                                {!hasCurrentCoverImage && <MusicIcon className="w-20 h-20 text-white/40" />}
                                {hasCurrentCoverImage && (
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                                )}
                                {isPlaying && (
                                    <div className="absolute bottom-3 right-3 flex items-end gap-[3px] h-4">
                                        <span className="w-[3px] bg-purple-400 rounded-full animate-pulse" style={{ height: '60%', animationDelay: '0ms' }} />
                                        <span className="w-[3px] bg-purple-400 rounded-full animate-pulse" style={{ height: '100%', animationDelay: '150ms' }} />
                                        <span className="w-[3px] bg-purple-400 rounded-full animate-pulse" style={{ height: '40%', animationDelay: '300ms' }} />
                                        <span className="w-[3px] bg-purple-400 rounded-full animate-pulse" style={{ height: '80%', animationDelay: '450ms' }} />
                                    </div>
                                )}
                            </div>

                            <div className="text-center w-full max-w-xs">
                                <h4 className={`font-black text-white leading-tight mb-1 ${isIphoneLayout ? 'text-lg' : 'text-xl sm:text-2xl'}`}>{currentTrack.title}</h4>
                                <p className="text-sm text-slate-400 font-medium">{currentTrack.artist}</p>
                                {currentAlbum && (
                                    <p className="text-[11px] text-purple-400/80 font-black uppercase tracking-[0.2em] mt-1">{currentAlbum.title} &bull; {currentAlbum.genre}</p>
                                )}
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative px-6 mb-2">
                            <div className="relative">
                                <div className="h-[6px] bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-[width] duration-300 ease-linear"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max={duration || 0}
                                    value={currentTime}
                                    onChange={handleSeek}
                                    aria-label="Seek current track"
                                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                                    style={{ height: '24px', marginTop: '-9px' }}
                                />
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-500 mt-1.5 font-mono">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Transport Controls */}
                        <div className="px-6 pb-3">
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={toggleShuffle}
                                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 ${isShuffleEnabled ? 'text-purple-400 bg-purple-500/20' : 'text-slate-500'}`}
                                >
                                    <Shuffle className="w-5 h-5" />
                                </button>

                                <div className="flex items-center gap-4">
                                    <button onClick={playPreviousTrack} className="w-13 h-13 rounded-full flex items-center justify-center active:scale-90 transition-transform">
                                        <SkipBack className="w-7 h-7 text-white" />
                                    </button>
                                    <button
                                        onClick={togglePlayPause}
                                        className="w-[72px] h-[72px] bg-purple-500 rounded-full flex items-center justify-center transition-all shadow-xl shadow-purple-500/30 active:scale-90"
                                    >
                                        {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white ml-1" />}
                                    </button>
                                    <button onClick={playNextTrack} className="w-13 h-13 rounded-full flex items-center justify-center active:scale-90 transition-transform">
                                        <SkipForward className="w-7 h-7 text-white" />
                                    </button>
                                </div>

                                <button
                                    onClick={cycleRepeatMode}
                                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90 ${repeatMode !== 'off' ? 'text-purple-400 bg-purple-500/20' : 'text-slate-500'}`}
                                >
                                    <RepeatIcon mode={repeatMode} className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Volume Control */}
                        <div className="flex items-center justify-center gap-3 px-10 pb-8">
                            <button onClick={toggleMute} className="text-slate-400 active:text-white transition-colors">
                                {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                aria-label="Adjust volume"
                                className="flex-1 music-slider"
                            />
                        </div>
                    </div>
                )}

                {/* Mobile Track List FAB */}
                {selectedAlbum && !isMobileTrackListOpen && !isMobilePlayerOpen && (
                    <div className={`lg:hidden fixed z-40 ${currentTrack ? 'bottom-[5.5rem]' : 'bottom-6'} right-4`}>
                        <button
                            onClick={() => setIsMobileTrackListOpen(true)}
                            className="w-14 h-14 bg-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30 hover:bg-purple-600 transition-all active:scale-95"
                        >
                            <ListMusic className="w-6 h-6 text-white" />
                        </button>
                    </div>
                )}

                {/* --------------------------------------------------------- */}
                {/* Mobile Mini Player                                        */}
                {/* --------------------------------------------------------- */}
                {currentTrack && !isMobilePlayerOpen && (
                    <div
                        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-white/10 backdrop-blur-xl shadow-2xl shadow-black/60"
                        onClick={() => setIsMobilePlayerOpen(true)}
                    >
                        {/* Progress line at top */}
                        <div className="h-[3px] bg-white/5">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-[width] duration-300 ease-linear"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <div className="px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-11 h-11 shrink-0 rounded-xl overflow-hidden relative flex items-center justify-center ${hasCurrentCoverImage ? '' : 'bg-gradient-to-br from-purple-500 to-pink-600'}`}
                                    style={currentCoverStyle}
                                >
                                    {!hasCurrentCoverImage && <MusicIcon className="w-5 h-5 text-white/50" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{currentTrack.title}</p>
                                    <p className="text-[11px] text-slate-500 truncate">{currentTrack.artist}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
                                        className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                                    >
                                        {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); playNextTrack(); }}
                                        className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 active:text-white transition-colors"
                                    >
                                        <SkipForward className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showBackToTop && (
                    <button
                        type="button"
                        onClick={handleBackToTop}
                        className={`fixed right-4 z-40 h-12 w-12 rounded-full bg-purple-500/90 hover:bg-purple-400 text-white shadow-xl shadow-purple-900/40 flex items-center justify-center transition-colors ${currentTrack && !isMobilePlayerOpen ? 'bottom-24 lg:bottom-6' : 'bottom-6'}`}
                        aria-label="Back to top"
                    >
                        <ChevronUp className="h-5 w-5" />
                    </button>
                )}
            </div>
        </div>
    );
};
