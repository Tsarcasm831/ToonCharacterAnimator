import React, { Suspense, lazy } from 'react';
import { PlayerConfig, PlayerInput, InventoryItem, ActiveScene } from '../../../types';
import { useGlobalState } from '../../../contexts/GlobalContext';
import { FastTravelMenu } from '../menus/FastTravelMenu';
import * as THREE from 'three';
import { CITIES } from '../../../data/lands/cities';
import { getTownWallCenters } from '../../../game/environment/townWalls';
import { calculateBounds, isPointInPolygon, landCoordsToWorld } from '../../../game/environment/landTerrain';
import { PlayerUtils } from '../../../game/player/PlayerUtils';

// Lazy load heavy modal components
const InventoryModal = lazy(() => import('./InventoryModal').then(m => ({ default: m.InventoryModal })));
const TradeModal = lazy(() => import('./TradeModal').then(m => ({ default: m.TradeModal })));
const ForgeModal = lazy(() => import('./ForgeModal').then(m => ({ default: m.ForgeModal })));
const KeybindsModal = lazy(() => import('./KeybindsModal').then(m => ({ default: m.KeybindsModal })));
const QuestLogModal = lazy(() => import('./QuestLogModal').then(m => ({ default: m.QuestLogModal })));
const SpawnAnimalsModal = lazy(() => import('./SpawnAnimalsModal').then(m => ({ default: m.SpawnAnimalsModal })));
const EnemiesModal = lazy(() => import('./EnemiesModal').then(m => ({ default: m.EnemiesModal })));
const ShopkeeperChatModal = lazy(() => import('./ShopkeeperChatModal').then(m => ({ default: m.ShopkeeperChatModal })));
import { LandMapModal } from './LandMapModal';
import { WorldMapModal } from './WorldMapModal';
const LandSelectionModal = lazy(() => import('./LandSelectionModal').then(m => ({ default: m.LandSelectionModal })));

