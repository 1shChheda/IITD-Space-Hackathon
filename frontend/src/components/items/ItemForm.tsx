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
    SelectChangeEvent,
    Slider,
    InputAdornment,
    Tooltip
} from '@mui/material';
import { createItem } from '../../services/itemService';
import { ItemCreate } from '../../types/Item';
import InfoIcon from '@mui/icons-material/Info';

// Wrapper components for Grid to fix TypeScript errors
const GridContainer = (props: any) => <MuiGrid container {...props} />;
const GridItem = (props: any) => <MuiGrid {...props} />;

interface ItemFormProps {
    onClose: (refresh?: boolean) => void;
}

const ItemForm: React.FC<ItemFormProps> = ({ onClose }) => {
    const [formData, setFormData] = useState<ItemCreate>({
        item_id: '',
        name: '',
        width: 0,
        depth: 0,
        height: 0,
        mass: 0,
        priority: 50, // Default to medium priority
        usage_limit: 1,
        preferred_zone: ''
    });

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

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
                [name]: ['width', 'depth', 'height', 'mass', 'usage_limit'].includes(name)
                    ? parseFloat(value) || 0
                    : value
            }));
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

    const handlePriorityChange = (event: Event, newValue: number | number[]) => {
        setFormData((prev) => ({
            ...prev,
            priority: newValue as number
        }));
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        if (!formData.item_id || !formData.name || !formData.preferred_zone ||
            formData.width <= 0 || formData.depth <= 0 || formData.height <= 0 || formData.mass <= 0) {
            setError('Please fill in all required fields with valid values');
            return;
        }

        try {
            setLoading(true);
            await createItem(formData);
            onClose(true); // Refresh item list
        } catch (err: any) {
            console.error('Failed to create item:', err);
            setError(err.response?.data?.detail || 'Failed to create item. Please try again.');
            setLoading(false);
        }
    };

    const totalVolume = formData.width * formData.depth * formData.height;

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogContent>
                <GridContainer spacing={3} sx={{ mt: 0 }}>
                    {/* Basic Information */}
                    <GridItem xs={12}>
                        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                            Basic Information
                        </Typography>
                    </GridItem>

                    <GridItem xs={12} md={6}>
                        <TextField
                            required
                            fullWidth
                            label="Item ID"
                            name="item_id"
                            value={formData.item_id}
                            onChange={handleTextFieldChange}
                            variant="outlined"
                            margin="normal"
                            helperText="Unique identifier for this item"
                        />
                    </GridItem>

                    <GridItem xs={12} md={6}>
                        <TextField
                            required
                            fullWidth
                            label="Item Name"
                            name="name"
                            value={formData.name}
                            onChange={handleTextFieldChange}
                            variant="outlined"
                            margin="normal"
                            helperText="Descriptive name of the item"
                        />
                    </GridItem>

                    {/* Physical Properties */}
                    <GridItem xs={12}>
                        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                            Physical Properties
                        </Typography>
                    </GridItem>

                    <GridItem xs={12} md={4}>
                        <TextField
                            required
                            fullWidth
                            label="Width (cm)"
                            name="width"
                            type="number"
                            value={formData.width || ''}
                            onChange={handleTextFieldChange}
                            variant="outlined"
                            margin="normal"
                            InputProps={{ 
                                inputProps: { min: 1 },
                                endAdornment: <InputAdornment position="end">cm</InputAdornment>
                            }}
                        />
                    </GridItem>

                    <GridItem xs={12} md={4}>
                        <TextField
                            required
                            fullWidth
                            label="Depth (cm)"
                            name="depth"
                            type="number"
                            value={formData.depth || ''}
                            onChange={handleTextFieldChange}
                            variant="outlined"
                            margin="normal"
                            InputProps={{ 
                                inputProps: { min: 1 },
                                endAdornment: <InputAdornment position="end">cm</InputAdornment>
                            }}
                        />
                    </GridItem>

                    <GridItem xs={12} md={4}>
                        <TextField
                            required
                            fullWidth
                            label="Height (cm)"
                            name="height"
                            type="number"
                            value={formData.height || ''}
                            onChange={handleTextFieldChange}
                            variant="outlined"
                            margin="normal"
                            InputProps={{ 
                                inputProps: { min: 1 },
                                endAdornment: <InputAdornment position="end">cm</InputAdornment>
                            }}
                        />
                    </GridItem>

                    <GridItem xs={12} md={6}>
                        <TextField
                            required
                            fullWidth
                            label="Mass"
                            name="mass"
                            type="number"
                            value={formData.mass || ''}
                            onChange={handleTextFieldChange}
                            variant="outlined"
                            margin="normal"
                            InputProps={{ 
                                inputProps: { min: 0, step: 0.1 },
                                endAdornment: <InputAdornment position="end">kg</InputAdornment>
                            }}
                        />
                    </GridItem>

                    <GridItem xs={12} md={6}>
                        <TextField
                            required
                            fullWidth
                            label="Usage Limit"
                            name="usage_limit"
                            type="number"
                            value={formData.usage_limit || ''}
                            onChange={handleTextFieldChange}
                            variant="outlined"
                            margin="normal"
                            helperText="Maximum number of times item can be used"
                            InputProps={{ 
                                inputProps: { min: 1 }
                            }}
                        />
                    </GridItem>

                    {/* Location and Priority */}
                    <GridItem xs={12}>
                        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                            Storage Information
                        </Typography>
                    </GridItem>

                    <GridItem xs={12} md={6}>
                        <FormControl fullWidth margin="normal" required>
                            <InputLabel>Preferred Zone</InputLabel>
                            <Select
                                name="preferred_zone"
                                value={formData.preferred_zone}
                                onChange={handleSelectChange}
                                label="Preferred Zone"
                            >
                                {zones.map((zone) => (
                                    <MenuItem key={zone} value={zone}>{zone}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </GridItem>

                    <GridItem xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Expiry Date"
                            name="expiry_date"
                            type="date"
                            value={formData.expiry_date || ''}
                            onChange={handleDateChange}
                            variant="outlined"
                            margin="normal"
                            InputLabelProps={{ shrink: true }}
                            helperText="Leave blank if not applicable"
                        />
                    </GridItem>

                    <GridItem xs={12}>
                        <Box sx={{ mt: 2, mb: 1 }}>
                            <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center">
                                Priority Level
                                <Tooltip title="Higher priority items will be placed in more accessible locations">
                                    <InfoIcon fontSize="small" sx={{ ml: 1, opacity: 0.7 }} />
                                </Tooltip>
                            </Typography>
                            <Slider
                                value={formData.priority}
                                onChange={handlePriorityChange}
                                aria-labelledby="priority-slider"
                                valueLabelDisplay="auto"
                                step={5}
                                marks
                                min={0}
                                max={100}
                                sx={{
                                    '& .MuiSlider-valueLabel': {
                                        backgroundColor: 
                                            formData.priority >= 70 ? '#ff5252' : 
                                            formData.priority >= 40 ? '#ffb74d' : '#81c784'
                                    }
                                }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption" color="text.secondary">Low</Typography>
                                <Typography variant="caption" color="text.secondary">Medium</Typography>
                                <Typography variant="caption" color="text.secondary">High</Typography>
                            </Box>
                        </Box>
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
                            <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
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
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : undefined}
                >
                    {loading ? 'Creating...' : 'Create Item'}
                </Button>
            </DialogActions>
        </Box>
    );
};

export default ItemForm;