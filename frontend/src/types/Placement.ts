export interface Coordinates {
    width: number;
    depth: number;
    height: number;
}

export interface PlacementPosition {
    startCoordinates: Coordinates;
    endCoordinates: Coordinates;
}

export interface Placement {
    itemId: string;
    containerId: string;
    position: PlacementPosition;
}

export interface PlacementResult {
    success: boolean;
    placements: Placement[];
    rearrangements: any[];
    unplaced_items: string[];
}

export interface PlacementRequest {
    items: any[];
    containers: any[];
}

export interface PlacementSuggestion {
    success: boolean;
    suggestion?: {
        itemId: string;
        containerId: string;
        containerZone: string;
        position: PlacementPosition;
        isPreferedZone: boolean;
    };
    message?: string;
}