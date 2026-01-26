import * as THREE from 'three';
import { EntityManager } from './EntityManager';
import { RenderManager } from '../core/RenderManager';
import { CombatEnvironment } from '../environment/CombatEnvironment';
import { Player } from '../player/Player';
import { EntityStats, TurnPhase } from '../../types';
import { PlayerDebug } from '../player/PlayerDebug';
import { CombatSystem } from './CombatSystem';

export class CombatInteractionManager {
    private entityManager: EntityManager;
    private renderManager: RenderManager;
    private player: Player;
    private combatSystem: CombatSystem | null = null;
    
    private raycaster = new THREE.Raycaster();
    private dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    private dragOffset = new THREE.Vector3();
    
    public selectedUnit: any | null = null;
    private draggingUnit: any | null = null;
    private draggingUnitStartPos: THREE.Vector3 | null = null;
    private isWaitingForClick = false;
    private mouseDownScreenPos = new THREE.Vector2();
    
    public isActive: boolean = false;
    
    public onUnitSelect?: (stats?: EntityStats, unit?: any) => void;
    public onShowCharacterStats?: (stats?: EntityStats, name?: string) => void;
    public onShowTooltip?: (stats?: EntityStats, name?: string, screenX?: number, screenY?: number) => void;
    public onHideTooltip?: () => void;

    private rangeHighlight: THREE.Group | null = null;
    private pathHighlight: THREE.Group | null = null;

    constructor(entityManager: EntityManager, renderManager: RenderManager, player: Player) {
        this.entityManager = entityManager;
        this.renderManager = renderManager;
        this.player = player;
    }

    public setCombatSystem(system: CombatSystem) {
        this.combatSystem = system;
    }

    public setCombatActive(active: boolean) {
        this.isActive = active;
        if (!active) {
            this.clearSelection();
            this.clearRangeHighlight();
            this.clearPathHighlight();
        } else {
            // When combat becomes active, auto-select the player's turn unit
            if (this.combatSystem) {
                const activeUnit = this.combatSystem.getActiveUnit();
                if (activeUnit && activeUnit.isFriendly) {
                    this.selectedUnit = activeUnit.entity;
                    this.setUnitHighlight(activeUnit.entity, true);
                }
            }
        }
    }

