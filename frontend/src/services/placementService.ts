import api from './api';
import { PlacementRequest, PlacementResult, PlacementSuggestion } from '../types/Placement';

export const getPlacementSuggestion = async (itemId: string): Promise<PlacementSuggestion> => {
    const response = await api.get(`/placement/suggestion/${itemId}`);
    return response.data;
};

export const placeItems = async (request: PlacementRequest): Promise<PlacementResult> => {
    const response = await api.post('/placement', request);
    return response.data;
};

export const simulatePlacement = async (request: PlacementRequest): Promise<PlacementResult> => {
    const response = await api.post('/placement/simulate', request);
    return response.data;
};

export const placeItem = async (
    itemId: string,
    containerId: string,
    position: any,
    userId: string = 'user1'
): Promise<any> => {
    const request = {
        itemId,
        userId,
        timestamp: new Date().toISOString(),
        containerId,
        position
    };

    const response = await api.post('/place', request);
    return response.data;
};

export const getStats = async (): Promise<any> => {
    const response = await api.get('/stats');
    return response.data;
};