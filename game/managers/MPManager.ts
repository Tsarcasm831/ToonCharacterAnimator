import * as THREE from 'three';
import { Game } from '../core/Game';
import { Player } from '../player/Player';
import { PlayerInput } from '../../types';

// Simple interface for remote player data
interface RemotePlayerData {
    id: string;
    position: { x: number, y: number, z: number };
    rotation: { y: number };
    velocity: { x: number, y: number, z: number };
    input: PlayerInput;
    config: any; // PlayerConfig
    timestamp: number;
}

export class MPManager {
    private game: Game;
    private socket: WebSocket | null = null;
    private remotePlayers: Map<string, { player: Player, targetPos: THREE.Vector3, targetRot: number, velocity: THREE.Vector3, input: PlayerInput }> = new Map();
    private updateInterval: number | null = null;
    private playerId: string = Math.random().toString(36).substr(2, 9);
    private lastPosition = new THREE.Vector3();
    private lastRotation = 0;

    // Use a publicly available echo server for testing if localhost fails, or default to localhost.
    // Since we can't easily run a backend, we'll try to connect to localhost:8080.
    // If you have a specific signaling server, replace this URL.
    private wsUrl = 'ws://localhost:8080'; 

    constructor(game: Game) {
        this.game = game;
    }

    connect() {
        console.log(`[MP] Connecting to ${this.wsUrl}...`);
        try {
            this.socket = new WebSocket(this.wsUrl);

            this.socket.onopen = () => {
                console.log('[MP] Connected!');
                this.startBroadcasting();
            };

            this.socket.onmessage = (event) => {
                try {
                    // Blob handling if binary
                    if (event.data instanceof Blob) {
                        event.data.text().then(text => {
                            try {
                                this.handleMessage(JSON.parse(text));
                            } catch (e) {}
                        });
                        return;
                    }
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (e) {
                    console.error('[MP] Failed to parse message', e);
                }
            };

            this.socket.onclose = () => {
                console.log('[MP] Disconnected');
                this.stopBroadcasting();
            };
            
            this.socket.onerror = (err) => {
                // console.warn('[MP] WebSocket error. Is the server running?', err);
            };

        } catch (e) {
            console.error('[MP] Connection failed', e);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.stopBroadcasting();
        // Cleanup remote players
        this.remotePlayers.forEach(({ player }) => {
            if (player.mesh.parent) player.mesh.parent.remove(player.mesh);
        });
        this.remotePlayers.clear();
    }

    private startBroadcasting() {
        // Broadcast state every 50ms
        this.updateInterval = window.setInterval(() => {
            this.broadcastState();
        }, 50);
    }

    private stopBroadcasting() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    private broadcastState() {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
        
        const player = this.game.player;
        if (!player || !player.mesh) return;

        const position = player.mesh.position;
        const rotation = player.mesh.rotation.y;
        const velocity = player.velocity;
        const input = this.game.inputManager.getInput();

        const payload: any = {
            type: 'update',
            id: this.playerId,
            position: { x: position.x, y: position.y, z: position.z },
            rotation: { y: rotation },
            velocity: { x: velocity.x, y: velocity.y, z: velocity.z },
            input: input,
            config: this.game.config,
            timestamp: Date.now()
        };

        this.socket.send(JSON.stringify(payload));
    }

    private handleMessage(data: any) {
        if (data.id === this.playerId) return; // Ignore self

        if (data.type === 'update') {
            this.updateRemotePlayer(data);
        } else if (data.type === 'disconnect') {
            this.removeRemotePlayer(data.id);
        }
    }

    private updateRemotePlayer(data: RemotePlayerData) {
        let remote = this.remotePlayers.get(data.id);
        
        if (!remote) {
            // Spawn new remote player
            console.log(`[MP] Spawning remote player ${data.id}`);
            const player = new Player(this.game.renderManager.scene);
            // Apply config
            Object.assign(player.config, data.config);
            // Force config sync
            // We can trick the player into syncing by changing outfit briefly or just calling internal sync if exposed
            // But modifying config and calling update once should trigger syncConfig
            
            remote = {
                player,
                targetPos: new THREE.Vector3(data.position.x, data.position.y, data.position.z),
                targetRot: data.rotation.y,
                velocity: new THREE.Vector3(),
                input: data.input
            };
            this.remotePlayers.set(data.id, remote);
            
            // Initial position set
            player.mesh.position.copy(remote.targetPos);
            player.mesh.rotation.y = remote.targetRot;
        }

        // Update target state
        remote.targetPos.set(data.position.x, data.position.y, data.position.z);
        remote.targetRot = data.rotation.y;
        if (data.velocity) remote.velocity.set(data.velocity.x, data.velocity.y, data.velocity.z);
        remote.input = data.input;
        
        // Update config if changed (basic check)
        if (JSON.stringify(remote.player.config.outfit) !== JSON.stringify(data.config.outfit)) {
            Object.assign(remote.player.config, data.config);
        }
    }

    private removeRemotePlayer(id: string) {
        const remote = this.remotePlayers.get(id);
        if (remote) {
            console.log(`[MP] Removing remote player ${id}`);
            if (remote.player.mesh.parent) remote.player.mesh.parent.remove(remote.player.mesh);
            if (remote.player.model?.group?.parent) remote.player.model.group.parent.remove(remote.player.model.group);
            this.remotePlayers.delete(id);
        }
    }

    public update(dt: number) {
        this.remotePlayers.forEach((remote, id) => {
            const { player, targetPos, targetRot, velocity, input } = remote;
            
            // Interpolate position
            player.mesh.position.lerp(targetPos, dt * 10);
            
            // Interpolate rotation (handling wrap-around)
            let rotDiff = targetRot - player.mesh.rotation.y;
            while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
            while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
            player.mesh.rotation.y += rotDiff * dt * 10;

            // Sync model group
            if (player.model && player.model.group) {
                player.model.group.position.copy(player.mesh.position);
                player.model.group.rotation.copy(player.mesh.rotation);
            }

            // Update visuals
            player.model.update(dt, velocity);
            
            // Animate
            const isMoving = velocity.lengthSq() > 0.1 || input.isRunning;
            // We pass dummy environment as we don't want collision checks for remote players
            player.animator.animate(player, dt, isMoving, input, []);
            
            // We might need to manually call syncConfig if we want outfit changes to apply
            // The Player class calls syncConfig in update(), but we aren't calling update().
            // We can access the private syncConfig if we cast to any, or just replicate critical parts.
            (player as any).syncConfig();
        });
    }
}

