import { PlayerInput } from '../../types';
import { InputCommand, KeyBindingMap, DEFAULT_KEYBINDINGS } from './InputBindings';

export class InputManager {
    keys: { [key: string]: boolean } = {};
    isMouseDown: boolean = false;
    mouseButton: number = -1;
    manualInput: PlayerInput = {
        x: 0, y: 0, isRunning: false, jump: false, isDead: false, isPickingUp: false,
        attack1: false, attack2: false, interact: false, combat: false,
        toggleFirstPerson: false, wave: false, leftHandWave: false, summon: false, toggleBuilder: false, rotateGhost: false,
        fireball: false, crouch: false
    };
    cameraMovementInput: { x: number, y: number } = { x: 0, y: 0 };
    isBlocked: boolean = false;
    isBuilding: boolean = false;
    isInCombat: boolean = false;
    
    // Config
    bindings: KeyBindingMap;

    // Joystick State
    private joystickMove = { x: 0, y: 0 };
    private joystickLook = { x: 0, y: 0 };
    
    // Mouse State (NDC)
    mousePosition = { x: 0, y: 0 };

    // Callbacks for specific actions (Triggers)
    onSlotSelect?: (slotIndex: number) => void;
    onToggleHitbox?: () => void;
    onToggleObstacleHitboxes?: () => void;
    onToggleCamera?: () => void;
    onToggleHands?: () => void;
    onToggleSkeletonMode?: () => void;
    onToggleInventory?: () => void;
    onToggleFirstPerson?: () => void;
    onToggleBuilder?: () => void;
    onToggleKeybinds?: () => void;
    onToggleWorldMap?: () => void;
    onToggleGrid?: () => void;
    onToggleQuestLog?: () => void;
    onToggleBuilderLog?: () => void;
    onConfirmBuild?: () => void;
    onTeleportToTown?: () => void;

