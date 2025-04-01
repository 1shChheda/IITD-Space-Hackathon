import React from 'react';
import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Tooltip,
    LinearProgress,
    Divider
} from '@mui/material';
import { Container } from '../../types/Container';

interface ContainerGridProps {
    containers: Container[];
    selectedContainer: Container | null;
    onContainerSelect: (container: Container) => void;
}

const ContainerGrid: React.FC<ContainerGridProps> = ({
    containers,
    selectedContainer,
    onContainerSelect
}) => {
    //Group containers by zone
    const containersByZone = containers.reduce<Record<string, Container[]>>((acc, container) => {
        const zone = container.zone;
        if (!acc[zone]) {
            acc[zone] = [];
        }
        acc[zone].push(container);
        return acc;
    }, {});

    //calculate utilization percentage for a container
    const calculateUtilization = (container: Container) => {
        const totalVolume = container.dimensions.width *
            container.dimensions.height *
            container.dimensions.depth;
        return (container.occupied_volume / totalVolume) * 100;
    };

    return (
        <Box>
            {Object.keys(containersByZone).length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ p: 2 }}>
                    No containers available. Add containers to begin placement.
                </Typography>
            ) : (
                Object.entries(containersByZone).map(([zone, zoneContainers]) => (
                    <Box key={zone} sx={{ mb: 3 }}>
                        <Typography
                            variant="subtitle1"
                            fontWeight="bold"
                            sx={{ mb: 1, color: 'primary.main' }}
                        >
                            {zone}
                        </Typography>
                        <Divider sx={{ mb: 1 }} />
                        <List disablePadding dense>
                            {zoneContainers.map((container) => {
                                const utilization = calculateUtilization(container);
                                const isSelected = selectedContainer?.container_id === container.container_id;

                                return (
                                    <Paper
                                        key={container.container_id}
                                        elevation={isSelected ? 3 : 1}
                                        sx={{
                                            mb: 1,
                                            border: isSelected ? '2px solid' : '1px solid',
                                            borderColor: isSelected ? 'primary.main' : 'divider',
                                            borderRadius: 1,
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <ListItemButton
                                            selected={isSelected}
                                            onClick={() => onContainerSelect(container)}
                                            sx={{
                                                borderRadius: 1,
                                                '&.Mui-selected': {
                                                    backgroundColor: 'primary.light',
                                                    '&:hover': {
                                                        backgroundColor: 'primary.light',
                                                    }
                                                }
                                            }}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Typography variant="body1" fontWeight={isSelected ? 'bold' : 'normal'}>
                                                        {container.container_id}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Box sx={{ mt: 1 }}>
                                                        <Typography variant="caption" display="block">
                                                            {container.dimensions.width} × {container.dimensions.depth} × {container.dimensions.height} cm
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                                            <Tooltip title={`${utilization.toFixed(1)}% full`}>
                                                                <LinearProgress
                                                                    variant="determinate"
                                                                    value={utilization}
                                                                    sx={{
                                                                        height: 8,
                                                                        borderRadius: 1,
                                                                        flexGrow: 1,
                                                                        backgroundColor: 'grey.300',
                                                                        '& .MuiLinearProgress-bar': {
                                                                            backgroundColor: utilization > 85 ? 'error.main' :
                                                                                utilization > 65 ? 'warning.main' : 'success.main',
                                                                        }
                                                                    }}
                                                                />
                                                            </Tooltip>
                                                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1, minWidth: '40px' }}>
                                                                {utilization.toFixed(0)}%
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                }
                                            />
                                        </ListItemButton>
                                    </Paper>
                                );
                            })}
                        </List>
                    </Box>
                ))
            )}
        </Box>
    );
};

export default ContainerGrid;