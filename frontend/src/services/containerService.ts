import api from './api';
import { Container, ContainerCreate } from '../types/Container';

export const getContainers = async (): Promise<Container[]> => {
    const response = await api.get('/containers');
    return response.data;
};

export const createContainer = async (container: ContainerCreate): Promise<Container> => {
    const response = await api.post('/containers', container);
    return response.data;
};

export const importContainers = async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/import/containers', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};