    constructor(initialBindings: KeyBindingMap = DEFAULT_KEYBINDINGS) {
        this.bindings = initialBindings;
        
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
            this.mouseButton = -1;
            this.keys = {}; 
            this.joystickMove = { x: 0, y: 0 };
            this.joystickLook = { x: 0, y: 0 };
        }
    }

    setBuilding(building: boolean) {
        this.isBuilding = building;
    }

    setCombatState(isInCombat: boolean) {
        this.isInCombat = isInCombat;
    }

    getCameraMovementInput(): { x: number, y: number } {
        return this.cameraMovementInput;
    }

    private isCommandActive(command: InputCommand): boolean {
        const boundKeys = this.bindings[command];
        if (!boundKeys) return false;
        return boundKeys.some(key => this.keys[key]);
    }

    private handleKeyDown(e: KeyboardEvent) { 
        if ((e.target as HTMLElement).closest('input, textarea, select, .no-capture')) return;
        if (e.repeat) return;

        if (this.isBlocked) return;

        // Store key state
        this.keys[e.code] = true; 

        // Handle Triggers (One-shot actions)
        if (this.checkTrigger(e.code, InputCommand.ToggleInventory)) this.onToggleInventory?.();
        if (this.checkTrigger(e.code, InputCommand.ToggleQuestLog)) this.onToggleQuestLog?.();
        if (this.checkTrigger(e.code, InputCommand.ToggleWorldMap)) this.onToggleWorldMap?.();
        if (this.checkTrigger(e.code, InputCommand.ToggleKeybinds)) this.onToggleKeybinds?.();
        if (this.checkTrigger(e.code, InputCommand.ToggleHitbox)) this.onToggleHitbox?.();
        if (this.checkTrigger(e.code, InputCommand.ToggleObstacleHitboxes)) this.onToggleObstacleHitboxes?.();
        if (this.checkTrigger(e.code, InputCommand.ToggleCamera)) this.onToggleCamera?.();
        if (this.checkTrigger(e.code, InputCommand.ToggleHands)) this.onToggleHands?.();
        if (this.checkTrigger(e.code, InputCommand.ToggleSkeletonMode)) this.onToggleSkeletonMode?.();
        if (this.checkTrigger(e.code, InputCommand.ToggleFirstPerson)) this.onToggleFirstPerson?.();
        if (this.checkTrigger(e.code, InputCommand.ToggleBuilder)) this.onToggleBuilder?.();
        if (this.checkTrigger(e.code, InputCommand.ToggleGrid)) this.onToggleGrid?.();
        if (this.checkTrigger(e.code, InputCommand.ToggleBuilderLog)) this.onToggleBuilderLog?.();
        if (this.checkTrigger(e.code, InputCommand.ConfirmBuild)) this.onConfirmBuild?.();
        if (this.checkTrigger(e.code, InputCommand.TeleportToTown)) this.onTeleportToTown?.();

        // Slot Selection
        this.handleSlotSelection(e.code);
    }

    private checkTrigger(code: string, command: InputCommand): boolean {
        return this.bindings[command]?.includes(code);
    }

    private handleSlotSelection(code: string) {
        if (this.checkTrigger(code, InputCommand.Slot1)) this.onSlotSelect?.(0);
        if (this.checkTrigger(code, InputCommand.Slot2)) this.onSlotSelect?.(1);
        if (this.checkTrigger(code, InputCommand.Slot3)) this.onSlotSelect?.(2);
        if (this.checkTrigger(code, InputCommand.Slot4)) this.onSlotSelect?.(3);
        if (this.checkTrigger(code, InputCommand.Slot5)) this.onSlotSelect?.(4);
        if (this.checkTrigger(code, InputCommand.Slot6)) this.onSlotSelect?.(5);
        if (this.checkTrigger(code, InputCommand.Slot7)) this.onSlotSelect?.(6);
        if (this.checkTrigger(code, InputCommand.Slot8)) this.onSlotSelect?.(7);
        if (this.checkTrigger(code, InputCommand.Slot9)) this.onSlotSelect?.(8);
        if (this.checkTrigger(code, InputCommand.Slot0)) this.onSlotSelect?.(9);
        if (this.checkTrigger(code, InputCommand.SlotMinus)) this.onSlotSelect?.(10);
        if (this.checkTrigger(code, InputCommand.SlotEqual)) this.onSlotSelect?.(11);
        if (this.checkTrigger(code, InputCommand.SlotBackspace)) this.onSlotSelect?.(12);
    }
    
    private handleKeyUp(e: KeyboardEvent) { 
        if (this.isBlocked) return;
        this.keys[e.code] = false; 
    }
    
    private handleMouseDown(e: MouseEvent) {
        if (this.isBlocked) return;
        if ((e.target as HTMLElement).closest('button, input, select, .no-capture, .builder-log-container')) return;
        this.isMouseDown = true;
        this.mouseButton = e.button;
    }
    
    private handleMouseUp(e: MouseEvent) {
        this.isMouseDown = false;
        this.mouseButton = -1;
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
                toggleFirstPerson: false, wave: false, leftHandWave: false, summon: false, toggleBuilder: false, rotateGhost: false,
                fireball: false, crouch: false
            };
        }

        let xInput = (this.isCommandActive(InputCommand.MoveRight) ? 1 : 0) - (this.isCommandActive(InputCommand.MoveLeft) ? 1 : 0);
        let yInput = (this.isCommandActive(InputCommand.MoveBackward) ? 1 : 0) - (this.isCommandActive(InputCommand.MoveForward) ? 1 : 0);
        
        // Store raw WASD input for camera movement when in combat
        this.cameraMovementInput.x = xInput;
        this.cameraMovementInput.y = yInput;
        
        // Disable player movement when in combat - WASD will be used for camera control
        if (this.isInCombat) {
            xInput = 0;
            yInput = 0;
        }
        
        if (xInput === 0 && yInput === 0) {
            xInput = this.joystickMove.x;
            yInput = -this.joystickMove.y; 
        }

        const isAttack1 = this.manualInput.attack1 || (this.isMouseDown && this.mouseButton === 0) || this.isCommandActive(InputCommand.Attack1);
        const isAttack2 = this.manualInput.attack2 || this.isCommandActive(InputCommand.Attack2);

        return {
            x: xInput,
            y: yInput,
            isRunning: !!(this.isCommandActive(InputCommand.Run) || this.manualInput.isRunning),
            crouch: !!(this.isCommandActive(InputCommand.Crouch)),
            jump: !!(this.isCommandActive(InputCommand.Jump) || this.manualInput.jump),
            isDead: !!(this.isCommandActive(InputCommand.Die) || this.manualInput.isDead),
            isPickingUp: !!(this.isCommandActive(InputCommand.PickUp) || this.manualInput.isPickingUp),
            attack1: isAttack1,
            attack2: isAttack2,
            interact: !!(this.isCommandActive(InputCommand.Interact) || this.manualInput.interact),
            combat: !!(this.isCommandActive(InputCommand.CombatStance) || this.manualInput.combat),
            toggleFirstPerson: !!(this.isCommandActive(InputCommand.ToggleFirstPerson) || this.manualInput.toggleFirstPerson),
            wave: !!(this.isCommandActive(InputCommand.Wave) || this.manualInput.wave),
            leftHandWave: !!(this.isCommandActive(InputCommand.LeftHandWave) || this.manualInput.leftHandWave),
            summon: !!(this.isCommandActive(InputCommand.Summon) || this.manualInput.summon),
            toggleBuilder: !!(this.isCommandActive(InputCommand.ToggleBuilder)),
            rotateGhost: !!(this.isCommandActive(InputCommand.RotateGhost)), 
            fireball: !!(this.isCommandActive(InputCommand.Fireball) && !this.isBuilding)
        };
    }

    dispose() {
        if (typeof window !== 'undefined') {
            window.removeEventListener('keydown', this.handleKeyDown);
            window.removeEventListener('keyup', this.handleKeyUp);
            window.removeEventListener('mousedown', this.handleMouseDown);
            window.removeEventListener('mouseup', this.handleMouseUp);
            window.removeEventListener('mousemove', this.handleMouseMove);
        }
    }
}
