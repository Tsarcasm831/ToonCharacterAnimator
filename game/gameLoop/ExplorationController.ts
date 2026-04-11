import { DungeonLayout, DungeonRoom } from './types';

export class ExplorationController {
    private activeDungeon: DungeonLayout | null = null;
    private currentRoomId: string | null = null;

    public beginDungeon(dungeon: DungeonLayout): void {
        this.activeDungeon = dungeon;
        this.currentRoomId = dungeon.startRoomId;
        const startRoom = this.getCurrentRoom();
        if (startRoom) {
            startRoom.visited = true;
        }
    }

    public getCurrentRoom(): DungeonRoom | undefined {
        if (!this.activeDungeon || !this.currentRoomId) return undefined;
        return this.activeDungeon.rooms.find((room) => room.id === this.currentRoomId);
    }

    public getReachableRooms(): DungeonRoom[] {
        const currentRoom = this.getCurrentRoom();
        if (!currentRoom || !this.activeDungeon) return [];

        return currentRoom.connectedRoomIds
            .map((roomId) => this.activeDungeon?.rooms.find((room) => room.id === roomId))
            .filter((room): room is DungeonRoom => Boolean(room));
    }

    public moveToRoom(roomId: string): DungeonRoom | undefined {
        const reachableRooms = this.getReachableRooms();
        const targetRoom = reachableRooms.find((room) => room.id === roomId);
        if (!targetRoom) return undefined;

        this.currentRoomId = targetRoom.id;
        targetRoom.visited = true;
        return targetRoom;
    }

    public endDungeon(): void {
        this.activeDungeon = null;
        this.currentRoomId = null;
    }
}
