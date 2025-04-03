import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Alert, CircularProgress, Grid as MuiGrid, Divider } from '@mui/material';
import ContainerGrid from './ContainerGrid';
import ItemPlacement from './ItemPlacement';
import PlacementControls from './PlacementControls';
import { getContainers } from '../../services/containerService';
import { getItems } from '../../services/itemService';
import { Container } from '../../types/Container';
import { Item } from '../../types/Item';
import { PlacementResult } from '../../types/Placement';
import { placeItems, simulatePlacement } from '../../services/placementService';

// normal "Grid item", "Grid container" was not working
// FIX: Create wrapper components for Grid to fix the TypeScript errors
const GridContainer = (props: any) => <MuiGrid container {...props} />;
const GridItem = (props: any) => <MuiGrid {...props} />;

const PlacementView: React.FC = () => {
    const [containers, setContainers] = useState<Container[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [placementResult, setPlacementResult] = useState<PlacementResult | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [simulationMode, setSimulationMode] = useState<boolean>(false);

    // Fetch initial data
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [containersData, itemsData] = await Promise.all([
                getContainers(),
                getItems()
            ]);
            setContainers(containersData);
            setItems(itemsData);

            // Select first container by default if available
            if (containersData.length > 0 && !selectedContainer) {
                setSelectedContainer(containersData[0]);
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
            setError('Failed to load containers and items. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleContainerSelect = (container: Container) => {
        setSelectedContainer(container);
    };

    const handleItemSelect = (item: Item) => {
        setSelectedItem(item);
    };

    const handleRunPlacement = async (selectedItemIds: string[], automatedPlacement: boolean) => {
        if (selectedItemIds.length === 0) {
            setError('Please select at least one item to place');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            //filter selected items
            const itemsToPlace = items.filter(item => selectedItemIds.includes(item.item_id));

            // Format item data according to what the API expects
            const formattedItems = itemsToPlace.map(item => ({
                itemId: item.item_id,
                name: item.name,
                width: item.dimensions.width,
                depth: item.dimensions.depth,
                height: item.dimensions.height,
                mass: item.mass,
                priority: item.priority,
                expiryDate: item.expiry_date,
                usageLimit: item.usage_limit,
                preferredZone: item.preferred_zone
            }));

            // Format container data
            const formattedContainers = containers.map(container => ({
                containerId: container.container_id,
                zone: container.zone,
                width: container.dimensions.width,
                depth: container.dimensions.depth,
                height: container.dimensions.height
            }));

            // Create placement request
            const request = {
                items: formattedItems,
                containers: formattedContainers
            };

            //call the appropriate API based on simulation mode
            const result = simulationMode
                ? await simulatePlacement(request)
                : await placeItems(request);

            setPlacementResult(result);

            //If not in simulation mode, refresh data to show updated placements
            if (!simulationMode) {
                fetchData();
            }
        } catch (err) {
            console.error('Placement operation failed:', err);
            setError('Failed to execute placement operation. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSimulationToggle = (enabled: boolean) => {
        setSimulationMode(enabled);
        //Clear previous results when toggling simulation mode
        setPlacementResult(null);
    };

    const getPlacedItems = () => {
        if (!selectedContainer) return [];
        return items.filter(item => item.container_id === selectedContainer.container_id);
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Item Placement
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            <GridContainer spacing={3}>
                {/* Left side - Container selection*/}
                <GridItem xs={12} md={4} lg={3}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            Containers
                        </Typography>
                        <ContainerGrid
                            containers={containers}
                            selectedContainer={selectedContainer}
                            onContainerSelect={handleContainerSelect}
                        />
                    </Paper>
                </GridItem>

                {/* Middle - Container Visualization*/}
                <GridItem xs={12} md={8} lg={9}>
                    <Paper sx={{ p: 2 }}>
                        {selectedContainer ? (
                            <Box>
                                <Typography variant="h6" gutterBottom>
                                    Container View
                                </Typography>
                                <Box sx={{ height: '650px', width: '100%' }}>
                                    {/* Dynamic import for ContainerVisualizer to avoid issues with Three.js SSR */}
                                    <React.Suspense fallback={<CircularProgress />}>
                                        {React.createElement(
                                            React.lazy(() => import('./ContainerVisualizer')),
                                            {
                                                container: selectedContainer,
                                                placedItems: getPlacedItems(),
                                                selectedItem: selectedItem,
                                                onRefresh: fetchData
                                            }
                                        )}
                                    </React.Suspense>
                                </Box>
                            </Box>
                        ) : (
                            <Typography variant="body1" color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
                                Select a container to view its contents
                            </Typography>
                        )}
                    </Paper>
                </GridItem>

                {/* Bottom section - Items and placement controls */}
                <GridItem xs={12}>
                    <Paper sx={{ p: 0 }}>
                        {/* Item Placement Section */}
                        <Box sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Available Items
                            </Typography>
                            <ItemPlacement
                                items={items}
                                selectedItem={selectedItem}
                                onItemSelect={handleItemSelect}
                                placementResult={placementResult}
                            />
                        </Box>

                        <Divider />

                        {/* Placement Controls Section */}
                        <Box sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Placement Controls
                            </Typography>
                            {/* Redesigned PlacementControls with horizontal layout */}
                            <PlacementControls
                                items={items.filter(item => !item.container_id)}
                                onRunPlacement={handleRunPlacement}
                                simulationMode={simulationMode}
                                onSimulationToggle={handleSimulationToggle}
                            />
                        </Box>
                    </Paper>
                </GridItem>
            </GridContainer>
        </Box>
    );
};

export default PlacementView;