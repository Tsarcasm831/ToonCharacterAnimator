import { getAudioContext, getMasterMusicGain } from './settings.js';

const MUSIC_TRACKS = [
    'https://file.garden/Zy7B0LkdIVpGyzA1/Disney/music/dbgm1.mp3',
    'https://file.garden/Zy7B0LkdIVpGyzA1/Disney/music/dbgm2.mp3',
    'https://file.garden/Zy7B0LkdIVpGyzA1/Disney/music/dbgm3.mp3',
    'https://file.garden/Zy7B0LkdIVpGyzA1/Disney/music/dbgm4.mp3',
    'https://file.garden/Zy7B0LkdIVpGyzA1/Disney/music/dbgm5.mp3',
    'https://file.garden/Zy7B0LkdIVpGyzA1/Disney/music/dbgm6.mp3',
];
const CACHE_NAME = 'disney-kingdom-clash-music-v1';
const MODEL_CACHE_NAME = 'disney-kingdom-clash-models-v1';
const MODEL_TRACKS = [
    'https://file.garden/Zy7B0LkdIVpGyzA1/Disney/assets/glbs/jafar.glb',
    'https://file.garden/Zy7B0LkdIVpGyzA1/Disney/assets/glbs/groot.glb',
    'https://file.garden/Zy7B0LkdIVpGyzA1/Disney/assets/glbs/pooh.glb'
];

let musicAudio;
let musicPlaylist = [];
let currentTrackIndex = -1;
let isMusicPlaying = false;
let musicSourceNode = null;

export async function cacheMusicOnLoad() {
    if (!('caches' in window)) {
        console.log('Cache API not supported, skipping music caching.');
        return;
    }
    try {
        const cache = await caches.open(CACHE_NAME);
        const requests = MUSIC_TRACKS.map(url => new Request(url));
        const responses = await Promise.all(requests.map(req => cache.match(req)));
        const allCached = responses.every(res => res && res.ok);
        if (allCached) {
            console.log('All music tracks are already cached.');
            return;
        }
        console.log('Caching music tracks...');
        await cache.addAll(MUSIC_TRACKS);
        console.log('All music tracks cached successfully.');
    } catch (error) {
        console.error('Failed to cache music tracks:', error);
    }
}

export async function cacheModelsOnLoad() {
    if (!('caches' in window)) {
        console.log('Cache API not supported, skipping model caching.');
        return;
    }
    try {
        const cache = await caches.open(MODEL_CACHE_NAME);
        const requests = MODEL_TRACKS.map(url => new Request(url));
        const responses = await Promise.all(requests.map(req => cache.match(req)));
        const allCached = responses.every(res => res && res.ok);
        if (allCached) {
            console.log('All GLB models are already cached.');
            return;
        }
        console.log('Caching GLB models...');
        await cache.addAll(MODEL_TRACKS);
        console.log('All GLB models cached successfully.');
    } catch (error) {
        console.error('Failed to cache GLB models:', error);
    }
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function playNextTrack() {
    if (musicPlaylist.length === 0) return;
    currentTrackIndex++;
    if (currentTrackIndex >= musicPlaylist.length) {
        currentTrackIndex = 0;
        shuffle(musicPlaylist);
    }
    musicAudio.src = musicPlaylist[currentTrackIndex];
    musicAudio.play().catch(e => {
        console.warn("Music autoplay blocked. User interaction required.", e);
        isMusicPlaying = false;
    });
}

export function initMusicPlayer() {
    musicPlaylist = [...MUSIC_TRACKS];
    shuffle(musicPlaylist);
    musicAudio = new Audio();
    musicAudio.crossOrigin = "anonymous";
    musicAudio.addEventListener('ended', playNextTrack);
}

export function startMusic() {
    if (isMusicPlaying) return;
    const audioContext = getAudioContext();
    if (!audioContext) {
        console.log("Audio context not available yet, cannot start music.");
        return;
    }
    if (!musicSourceNode) {
        try {
            const source = audioContext.createMediaElementSource(musicAudio);
            const musicGain = getMasterMusicGain();
            source.connect(musicGain);
            musicSourceNode = source;
        } catch (e) {
            if (e.name !== "InvalidStateError") {
                console.error("Error connecting audio element to Web Audio API:", e);
                return;
            }
        }
    }
    isMusicPlaying = true;
    playNextTrack();
}