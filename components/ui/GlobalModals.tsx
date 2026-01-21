import React, { Suspense, lazy } from 'react';
import { useGlobalState } from '../../contexts/GlobalContext';
import { FastTravelMenu } from './FastTravelMenu';
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
        isLandMapOpen, setIsLandMapOpen
    } = uiState;

    const { inventory, setInventory, equipmentSlots } = inventoryState;
    const { coins, config } = playerState;
    const { handleEquipItem, handleUnequipItem } = equipmentLogic;
    const { handleBuy, handleSell } = economyLogic;
    const { quests, claimQuestReward } = questState;
    const { activeScene, setActiveScene, setGameState } = gameState;
    const { setIsEnvironmentBuilt, setIsVisualLoadingDone } = environmentState;
    const { setIsCombatActive } = combatState;

    const isLand = activeScene === 'land';
    const equipSlotMap: Record<string, string> = {
        'Shirt': 'torso',
        'Quilted Armor': 'torso',
        'Leather Armor': 'torso',
        'Heavy Leather Armor': 'torso',
        'RingMail': 'torso',
        'Plate Mail': 'torso',
        'Pants': 'legs',
        'Shoes': 'boots',
        'Mask': 'mask',
        'Hood': 'hood',
        'Helm': 'helm'
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

    const handleTravel = (scene: 'dev' | 'land' | 'combat') => {
        if (scene === activeScene) { setIsTravelOpen(false); return; }
        setIsEnvironmentBuilt(false);
        setIsVisualLoadingDone(false);
        setIsCombatActive(false);
        setGameState('LOADING');
        setIsTravelOpen(false);
        setTimeout(() => setActiveScene(scene), 100);
    };

    const handleSpawnAnimal = (type: string, count: number) => { 
        if (gameInstance.current) {
            const playerPos = gameInstance.current.player.position;
            const spawnPos = playerPos.clone().add(new THREE.Vector3(2, 0, 2));
            gameInstance.current.entityManager.spawnAnimalGroup(type, count, gameInstance.current.environment, spawnPos);
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
                    onClose={() => setIsShopkeeperChatOpen(false)}
                    onOpenTrade={() => {
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
                <KeybindsModal onClose={toggleKeybinds} />
            )}
            {isQuestLogOpen && (
                <QuestLogModal 
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
                    onClose={() => setIsSpawnModalOpen(false)}
                    onSpawn={handleSpawnAnimal}
                />
            )}
            {isEnemiesModalOpen && (
                <EnemiesModal isOpen={isEnemiesModalOpen} onClose={() => setIsEnemiesModalOpen(false)} />
            )}
            {isLand && isLandMapOpen && (
                <LandMapModal isOpen={isLandMapOpen} onClose={() => setIsLandMapOpen(false)} />
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
