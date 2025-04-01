import { Dimensions } from './Container';

export interface Position {
    start_coordinates: Dimensions;
    end_coordinates: Dimensions;
}

export interface Item {
    _id?: string;
    item_id: string;
    name: string;
    dimensions: Dimensions;
    mass: number;
    priority: number;
    expiry_date?: string;
    usage_limit: number;
    usage_count: number;
    preferred_zone: string;
    is_waste: boolean;
    waste_reason?: string;
    container_id?: string;
    position?: Position;
}

export interface ItemCreate {
    item_id: string;
    name: string;
    width: number;
    depth: number;
    height: number;
    mass: number;
    priority: number;
    expiry_date?: string;
    usage_limit: number;
    preferred_zone: string;
}