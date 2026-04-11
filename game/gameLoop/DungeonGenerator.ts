import { DungeonLayout, DungeonRoom, DungeonRoomType, MissionDefinition } from './types';

export class DungeonGenerator {
    public generate(mission: MissionDefinition, seed: number): DungeonLayout {
        const rooms: DungeonRoom[] = [];
        const roomCount = mission.difficulty >= 2 ? 8 : 6;

        for (let i = 0; i < roomCount; i += 1) {
            const type = this.getRoomTypeForIndex(i, roomCount);
            const roomId = `room_${seed}_${i}`;
            rooms.push({
                id: roomId,
                type,
                visited: false,
                depth: i,
                connectedRoomIds: [],
            });
        }

        for (let i = 0; i < rooms.length - 1; i += 1) {
            const current = rooms[i];
            const next = rooms[i + 1];
            current.connectedRoomIds.push(next.id);
            next.connectedRoomIds.push(current.id);
        }

        return {
            id: `dungeon_${seed}_${mission.id}`,
            theme: mission.dungeonTheme,
            rooms,
            startRoomId: rooms[0].id,
            bossRoomId: rooms[rooms.length - 1].id,
        };
    }

    private getRoomTypeForIndex(index: number, roomCount: number): DungeonRoomType {
        if (index === 0) return 'start';
        if (index === roomCount - 1) return 'boss';

        const weightedCycle: DungeonRoomType[] = ['combat', 'combat', 'event', 'treasure', 'trap', 'camp'];
        return weightedCycle[index % weightedCycle.length];
    }
}
