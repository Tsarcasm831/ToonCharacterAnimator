import * as THREE from 'three';
import { EntityManager } from './EntityManager';
import { RenderManager } from '../core/RenderManager';
import { CombatEnvironment } from '../environment/CombatEnvironment';
import { Player } from '../player/Player';
import { EntityStats } from '../../types';
import { PlayerDebug } from '../player/PlayerDebug';

export class CombatInteractionManager {
    private entityManager: EntityManager;
    private renderManager: RenderManager;
    private player: Player;
    
    private raycaster = new THREE.Raycaster();
    private dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    private dragOffset = new THREE.Vector3();
    
    private selectedUnit: any | null = null;
    private draggingUnit: any | null = null;
    private draggingUnitStartPos: THREE.Vector3 | null = null;
    private isWaitingForClick = false;
    private mouseDownScreenPos = new THREE.Vector2();
    
    public isActive: boolean = false;
    
    public onUnitSelect?: (stats?: EntityStats, unit?: any) => void;
    public onShowCharacterStats?: (stats?: EntityStats, name?: string) => void;
    public onShowTooltip?: (stats?: EntityStats, name?: string, screenX?: number, screenY?: number) => void;
    public onHideTooltip?: () => void;

    constructor(entityManager: EntityManager, renderManager: RenderManager, player: Player) {
        this.entityManager = entityManager;
        this.renderManager = renderManager;
        this.player = player;
    }

    public setCombatActive(active: boolean) {
        this.isActive = active;
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
        const unitMeshes = units.map(u => u.mesh || u.model?.group || u.group).filter(Boolean);
        
        const intersects = this.raycaster.intersectObjects(unitMeshes, true);
        
        if (intersects.length > 0) {
            const clickedMesh = intersects[0].object;
            let foundUnit = units.find(u => {
                const mesh = u.mesh || u.model?.group || u.group;
                return mesh && (mesh === clickedMesh || mesh.getObjectById(clickedMesh.id));
            });

            if (foundUnit) {
                // Check if this is a friendly unit (player or cleric-type)
                const isFriendly = this.isFriendlyUnit(foundUnit);
                
                this.draggingUnit = foundUnit;
                this.isWaitingForClick = true;
                this.mouseDownScreenPos.set(e.clientX, e.clientY);
                
                const unitPos = this.getUnitPosition(foundUnit);
                this.draggingUnitStartPos = unitPos ? unitPos.clone() : null;
                
                // Only allow dragging friendly units
                if (isFriendly && unitPos && this.raycaster.ray.intersectPlane(this.dragPlane, this.dragOffset)) {
                    this.dragOffset.sub(unitPos);
                }
            }
        } else {
            // Clicked off any unit - deselect
            if (this.selectedUnit) {
                this.setUnitHighlight(this.selectedUnit, false);
                this.selectedUnit = null;
                this.onUnitSelect?.(undefined, null);
            }
        }
    }

    private isFriendlyUnit(unit: any): boolean {
        if (unit === this.player) return true;
        // Check unit type - clerics, knights, paladins, monks, rangers, sentinels are friendly
        const friendlyTypes = ['Cleric', 'Knight', 'Paladin', 'Monk', 'Ranger', 'Sentinel'];
        const unitType = unit?.constructor?.name || '';
        return friendlyTypes.includes(unitType);
    }

