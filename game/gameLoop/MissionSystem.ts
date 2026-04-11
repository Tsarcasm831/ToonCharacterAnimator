import { MissionDefinition, MissionObjectiveType, Reward } from './types';

export class MissionSystem {
    private missionPool: MissionDefinition[] = [];

    public createDefaultMissionPool(): MissionDefinition[] {
        this.missionPool = [
            this.buildMission('mission_ruins_explore', 'Scout the Ruins', 'ruins', 'explore', 1, { gold: 120, heirlooms: 2 }),
            this.buildMission('mission_warrens_boss', 'Cull the Alpha', 'warrens', 'eliminateBoss', 2, { gold: 220, heirlooms: 4, supplyChests: 1 }),
            this.buildMission('mission_weald_relic', 'Recover the Relic', 'weald', 'collectRelic', 2, { gold: 180, heirlooms: 3, supplyChests: 1 }),
        ];

        return this.missionPool;
    }

    public getMissionPool(): MissionDefinition[] {
        return this.missionPool;
    }

    private buildMission(
        id: string,
        title: string,
        dungeonTheme: string,
        objective: MissionObjectiveType,
        difficulty: number,
        expectedRewards: Reward,
    ): MissionDefinition {
        return {
            id,
            title,
            dungeonTheme,
            objective,
            difficulty,
            expectedRewards,
        };
    }
}
