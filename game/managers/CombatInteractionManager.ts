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

    private rangeHighlight: THREE.Group | null = null;

    constructor(entityManager: EntityManager, renderManager: RenderManager, player: Player) {
        this.entityManager = entityManager;
        this.renderManager = renderManager;
        this.player = player;
    }

    public setCombatActive(active: boolean) {
        this.isActive = active;
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

    private showRangeHighlight(unit: any, combatEnvironment: CombatEnvironment) {
        this.clearRangeHighlight();
        const unitPos = this.getUnitPosition(unit);
        if (!unitPos || !combatEnvironment) return;

        const gridPos = combatEnvironment.getGridPosition(unitPos);
        if (!gridPos) return;

        this.rangeHighlight = new THREE.Group();
        this.renderManager.scene.add(this.rangeHighlight);

        // Define ranges based on unit type
        const unitType = unit?.constructor?.name || '';
        const range = (unitType === 'Archer' || unitType === 'combatArchers' || (unit.config && unit.config.selectedItem === 'Bow')) ? 4 : 1;
        
        console.log(`[CombatInteractionManager] Showing range for ${unitType}: ${range} cells`);

        for (let r = 0; r < combatEnvironment.GRID_ROWS; r++) {
            for (let c = 0; c < combatEnvironment.GRID_COLS; c++) {
                const cellWorldPos = combatEnvironment.getWorldPosition(r, c);
                const dist = unitPos.distanceTo(cellWorldPos);
                const maxWorldDist = range * 1.6; 

                if (dist <= maxWorldDist && dist > 0.1) {
                    const ringGeo = new THREE.RingGeometry(0.4, 0.5, 6);
                    const ringMat = new THREE.MeshBasicMaterial({ 
                        color: 0x00aaff, 
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: 0.6
                    });
                    const ring = new THREE.Mesh(ringGeo, ringMat);
                    ring.position.copy(cellWorldPos);
                    ring.position.y = 0.05;
                    ring.rotation.x = -Math.PI / 2;
                    this.rangeHighlight.add(ring);
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
                const isCombatStarted = combatEnvironment.isCombatStarted;
                console.log(`[CombatInteractionManager] Clicked unit: ${foundUnit.constructor.name}, CombatStarted: ${isCombatStarted}`);
                
                this.selectedUnit = foundUnit;
                this.setUnitHighlight(foundUnit, true);
                this.showRangeHighlight(foundUnit, combatEnvironment);
                const stats = foundUnit === this.player ? this.player.status.getStats() : foundUnit.stats;
                this.onUnitSelect?.(stats, foundUnit);

                if (!isCombatStarted) {
                    this.draggingUnit = foundUnit;
                    this.isWaitingForClick = true;
                    this.mouseDownScreenPos.set(e.clientX, e.clientY);
                    
                    const unitPos = this.getUnitPosition(foundUnit);
                    this.draggingUnitStartPos = unitPos ? unitPos.clone() : null;
                    
                    if (this.isFriendlyUnit(foundUnit) && unitPos && this.raycaster.ray.intersectPlane(this.dragPlane, this.dragOffset)) {
                        this.dragOffset.sub(unitPos);
                    }
                }
            }
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
        if (unit === this.player) {
            PlayerDebug.updateHitboxVisuals(unit);
        } else if (unit.model?.group) {
            unit.model.group.traverse((child: THREE.Object3D) => {
                if (child instanceof THREE.Mesh && child.material) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach(mat => {
                        if ('emissive' in mat) (mat as any).emissive.setHex(active ? 0x444400 : 0x000000);
                    });
                }
            });
        }
    }
}