    public handleMouseMove(e: MouseEvent) {
        if (!this.isActive || !this.draggingUnit) return;
        
        // Only allow dragging friendly units
        if (!this.isFriendlyUnit(this.draggingUnit)) return;

        const dist = this.mouseDownScreenPos.distanceTo(new THREE.Vector2(e.clientX, e.clientY));
        if (dist > 5) {
            this.isWaitingForClick = false;
            this.setUnitHighlight(this.draggingUnit, true);
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
        if (!this.isActive || !this.draggingUnit) return;

        if (this.isWaitingForClick) {
            if (this.selectedUnit && this.selectedUnit !== this.draggingUnit) {
                this.setUnitHighlight(this.selectedUnit, false);
            }
            
            const isNowSelected = this.selectedUnit !== this.draggingUnit;
            this.selectedUnit = isNowSelected ? this.draggingUnit : null;
            this.setUnitHighlight(this.draggingUnit, isNowSelected);
            
            if (isNowSelected) {
                const stats = this.draggingUnit === this.player ? this.player.status.getStats() : this.draggingUnit.stats;
                this.onUnitSelect?.(stats, this.draggingUnit);
            } else {
                this.onUnitSelect?.(undefined, null);
            }
        } else {
            // Snap to grid - only for friendly units
            if (combatEnvironment && this.isFriendlyUnit(this.draggingUnit)) {
                const unitPos = this.getUnitPosition(this.draggingUnit);
                if (unitPos) {
                    const targetGrid = combatEnvironment.getGridPosition(unitPos);
                    const combatEntities = this.entityManager.getEntitiesForScene('combat');
                    const units = [this.player, ...combatEntities];
                    
                    // Check if target is on friendly side (rows 4-7 are green/friendly)
                    const isOnFriendlySide = targetGrid ? targetGrid.r >= 4 : false;
                    
                    const isTargetOccupied = targetGrid
                        ? units.some(u => {
                            if (u === this.draggingUnit) return false;
                            const pos = this.getUnitPosition(u);
                            if (!pos) return false;
                            const grid = combatEnvironment?.getGridPosition(pos);
                            return grid?.r === targetGrid.r && grid?.c === targetGrid.c;
                        })
                        : true;

                    // Only allow placement on friendly side and unoccupied cells
                    if ((isTargetOccupied || !isOnFriendlySide) && this.draggingUnitStartPos) {
                        // Return to original position
                        const startGrid = combatEnvironment.getGridPosition(this.draggingUnitStartPos);
                        if (startGrid) {
                            const snapped = combatEnvironment.getWorldPosition(startGrid.r, startGrid.c);
                            this.setUnitPosition(this.draggingUnit, snapped);
                        }
                    } else if (!isTargetOccupied && isOnFriendlySide && targetGrid) {
                        const snapped = combatEnvironment.getWorldPosition(targetGrid.r, targetGrid.c);
                        this.setUnitPosition(this.draggingUnit, snapped);
                    }
                }
            }
        }
        this.draggingUnit = null;
        this.isWaitingForClick = false;
        this.draggingUnitStartPos = null;
    }
    
    public handleContextMenu(e: MouseEvent) {
        if (!this.isActive) return;
        
        const rect = this.renderManager.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        this.raycaster.setFromCamera(mouse, this.renderManager.camera);
        
        const combatEntities = this.entityManager.getEntitiesForScene('combat');
        const units = [this.player, ...combatEntities];
        const unitMeshes = units.map(u => u.mesh || u.model?.group || u.group).filter(Boolean);
        
        const intersects = this.raycaster.intersectObjects(unitMeshes, true);
        
        if (intersects.length > 0) {
            const clickedMesh = intersects[0].object;
            let foundUnit = units.find(u => {
                const mesh = u.mesh || u.model?.group || u.group;
                return mesh && (mesh === clickedMesh || mesh.getObjectById(clickedMesh.id));
            });

            if (foundUnit) {
                let stats: EntityStats | undefined = foundUnit.stats;
                let unitName = 'Unknown Unit';

                if (foundUnit === this.player) {
                    stats = this.player.status.getStats();
                    unitName = 'Hero';
                } else {
                    unitName = foundUnit.constructor.name;
                }

                // Show tooltip at mouse position instead of modal
                this.onShowTooltip?.(stats, unitName, e.clientX, e.clientY);
            }
        } else {
            // Hide tooltip when right-clicking empty space
            this.onHideTooltip?.();
        }
    }
    
    public clearSelection() {
        this.selectedUnit = null;
        this.draggingUnit = null;
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
        if (unit === this.player) {
            PlayerDebug.updateHitboxVisuals(unit);
        } else if (unit.updateHitboxVisuals) {
            unit.updateHitboxVisuals();
        }
    }
}
