export interface Dimensions {
    width: number;
    depth: number;
    height: number;
}

export interface Container {
    _id?: string;
    container_id: string;
    zone: string;
    dimensions: Dimensions;
    occupied_volume: number;
}

export interface ContainerCreate {
    container_id: string;
    zone: string;
    width: number;
    depth: number;
    height: number;
}