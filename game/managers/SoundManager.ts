
import * as THREE from 'three';
import { Player } from '../player/Player';
import { PlayerUtils } from '../player/PlayerUtils';
import { ENV_CONSTANTS, BIOME_DATA } from '../environment/EnvironmentTypes';

export class SoundManager {
    ctx: AudioContext | null = null;
    masterGain: GainNode | null = null;
    
    // State tracking for edge detection
    private prevIsDead = false;
    private prevIsJumping = false;
    private prevIsPickingUp = false;
    private prevIsGrounded = true;
    private prevJumpVelocity = 0;

    // Audio buffer cache
    private weaponSwingBuffer: AudioBuffer | null = null;
    private oreHitBuffer: AudioBuffer | null = null;
    private treeHitBuffer: AudioBuffer | null = null;
    private oreCrumblingBuffer: AudioBuffer | null = null;
    private treeFallBuffer: AudioBuffer | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
                this.masterGain = this.ctx.createGain();
                this.masterGain.connect(this.ctx.destination);
                this.masterGain.gain.value = 0.5; // Default volume
            }
        }
    }

    private ensureContext() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    private async loadAudioBuffer(url: string): Promise<AudioBuffer | null> {
        if (!this.ctx) return null;
        try {
            const response = await fetch(url);
            if (!response.ok) return null;
            const arrayBuffer = await response.arrayBuffer();
            return await this.ctx.decodeAudioData(arrayBuffer);
        } catch (e) {
            console.error('Failed to load audio:', url, e);
            return null;
        }
    }

    setVolume(volume: number) {
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.1);
        }
    }

    update(player: Player, dt: number, environment?: any) {
        if (!this.ctx) return;

        const isDead = player.status.isDead;

        // Detect Death
        if (isDead && !this.prevIsDead) {
            this.playDeath();
        }

        // Detect Jump
        if (player.locomotion.isJumping && !this.prevIsJumping) {
            this.playJump();
        }

        // Detect Landing
        const isGrounded = !player.locomotion.isJumping && Math.abs(player.locomotion.jumpVelocity) < 0.1;
        // Only play landing sound if falling at a significant speed before hitting ground
        if (isGrounded && !this.prevIsGrounded && this.prevJumpVelocity < -5.0) {
            this.playLand();
        }

        // Update velocity for next frame landing check
        this.prevJumpVelocity = player.locomotion.jumpVelocity;

        // Detect Pickup
        if (player.isPickingUp && !this.prevIsPickingUp) {
            this.playPickup();
        }

        // Detect Footsteps (Locomotion)
        if (player.locomotion.didStep && !player.locomotion.isJumping && isGrounded && !isDead) {
            const speed = player.velocity.length();
            const vol = speed > 8 ? 0.35 : 0.15;
            
            // Determine Terrain
            const terrain = this.getTerrainAt(player.mesh.position, environment);
            
            this.playFootstep(vol, terrain);
            player.locomotion.didStep = false;
        }

        // Update previous states
        this.prevIsDead = isDead;
        this.prevIsJumping = player.locomotion.isJumping;
        this.prevIsPickingUp = player.isPickingUp;
        this.prevIsGrounded = isGrounded;
    }

    private getTerrainAt(pos: THREE.Vector3, environment?: any): string {
        // 0. Check Environment specific biome (e.g. SingleBiomeEnvironment)
        if (environment && environment.getBiomeAt) {
             const biome = environment.getBiomeAt(pos);
             // If biome returns a name/color, map it to a sound type if needed
             // SingleBiomeEnvironment currently returns { name: 'Grass', color: ... }
             // We can check if biome.name or biome.type maps to a known sound key
             if (biome.type) return biome.type;
             if (biome.name === 'Grass') return 'Grass';
             // Default fallback for single biome if it doesn't specify type
             return 'Grass';
        }

        // 1. Check Water (Pond)
        const pondDepth = PlayerUtils.getTerrainHeight(pos.x, pos.z);
        if (pondDepth < -0.1) return 'Water';

        // 2. Check Biome Grid Tile
        const biomeSize = ENV_CONSTANTS.BIOME_SIZE;
        const ix = Math.round(pos.x / biomeSize);
        const iz = Math.round(pos.z / biomeSize);
        
        const key = `${ix},${iz}`;
        const biomeData = BIOME_DATA[key];
        
        if (biomeData) return biomeData.type;
        return 'Grass';
    }

    playFootstep(volume: number, terrain: string) {
        if (!this.ctx || !this.masterGain) return;
        this.ensureContext();
        const t = this.ctx.currentTime;
        
        // Setup Base Noise
        const bufferSize = this.ctx.sampleRate * 0.1; // 100ms
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() - 0.5) * 2;
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        const noiseGain = this.ctx.createGain();
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        // --- Synthesis Parameters per Terrain ---
        
        switch (terrain) {
            case 'Water':
                noiseFilter.type = 'bandpass';
                noiseFilter.frequency.setValueAtTime(400, t);
                noiseFilter.frequency.linearRampToValueAtTime(800, t + 0.1); // Splash sweep
                noiseGain.gain.setValueAtTime(volume * 1.5, t);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
                break;

            case 'Wood':
                // Hollow thud
                noiseFilter.type = 'lowpass';
                noiseFilter.frequency.setValueAtTime(300, t);
                noiseGain.gain.setValueAtTime(volume * 1.2, t);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
                // Add resonant sine for "hollow" feel
                const osc = this.ctx.createOscillator();
                osc.type = 'square'; // Woody harmonic
                osc.frequency.setValueAtTime(150, t);
                const oscGain = this.ctx.createGain();
                oscGain.gain.setValueAtTime(volume * 0.3, t);
                oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
                osc.connect(oscGain).connect(this.masterGain);
                osc.start(t);
                osc.stop(t+0.1);
                break;

            case 'Stone':
            case 'Marble':
            case 'Obsidian':
                // Sharp click
                noiseFilter.type = 'highpass';
                noiseFilter.frequency.setValueAtTime(1000, t);
                noiseGain.gain.setValueAtTime(volume * 1.2, t);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.04); // Very short
                break;

            case 'Metal':
                // Clank
                noiseFilter.type = 'bandpass';
                noiseFilter.frequency.setValueAtTime(2000, t);
                noiseGain.gain.setValueAtTime(volume, t);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
                // Ringing
                const ring = this.ctx.createOscillator();
                ring.type = 'triangle';
                ring.frequency.setValueAtTime(800, t);
                const ringGain = this.ctx.createGain();
                ringGain.gain.setValueAtTime(volume * 0.4, t);
                ringGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
                ring.connect(ringGain).connect(this.masterGain);
                ring.start(t);
                ring.stop(t+0.4);
                break;

            case 'Snow':
                // Squeaky crunch
                noiseFilter.type = 'bandpass';
                noiseFilter.frequency.setValueAtTime(1200, t);
                noiseGain.gain.setValueAtTime(volume * 0.8, t);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
                break;

            case 'Gravel':
                // Gritty
                noiseFilter.type = 'highpass';
                noiseFilter.frequency.setValueAtTime(600, t);
                noiseGain.gain.setValueAtTime(volume * 1.0, t);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
                break;

            case 'Sand':
                // Soft slide
                noiseFilter.type = 'lowpass';
                noiseFilter.frequency.setValueAtTime(600, t);
                noiseGain.gain.setValueAtTime(volume * 0.7, t);
                noiseGain.gain.linearRampToValueAtTime(0.01, t + 0.18); // Longer decay
                break;
            
            case 'Leaves':
                // Rustle (High freq, messy)
                noiseFilter.type = 'peaking';
                noiseFilter.frequency.setValueAtTime(2500, t);
                noiseGain.gain.setValueAtTime(volume * 0.9, t);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
                break;

            case 'Toxic':
                // Bubbling/Squish
                noiseFilter.type = 'bandpass';
                noiseFilter.frequency.setValueAtTime(500, t);
                noiseFilter.Q.setValueAtTime(10, t);
                noiseGain.gain.setValueAtTime(volume * 1.2, t);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
                break;

            case 'Dirt':
            case 'Crimson':
            default:
                // Standard thud + crunch
                noiseFilter.type = 'lowpass';
                noiseFilter.frequency.setValueAtTime(400, t);
                noiseGain.gain.setValueAtTime(volume, t);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
                
                // Bass thud
                const thud = this.ctx.createOscillator();
                thud.frequency.setValueAtTime(80, t);
                thud.frequency.exponentialRampToValueAtTime(40, t+0.1);
                const thudGain = this.ctx.createGain();
                thudGain.gain.setValueAtTime(volume * 0.5, t);
                thudGain.gain.exponentialRampToValueAtTime(0.01, t+0.1);
                thud.connect(thudGain).connect(this.masterGain);
                thud.start(t);
                thud.stop(t+0.1);
                break;
        }

        noise.start(t);
        noise.stop(t + 0.3);
    }

    playJump() {
        if (!this.ctx || !this.masterGain) return;
        this.ensureContext();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(440, t + 0.15);
        
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        
        osc.start();
        osc.stop(t + 0.15);
    }

    playLand() {
        if (!this.ctx || !this.masterGain) return;
        this.ensureContext();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
        
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.15);
        
        osc.start();
        osc.stop(t + 0.15);
    }

    playPickup() {
        if (!this.ctx || !this.masterGain) return;
        this.ensureContext();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.setValueAtTime(1800, t + 0.08);
        
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.setValueAtTime(0.15, t + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        
        osc.start();
        osc.stop(t + 0.3);
    }

    playDeath() {
        if (!this.ctx || !this.masterGain) return;
        this.ensureContext();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.linearRampToValueAtTime(50, t + 0.8);
        
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.8);
        
        osc.start();
        osc.stop(t + 0.8);
    }

    async playWoodChop() {
        if (!this.ctx || !this.masterGain) return;
        this.ensureContext();

        if (!this.treeHitBuffer) {
            this.treeHitBuffer = await this.loadAudioBuffer('/assets/sounds/tree_hit.mp3');
        }

        if (!this.treeHitBuffer) return;

        const source = this.ctx.createBufferSource();
        source.buffer = this.treeHitBuffer;
        const gain = this.ctx.createGain();
        source.connect(gain);
        gain.connect(this.masterGain);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

        source.start(this.ctx.currentTime);
    }

    async playWeaponSwing() {
        if (!this.ctx || !this.masterGain) return;
        this.ensureContext();

        if (!this.weaponSwingBuffer) {
            this.weaponSwingBuffer = await this.loadAudioBuffer('/assets/sounds/weapon_swing_h.mp3');
        }

        if (!this.weaponSwingBuffer) return;

        const source = this.ctx.createBufferSource();
        source.buffer = this.weaponSwingBuffer;
        const gain = this.ctx.createGain();
        source.connect(gain);
        gain.connect(this.masterGain);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

        source.start(this.ctx.currentTime);
    }

    async playStoneDink() {
        if (!this.ctx || !this.masterGain) return;
        this.ensureContext();

        if (!this.oreHitBuffer) {
            this.oreHitBuffer = await this.loadAudioBuffer('/assets/sounds/ore_hit.mp3');
        }

        if (!this.oreHitBuffer) return;

        const source = this.ctx.createBufferSource();
        source.buffer = this.oreHitBuffer;
        const gain = this.ctx.createGain();
        source.connect(gain);
        gain.connect(this.masterGain);

        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

        source.start(this.ctx.currentTime);
    }

    async playOreCrumbling() {
        if (!this.ctx || !this.masterGain) return;
        this.ensureContext();

        if (!this.oreCrumblingBuffer) {
            this.oreCrumblingBuffer = await this.loadAudioBuffer('/assets/sounds/ore_crumbling.mp3');
        }

        if (!this.oreCrumblingBuffer) return;

        const source = this.ctx.createBufferSource();
        source.buffer = this.oreCrumblingBuffer;
        const gain = this.ctx.createGain();
        source.connect(gain);
        gain.connect(this.masterGain);

        gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

        source.start(this.ctx.currentTime);
    }

    async playTreeFall() {
        if (!this.ctx || !this.masterGain) return;
        this.ensureContext();

        if (!this.treeFallBuffer) {
            this.treeFallBuffer = await this.loadAudioBuffer('/assets/sounds/tree_fall.mp3');
        }

        if (!this.treeFallBuffer) return;

        const source = this.ctx.createBufferSource();
        source.buffer = this.treeFallBuffer;
        const gain = this.ctx.createGain();
        source.connect(gain);
        gain.connect(this.masterGain);

        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);

        source.start(this.ctx.currentTime);
    }
}
