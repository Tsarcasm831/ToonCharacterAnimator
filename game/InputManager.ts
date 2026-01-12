
import { PlayerInput } from '../types';

export class InputManager {
    keys: { [key: string]: boolean } = {};
    isMouseDown: boolean = false;
    manualInput: PlayerInput = {
        x: 0, y: 0, isRunning: false, jump: false, isDead: false, isPickingUp: false,
        attack1: false, attack2: false, interact: false, combat: false,
        toggleFirstPerson: false, wave: false, summon: false, toggleBuilder: false, rotateGhost: false
    };
    isBlocked: boolean = false;
    
    // Joystick State
    private joystickMove = { x: 0, y: 0 };
    private joystickLook = { x: 0, y: 0 };
    
    // Mouse State (NDC)
    mousePosition = { x: 0, y: 0 };

    // Callbacks for specific actions
    onSlotSelect?: (slotIndex: number) => void;
    onToggleHitbox?: () => void;
    onToggleObstacleHitboxes?: () => void;
    onToggleCamera?: () => void;
    onToggleHands?: () => void;
    onToggleSkeletonMode?: () => void;
    onToggleInventory?: () => void;
    onToggleFirstPerson?: () => void;
    onToggleBuilder?: () => void;
    onToggleGrid?: () => void;
    onToggleKeybinds?: () => void;

    constructor() {
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        
        if (typeof window !== 'undefined') {
            window.addEventListener('keydown', this.handleKeyDown, { passive: false });
            window.addEventListener('keyup', this.handleKeyUp, { passive: false });
            window.addEventListener('mousedown', this.handleMouseDown, { passive: false });
            window.addEventListener('mouseup', this.handleMouseUp, { passive: false });
            window.addEventListener('mousemove', this.handleMouseMove, { passive: false });
        }
    }

    setJoystickMove(x: number, y: number) {
        this.joystickMove.x = x;
        this.joystickMove.y = y;
    }

    setJoystickLook(x: number, y: number) {
        this.joystickLook.x = x;
        this.joystickLook.y = y;
    }

    getJoystickLook() {
        return this.joystickLook;
    }

    setManualInput(input: Partial<PlayerInput>) {
        Object.assign(this.manualInput, input);
    }

    setBlocked(blocked: boolean) {
        this.isBlocked = blocked;
        if (blocked) {
            this.isMouseDown = false;
            this.keys = {}; 
            this.joystickMove = { x: 0, y: 0 };
            this.joystickLook = { x: 0, y: 0 };
        }
    }

    private handleKeyDown(e: KeyboardEvent) { 
        if (e.code === 'KeyI') {
            this.onToggleInventory?.();
        }
        
        if (e.code === 'Backquote') {
            this.onToggleKeybinds?.();
        }

        if (this.isBlocked) return;

        this.keys[e.code] = true; 
        
        if (e.code === 'KeyG') this.onToggleHitbox?.();
        if (e.code === 'KeyU') this.onToggleObstacleHitboxes?.(); 
        if (e.code === 'KeyX') this.onToggleCamera?.();
        if (e.code === 'KeyH') this.onToggleHands?.();
        if (e.code === 'KeyJ') this.onToggleSkeletonMode?.();
        if (e.code === 'KeyV') this.onToggleFirstPerson?.();
        if (e.code === 'KeyB') this.onToggleBuilder?.();
        if (e.code === 'KeyT') this.onToggleGrid?.(); 

        if (e.code.startsWith('Digit')) {
            const num = parseInt(e.code.replace('Digit', ''));
            if (num >= 1 && num <= 8) {
                this.onSlotSelect?.(num - 1);
            }
        }
    }
    
    private handleKeyUp(e: KeyboardEvent) { 
        if (this.isBlocked) return;
        this.keys[e.code] = false; 
    }
    
    private handleMouseDown(e: MouseEvent) {
        if (this.isBlocked) return;
        if ((e.target as HTMLElement).closest('button, input, select, .no-capture')) return;
        if (e.button === 0) this.isMouseDown = true;
    }
    
    private handleMouseUp(e: MouseEvent) {
        if (e.button === 0) this.isMouseDown = false;
    }

    private handleMouseMove(e: MouseEvent) {
        if (this.isBlocked) return;
        // Convert to Normalized Device Coordinates (NDC)
        // x: -1 to 1, y: 1 to -1
        this.mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }

    getInput(): PlayerInput {
        if (this.isBlocked) {
            return {
                x: 0, y: 0, isRunning: false, jump: false, isDead: false, isPickingUp: false,
                attack1: false, attack2: false, interact: false, combat: false,
                toggleFirstPerson: false, wave: false, summon: false, toggleBuilder: false, rotateGhost: false
            };
        }

        let xInput = (this.keys['KeyD'] || this.keys['ArrowRight'] ? 1 : 0) - (this.keys['KeyA'] || this.keys['ArrowLeft'] ? 1 : 0);
        let yInput = (this.keys['KeyS'] || this.keys['ArrowDown'] ? 1 : 0) - (this.keys['KeyW'] || this.keys['ArrowUp'] ? 1 : 0);
        
        if (xInput === 0 && yInput === 0) {
            xInput = this.joystickMove.x;
            yInput = -this.joystickMove.y; 
        }

        return {
            x: xInput,
            y: yInput,
            isRunning: !!(this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.manualInput.isRunning),
            jump: !!(this.keys['Space'] || this.manualInput.jump),
            isDead: !!(this.keys['KeyK'] || this.manualInput.isDead),
            isPickingUp: !!(this.keys['KeyP'] || this.keys['KeyF'] || this.manualInput.isPickingUp),
            attack1: !!(this.manualInput.attack1 || this.isMouseDown),
            attack2: !!(this.manualInput.attack2),
            interact: !!(this.keys['KeyE'] || this.manualInput.interact),
            combat: !!(this.keys['KeyC'] || this.manualInput.combat),
            toggleFirstPerson: !!(this.manualInput.toggleFirstPerson),
            wave: !!(this.manualInput.wave),
            summon: !!(this.keys['KeyL'] || this.manualInput.summon),
            toggleBuilder: !!(this.keys['KeyB']),
            rotateGhost: !!(this.keys['KeyR']) 
        };
    }

    dispose() {
        if (typeof window !== 'undefined') {
            window.removeEventListener('keydown', this.handleKeyDown);
            window.removeEventListener('keyup', this.handleKeyUp);
            window.removeEventListener('mousedown', this.handleMouseDown);
            window.removeEventListener('mouseup', this.handleMouseUp);
        }
    }
}
