import api from './api';
import { Item, ItemCreate } from '../types/Item';

export const getItems = async (): Promise<Item[]> => {
    const response = await api.get('/items');
    return response.data;
};

export const createItem = async (item: ItemCreate): Promise<Item> => {
    const response = await api.post('/items', item);
    return response.data;
};

export const importItems = async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/import/items', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};