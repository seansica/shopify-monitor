export enum EventTypes {
    Available_to_Not_Available,
    Not_Available_to_Available,
    Quantity_Changed,
    New_Inventory,
    False_Positive,
    Status_Update,
    Item_Removed
}

export interface InventoryItem {
    title: string;
    quantity: number;
    available: boolean;
    site: string;
}

export interface NotificationEvent {
    eventType: EventTypes
    inventoryItemBeforeChange?: InventoryItem;
    inventoryItemAfterChange?: InventoryItem;
    inventoryItems?: InventoryItem[];
}
