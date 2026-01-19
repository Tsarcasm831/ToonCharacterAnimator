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
    
    public onUnitSelect?: (stats?: EntityStats) => void;
    public onShowCharacterStats?: (stats?: EntityStats, name?: string) => void;

    constructor(entityManager: EntityManager, renderManager: RenderManager, player: Player) {
        this.entityManager = entityManager;
        this.renderManager = renderManager;
        this.player = player;
    }

    public setCombatActive(active: boolean) {
        this.isActive = active;
    }

    public handleMouseDown(e: MouseEvent, combatEnvironment: CombatEnvironment) {
        if (e.button !== 0) return;

        const mouse = new THREE.Vector2(
            (e.clientX / window.innerWidth) * 2 - 1,
            -(e.clientY / window.innerHeight) * 2 + 1
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
                this.draggingUnit = foundUnit;
                this.isWaitingForClick = true;
                this.mouseDownScreenPos.set(e.clientX, e.clientY);
                
                const unitPos = this.getUnitPosition(foundUnit);
                this.draggingUnitStartPos = unitPos ? unitPos.clone() : null;
                if (unitPos && this.raycaster.ray.intersectPlane(this.dragPlane, this.dragOffset)) {
                    this.dragOffset.sub(unitPos);
                }
            }
        } else {
            if (this.selectedUnit) {
                this.setUnitHighlight(this.selectedUnit, false);
                this.selectedUnit = null;
            }
        }
    }

    public handleMouseMove(e: MouseEvent) {
        if (!this.isActive || !this.draggingUnit) return;

        const dist = this.mouseDownScreenPos.distanceTo(new THREE.Vector2(e.clientX, e.clientY));
        if (dist > 5) {
            this.isWaitingForClick = false;
            this.setUnitHighlight(this.draggingUnit, true);
        }

        if (!this.isWaitingForClick) {
            const mouse = new THREE.Vector2(
                (e.clientX / window.innerWidth) * 2 - 1,
                -(e.clientY / window.innerHeight) * 2 + 1
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
                this.onUnitSelect?.(stats);
            } else {
                this.onUnitSelect?.(undefined);
            }
        } else {
            // Snap to grid
            if (combatEnvironment) {
                const unitPos = this.getUnitPosition(this.draggingUnit);
                if (unitPos) {
                    const targetGrid = combatEnvironment.getGridPosition(unitPos);
                    const combatEntities = this.entityManager.getEntitiesForScene('combat');
                    const units = [this.player, ...combatEntities];
                    const isTargetOccupied = targetGrid
                        ? units.some(u => {
                            if (u === this.draggingUnit) return false;
                            const pos = this.getUnitPosition(u);
                            if (!pos) return false;
                            const grid = combatEnvironment?.getGridPosition(pos);
                            return grid?.r === targetGrid.r && grid?.c === targetGrid.c;
                        })
                        : true;

                    if (isTargetOccupied && this.draggingUnitStartPos) {
                        const snapped = combatEnvironment.snapToGrid(this.draggingUnitStartPos);
                        this.setUnitPosition(this.draggingUnit, snapped);
                    } else if (!isTargetOccupied) {
                        const snapped = combatEnvironment.snapToGrid(unitPos);
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
        
        const mouse = new THREE.Vector2(
            (e.clientX / window.innerWidth) * 2 - 1,
            -(e.clientY / window.innerHeight) * 2 + 1
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

                this.onShowCharacterStats?.(stats, unitName);
            }
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