    private clearRangeHighlight() {
        if (this.rangeHighlight) {
            this.renderManager.scene.remove(this.rangeHighlight);
            this.rangeHighlight.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose();
                    if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                    else child.material.dispose();
                }
            });
            this.rangeHighlight = null;
        }
    }

    private clearPathHighlight() {
        if (this.pathHighlight) {
            this.renderManager.scene.remove(this.pathHighlight);
            this.pathHighlight.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose();
                    if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                    else child.material.dispose();
                }
            });
            this.pathHighlight = null;
        }
    }

    private showRangeHighlight(unit: any, combatEnvironment: CombatEnvironment) {
        this.clearRangeHighlight();
        const unitPos = this.getUnitPosition(unit);
        if (!unitPos || !combatEnvironment) return;

        // If in combat, show both movement and attack range for active unit
        let movementRange = 0;
        let attackRange = 1;
        let isActiveUnit = false;
        
        if (this.combatSystem && combatEnvironment.isCombatStarted) {
            const combatUnit = this.combatSystem.getUnitByEntity(unit);
            if (combatUnit && combatUnit === this.combatSystem.getActiveUnit()) {
                movementRange = combatUnit.stats.currentMovement || 0;
                attackRange = combatUnit.stats.range || 1.5;
                isActiveUnit = true;
            } else {
                // For non-active units, show only attack range
                const unitType = unit?.constructor?.name || '';
                attackRange = (unitType === 'Archer' || unitType === 'combatArchers' || (unit.config && unit.config.selectedItem === 'Bow')) ? 4 : 1;
            }
        } else {
            const unitType = unit?.constructor?.name || '';
            attackRange = (unitType === 'Archer' || unitType === 'combatArchers' || (unit.config && unit.config.selectedItem === 'Bow')) ? 4 : 1;
        }

        const gridPos = combatEnvironment.getGridPosition(unitPos);
        if (!gridPos) return;

        this.rangeHighlight = new THREE.Group();
        this.renderManager.scene.add(this.rangeHighlight);
        
        // Show movement range (green) if active unit and has movement
        if (isActiveUnit && movementRange > 0) {
            const combatUnit = this.combatSystem?.getUnitByEntity(unit);
            if (combatUnit && !combatUnit.stats.hasMovedThisTurn) {
                const reachable = new Set<string>();
                const queue: {r: number, c: number, dist: number}[] = [{r: gridPos.r, c: gridPos.c, dist: 0}];
                const visited = new Set<string>();
                visited.add(`${gridPos.r},${gridPos.c}`);
                
                while(queue.length > 0) {
                    const current = queue.shift()!;
                    if (current.dist <= movementRange) {
                        reachable.add(`${current.r},${current.c}`);
                        
                        if (current.dist < movementRange) {
                            const directions = [
                                [0, 1], [0, -1], [1, 0], [-1, 0],
                                current.r % 2 === 0 ? [1, -1] : [1, 1],
                                current.r % 2 === 0 ? [-1, -1] : [-1, 1]
                            ];
                            
                            for (const [dr, dc] of directions) {
                                const nr = current.r + dr;
                                const nc = current.c + dc;
                                const key = `${nr},${nc}`;
                                if (nr >= 0 && nr < combatEnvironment.GRID_ROWS && nc >= 0 && nc < combatEnvironment.GRID_COLS) {
                                    if (!visited.has(key) && !combatEnvironment.isCellOccupied(nr, nc)) {
                                        visited.add(key);
                                        queue.push({r: nr, c: nc, dist: current.dist + 1});
                                    }
                                }
                            }
                        }
                    }
                }

                // Draw movement range (green)
                reachable.forEach(key => {
                    const [r, c] = key.split(',').map(Number);
                    const cellWorldPos = combatEnvironment.getWorldPosition(r, c);
                    
                    const ringGeo = new THREE.RingGeometry(0.4, 0.5, 6);
                    const ringMat = new THREE.MeshBasicMaterial({ 
                        color: 0x00ff00, 
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: 0.4
                    });
                    const ring = new THREE.Mesh(ringGeo, ringMat);
                    ring.position.copy(cellWorldPos);
                    ring.position.y = 0.05;
                    ring.rotation.x = -Math.PI / 2;
                    this.rangeHighlight!.add(ring);
                });
            }
        }
        
        // Show attack range (red outline) for all units
        for (let r = 0; r < combatEnvironment.GRID_ROWS; r++) {
            for (let c = 0; c < combatEnvironment.GRID_COLS; c++) {
                const cellWorldPos = combatEnvironment.getWorldPosition(r, c);
                const dist = unitPos.distanceTo(cellWorldPos);
                
                if (dist <= attackRange * 1.6 && dist > 0.1) {
                    const ringGeo = new THREE.RingGeometry(0.6, 0.65, 6);
                    const ringMat = new THREE.MeshBasicMaterial({ 
                        color: 0xff0000, 
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: 0.3
                    });
                    const ring = new THREE.Mesh(ringGeo, ringMat);
                    ring.position.copy(cellWorldPos);
                    ring.position.y = 0.04;
                    ring.rotation.x = -Math.PI / 2;
                    this.rangeHighlight!.add(ring);
                }
            }
        }
    }

    public handleMouseDown(e: MouseEvent, combatEnvironment: CombatEnvironment) {
        if (!this.isActive) return;
        if (e.button !== 0) return;

        const rect = this.renderManager.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        
        this.raycaster.setFromCamera(mouse, this.renderManager.camera);
        
        const combatEntities = this.entityManager.getEntitiesForScene('combat');
        const units = [this.player, ...combatEntities];
        const intersects = this.raycaster.intersectObjects(this.renderManager.scene.children, true);
        
        let clickedUnit: any = null;
        let clickedGround: THREE.Vector3 | null = null;

        if (intersects.length > 0) {
            // Check what we hit first: unit or ground?
            // Actually, we should prioritize units over ground if close.
            
            for (const intersect of intersects) {
                let obj: THREE.Object3D | null = intersect.object;
                
                // Check if ground
                if (intersect.object.userData.type === 'ground' || intersect.object.userData.isHex) {
                    if (!clickedGround && !clickedUnit) {
                        clickedGround = intersect.point;
                    }
                }

                // Check if unit
                while (obj) {
                    const unit = units.find(u => (u.mesh || u.model?.group || u.group) === obj);
                    if (unit) {
                        clickedUnit = unit;
                        break;
                    }
                    obj = obj.parent;
                }
                if (clickedUnit) break;
            }
        }

        const isCombatStarted = combatEnvironment.isCombatStarted;

        if (clickedUnit) {
            console.log(`[CombatInteractionManager] Clicked unit: ${clickedUnit.constructor.name}`);
            
            // If combat started, check if this is an attack
            if (isCombatStarted && this.combatSystem) {
                const activeUnit = this.combatSystem.getActiveUnit();
                const targetUnit = this.combatSystem.getUnitByEntity(clickedUnit);
                
                // If we have an active unit and it's friendly (Player Turn)
                if (activeUnit && activeUnit.isFriendly && this.combatSystem.turnManager.getPhase() === TurnPhase.PLAYER_TURN) {
                    // If clicking enemy -> Attack
                    if (targetUnit && !targetUnit.isFriendly) {
                        const dist = this.getUnitPosition(activeUnit.entity)?.distanceTo(this.getUnitPosition(clickedUnit)!) || Infinity;
                        if (dist <= activeUnit.stats.range) {
                            // Check if unit can attack (hasn't acted yet)
                            if (!activeUnit.stats.hasActedThisTurn) {
                                // In HOMM4, units can attack after moving but it ends their turn
                                this.combatSystem.executeAttack(activeUnit, targetUnit);
                            } else {
                                console.log("Unit has already attacked this turn");
                            }
                            return; // Action taken
                        } else {
                            console.log("Target out of range");
                        }
                    }
                }
            }

            // Select unit (default behavior)
            this.selectedUnit = clickedUnit;
            this.setUnitHighlight(clickedUnit, true);
            this.showRangeHighlight(clickedUnit, combatEnvironment);
            const stats = clickedUnit === this.player ? this.player.status.getStats() : clickedUnit.stats;
            this.onUnitSelect?.(stats, clickedUnit);

            // Dragging logic (Pre-Combat)
            if (!isCombatStarted) {
                this.draggingUnit = clickedUnit;
                this.isWaitingForClick = true;
                this.mouseDownScreenPos.set(e.clientX, e.clientY);
                
                const unitPos = this.getUnitPosition(clickedUnit);
                this.draggingUnitStartPos = unitPos ? unitPos.clone() : null;
                
                if (this.isFriendlyUnit(clickedUnit) && unitPos && this.raycaster.ray.intersectPlane(this.dragPlane, this.dragOffset)) {
                    this.dragOffset.sub(unitPos);
                }
            }
        } else if (clickedGround) {
             // Clicked Ground
             if (isCombatStarted && this.combatSystem) {
                const activeUnit = this.combatSystem.getActiveUnit();
                
                // Move Action
                if (activeUnit && activeUnit.isFriendly && this.combatSystem.turnManager.getPhase() === TurnPhase.PLAYER_TURN) {
                    const activeUnitPos = this.getUnitPosition(activeUnit.entity);
                    if (activeUnitPos) {
                        // Check if unit can still move
                        if (!activeUnit.stats.hasMovedThisTurn || (activeUnit.stats.currentMovement || 0) > 0) {
                            const path = combatEnvironment.getPath(activeUnitPos, clickedGround);
                            if (path.length > 0) {
                                // Validate movement cost
                                if (this.combatSystem.canMove(activeUnit, path.length)) {
                                    this.combatSystem.executeMove(activeUnit, path);
                                } else {
                                    console.log("Not enough movement points");
                                }
                            }
                        } else {
                            console.log("Unit has already moved this turn");
                        }
                    }
                }
             }
             
             this.clearSelection();
        } else {
            this.clearSelection();
        }
    }

    private isFriendlyUnit(unit: any): boolean {
        if (unit === this.player) return true;
        const friendlyTypes = ['Cleric', 'Knight', 'Paladin', 'Monk', 'Ranger', 'Sentinel'];
        const unitType = unit?.constructor?.name || '';
        return friendlyTypes.includes(unitType) || this.entityManager.combatArchers.includes(unit);
    }

    public handleMouseMove(e: MouseEvent) {
        if (!this.isActive || !this.draggingUnit) return;
        if (!this.isFriendlyUnit(this.draggingUnit)) return;

        const dist = this.mouseDownScreenPos.distanceTo(new THREE.Vector2(e.clientX, e.clientY));
        if (dist > 5) {
            this.isWaitingForClick = false;
        }

        if (!this.isWaitingForClick) {
            const rect = this.renderManager.renderer.domElement.getBoundingClientRect();
            const mouse = new THREE.Vector2(
                ((e.clientX - rect.left) / rect.width) * 2 - 1,
                -((e.clientY - rect.top) / rect.height) * 2 + 1
            );
            this.raycaster.setFromCamera(mouse, this.renderManager.camera);
            const target = new THREE.Vector3();
            
            if (this.raycaster.ray.intersectPlane(this.dragPlane, target)) {
                const newPos = target.sub(this.dragOffset);
                newPos.y = 0;
                this.setUnitPosition(this.draggingUnit, newPos);
            }
        }
    }

    public handleMouseUp(e: MouseEvent, combatEnvironment: CombatEnvironment) {
        if (!this.isActive) return;

        if (this.draggingUnit && !this.isWaitingForClick) {
            if (combatEnvironment && this.isFriendlyUnit(this.draggingUnit)) {
                const unitPos = this.getUnitPosition(this.draggingUnit);
                if (unitPos) {
                    const targetGrid = combatEnvironment.getGridPosition(unitPos);
                    const units = [this.player, ...this.entityManager.getEntitiesForScene('combat')];
                    
                    // Friendly side is rows 7-12 (including bench at 11-12) for 13x13 grid
                    // Enemy side is rows 0-5 (including bench at 0-1)
                    // We only allow friendly units to be placed on friendly rows
                    // Also constrain to central columns (2-10) for better positioning
                    const isOnFriendlySide = targetGrid ? targetGrid.r >= 7 && targetGrid.c >= 2 && targetGrid.c <= 10 : false;
                    
                    if (targetGrid && isOnFriendlySide) {
                        // Check for occupancy
                        const occupiedBy = units.find(u => {
                            if (u === this.draggingUnit) return false;
                            const pos = this.getUnitPosition(u);
                            if (!pos) return false;
                            const grid = combatEnvironment.getGridPosition(pos);
                            return grid?.r === targetGrid.r && grid?.c === targetGrid.c;
                        });

                        if (occupiedBy) {
                            // Swap Logic
                            if (this.draggingUnitStartPos) {
                                // Move occupied unit to start pos
                                const startGrid = combatEnvironment.getGridPosition(this.draggingUnitStartPos);
                                if (startGrid) {
                                    const startWorldPos = combatEnvironment.getWorldPosition(startGrid.r, startGrid.c);
                                    this.setUnitPosition(occupiedBy, startWorldPos);
                                    
                                    // Snap dragged unit to target
                                    const targetWorldPos = combatEnvironment.getWorldPosition(targetGrid.r, targetGrid.c);
                                    this.setUnitPosition(this.draggingUnit, targetWorldPos);
                                } else {
                                    // Fallback: Reset dragged unit
                                    this.setUnitPosition(this.draggingUnit, this.draggingUnitStartPos);
                                }
                            }
                        } else {
                            // Empty cell: Snap to it
                            const targetWorldPos = combatEnvironment.getWorldPosition(targetGrid.r, targetGrid.c);
                            this.setUnitPosition(this.draggingUnit, targetWorldPos);
                        }
                    } else {
                        // Invalid placement: Reset
                        if (this.draggingUnitStartPos) {
                            this.setUnitPosition(this.draggingUnit, this.draggingUnitStartPos);
                        }
                    }
                }
            }
        }
        this.draggingUnit = null;
        this.isWaitingForClick = false;
    }

    public handleContextMenu(e: MouseEvent) {
        if (!this.isActive) return;
        e.preventDefault();

        const rect = this.renderManager.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        this.raycaster.setFromCamera(mouse, this.renderManager.camera);
        
        const units = [this.player, ...this.entityManager.getEntitiesForScene('combat')];
        const intersects = this.raycaster.intersectObjects(this.renderManager.scene.children, true);
        
        if (intersects.length > 0) {
            let foundUnit = null;
            for (const intersect of intersects) {
                let obj: THREE.Object3D | null = intersect.object;
                while (obj) {
                    const unit = units.find(u => (u.mesh || u.model?.group || u.group) === obj);
                    if (unit) {
                        foundUnit = unit;
                        break;
                    }
                    obj = obj.parent;
                }
                if (foundUnit) break;
            }

            if (foundUnit) {
                let stats = foundUnit === this.player ? this.player.status.getStats() : foundUnit.stats;
                let unitName = foundUnit === this.player ? 'Hero' : foundUnit.constructor.name;
                this.onShowTooltip?.(stats, unitName, e.clientX, e.clientY);
            }
        } else {
            this.onHideTooltip?.();
        }
    }
    
    public clearSelection() {
        if (this.selectedUnit) {
            this.setUnitHighlight(this.selectedUnit, false);
            this.clearRangeHighlight();
        }
        this.selectedUnit = null;
        this.draggingUnit = null;
        this.onUnitSelect?.(undefined, null);
    }

    private getUnitPosition(unit: any): THREE.Vector3 | null {
        return unit?.position || unit?.mesh?.position || unit?.model?.group?.position || unit?.group?.position || null;
    }

    private setUnitPosition(unit: any, position: THREE.Vector3) {
        if (unit?.position) unit.position.copy(position);
        if (unit?.mesh?.position) unit.mesh.position.copy(position);
        if (unit?.model?.group?.position) unit.model.group.position.copy(position);
        if (unit?.group?.position) unit.group.position.copy(position);
    }
    
    private setUnitHighlight(unit: any, active: boolean) {
        if (!unit) return;
        unit.isDebugHitbox = active;
        
        // Check if this is the current active unit in combat
        const isActiveUnit = this.combatSystem && this.combatSystem.getActiveUnit()?.entity === unit;
        
        if (unit === this.player) {
            PlayerDebug.updateHitboxVisuals(unit);
        } else if (unit.model?.group) {
            unit.model.group.traverse((child: THREE.Object3D) => {
                if (child instanceof THREE.Mesh && child.material) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach(mat => {
                        if ('emissive' in mat) {
                            if (isActiveUnit) {
                                // Active unit gets a golden glow
                                (mat as any).emissive.setHex(0x444400);
                            } else if (active) {
                                // Selected unit gets a subtle highlight
                                (mat as any).emissive.setHex(0x222200);
                            } else {
                                (mat as any).emissive.setHex(0x000000);
                            }
                        }
                    });
                }
            });
        }
    }
}
