import * as THREE from 'three';
import * as User from './user.js';

// --- Defaults ---
const DEFAULT_SETTINGS = {
    soundVolume: 0.8,
    musicVolume: 0.5,
    graphicsQuality: 'medium', // 'low', 'medium', 'high'
    devMode: false,
};

// --- State ---
let settings = { ...DEFAULT_SETTINGS };
let audioContext;
let masterSoundGain;
let masterMusicGain;
const uiControls = [];

// --- Public API ---
export function initSettings() {
    loadSettings();
    setupUIControls('#options-screen');
    setupUIControls('#in-game-settings-modal');
}

export function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext) {
            masterSoundGain = audioContext.createGain();
            masterSoundGain.gain.value = settings.soundVolume;
            masterSoundGain.connect(audioContext.destination);

            masterMusicGain = audioContext.createGain();
            masterMusicGain.gain.value = settings.musicVolume;
            masterMusicGain.connect(audioContext.destination);
        }
    }
    return audioContext;
}

export function getMasterSoundGain() {
    return masterSoundGain;
}

export function getMasterMusicGain() {
    return masterMusicGain;
}

export function applyGraphicsSettings(renderer) {
    if (!renderer) return;

    switch (settings.graphicsQuality) {
        case 'low':
            renderer.setPixelRatio(window.devicePixelRatio * 0.5);
            renderer.shadowMap.enabled = false;
            break;
        case 'high':
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            break;
        case 'medium':
        default:
            renderer.setPixelRatio(window.devicePixelRatio * 0.75);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFShadowMap;
            break;
    }
}

// --- Internal Functions ---

function setupUIControls(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const soundSlider = container.querySelector('input[type="range"][aria-label="Sound Volume"]');
    const musicSlider = container.querySelector('input[type="range"][aria-label="Music Volume"]');
    const graphicsSelect = container.querySelector('select[aria-label="Graphics Quality"]');
    const devModeCheckbox = container.querySelector('input[type="checkbox"][aria-label="Dev Mode"]');

    if (!soundSlider || !musicSlider || !graphicsSelect || !devModeCheckbox) {
        console.warn(`Settings UI elements not found in "${containerSelector}". Skipping event listener setup.`);
        return;
    }

    uiControls.push({ soundSlider, musicSlider, graphicsSelect, devModeCheckbox });

    soundSlider.value = settings.soundVolume * 100;
    musicSlider.value = settings.musicVolume * 100;
    graphicsSelect.value = settings.graphicsQuality;
    devModeCheckbox.checked = settings.devMode;

    soundSlider.addEventListener('input', (e) => onSoundVolumeChange(e.target.value));
    musicSlider.addEventListener('input', (e) => onMusicVolumeChange(e.target.value));
    graphicsSelect.addEventListener('change', (e) => onGraphicsQualityChange(e.target.value));
    devModeCheckbox.addEventListener('change', (e) => onDevModeChange(e.target.checked));
}

function onDevModeChange(isEnabled) {
    settings.devMode = isEnabled;
    uiControls.forEach(ui => ui.devModeCheckbox.checked = isEnabled);
    User.setDevMode(isEnabled);
    saveSettings();
    alert("Dev mode setting changed. Refresh the Cards or Planning screen to see updates.");
}

function onSoundVolumeChange(value) {
    settings.soundVolume = value / 100;
    if (masterSoundGain) masterSoundGain.gain.value = settings.soundVolume;
    uiControls.forEach(ui => ui.soundSlider.value = value);
    saveSettings();
}

function onMusicVolumeChange(value) {
    settings.musicVolume = value / 100;
    if (masterMusicGain) masterMusicGain.gain.value = settings.musicVolume;
    uiControls.forEach(ui => ui.musicSlider.value = value);
    saveSettings();
}

function onGraphicsQualityChange(value) {
    settings.graphicsQuality = value;
    uiControls.forEach(ui => ui.graphicsSelect.value = value);
    saveSettings();
    // Note: requires game restart to apply fully.
}

export function applyDevSettings() {
    if (settings.devMode) {
        User.setDevMode(true);
    }
}

function saveSettings() {
    try {
        localStorage.setItem('disney-kingdom-clash-settings', JSON.stringify(settings));
    } catch (e) {
        console.warn("Could not save settings to localStorage.", e);
    }
}

function loadSettings() {
    try {
        const savedSettings = localStorage.getItem('disney-kingdom-clash-settings');
        if (savedSettings) {
            settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
        }
    } catch (e) {
        console.warn("Could not load settings from localStorage.", e);
        settings = { ...DEFAULT_SETTINGS };
    }
    applyDevSettings();
}