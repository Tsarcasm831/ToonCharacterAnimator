
import { InventoryItem } from '../../types';

export class PlayerInventory {
    items: (InventoryItem | null)[] = Array(32).fill(null);
    capacity: number = 32;
    isDirty: boolean = false;

    constructor(initialItems?: (InventoryItem | null)[]) {
        if (initialItems) {
            this.items = [...initialItems, ...Array(Math.max(0, this.capacity - initialItems.length)).fill(null)];
            this.isDirty = true;
        }
    }

    addItem(itemName: string, count: number = 1, skipHotbar: boolean = false): boolean {
        const startIndex = skipHotbar ? 8 : 0;
        
        // 1. Try to stack
        for (let i = startIndex; i < this.capacity; i++) {
            const slot = this.items[i];
            if (slot && slot.name === itemName) {
                slot.count += count;
                this.isDirty = true;
                return true;
            }
        }

        // 2. Find first empty slot
        const emptySlot = this.items.findIndex((s, i) => i >= startIndex && s === null);
        if (emptySlot === -1) return false;

        this.items[emptySlot] = { name: itemName, count };
        this.isDirty = true;
        return true;
    }

    setItems(items: (InventoryItem | null)[]) {
        // Simple comparison to prevent redundant updates
        const currentHash = JSON.stringify(this.items);
        const nextHash = JSON.stringify(items);
        if (currentHash !== nextHash) {
            this.items = [...items];
            this.isDirty = true;
        }
    }
    
    removeItem(index: number, count: number = 1) {
        const item = this.items[index];
        if (!item) return;
        
        item.count -= count;
        if (item.count <= 0) {
            this.items[index] = null;
        }
        this.isDirty = true;
    }
}
