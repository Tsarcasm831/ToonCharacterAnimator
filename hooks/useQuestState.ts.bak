import React, { useState, useEffect } from 'react';
import { Quest, InventoryItem, QuestStatus } from '../types';

const INITIAL_QUESTS: Quest[] = [
  {
    id: '1',
    title: 'Lumberjack\'s Task',
    description: 'The Timber Wharf is running low on supplies. Head out into the meadows and collect 100 pieces of wood for the local craftsmen.',
    status: 'active',
    objectives: [
      { label: 'Collect Wood', current: 0, target: 100 }
    ],
    reward: '100 Gold Coins & 100 Wood',
    rewardClaimed: false
  }
];

const COAL_QUEST: Quest = {
  id: '2',
  title: 'Coal Story Bro',
  description: 'Now that you have plenty of wood, it\'s time to refine it. Use the Blacksmith\'s forge to smelt your wood into coal. We need a steady supply for the upcoming winter.',
  status: 'active',
  objectives: [
    { label: 'Create Coal', current: 0, target: 50 }
  ],
  reward: '500 Gold Coins & Steel Axe',
  rewardClaimed: false
};

export function useQuestState(inventory: (InventoryItem | null)[], setCoins: React.Dispatch<React.SetStateAction<number>>, setInventory: React.Dispatch<React.SetStateAction<(InventoryItem | null)[]>>, setNotification: (msg: string) => void) {
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [isQuestLogOpen, setIsQuestLogOpen] = useState(false);

  const toggleQuestLog = () => setIsQuestLogOpen(prev => !prev);

  const claimQuestReward = (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest || quest.status !== 'completed' || quest.rewardClaimed) return;

    if (questId === '1') {
      setCoins(c => c + 100);
      const nextInv = [...inventory];
      let added = false;
      for (let i = 0; i < nextInv.length; i++) {
        if (nextInv[i]?.name === 'Wood') {
          nextInv[i]!.count += 100;
          added = true;
          break;
        }
      }
      if (!added) {
        const emptyIdx = nextInv.findIndex(s => s === null);
        if (emptyIdx !== -1) nextInv[emptyIdx] = { name: 'Wood', count: 100 };
      }
      setInventory(nextInv);
      setNotification(`Claimed rewards for ${quest.title}!`);
      setQuests(prev => [...prev.map(q => q.id === questId ? { ...q, rewardClaimed: true } : q), COAL_QUEST]);
      return;
    }

    if (questId === '2') {
        setCoins(c => c + 500);
        const nextInv = [...inventory];
        const emptyIdx = nextInv.findIndex(s => s === null);
        if (emptyIdx !== -1) nextInv[emptyIdx] = { name: 'Steel Axe', count: 1 };
        setInventory(nextInv);
        setNotification(`Claimed rewards for ${quest.title}! (+500 Gold, +Steel Axe)`);
        setQuests(prev => prev.map(q => q.id === questId ? { ...q, rewardClaimed: true } : q));
    }
  };

  useEffect(() => {
    const totalWood = inventory.reduce((sum, item) => item?.name === 'Wood' ? sum + item.count : sum, 0);
    const totalCoal = inventory.reduce((sum, item) => item?.name === 'Coal' ? sum + item.count : sum, 0);

    setQuests(prev => prev.map(q => {
        if (q.id === '1' && q.status === 'active') {
            const woodObj = q.objectives.find(o => o.label === 'Collect Wood');
            if (!woodObj) return q;
            const newObjectives = q.objectives.map(obj => obj.label === 'Collect Wood' ? { ...obj, current: totalWood } : obj);
            const isDone = newObjectives.every(o => o.current >= o.target);
            if (isDone) {
                setNotification(`Quest Completed: ${q.title}! (Open Log to Claim)`);
                return { ...q, objectives: newObjectives, status: 'completed' as QuestStatus };
            }
            if (woodObj.current !== totalWood) return { ...q, objectives: newObjectives };
        }
        if (q.id === '2' && q.status === 'active') {
            const coalObj = q.objectives.find(o => o.label === 'Create Coal');
            if (!coalObj) return q;
            const newObjectives = q.objectives.map(obj => obj.label === 'Create Coal' ? { ...obj, current: totalCoal } : obj);
            const isDone = newObjectives.every(o => o.current >= o.target);
            if (isDone) {
                setNotification(`Quest Completed: ${q.title}! (Open Log to Claim)`);
                return { ...q, objectives: newObjectives, status: 'completed' as QuestStatus };
            }
            if (coalObj.current !== totalCoal) return { ...q, objectives: newObjectives };
        }
        return q;
    }));
  }, [inventory, setNotification]);

  return {
    quests,
    setQuests,
    claimQuestReward
  };
}
