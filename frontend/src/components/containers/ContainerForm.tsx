import React, { useState } from 'react';
import {
    Box,
    Button,
    TextField,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
    Grid as MuiGrid,
    SelectChangeEvent
} from '@mui/material';
import { createContainer, checkContainerExists } from '../../services/containerService';
import { ContainerCreate } from '../../types/Container';

// normal "Grid item", "Grid container" was not working
// FIX: Create wrapper components for Grid to fix the TypeScript errors
const GridContainer = (props: any) => <MuiGrid container {...props} />;
const GridItem = (props: any) => <MuiGrid {...props} />;

interface ContainerFormProps {
    onClose: (refresh?: boolean) => void;
}

const ContainerForm: React.FC<ContainerFormProps> = ({ onClose }) => {
    const [formData, setFormData] = useState<ContainerCreate>({
        container_id: '',
        zone: '',
        width: 0,
        depth: 0,
        height: 0
    });

    const [loading, setLoading] = useState<boolean>(false);
    const [checking, setChecking] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [idExists, setIdExists] = useState<boolean>(false);

    const zones = [
        'Sanitation Bay', 'Command Center', 'Engineering Bay', 'Power Bay',
        'External Storage', 'Lab', 'Storage Bay', 'Engine Bay', 'Life Support',
        'Maintenance Bay', 'Crew Quarters', 'Medical Bay', 'Cockpit', 'Airlock', 'Greenhouse'
    ];

    const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name) {
            setFormData((prev) => ({
                ...prev,
                [name]: name === 'width' || name === 'depth' || name === 'height'
                    ? parseFloat(value) || 0
                    : value
            }));

            // Check container ID existence when it changes
            if (name === 'container_id' && value.trim().length > 0) {
                checkContainerId(value);
            } else if (name === 'container_id' && value.trim().length === 0) {
                setIdExists(false);
                setError(null);
            }
        }
    };

    const checkContainerId = async (id: string) => {
        if (id.trim() === '') return;

        try {
            setChecking(true);
            const exists = await checkContainerExists(id);
            setIdExists(exists);
            if (exists) {
                setError(`Container ID '${id}' already exists. Please use a unique ID.`);
            } else {
                setError(null);
            }
        } catch (err) {
            console.error('Error checking container ID:', err);
        } finally {
            setChecking(false);
        }
    };

    const handleSelectChange = (e: SelectChangeEvent) => {
        const { name, value } = e.target;
        if (name) {
            setFormData((prev) => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        if (!formData.container_id || !formData.zone ||
            formData.width <= 0 || formData.depth <= 0 || formData.height <= 0) {
            setError('Please fill in all fields with valid values');
            return;
        }

        // Check again if container ID exists
        try {
            setLoading(true);
            const exists = await checkContainerExists(formData.container_id);

            if (exists) {
                setError(`Container ID '${formData.container_id}' already exists. Please use a unique ID.`);
                setLoading(false);
                return;
            }

            await createContainer(formData);
            onClose(true); // Refresh container list
        } catch (err) {
            console.error('Failed to create container:', err);
            setError('Failed to create container. Please try again.');
            setLoading(false);
        }
    };

    const totalVolume = formData.width * formData.depth * formData.height;

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <DialogTitle>Add New Container</DialogTitle>
            <DialogContent>
                <GridContainer spacing={3} sx={{ mt: 0 }}>
                    <GridItem xs={12}>
                        <TextField
                            required
                            fullWidth
                            label="Container ID"
                            name="container_id"
                            value={formData.container_id}
                            onChange={handleTextFieldChange}
                            variant="outlined"
                            margin="normal"
                            helperText={
                                checking ? "Checking ID..." :
                                    idExists ? "This ID already exists" :
                                        "Unique identifier for this container"
                            }
                            error={idExists}
                            InputProps={{
                                endAdornment: checking ? <CircularProgress size={20} /> : undefined
                            }}
                        />
                    </GridItem>

                    <GridItem xs={12}>
                        <FormControl fullWidth margin="normal" required>
                            <InputLabel>Zone</InputLabel>
                            <Select
                                name="zone"
                                value={formData.zone}
                                onChange={handleSelectChange}
                                label="Zone"
                            >
                                {zones.map((zone) => (
                                    <MenuItem key={zone} value={zone}>{zone}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </GridItem>

                    <GridItem xs={12}>
                        <Typography variant="subtitle1" gutterBottom>
                            Container Dimensions
                        </Typography>
                    </GridItem>

                    <GridItem xs={4}>
                        <TextField
                            required
                            fullWidth
                            label="Width (cm)"
                            name="width"
                            type="number"
                            value={formData.width || ''}
                            onChange={handleTextFieldChange}
                            variant="outlined"
                            InputProps={{ inputProps: { min: 1 } }}
                        />
                    </GridItem>

                    <GridItem xs={4}>
                        <TextField
                            required
                            fullWidth
                            label="Depth (cm)"
                            name="depth"
                            type="number"
                            value={formData.depth || ''}
                            onChange={handleTextFieldChange}
                            variant="outlined"
                            InputProps={{ inputProps: { min: 1 } }}
                        />
                    </GridItem>

                    <GridItem xs={4}>
                        <TextField
                            required
                            fullWidth
                            label="Height (cm)"
                            name="height"
                            type="number"
                            value={formData.height || ''}
                            onChange={handleTextFieldChange}
                            variant="outlined"
                            InputProps={{ inputProps: { min: 1 } }}
                        />
                    </GridItem>

                    {totalVolume > 0 && (
                        <GridItem xs={12}>
                            <Box sx={{ mt: 1, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                                <Typography variant="body2">
                                    Total Volume: {totalVolume.toLocaleString()} cm³ ({(totalVolume / 1000000).toFixed(2)} m³)
                                </Typography>
                            </Box>
                        </GridItem>
                    )}

                    {error && (
                        <GridItem xs={12}>
                            <Alert severity="error">{error}</Alert>
                        </GridItem>
                    )}
                </GridContainer>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => onClose()} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="contained"
                    disabled={loading || idExists}
                    startIcon={loading ? <CircularProgress size={20} /> : undefined}
                >
                    {loading ? 'Creating...' : 'Create Container'}
                </Button>
            </DialogActions>
        </Box>
    );
};

export default ContainerForm;