export const GlobalModals: React.FC = () => {
    const {
        uiState,
        playerState,
        inventoryState,
        equipmentLogic,
        economyLogic,
        questState,
        gameState,
        environmentState,
        combatState,
        gameInstance
    } = useGlobalState();

    const {
        isInventoryOpen, toggleInventory,
        isTradeOpen, setIsTradeOpen,
        isShopkeeperChatOpen, setIsShopkeeperChatOpen,
        isForgeOpen, setIsForgeOpen,
        isKeybindsOpen, toggleKeybinds,
        isQuestLogOpen, toggleQuestLog,
        isTravelOpen, setIsTravelOpen,
        isSpawnModalOpen, setIsSpawnModalOpen,
        isEnemiesModalOpen, setIsEnemiesModalOpen,
        isCharacterStatsOpen, setIsCharacterStatsOpen,
        statsForModal, statsUnitName,
        isLandMapOpen, setIsLandMapOpen,
        isWorldMapOpen, setIsWorldMapOpen,
        isAreaMapOpen, setIsAreaMapOpen,
        isLandSelectionOpen, setIsLandSelectionOpen
    } = uiState;

    const { inventory, setInventory, equipmentSlots, slotLayouts, updateSlotLayouts } = inventoryState;
    const { coins, config } = playerState;
    const { handleEquipItem, handleUnequipItem } = equipmentLogic;
    const { handleBuy, handleSell } = economyLogic;
    const { quests, claimQuestReward } = questState;
    const { activeScene, setActiveScene, setGameState } = gameState;
    const { setIsEnvironmentBuilt, setIsVisualLoadingDone, selectedLand, setSelectedLand } = environmentState;
    const { setIsCombatActive } = combatState;

    const isLand = activeScene === 'land';
    const equipSlotMap: Record<string, string> = {
        'Shirt': 'torso',
        'Quilted Armor': 'torso',
        'Leather Armor': 'torso',
        'Leather Doublet': 'torso',
        'Heavy Leather Armor': 'torso',
        'RingMail': 'torso',
        'Plate Mail': 'torso',
        'Pants': 'legs',
        'Hide Breeches': 'legs',
        'Leather Pants': 'legs',
        'Chain Leggings': 'legs',
        'Plate Leggings': 'legs',
        'Warlord Leg Plates': 'legs',
        'Shoes': 'boots',
        'Mask': 'mask',
        'Hood': 'hood',
        'Helm': 'helm',
        'Sword': 'weapon',
        'Axe': 'weapon',
        'Pickaxe': 'weapon',
        'Knife': 'weapon',
        'Halberd': 'weapon',
        'Staff': 'weapon',
        'Fishing Pole': 'weapon',
        'Bow': 'weapon'
    };

    const handleEquipFromInventory = (index: number) => {
        const item = inventory[index];
        if (!item) return;
        const slotId = equipSlotMap[item.name];
        if (!slotId) return;

        const nextInv = [...inventory];
        nextInv[index] = item.count > 1 ? { ...item, count: item.count - 1 } : null;
        setInventory(nextInv);
        handleEquipItem(item.name, slotId);
    };

    const handleTravel = (scene: ActiveScene) => {
        if (scene === (activeScene as any)) { setIsTravelOpen(false); return; }
        setIsEnvironmentBuilt(false);
        setIsVisualLoadingDone(false);
        setIsCombatActive(false);
        setGameState('LOADING');
        setIsTravelOpen(false);
        setTimeout(() => setActiveScene(scene as any), 100);
    };

    const handleSpawnAnimal = (type: string, count: number) => { 
        if (gameInstance.current) {
            const playerPos = gameInstance.current.player.position;
            const spawnPos = playerPos.clone().add(new THREE.Vector3(2, 0, 2));
            gameInstance.current.entityManager.spawnAnimalGroup(type, count, gameInstance.current.sceneManager.environment, spawnPos);
        }
    };

    const getBiomeType = (texture?: string) => {
        if (!texture) return 'Grass';
        if (texture === 'trees') return 'Leaves';
        if (texture === 'sand') return 'Sand';
        if (texture === 'snow') return 'Snow';
        if (texture === 'stone') return 'Stone';
        return 'Grass';
    };

    const getLandWorldData = (points: number[][]) => {
        const bounds = calculateBounds(points);
        const worldPoints = points.map((p) => {
            const world = landCoordsToWorld(p[0], p[1], bounds.centerX, bounds.centerZ);
            return [world.x, world.z];
        });
        return { bounds, worldPoints };
    };

    const findSpawnPointInLand = (
        worldPoints: number[][],
        bounds: { worldMinX: number, worldMaxX: number, worldMinZ: number, worldMaxZ: number },
        preferred?: THREE.Vector3
    ) => {
        if (preferred && isPointInPolygon(preferred.x, preferred.z, worldPoints)) {
            return preferred;
        }

        const centerX = (bounds.worldMinX + bounds.worldMaxX) * 0.5;
        const centerZ = (bounds.worldMinZ + bounds.worldMaxZ) * 0.5;
        const center = new THREE.Vector3(centerX, 0, centerZ);
        if (isPointInPolygon(center.x, center.z, worldPoints)) {
            return center;
        }

        const width = bounds.worldMaxX - bounds.worldMinX;
        const depth = bounds.worldMaxZ - bounds.worldMinZ;
        const maxRadius = Math.sqrt((width * width) + (depth * depth)) * 0.5;
        const step = Math.max(2, Math.min(10, Math.min(width, depth) / 20));

        for (let radius = step; radius <= maxRadius; radius += step) {
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
                const x = centerX + Math.cos(angle) * radius;
                const z = centerZ + Math.sin(angle) * radius;
                if (isPointInPolygon(x, z, worldPoints)) {
                    return new THREE.Vector3(x, 0, z);
                }
            }
        }

        const fallback = worldPoints[0];
        return new THREE.Vector3(fallback[0], 0, fallback[1]);
    };

    const teleportPlayerToSpawn = (spawnWorld: THREE.Vector3, obstacles?: THREE.Object3D[]) => {
        if (!gameInstance.current) return;
        const player = gameInstance.current.player;
        const playerScale = player.mesh.scale.x || 1;
        const targetHeight = 1.7 * playerScale;
        const cameraHeight = 3.2 * playerScale;
        const cameraDistance = 5.0 * playerScale;
        const groundY = PlayerUtils.getGroundHeight(spawnWorld, config, obstacles ?? []);
        const spawnY = groundY + 0.5;

        player.mesh.position.set(spawnWorld.x, spawnY, spawnWorld.z);
        gameInstance.current.renderManager.controls.target.set(spawnWorld.x, spawnY + targetHeight, spawnWorld.z);
        gameInstance.current.renderManager.camera.position.set(spawnWorld.x, spawnY + cameraHeight, spawnWorld.z + cameraDistance);
        player.locomotion.position.copy(player.mesh.position);
        player.locomotion.previousPosition.copy(player.mesh.position);
        player.locomotion.velocity.set(0, 0, 0);
    };

    const handleLandSelect = (land: any) => {
        setIsLandSelectionOpen(false);
        if (gameInstance.current && land.points) {
            const biomeType = getBiomeType(land.texture);

            gameInstance.current.sceneManager.updateSingleBiomeLand(land.points, {
                name: land.name,
                color: land.color,
                type: biomeType
            });
            setSelectedLand({
                id: land.id,
                name: land.name,
                color: land.color,
                points: land.points,
                texture: land.texture,
                biomeType
            });

            const isLand23 = land.id === 'Land23';
            let didLand23Teleport = false;
            const singleBiomeEnv = gameInstance.current.sceneManager.singleBiomeEnvironment;
            if (singleBiomeEnv) {
                const wallCenters = getTownWallCenters(land, CITIES);
                singleBiomeEnv.setTownWallCenters(wallCenters);
                if (isLand23) {
                    const yureiCity = CITIES.find(city => city.name === 'Yureigakure');
                    if (yureiCity) {
                        const { bounds, worldPoints } = getLandWorldData(land.points);
                        const preferred = landCoordsToWorld(yureiCity.x, yureiCity.y, bounds.centerX, bounds.centerZ);
                        const spawnWorld = findSpawnPointInLand(worldPoints, bounds, new THREE.Vector3(preferred.x, 0, preferred.z));
                        teleportPlayerToSpawn(spawnWorld, singleBiomeEnv.obstacles);
                        didLand23Teleport = true;
                    }
                }
            }
            
            // Reset player position to center/safe spot
            if (gameInstance.current.player && !didLand23Teleport) {
               const { bounds, worldPoints } = getLandWorldData(land.points);
               const spawnWorld = findSpawnPointInLand(worldPoints, bounds);
               teleportPlayerToSpawn(spawnWorld, singleBiomeEnv?.obstacles);
            }
        }
    };

    return (
        <Suspense fallback={null}>
            {isInventoryOpen && (
              <InventoryModal 
                isOpen={isInventoryOpen}
                config={config}
                inventory={inventory} 
                onClose={toggleInventory}
                onInventoryChange={setInventory}
                equipmentSlots={equipmentSlots}
                onEquip={handleEquipFromInventory}
                onEquipItem={handleEquipItem}
                onUnequipItem={handleUnequipItem}
                coins={coins}
                slotLayouts={slotLayouts}
                onUpdateSlotLayouts={updateSlotLayouts}
              />
            )}
            {isTradeOpen && (
              <TradeModal 
                isOpen={isTradeOpen}
                inventory={inventory}
                onClose={() => setIsTradeOpen(false)}
                onBuy={handleBuy}
                onSell={handleSell}
                coins={coins}
              />
            )}
            {isShopkeeperChatOpen && (
                <ShopkeeperChatModal 
                    isOpen={isShopkeeperChatOpen}
                    onClose={() => setIsShopkeeperChatOpen(false)}
                    onTrade={() => {
                        setIsShopkeeperChatOpen(false);
                        setIsTradeOpen(true);
                    }}
                />
            )}
            {isForgeOpen && (
                <ForgeModal 
                    isOpen={isForgeOpen}
                    inventory={inventory}
                    onClose={() => setIsForgeOpen(false)}
                    onInventoryChange={setInventory}
                />
            )}
            {isKeybindsOpen && (
                <KeybindsModal isOpen={isKeybindsOpen} onClose={toggleKeybinds} />
            )}
            {isQuestLogOpen && (
                <QuestLogModal 
                    isOpen={isQuestLogOpen}
                    quests={quests}
                    onClose={toggleQuestLog}
                    onClaimReward={claimQuestReward}
                />
            )}
            {isTravelOpen && (
                <FastTravelMenu 
                    activeScene={activeScene}
                    onTravel={handleTravel}
                    onClose={() => setIsTravelOpen(false)}
                />
            )}
            {isSpawnModalOpen && (
                <SpawnAnimalsModal 
                    isOpen={isSpawnModalOpen}
                    onClose={() => setIsSpawnModalOpen(false)}
                    onSpawn={handleSpawnAnimal}
                />
            )}
            {isEnemiesModalOpen && (
                <EnemiesModal isOpen={isEnemiesModalOpen} onClose={() => setIsEnemiesModalOpen(false)} />
            )}
            {isLand && isLandMapOpen && (
                <LandMapModal 
                    isOpen={isLandMapOpen} 
                    onClose={() => setIsLandMapOpen(false)} 
                    playerPos={gameInstance.current?.player.position || new THREE.Vector3()}
                />
            )}
            {isAreaMapOpen && selectedLand?.points && (
                <LandMapModal
                    isOpen={isAreaMapOpen}
                    onClose={() => setIsAreaMapOpen(false)}
                    playerPos={gameInstance.current?.player.position || new THREE.Vector3()}
                    points={selectedLand.points}
                    title={`${selectedLand.name} Map`}
                />
            )}
            {isWorldMapOpen && (
                <WorldMapModal 
                    isOpen={isWorldMapOpen}
                    onClose={() => setIsWorldMapOpen(false)}
                />
            )}
            {isLandSelectionOpen && (
                <LandSelectionModal
                    isOpen={isLandSelectionOpen}
                    onSelect={handleLandSelect}
                />
            )}
            {/* {isCharacterStatsOpen && (
                <CharacterStatsModal 
                    stats={statsForModal} 
                    unitName={statsUnitName}
                    onClose={() => setIsCharacterStatsOpen(false)} 
                />
            )} */}
        </Suspense>
    );
};
