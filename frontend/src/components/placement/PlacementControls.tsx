import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Divider,
    FormControlLabel,
    Switch,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Autocomplete,
    Chip,
    CircularProgress,
    Alert,
    AlertTitle,
    Stack,
    Paper,
    Grid as MuiGrid
} from '@mui/material';
import {
    PlayArrow,
    Refresh,
    Settings,
    Science,
    SettingsBackupRestore
} from '@mui/icons-material';
import { Item } from '../../types/Item';

// normal "GridItem", "GridContainer" was not working
// FIX: Create wrapper components for Grid to fix the TypeScript errors
const GridContainer = (props: any) => <MuiGrid container {...props} />;
const GridItem = (props: any) => <MuiGrid {...props} />;

interface PlacementControlsProps {
    items: Item[];
    onRunPlacement: (selectedItemIds: string[], automatedPlacement: boolean) => void;
    simulationMode: boolean;
    onSimulationToggle: (enabled: boolean) => void;
}

const PlacementControls: React.FC<PlacementControlsProps> = ({
    items,
    onRunPlacement,
    simulationMode,
    onSimulationToggle
}) => {
    const [selectedItems, setSelectedItems] = useState<Item[]>([]);
    const [automatedPlacement, setAutomatedPlacement] = useState<boolean>(true);
    const [placementStrategy, setPlacementStrategy] = useState<string>("priority");
    const [loading, setLoading] = useState<boolean>(false);

    const handleRunPlacement = () => {
        setLoading(true);
        const itemIds = selectedItems.map(item => item.item_id);
        onRunPlacement(itemIds, automatedPlacement);
        setTimeout(() => setLoading(false), 1000); // To show loading state briefly
    };

    const handleSimulationToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
        onSimulationToggle(event.target.checked);
    };

    const handleSelectAllItems = () => {
        setSelectedItems([...items]);
    };

    const handleClearSelectedItems = () => {
        setSelectedItems([]);
    };

    const handleSelectHighPriorityItems = () => {
        const highPriorityItems = items.filter(item => item.priority >= 70);
        setSelectedItems(highPriorityItems);
    };

    return (
        <GridContainer spacing={3}>
            {/* Left Column - Item Selection */}
            <GridItem xs={12} md={6}>
                <Box>
                    <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                        Select Items to Place
                    </Typography>

                    <Autocomplete
                        multiple
                        id="items-selection"
                        options={items}
                        value={selectedItems}
                        onChange={(event, newValue) => {
                            setSelectedItems(newValue);
                        }}
                        getOptionLabel={(option) => `${option.item_id} - ${option.name}`}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="outlined"
                                label="Select Items"
                                placeholder="Start typing..."
                                fullWidth
                            />
                        )}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => {
                                const tagProps = getTagProps({ index });
                                const { key, ...chipProps } = tagProps;
                                return (
                                    <Chip
                                        key={key}
                                        label={option.item_id}
                                        {...chipProps}
                                        size="small"
                                    />
                                );
                            })
                        }
                        sx={{ mb: 2 }}
                    />

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={handleSelectAllItems}
                        >
                            Select All
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={handleClearSelectedItems}
                        >
                            Clear
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={handleSelectHighPriorityItems}
                        >
                            High Priority
                        </Button>
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                        {selectedItems.length} of {items.length} items selected
                    </Typography>
                </Box>
            </GridItem>

            {/* Right Column - Settings and Run Controls */}
            <GridItem xs={12} md={6}>
                <GridContainer spacing={2}>
                    {/* Simulation Mode Toggle */}
                    <GridItem xs={12}>
                        <Box sx={{ mb: 2 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={simulationMode}
                                        onChange={handleSimulationToggle}
                                        color="warning"
                                    />
                                }
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Science fontSize="small" sx={{ mr: 0.5 }} />
                                        <Typography variant="body2">Simulation Mode</Typography>
                                    </Box>
                                }
                            />

                            {simulationMode && (
                                <Alert severity="info" sx={{ mt: 1 }}>
                                    <AlertTitle>Simulation Mode Active</AlertTitle>
                                    Changes won't be applied to the actual containers
                                </Alert>
                            )}
                        </Box>
                    </GridItem>

                    {/* Placement Strategy */}
                    <GridItem xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel id="placement-strategy-label">Strategy</InputLabel>
                            <Select
                                labelId="placement-strategy-label"
                                id="placement-strategy"
                                value={placementStrategy}
                                label="Strategy"
                                onChange={(e) => setPlacementStrategy(e.target.value)}
                            >
                                <MenuItem value="priority">Priority Based (Default)</MenuItem>
                                <MenuItem value="first-fit">First Fit</MenuItem>
                                <MenuItem value="best-fit">Best Fit</MenuItem>
                                <MenuItem value="zone-priority">Zone Priority</MenuItem>
                            </Select>
                        </FormControl>
                    </GridItem>

                    {/* Auto Placement Toggle */}
                    <GridItem xs={12} sm={6}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={automatedPlacement}
                                    onChange={(e) => setAutomatedPlacement(e.target.checked)}
                                    color="primary"
                                />
                            }
                            label="Use automated placement"
                        />
                    </GridItem>

                    {/* Run Buttons */}
                    <GridItem xs={12} sm={6}>
                        <Button
                            fullWidth
                            variant="contained"
                            color={simulationMode ? "warning" : "primary"}
                            size="large"
                            startIcon={simulationMode ? <Science /> : <PlayArrow />}
                            onClick={handleRunPlacement}
                            disabled={selectedItems.length === 0 || loading}
                        >
                            {loading ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                simulationMode ? "Run Simulation" : "Run Placement"
                            )}
                        </Button>
                    </GridItem>

                    {/* Optimize Button */}
                    <GridItem xs={12} sm={6}>
                        {!simulationMode && (
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<SettingsBackupRestore />}
                                disabled={selectedItems.length === 0 || loading}
                            >
                                Optimize Existing
                            </Button>
                        )}
                    </GridItem>
                </GridContainer>
            </GridItem>
        </GridContainer>
    );
};

export default PlacementControls;