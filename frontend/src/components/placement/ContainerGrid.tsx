import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    ListItemButton,
    ListItemText,
    Tooltip,
    LinearProgress,
    Divider,
    Grid as MuiGrid,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material';
import { Container } from '../../types/Container';

// normal "GridItem", "GridContainer" was not working
// FIX: Create wrapper components for Grid to fix the TypeScript errors
const GridContainer = (props: any) => <MuiGrid container {...props} />;
const GridItem = (props: any) => <MuiGrid {...props} />;

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
    const [selectedZone, setSelectedZone] = useState<string>('');
    const [containersByZone, setContainersByZone] = useState<Record<string, Container[]>>({});

    useEffect(() => {
        //Group containers by zone
        const groupedContainers = containers.reduce<Record<string, Container[]>>((acc, container) => {
            const zone = container.zone;
            if (!acc[zone]) {
                acc[zone] = [];
            }
            acc[zone].push(container);
            return acc;
        }, {});

        setContainersByZone(groupedContainers);

        // Set default zone to the one with the most utilized space
        const mostUtilizedZone = Object.keys(groupedContainers).reduce((prev, curr) => {
            const prevUtilization = calculateZoneUtilization(groupedContainers[prev]);
            const currUtilization = calculateZoneUtilization(groupedContainers[curr]);
            return currUtilization > prevUtilization ? curr : prev;
        }, Object.keys(groupedContainers)[0]);

        setSelectedZone(mostUtilizedZone);
    }, [containers]);

    //calculate utilization percentage for a container
    const calculateUtilization = (container: Container) => {
        const totalVolume = container.dimensions.width *
            container.dimensions.height *
            container.dimensions.depth;
        return (container.occupied_volume / totalVolume) * 100;
    };

    const calculateZoneUtilization = (zoneContainers: Container[]) => {
        const totalVolume = zoneContainers.reduce((acc, container) => {
            return acc + (container.dimensions.width * container.dimensions.height * container.dimensions.depth);
        }, 0);
        const occupiedVolume = zoneContainers.reduce((acc, container) => {
            return acc + container.occupied_volume;
        }, 0);
        return (occupiedVolume / totalVolume) * 100;
    };

    const handleZoneChange = (event: SelectChangeEvent<string>) => {
        setSelectedZone(event.target.value);
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="zone-select-label">Select Zone</InputLabel>
                <Select
                    labelId="zone-select-label"
                    value={selectedZone}
                    onChange={handleZoneChange}
                >
                    {Object.keys(containersByZone).map((zone) => (
                        <MenuItem key={zone} value={zone}>
                            {zone}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {Object.keys(containersByZone).length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ p: 2 }}>
                    No containers available. Add containers to begin placement.
                </Typography>
            ) : (
                <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: 'primary.main' }}>
                        {selectedZone}
                    </Typography>
                    <Divider sx={{ mb: 1 }} />
                    <GridContainer spacing={1} direction="column">
                        {containersByZone[selectedZone]?.map((container) => {
                            const utilization = calculateUtilization(container);
                            const isSelected = selectedContainer?.container_id === container.container_id;

                            return (
                                <GridItem xs={12} key={container.container_id}>
                                    <Paper
                                        elevation={isSelected ? 3 : 1}
                                        sx={{
                                            border: isSelected ? '2px solid' : '1px solid',
                                            borderColor: isSelected ? 'primary.main' : 'divider',
                                            borderRadius: 1,
                                            transition: 'all 0.2s',
                                            padding: 0.5,
                                            mb: 1
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
                                </GridItem>
                            );
                        })}
                    </GridContainer>
                </Box>
            )}
        </Box>
    );
};

export default ContainerGrid;