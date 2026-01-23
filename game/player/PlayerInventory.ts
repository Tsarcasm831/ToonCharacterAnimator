import { InventoryItem } from '../../types';

export class PlayerInventory {
    items: (InventoryItem | null)[];
    capacity: number;
    isDirty: boolean = false;

    constructor(initialItems?: (InventoryItem | null)[], capacity: number = 60) {
        this.capacity = capacity;
        if (initialItems) {
            // Ensure array matches capacity
            this.items = [...initialItems, ...Array(Math.max(0, capacity - initialItems.length)).fill(null)];
            this.isDirty = true;
        } else {
            this.items = Array(capacity).fill(null);
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
        for (let i = startIndex; i < this.capacity; i++) {
            if (this.items[i] === null) {
                this.items[i] = { name: itemName, count };
                this.isDirty = true;
                return true;
            }
        }

        return false;
    }

    setItems(items: (InventoryItem | null)[]) {
        // Simple deep comparison optimization
        if (JSON.stringify(this.items) !== JSON.stringify(items)) {
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