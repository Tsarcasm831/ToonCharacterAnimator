import { AfflictionSystem } from './AfflictionSystem';
import { DungeonGenerator } from './DungeonGenerator';
import { EconomySystem } from './EconomySystem';
import { EventSystem } from './EventSystem';
import { ExplorationController } from './ExplorationController';
import { MissionSystem } from './MissionSystem';
import { RosterManager } from './RosterManager';
import { StressSystem } from './StressSystem';
import { TownSystem } from './TownSystem';
import { ActiveMission, GameLoopPhase, Hero, MissionDefinition, Resources, RunState } from './types';

export class GameLoopManager {
    private readonly rosterManager: RosterManager;
    private readonly economySystem: EconomySystem;
    private readonly stressSystem: StressSystem;
    private readonly afflictionSystem: AfflictionSystem;
    private readonly missionSystem: MissionSystem;
    private readonly dungeonGenerator: DungeonGenerator;
    private readonly explorationController: ExplorationController;
    private readonly eventSystem: EventSystem;
    private readonly townSystem: TownSystem;

    private runState: RunState;

    constructor(seed: number = Date.now()) {
        const resources: Resources = { gold: 500, heirlooms: 0, supplyChests: 0 };

        this.rosterManager = new RosterManager();
        this.economySystem = new EconomySystem(resources);
        this.stressSystem = new StressSystem();
        this.afflictionSystem = new AfflictionSystem();
        this.missionSystem = new MissionSystem();
        this.dungeonGenerator = new DungeonGenerator();
        this.explorationController = new ExplorationController();
        this.eventSystem = new EventSystem();
        this.townSystem = new TownSystem(this.rosterManager, this.economySystem, this.stressSystem);

        this.runState = {
            seed,
            day: 1,
            difficulty: 1,
            phase: 'town',
            resources,
            roster: [],
            partyHeroIds: [],
            missionPool: this.missionSystem.createDefaultMissionPool(),
        };
    }

    public update(_dt: number): void {
        this.runState.resources = this.economySystem.getResources();
        this.runState.roster = this.rosterManager.getRoster();
    }

    public getRunState(): RunState {
        return this.runState;
    }

    public setPhase(phase: GameLoopPhase): void {
        this.runState.phase = phase;
    }

    public addStartingHero(hero: Hero): void {
        this.rosterManager.recruit(hero);
    }

    public selectParty(heroIds: string[]): void {
        this.runState.partyHeroIds = [...heroIds];
    }

    public startMission(mission: MissionDefinition): ActiveMission {
        const dungeon = this.dungeonGenerator.generate(mission, this.runState.seed + this.runState.day);
        this.explorationController.beginDungeon(dungeon);

        const activeMission: ActiveMission = {
            mission,
            dungeon,
            completed: false,
        };

        this.runState.activeMission = activeMission;
        this.runState.phase = 'dungeonExploration';
        return activeMission;
    }

    public completeActiveMission(reward: Resources): void {
        if (!this.runState.activeMission) return;

        this.runState.activeMission.completed = true;
        this.economySystem.add(reward);
        this.explorationController.endDungeon();

        this.runState.phase = 'expeditionRewards';
        this.runState.day += 1;
    }

    public processResolveCheck(heroId: string): void {
        const hero = this.rosterManager.getHero(heroId);
        if (!hero) return;

        this.afflictionSystem.resolveTest(hero);
    }

    public getTownSystem(): TownSystem {
        return this.townSystem;
    }

    public getEventSystem(): EventSystem {
        return this.eventSystem;
    }
}
