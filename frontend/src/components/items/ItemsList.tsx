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
    Chip,
    TablePagination,
    useTheme,
    useMediaQuery,
    Card,
    CardContent,
    Divider
} from '@mui/material';
import { Add, Refresh, Upload, ViewInAr, Info } from '@mui/icons-material';
import { getItems } from '../../services/itemService';
import { Item } from '../../types/Item';
import ItemForm from './ItemForm';
import ItemImport from './ItemImport';
import { priorityToColor } from '../../utils/colors';
import { Link } from 'react-router-dom';

const ItemsList: React.FC = () => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [openForm, setOpenForm] = useState<boolean>(false);
    const [openImport, setOpenImport] = useState<boolean>(false);

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const data = await getItems();
            setItems(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch items:', err);
            setError('Failed to load items. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleFormClose = (refresh: boolean = false) => {
        setOpenForm(false);
        if (refresh) {
            fetchItems();
        }
    };

    const handleImportClose = (refresh: boolean = false) => {
        setOpenImport(false);
        if (refresh) {
            fetchItems();
        }
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Formatted volume calculation
    const formatVolume = (item: Item) => {
        const volume = item.dimensions.width * item.dimensions.depth * item.dimensions.height;
        return volume < 1000 ? `${volume} cm³` : `${(volume / 1000).toFixed(2)} L`;
    };

    // Format the date to be human-readable
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Determine if item is expired
    const isExpired = (dateString?: string) => {
        if (!dateString) return false;
        const expiryDate = new Date(dateString);
        return expiryDate < new Date();
    };

    const getItemStats = () => {
        if (items.length === 0) return null;

        const totalItems = items.length;
        const totalVolume = items.reduce((sum, item) => {
            return sum + (item.dimensions.width * item.dimensions.depth * item.dimensions.height);
        }, 0);
        const totalMass = items.reduce((sum, item) => sum + item.mass, 0);
        const unplacedItems = items.filter(item => !item.container_id).length;

        return { totalItems, totalVolume, totalMass, unplacedItems };
    };

    const stats = getItemStats();

    return (
        <Box sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
            {/* Header Section with improved spacing and responsive layout */}
            <Card
                elevation={2}
                sx={{
                    mb: 3,
                    p: 2,
                    background: `linear-gradient(to right, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
                    color: 'white'
                }}
            >
                <Box sx={{
                    display: 'flex',
                    flexDirection: isSmallScreen ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: isSmallScreen ? 'flex-start' : 'center',
                    gap: 2
                }}>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                        Storage Items
                    </Typography>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: isSmallScreen ? 'column' : 'row',
                        gap: 1
                    }}>
                        <Tooltip title="Refresh Items">
                            <IconButton
                                onClick={() => fetchItems()}
                                disabled={loading}
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
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
                                color: 'white',
                                borderColor: 'white',
                                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
                            }}
                        >
                            Import
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => setOpenForm(true)}
                            sx={{
                                bgcolor: 'white',
                                color: theme.palette.primary.main,
                                fontWeight: 'bold',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                            }}
                        >
                            Add Item
                        </Button>
                    </Box>
                </Box>
            </Card>

            {/* Stats Cards */}
            {!loading && stats && (
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: isSmallScreen ? '1fr 1fr' : 'repeat(4, 1fr)',
                    gap: 2,
                    mb: 3
                }}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography color="textSecondary" gutterBottom>Total Items</Typography>
                            <Typography variant="h4" component="div" color="primary">
                                {stats.totalItems}
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography color="textSecondary" gutterBottom>Total Volume</Typography>
                            <Typography variant="h4" component="div" color="primary">
                                {stats.totalVolume < 1000 ?
                                    `${stats.totalVolume} cm³` :
                                    `${(stats.totalVolume / 1000).toFixed(2)} L`}
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography color="textSecondary" gutterBottom>Total Mass</Typography>
                            <Typography variant="h4" component="div" color="primary">
                                {stats.totalMass.toFixed(2)} kg
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography color="textSecondary" gutterBottom>Unplaced Items</Typography>
                            <Typography
                                variant="h4"
                                component="div"
                                color={stats.unplacedItems > 0 ? "warning.main" : "success.main"}
                            >
                                {stats.unplacedItems}
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>
            )}

            {error && (
                <Alert
                    severity="error"
                    sx={{
                        mb: 3,
                        boxShadow: 2,
                        '& .MuiAlert-icon': {
                            fontSize: '1.5rem'
                        }
                    }}
                >
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                    my: 8,
                    gap: 2
                }}>
                    <CircularProgress size={60} thickness={4} />
                    <Typography variant="h6" color="text.secondary">
                        Loading storage items...
                    </Typography>
                </Box>
            ) : items.length === 0 ? (
                <Paper
                    sx={{
                        p: 6,
                        textAlign: 'center',
                        borderRadius: 2,
                        boxShadow: 3,
                        bgcolor: 'rgba(0,0,0,0.01)'
                    }}
                >
                    <Info sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h5" color="text.secondary" gutterBottom>
                        No items found
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                        Add your first item to start organizing storage. Items can be placed into containers for better organization.
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<Add />}
                        onClick={() => setOpenForm(true)}
                    >
                        Add First Item
                    </Button>
                </Paper>
            ) : (
                <Paper sx={{ width: '100%', mb: 4, overflow: 'hidden', borderRadius: 2, boxShadow: 3 }}>
                    <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: theme.palette.grey[100] }}>Item ID</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: theme.palette.grey[100] }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: theme.palette.grey[100] }}>Dimensions (W×D×H cm)</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: theme.palette.grey[100] }}>Volume</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: theme.palette.grey[100] }}>Mass (kg)</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: theme.palette.grey[100] }}>Priority</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: theme.palette.grey[100] }}>Preferred Zone</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: theme.palette.grey[100] }}>Expiry Date</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: theme.palette.grey[100] }}>Current Location</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', bgcolor: theme.palette.grey[100] }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((item) => (
                                        <TableRow
                                            key={item.item_id}
                                            hover
                                            sx={{
                                                '&:nth-of-type(odd)': {
                                                    backgroundColor: theme.palette.action.hover,
                                                },
                                            }}
                                        >
                                            <TableCell
                                                sx={{
                                                    fontWeight: 'medium',
                                                    borderLeft: `4px solid ${theme.palette.primary.main}`
                                                }}
                                            >
                                                {item.item_id}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 'medium' }}>{item.name}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                    {item.dimensions.width}×{item.dimensions.depth}×{item.dimensions.height}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{formatVolume(item)}</TableCell>
                                            <TableCell>{item.mass}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={item.priority}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: priorityToColor(item.priority),
                                                        color: item.priority >= 70 ? 'white' : 'black',
                                                        fontWeight: 'bold',
                                                        minWidth: 40
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={item.preferred_zone}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ borderRadius: 1 }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {item.expiry_date && (
                                                    <Typography
                                                        variant="body2"
                                                        color={isExpired(item.expiry_date) ? 'error' : 'inherit'}
                                                        sx={{
                                                            fontWeight: isExpired(item.expiry_date) ? 'bold' : 'normal',
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        {isExpired(item.expiry_date) && (
                                                            <Box
                                                                component="span"
                                                                sx={{
                                                                    display: 'inline-block',
                                                                    width: 8,
                                                                    height: 8,
                                                                    borderRadius: '50%',
                                                                    bgcolor: 'error.main',
                                                                    mr: 1
                                                                }}
                                                            />
                                                        )}
                                                        {formatDate(item.expiry_date)}
                                                    </Typography>
                                                )}
                                                {!item.expiry_date && (
                                                    <Typography variant="body2" color="text.secondary">N/A</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {item.container_id ? (
                                                    <Tooltip title="View in container">
                                                        <Chip
                                                            label={item.container_id}
                                                            size="small"
                                                            clickable
                                                            color="primary"
                                                            variant="outlined"
                                                            sx={{ borderRadius: 1 }}
                                                        />
                                                    </Tooltip>
                                                ) : (
                                                    <Chip
                                                        label="Unplaced"
                                                        size="small"
                                                        variant="outlined"
                                                        color="warning"
                                                        sx={{ borderRadius: 1 }}
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {!item.container_id && (
                                                    <Tooltip title="Place item">
                                                        <IconButton
                                                            component={Link}
                                                            to={`/placement?itemId=${item.item_id}`}
                                                            size="small"
                                                            color="primary"
                                                            sx={{
                                                                bgcolor: 'rgba(25, 118, 210, 0.1)',
                                                                '&:hover': {
                                                                    bgcolor: 'rgba(25, 118, 210, 0.2)',
                                                                }
                                                            }}
                                                        >
                                                            <ViewInAr />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Divider />
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        component="div"
                        count={items.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        sx={{
                            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                                margin: 0,
                            },
                        }}
                    />
                </Paper>
            )}

            <Dialog
                open={openForm}
                onClose={() => handleFormClose()}
                fullWidth
                maxWidth="md"
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        boxShadow: 24
                    }
                }}
            >
                <ItemForm onClose={handleFormClose} />
            </Dialog>

            <Dialog
                open={openImport}
                onClose={() => handleImportClose()}
                fullWidth
                maxWidth="md"
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        boxShadow: 24
                    }
                }}
            >
                <ItemImport onClose={handleImportClose} />
            </Dialog>
        </Box>
    );
};

export default ItemsList;