import React, { useCallback, useEffect, useState } from 'react';
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

const TOWN2_SUPPLY_QUEST: Quest = {
  id: 'town2_market_supplies',
  title: 'Market Day Shortage',
  description: 'Reeve Anya needs extra fuel and lumber before traders arrive. Bring enough wood and coal to restock the stalls and cooking fires.',
  status: 'active',
  objectives: [
    { label: 'Collect Wood', current: 0, target: 30 },
    { label: 'Create Coal', current: 0, target: 12 }
  ],
  reward: '120 Gold Coins & 20 Coal',
  rewardClaimed: false
};

const TOWN2_MESSAGE_QUEST: Quest = {
  id: 'town2_message_run',
  title: 'Message for the South Gate',
  description: 'Elder Mara wants Captain Bren warned about fresh movement near the old ruins. Carry her message to the gatehouse.',
  status: 'active',
  objectives: [
    { label: 'Speak to Captain Bren', current: 0, target: 1 }
  ],
  reward: '80 Gold Coins',
  rewardClaimed: false
};

const TOWN2_ARENA_QUEST: Quest = {
  id: 'town2_arena_trial',
  title: 'Arena Trial',
  description: 'Captain Bren wants proof that you can handle the beasts kept for training. Win one combat encounter and report back at your leisure.',
  status: 'active',
  objectives: [
    { label: 'Win an arena bout', current: 0, target: 1 }
  ],
  reward: '150 Gold Coins & 10 Wood',
  rewardClaimed: false
};

const upsertQuest = (quests: Quest[], nextQuest: Quest) => {
  if (quests.some((quest) => quest.id === nextQuest.id)) {
    return quests;
  }
  return [...quests, nextQuest];
};

const addItemToInventory = (
  inventory: (InventoryItem | null)[],
  setInventory: React.Dispatch<React.SetStateAction<(InventoryItem | null)[]>>,
  name: string,
  count: number
) => {
  const nextInventory = [...inventory];
  const existingSlot = nextInventory.findIndex((item) => item?.name === name);

  if (existingSlot !== -1 && nextInventory[existingSlot]) {
    nextInventory[existingSlot] = {
      ...nextInventory[existingSlot]!,
      count: nextInventory[existingSlot]!.count + count
    };
  } else {
    const emptySlot = nextInventory.findIndex((item) => item === null);
    if (emptySlot !== -1) {
      nextInventory[emptySlot] = { name, count };
    }
  }

  setInventory(nextInventory);
};

