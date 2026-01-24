import React, { Suspense, lazy } from 'react';
import { PlayerConfig, PlayerInput, InventoryItem, ActiveScene } from '../../../types';
import { useGlobalState } from '../../../contexts/GlobalContext';
import { FastTravelMenu } from '../menus/FastTravelMenu';
import * as THREE from 'three';

// Lazy load heavy modal components
const InventoryModal = lazy(() => import('./InventoryModal').then(m => ({ default: m.InventoryModal })));
const TradeModal = lazy(() => import('./TradeModal').then(m => ({ default: m.TradeModal })));
const ForgeModal = lazy(() => import('./ForgeModal').then(m => ({ default: m.ForgeModal })));
const KeybindsModal = lazy(() => import('./KeybindsModal').then(m => ({ default: m.KeybindsModal })));
const QuestLogModal = lazy(() => import('./QuestLogModal').then(m => ({ default: m.QuestLogModal })));
const SpawnAnimalsModal = lazy(() => import('./SpawnAnimalsModal').then(m => ({ default: m.SpawnAnimalsModal })));
const EnemiesModal = lazy(() => import('./EnemiesModal').then(m => ({ default: m.EnemiesModal })));
const ShopkeeperChatModal = lazy(() => import('./ShopkeeperChatModal').then(m => ({ default: m.ShopkeeperChatModal })));
const LandMapModal = lazy(() => import('./LandMapModal').then(m => ({ default: m.LandMapModal })));
const WorldMapModal = lazy(() => import('./WorldMapModal').then(m => ({ default: m.WorldMapModal })));
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

    const { inventory, setInventory, equipmentSlots } = inventoryState;
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

    const handleLandSelect = (land: any) => {
        setIsLandSelectionOpen(false);
        if (gameInstance.current && land.points) {
            // Map land texture/type to sound manager type if possible
            // Land data has 'texture' property e.g. 'trees', 'sand', etc.
            const biomeType = land.texture ? 
                (land.texture === 'trees' ? 'Leaves' : 
                 land.texture === 'sand' ? 'Sand' : 
                 land.texture === 'snow' ? 'Snow' : 
                 land.texture === 'stone' ? 'Stone' : 
                 'Grass') 
                : 'Grass';

            gameInstance.current.sceneManager.updateSingleBiomeLand(land.points, {
                name: land.name,
                color: land.color,
                type: biomeType
            });
            setSelectedLand({ name: land.name, color: land.color, points: land.points });
            
            // Reset player position to center/safe spot
            if (gameInstance.current.player) {
               // We should probably find a safe spot inside the polygon instead of 0,5,0 if 0,0 is not in polygon
               // But for now, 0,5,0 is the assumption that land is centered-ish.
               // However, SingleBiomeEnvironment centers the land on 0,0 world space.
               gameInstance.current.player.mesh.position.set(0, 5, 0);
               gameInstance.current.player.locomotion.velocity.set(0, 0, 0);
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
