import React, { Suspense, lazy } from 'react';
import { InventoryItem, EntityStats, PlayerConfig, Quest } from '../../types';
import { FastTravelMenu } from './FastTravelMenu';

// Lazy load heavy modal components
const InventoryModal = lazy(() => import('./InventoryModal').then(m => ({ default: m.InventoryModal })));
const TradeModal = lazy(() => import('./TradeModal').then(m => ({ default: m.TradeModal })));
const ForgeModal = lazy(() => import('./ForgeModal').then(m => ({ default: m.ForgeModal })));
const KeybindsModal = lazy(() => import('./KeybindsModal').then(m => ({ default: m.KeybindsModal })));
const QuestLogModal = lazy(() => import('./QuestLogModal').then(m => ({ default: m.QuestLogModal })));
const SpawnAnimalsModal = lazy(() => import('./SpawnAnimalsModal').then(m => ({ default: m.SpawnAnimalsModal })));
const EnemiesModal = lazy(() => import('./EnemiesModal').then(m => ({ default: m.EnemiesModal })));
const CharacterStatsModal = lazy(() => import('./CharacterStatsModal').then(m => ({ default: m.CharacterStatsModal })));
const ShopkeeperChatModal = lazy(() => import('./ShopkeeperChatModal').then(m => ({ default: m.ShopkeeperChatModal })));

interface GlobalModalsProps {
    isInventoryOpen: boolean;
    toggleInventory: () => void;
    inventory: (InventoryItem | null)[];
    setInventory: (items: (InventoryItem | null)[]) => void;
    equipmentSlots: Record<string, string | null>;
    handleEquipItem: (item: string, slotId: string) => void;
    handleUnequipItem: (slotId: string) => void;
    coins: number;
    stats: EntityStats;
    bodyType: string;

    isTradeOpen: boolean;
    setIsTradeOpen: (open: boolean) => void;
    onBuy: (item: string, price: number) => void;
    onSell: (index: number, price: number) => void;

    isShopkeeperChatOpen: boolean;
    setIsShopkeeperChatOpen: (open: boolean) => void;

    isForgeOpen: boolean;
    setIsForgeOpen: (open: boolean) => void;

    isKeybindsOpen: boolean;
    toggleKeybinds: () => void;

    isQuestLogOpen: boolean;
    toggleQuestLog: () => void;
    quests: Quest[];
    handleClaimReward: (questId: string) => void;

    isTravelOpen: boolean;
    setIsTravelOpen: (open: boolean) => void;
    activeScene: 'dev' | 'world' | 'combat';
    handleTravel: (scene: 'dev' | 'world' | 'combat') => void;

    isSpawnModalOpen: boolean;
    setIsSpawnModalOpen: (open: boolean) => void;
    handleSpawnAnimal: (type: string, count: number) => void;

    isEnemiesModalOpen: boolean;
    setIsEnemiesModalOpen: (open: boolean) => void;

    isCharacterStatsOpen: boolean;
    setIsCharacterStatsOpen: (open: boolean) => void;
    statsForModal: EntityStats | null;
    statsUnitName: string;
}

export const GlobalModals: React.FC<GlobalModalsProps> = ({
    isInventoryOpen, toggleInventory, inventory, setInventory, equipmentSlots, handleEquipItem, handleUnequipItem, coins, stats, bodyType,
    isTradeOpen, setIsTradeOpen, onBuy, onSell,
    isShopkeeperChatOpen, setIsShopkeeperChatOpen,
    isForgeOpen, setIsForgeOpen,
    isKeybindsOpen, toggleKeybinds,
    isQuestLogOpen, toggleQuestLog, quests, handleClaimReward,
    isTravelOpen, setIsTravelOpen, activeScene, handleTravel,
    isSpawnModalOpen, setIsSpawnModalOpen, handleSpawnAnimal,
    isEnemiesModalOpen, setIsEnemiesModalOpen,
    isCharacterStatsOpen, setIsCharacterStatsOpen, statsForModal, statsUnitName
}) => {
    return (
        <Suspense fallback={null}>
            {isInventoryOpen && (
              <InventoryModal 
                items={inventory} 
                onClose={toggleInventory}
                onUpdateItems={setInventory}
                equipmentSlots={equipmentSlots}
                onEquip={handleEquipItem}
                onUnequip={handleUnequipItem}
                coins={coins}
                stats={stats}
                bodyType={bodyType}
              />
            )}
            {isTradeOpen && (
              <TradeModal 
                isOpen={isTradeOpen}
                inventory={inventory}
                onClose={() => setIsTradeOpen(false)}
                onBuy={onBuy}
                onSell={onSell}
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
                    inventory={inventory}
                    onClose={() => setIsForgeOpen(false)}
                    onUpdateInventory={setInventory}
                />
            )}
            {isKeybindsOpen && (
                <KeybindsModal onClose={toggleKeybinds} />
            )}
            {isQuestLogOpen && (
                <QuestLogModal 
                    quests={quests}
                    onClose={toggleQuestLog}
                    onClaimReward={handleClaimReward}
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
            {isCharacterStatsOpen && (
                <CharacterStatsModal 
                    stats={statsForModal} 
                    unitName={statsUnitName}
                    onClose={() => setIsCharacterStatsOpen(false)} 
                />
            )}
        </Suspense>
    );
};
