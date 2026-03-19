export interface GeneratedTrack {
    id: string;
    title: string;
    artist: string;
    duration: string;
    fileUrl: string;
}

export interface GeneratedAlbum {
    id: string;
    title: string;
    artist: string;
    year: string;
    genre: string;
    coverColor: string;
    coverImage?: string;
    spotifyUrl?: string;
    tracks: GeneratedTrack[];
}

export interface GeneratedFeaturedTrack {
    trackId: string;
    albumId: string;
    coverImage?: string;
    spotifyUrl?: string;
    accentColor: string;
    tagline: string;
}

export const AUTO_GENERATED_SINGLE_ALBUMS: GeneratedAlbum[] = [
    {
        id: 'leave-me-alone-single',
        title: 'Leave Me Alone (Single)',
        artist: 'Lord Tsarcasm',
        year: '2026',
        genre: 'Single',
        coverColor: 'bg-gradient-to-br from-violet-900 via-fuchsia-900 to-slate-950',

        tracks: [
            {
                id: 'leave-me-alone',
                title: 'Leave Me Alone',
                artist: 'Lord Tsarcasm',
                duration: '4:47',
                fileUrl: '/assets/musicshrunk/singles/Leave Me Alone.opus'
            }
        ]
    }
];

export const AUTO_GENERATED_FEATURED_TRACKS: GeneratedFeaturedTrack[] = [
    {
        trackId: 'leave-me-alone',
        albumId: 'leave-me-alone-single',

        accentColor: 'from-violet-500 via-fuchsia-600 to-slate-900',
        tagline: 'New single release',
    }
];
