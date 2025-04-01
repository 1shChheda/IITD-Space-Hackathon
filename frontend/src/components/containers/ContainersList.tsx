import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    IconButton,
    Tooltip,
    CircularProgress,
    Alert
} from '@mui/material';
import { Add, Refresh, Upload } from '@mui/icons-material';
import { getContainers } from '../../services/containerService';
import { Container } from '../../types/Container';
import ContainerForm from './ContainerForm';
import ContainerImport from './ContainerImport';

const ContainersList: React.FC = () => {
    const [containers, setContainers] = useState<Container[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [openForm, setOpenForm] = useState<boolean>(false);
    const [openImport, setOpenImport] = useState<boolean>(false);

    const fetchContainers = async () => {
        try {
            setLoading(true);
            const data = await getContainers();
            setContainers(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch containers:', err);
            setError('Failed to load containers. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContainers();
    }, []);

    const handleFormClose = (refresh: boolean = false) => {
        setOpenForm(false);
        if (refresh) {
            fetchContainers();
        }
    };

    const handleImportClose = (refresh: boolean = false) => {
        setOpenImport(false);
        if (refresh) {
            fetchContainers();
        }
    };

    const calculateVolumePercentage = (container: Container) => {
        const totalVolume = container.dimensions.width * container.dimensions.depth * container.dimensions.height;
        const percentage = (container.occupied_volume / totalVolume) * 100;
        return percentage.toFixed(1);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Storage Containers
                </Typography>
                <Box>
                    <Tooltip title="Refresh">
                        <IconButton onClick={() => fetchContainers()} disabled={loading} sx={{ mr: 1 }}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="outlined"
                        startIcon={<Upload />}
                        onClick={() => setOpenImport(true)}
                        sx={{ mr: 2 }}
                    >
                        Import
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setOpenForm(true)}
                    >
                        Add Container
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            ) : containers.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">
                        No containers found
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                        Add your first container to start organizing items
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setOpenForm(true)}
                    >
                        Add Container
                    </Button>
                </Paper>
            ) : (
                <TableContainer component={Paper} sx={{ mb: 4 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Container ID</TableCell>
                                <TableCell>Zone</TableCell>
                                <TableCell>Dimensions (W×D×H cm)</TableCell>
                                <TableCell>Space Utilization</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {containers.map((container) => (
                                <TableRow key={container.container_id} hover>
                                    <TableCell>{container.container_id}</TableCell>
                                    <TableCell>{container.zone}</TableCell>
                                    <TableCell>
                                        {container.dimensions.width}×{container.dimensions.depth}×{container.dimensions.height}
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box sx={{ width: '70%', mr: 1 }}>
                                                <Box
                                                    sx={{
                                                        width: '100%',
                                                        bgcolor: '#e0e0e0',
                                                        borderRadius: 1,
                                                        height: 8
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            width: `${calculateVolumePercentage(container)}%`,
                                                            bgcolor:
                                                                parseFloat(calculateVolumePercentage(container)) > 80 ? 'error.main' :
                                                                    parseFloat(calculateVolumePercentage(container)) > 50 ? 'warning.main' :
                                                                        'success.main',
                                                            borderRadius: 1,
                                                            height: 8
                                                        }}
                                                    />
                                                </Box>
                                            </Box>
                                            <Typography variant="body2">
                                                {calculateVolumePercentage(container)}%
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog
                open={openForm}
                onClose={() => handleFormClose()}
                fullWidth
                maxWidth="sm"
            >
                <ContainerForm onClose={handleFormClose} />
            </Dialog>

            <Dialog
                open={openImport}
                onClose={() => handleImportClose()}
                fullWidth
                maxWidth="sm"
            >
                <ContainerImport onClose={handleImportClose} />
            </Dialog>
        </Box>
    );
};

export default ContainersList;