export function useQuestState(
  inventory: (InventoryItem | null)[],
  setCoins: React.Dispatch<React.SetStateAction<number>>,
  setInventory: React.Dispatch<React.SetStateAction<(InventoryItem | null)[]>>,
  setNotification: (msg: string) => void
) {
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [isQuestLogOpen, setIsQuestLogOpen] = useState(false);

  const toggleQuestLog = () => setIsQuestLogOpen((prev) => !prev);

  const ensureQuest = useCallback((quest: Quest, notification?: string) => {
    if (quests.some((entry) => entry.id === quest.id)) {
      return;
    }

    setQuests((prev) => {
      return [...prev, quest];
    });

    if (notification) {
      setNotification(notification);
    }
  }, [quests, setNotification]);

  const advanceQuestObjective = useCallback((questId: string, objectiveLabel: string, amount: number = 1) => {
    let completedTitle: string | null = null;

    setQuests((prev) => prev.map((quest) => {
      if (quest.id !== questId || quest.status !== 'active') {
        return quest;
      }

      let touched = false;
      const objectives = quest.objectives.map((objective) => {
        if (objective.label !== objectiveLabel) {
          return objective;
        }
        touched = true;
        return {
          ...objective,
          current: Math.min(objective.target, objective.current + amount)
        };
      });

      if (!touched) {
        return quest;
      }

      const isDone = objectives.every((objective) => objective.current >= objective.target);
      if (isDone) {
        completedTitle = quest.title;
        return { ...quest, objectives, status: 'completed' as QuestStatus };
      }

      return { ...quest, objectives };
    }));

    if (completedTitle) {
      setNotification(`Quest Completed: ${completedTitle}! (Open Log to Claim)`);
    }
  }, [setNotification]);

  const hasQuest = useCallback((questId: string) => quests.some((quest) => quest.id === questId), [quests]);
  const findQuest = useCallback((questId: string) => quests.find((quest) => quest.id === questId), [quests]);

  const handleTown2Interaction = useCallback((actorId: string) => {
    if (actorId === 'elder_mara') {
      if (!hasQuest(TOWN2_MESSAGE_QUEST.id)) {
        ensureQuest(TOWN2_MESSAGE_QUEST, 'New Quest: Message for the South Gate');
        return 'Elder Mara presses a sealed note into your hand. "Captain Bren must hear that the old graves are stirring again. Take this to the south gate before dusk."';
      }

      const messageQuest = findQuest(TOWN2_MESSAGE_QUEST.id);
      if (messageQuest?.status === 'completed' && !messageQuest.rewardClaimed) {
        return 'Elder Mara nods at the empty road. "Good. Bren is warned. Take your pay from the quest log when you have a moment."';
      }

      return 'Elder Mara watches the fountain. "This town was raised around a spring older than the walls. The stones by the graveyard remember every flood and every fire."';
    }

    if (actorId === 'captain_bren') {
      const messageQuest = findQuest(TOWN2_MESSAGE_QUEST.id);
      if (messageQuest?.status === 'active') {
        advanceQuestObjective(TOWN2_MESSAGE_QUEST.id, 'Speak to Captain Bren');
        ensureQuest(TOWN2_ARENA_QUEST, 'New Quest: Arena Trial');
        return 'Captain Bren reads the note, grimaces, and folds it into his belt. "Good. If you want to help more, prove yourself in the arena. Win a bout and I will know you are worth trusting with the walls."';
      }

      const arenaQuest = findQuest(TOWN2_ARENA_QUEST.id);
      if (arenaQuest?.status === 'completed' && !arenaQuest.rewardClaimed) {
        return 'Captain Bren gives you an approving nod. "You handled yourself well. Collect your reward from the quest log, then come back when you want harder work."';
      }

      return 'Captain Bren keeps one hand on his spear. "South gate stays open because we stay disciplined. The arena keeps the militia sharp when the roads go quiet."';
    }

    if (actorId === 'reeve_anya') {
      if (!hasQuest(TOWN2_SUPPLY_QUEST.id)) {
        ensureQuest(TOWN2_SUPPLY_QUEST, 'New Quest: Market Day Shortage');
        return 'Reeve Anya points at half-empty stalls. "We are short on fuel and lumber. Bring me wood and coal before the next caravan rolls in and I will make it worth your time."';
      }

      const supplyQuest = findQuest(TOWN2_SUPPLY_QUEST.id);
      if (supplyQuest?.status === 'completed' && !supplyQuest.rewardClaimed) {
        return 'Reeve Anya smiles at the stacked supplies. "That will keep the ovens, braziers, and bathhouse alive for a week. Your payment is waiting in the quest log."';
      }

      return 'Reeve Anya pats a crate of ledgers. "A town starves one missing cart at a time. Count your stores before you count your silver."';
    }

    if (actorId === 'smith_joric') {
      return 'Joric strikes the anvil in a steady rhythm. "Town lives or dies by iron and nails. The walls, the carts, the hinges, the arena gates. Every one of them comes through this forge."';
    }

    if (actorId === 'lina_child') {
      return 'Lina darts in a circle, then grins up at you. "If Captain Bren is shouting, it means the watchtower ladder squeaks again. We can hear it all the way to the market."';
    }

    if (actorId === 'toma_child') {
      return 'Toma skids to a stop long enough to whisper, "The chickens always win market day. They know exactly when grain spills from the feed sacks."';
    }

    if (actorId === 'villager_doran') {
      return 'Doran lowers his voice. "The ruin stones outside town are older than the chapel. People say the first wall was built from their rubble."';
    }

    if (actorId === 'villager_sella') {
      return 'Sella gestures toward the windmill. "That mill is the first thing caravans see. Means bread, feed, and a safe roof if they make the gate before dark."';
    }

    return null;
  }, [advanceQuestObjective, ensureQuest, findQuest, hasQuest]);

  const registerCombatVictory = useCallback(() => {
    advanceQuestObjective(TOWN2_ARENA_QUEST.id, 'Win an arena bout');
  }, [advanceQuestObjective]);

  const claimQuestReward = (questId: string) => {
    const quest = quests.find((entry) => entry.id === questId);
    if (!quest || quest.status !== 'completed' || quest.rewardClaimed) return;

    if (questId === '1') {
      setCoins((coins) => coins + 100);
      addItemToInventory(inventory, setInventory, 'Wood', 100);
      setNotification(`Claimed rewards for ${quest.title}!`);
      setQuests((prev) => upsertQuest(
        prev.map((entry) => entry.id === questId ? { ...entry, rewardClaimed: true } : entry),
        COAL_QUEST
      ));
      return;
    }

    if (questId === '2') {
      setCoins((coins) => coins + 500);
      addItemToInventory(inventory, setInventory, 'Steel Axe', 1);
      setNotification(`Claimed rewards for ${quest.title}! (+500 Gold, +Steel Axe)`);
      setQuests((prev) => prev.map((entry) => entry.id === questId ? { ...entry, rewardClaimed: true } : entry));
      return;
    }

    if (questId === TOWN2_MESSAGE_QUEST.id) {
      setCoins((coins) => coins + 80);
      setNotification(`Claimed rewards for ${quest.title}! (+80 Gold)`);
      setQuests((prev) => prev.map((entry) => entry.id === questId ? { ...entry, rewardClaimed: true } : entry));
      return;
    }

    if (questId === TOWN2_SUPPLY_QUEST.id) {
      setCoins((coins) => coins + 120);
      addItemToInventory(inventory, setInventory, 'Coal', 20);
      setNotification(`Claimed rewards for ${quest.title}! (+120 Gold, +20 Coal)`);
      setQuests((prev) => prev.map((entry) => entry.id === questId ? { ...entry, rewardClaimed: true } : entry));
      return;
    }

    if (questId === TOWN2_ARENA_QUEST.id) {
      setCoins((coins) => coins + 150);
      addItemToInventory(inventory, setInventory, 'Wood', 10);
      setNotification(`Claimed rewards for ${quest.title}! (+150 Gold, +10 Wood)`);
      setQuests((prev) => prev.map((entry) => entry.id === questId ? { ...entry, rewardClaimed: true } : entry));
    }
  };

  useEffect(() => {
    const totalWood = inventory.reduce((sum, item) => item?.name === 'Wood' ? sum + item.count : sum, 0);
    const totalCoal = inventory.reduce((sum, item) => item?.name === 'Coal' ? sum + item.count : sum, 0);

    setQuests((prev) => prev.map((quest) => {
      if (quest.status !== 'active') {
        return quest;
      }

      let objectives = quest.objectives;
      let changed = false;

      if (quest.id === '1' || quest.id === TOWN2_SUPPLY_QUEST.id) {
        const nextObjectives = objectives.map((objective) => (
          objective.label === 'Collect Wood'
            ? { ...objective, current: totalWood }
            : objective
        ));
        changed = changed || nextObjectives.some((objective, index) => objective.current !== objectives[index].current);
        objectives = nextObjectives;
      }

      if (quest.id === '2' || quest.id === TOWN2_SUPPLY_QUEST.id) {
        const nextObjectives = objectives.map((objective) => (
          objective.label === 'Create Coal'
            ? { ...objective, current: totalCoal }
            : objective
        ));
        changed = changed || nextObjectives.some((objective, index) => objective.current !== objectives[index].current);
        objectives = nextObjectives;
      }

      if (!changed) {
        return quest;
      }

      const isDone = objectives.every((objective) => objective.current >= objective.target);
      if (isDone) {
        setNotification(`Quest Completed: ${quest.title}! (Open Log to Claim)`);
        return { ...quest, objectives, status: 'completed' as QuestStatus };
      }

      return { ...quest, objectives };
    }));
  }, [inventory, setNotification]);

  return {
    quests,
    setQuests,
    isQuestLogOpen,
    setIsQuestLogOpen,
    toggleQuestLog,
    claimQuestReward,
    handleTown2Interaction,
    registerCombatVictory,
    ensureQuest
  };
}
