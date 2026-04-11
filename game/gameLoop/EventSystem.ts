import { EventChoice, EventDefinition } from './types';

const DEFAULT_EVENTS: EventDefinition[] = [
    {
        id: 'occult_altar',
        description: 'You find an eerie altar humming with strange energy.',
        choices: [
            {
                id: 'read_tome',
                text: 'Read the nearby tome',
                outcome: { stressDelta: 10, reward: { heirlooms: 1 } },
            },
            {
                id: 'smash_altar',
                text: 'Destroy the altar',
                outcome: { stressDelta: 5, reward: { gold: 35 } },
            },
            {
                id: 'leave',
                text: 'Leave it alone',
                outcome: {},
            },
        ],
    },
];

export class EventSystem {
    private readonly events: EventDefinition[];

    constructor(events: EventDefinition[] = DEFAULT_EVENTS) {
        this.events = events;
    }

    public getEventById(eventId: string): EventDefinition | undefined {
        return this.events.find((eventDef) => eventDef.id === eventId);
    }

    public rollEvent(): EventDefinition | undefined {
        if (this.events.length === 0) return undefined;
        const idx = Math.floor(Math.random() * this.events.length);
        return this.events[idx];
    }

    public resolveChoice(eventDef: EventDefinition, choiceId: string): EventChoice | undefined {
        return eventDef.choices.find((choice) => choice.id === choiceId);
    }
}
