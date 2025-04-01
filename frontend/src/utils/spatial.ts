import { Dimensions } from '../types/Container';
import { PlacementPosition } from '../types/Placement';

// Check if two placement positions overlap
export const doPositionsOverlap = (pos1: PlacementPosition, pos2: PlacementPosition): boolean => {
    // Check for overlap in all three dimensions
    const overlapX =
        pos1.startCoordinates.width < pos2.endCoordinates.width &&
        pos1.endCoordinates.width > pos2.startCoordinates.width;

    const overlapY =
        pos1.startCoordinates.height < pos2.endCoordinates.height &&
        pos1.endCoordinates.height > pos2.startCoordinates.height;

    const overlapZ =
        pos1.startCoordinates.depth < pos2.endCoordinates.depth &&
        pos1.endCoordinates.depth > pos2.startCoordinates.depth;

    return overlapX && overlapY && overlapZ;
};

// Calculate volume of a 3D shape
export const calculateVolume = (dimensions: Dimensions): number => {
    return dimensions.width * dimensions.height * dimensions.depth;
};

// Calculate volume from a position
export const calculatePositionVolume = (position: PlacementPosition): number => {
    const width = position.endCoordinates.width - position.startCoordinates.width;
    const height = position.endCoordinates.height - position.startCoordinates.height;
    const depth = position.endCoordinates.depth - position.startCoordinates.depth;
    return width * height * depth;
};

// Check if position fits within container dimensions
export const positionFitsContainer = (
    position: PlacementPosition,
    containerDimensions: Dimensions
): boolean => {
    return (
        position.startCoordinates.width >= 0 &&
        position.startCoordinates.height >= 0 &&
        position.startCoordinates.depth >= 0 &&
        position.endCoordinates.width <= containerDimensions.width &&
        position.endCoordinates.height <= containerDimensions.height &&
        position.endCoordinates.depth <= containerDimensions.depth
    );
};

// Get position from item dimensions and start coordinates
export const getPositionFromDimensions = (
    startCoordinates: Coordinates,
    dimensions: Dimensions
): PlacementPosition => {
    return {
        startCoordinates,
        endCoordinates: {
            width: startCoordinates.width + dimensions.width,
            height: startCoordinates.height + dimensions.height,
            depth: startCoordinates.depth + dimensions.depth
        }
    };
};

// Interface to work with the function above
interface Coordinates {
    width: number;
    height: number;
    depth: number;
}