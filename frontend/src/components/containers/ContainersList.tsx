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
    Alert,
    Card,
    CardContent,
    useTheme,
    alpha,
    Grid as MuiGrid
} from '@mui/material';
import { Add, Refresh, Upload, Storage, Warning } from '@mui/icons-material';
import { getContainers } from '../../services/containerService';
import { Container } from '../../types/Container';
import ContainerForm from './ContainerForm';
import ContainerImport from './ContainerImport';

// normal "Grid item", "Grid container" was not working
// FIX: Create wrapper components for Grid to fix the TypeScript errors
const GridContainer = (props: any) => <MuiGrid container {...props} />;
const GridItem = (props: any) => <MuiGrid {...props} />;

const ContainersList: React.FC = () => {
    const [containers, setContainers] = useState<Container[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [openForm, setOpenForm] = useState<boolean>(false);
    const [openImport, setOpenImport] = useState<boolean>(false);
    const theme = useTheme();

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

    const getUtilizationColor = (percentage: number) => {
        if (percentage > 80) return theme.palette.error.main;
        if (percentage > 50) return theme.palette.warning.main;
        return theme.palette.success.main;
    };

    const getContainerSummary = () => {
        if (containers.length === 0) return null;
        
        const totalContainers = containers.length;
        const highUtilization = containers.filter(c => 
            parseFloat(calculateVolumePercentage(c)) > 80
        ).length;
        
        return { totalContainers, highUtilization };
    };

    const summary = getContainerSummary();

    return (
        <Box sx={{ 
            maxWidth: '100%', 
            padding: { xs: 2, md: 3 },
            backgroundColor: alpha(theme.palette.background.default, 0.6)
        }}>
            {/* Header Section with Summary Cards */}
            <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' }, 
                justifyContent: 'space-between', 
                alignItems: { xs: 'flex-start', md: 'center' }, 
                mb: 4,
                gap: 2
            }}>
                <Typography 
                    variant="h4" 
                    component="h1"
                    sx={{
                        fontWeight: 'bold',
                        color: theme.palette.primary.main,
                        mb: { xs: 2, md: 0 }
                    }}
                >
                    Storage Containers
                </Typography>
                
                <Box sx={{ 
                    display: 'flex', 
                    gap: 2,
                    flexWrap: 'wrap',
                    justifyContent: 'flex-end'
                }}>
                    <Tooltip title="Refresh Data">
                        <IconButton 
                            onClick={() => fetchContainers()} 
                            disabled={loading}
                            sx={{ 
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                                }
                            }}
                        >
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="outlined"
                        startIcon={<Upload />}
                        onClick={() => setOpenImport(true)}
                        sx={{ 
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 'medium'
                        }}
                    >
                        Import
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setOpenForm(true)}
                        sx={{ 
                            borderRadius: 2,
                            boxShadow: 2,
                            textTransform: 'none',
                            fontWeight: 'medium',
                            px: 3
                        }}
                    >
                        Add Container
                    </Button>
                </Box>
            </Box>

            {/* Summary Cards */}
            {summary && (
                <GridContainer spacing={3} sx={{ mb: 4 }}>
                    <GridItem xs={12} sm={6} md={3}>
                        <Card 
                            elevation={2}
                            sx={{ 
                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                                borderRadius: 2,
                                height: '100%'
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <Storage sx={{ color: theme.palette.primary.main, mr: 1 }} />
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Total Containers
                                    </Typography>
                                </Box>
                                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                    {summary.totalContainers}
                                </Typography>
                            </CardContent>
                        </Card>
                    </GridItem>
                    <GridItem xs={12} sm={6} md={3}>
                        <Card 
                            elevation={2}
                            sx={{ 
                                bgcolor: alpha(theme.palette.error.main, 0.05),
                                borderRadius: 2,
                                height: '100%'
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <Warning sx={{ color: theme.palette.error.main, mr: 1 }} />
                                    <Typography variant="subtitle2" color="text.secondary">
                                        High Utilization
                                    </Typography>
                                </Box>
                                <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.error.main }}>
                                    {summary.highUtilization}
                                </Typography>
                            </CardContent>
                        </Card>
                    </GridItem>
                </GridContainer>
            )}

            {error && (
                <Alert 
                    severity="error" 
                    sx={{ 
                        mb: 3,
                        borderRadius: 2
                    }}
                >
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
                    <CircularProgress size={60} thickness={4} />
                </Box>
            ) : containers.length === 0 ? (
                <Paper 
                    elevation={3}
                    sx={{ 
                        p: 6, 
                        textAlign: 'center',
                        borderRadius: 3,
                        bgcolor: alpha(theme.palette.background.paper, 0.8)
                    }}
                >
                    <Storage sx={{ fontSize: 60, color: alpha(theme.palette.text.secondary, 0.3), mb: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 'medium', mb: 1 }}>
                        No containers found
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 450, mx: 'auto' }}>
                        Add your first container to start organizing items and tracking inventory
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<Add />}
                        onClick={() => setOpenForm(true)}
                        sx={{ 
                            borderRadius: 2,
                            px: 4,
                            py: 1,
                            textTransform: 'none',
                            fontWeight: 'medium'
                        }}
                    >
                        Add Container
                    </Button>
                </Paper>
            ) : (
                <TableContainer 
                    component={Paper} 
                    elevation={3}
                    sx={{ 
                        mb: 4,
                        borderRadius: 3,
                        overflow: 'hidden'
                    }}
                >
                    <Table>
                        <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Container ID</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Zone</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Dimensions (W×D×H cm)</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Space Utilization</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {containers.map((container, index) => {
                                const utilizationPercent = parseFloat(calculateVolumePercentage(container));
                                const utilizationColor = getUtilizationColor(utilizationPercent);
                                
                                return (
                                    <TableRow 
                                        key={container.container_id} 
                                        hover
                                        sx={{ 
                                            cursor: 'pointer',
                                            bgcolor: index % 2 === 0 ? 'transparent' : alpha(theme.palette.background.default, 0.5),
                                            '&:hover': {
                                                bgcolor: alpha(theme.palette.primary.main, 0.05)
                                            }
                                        }}
                                    >
                                        <TableCell sx={{ py: 2.5 }}>
                                            <Typography fontWeight="medium">
                                                {container.container_id}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ 
                                                display: 'inline-block',
                                                px: 2, 
                                                py: 0.5, 
                                                borderRadius: 1,
                                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                color: theme.palette.primary.main,
                                                fontWeight: 'medium'
                                            }}>
                                                {container.zone}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                                                {container.dimensions.width}×{container.dimensions.depth}×{container.dimensions.height}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Box sx={{ width: '70%', mr: 2 }}>
                                                    <Box
                                                        sx={{
                                                            width: '100%',
                                                            bgcolor: alpha(theme.palette.text.disabled, 0.2),
                                                            borderRadius: 2,
                                                            height: 10
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                width: `${utilizationPercent}%`,
                                                                bgcolor: utilizationColor,
                                                                borderRadius: 2,
                                                                height: 10,
                                                                transition: 'width 0.5s ease-in-out'
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>
                                                <Typography 
                                                    variant="body2" 
                                                    fontWeight="bold"
                                                    sx={{ color: utilizationColor }}
                                                >
                                                    {utilizationPercent}%
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog
                open={openForm}
                onClose={() => handleFormClose()}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        overflow: 'hidden'
                    }
                }}
            >
                <ContainerForm onClose={handleFormClose} />
            </Dialog>

            <Dialog
                open={openImport}
                onClose={() => handleImportClose()}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        overflow: 'hidden'
                    }
                }}
            >
                <ContainerImport onClose={handleImportClose} />
            </Dialog>
        </Box>
    );
};

export default ContainersList;