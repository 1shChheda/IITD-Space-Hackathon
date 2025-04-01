import React, { useState } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    TablePagination,
    IconButton,
    Tabs,
    Tab,
    Badge,
    Tooltip,
    TextField,
    InputAdornment
} from '@mui/material';
import {
    SearchOutlined,
    FilterList,
    SortOutlined,
    CheckCircleOutline,
    WarningAmberOutlined
} from '@mui/icons-material';
import { Item } from '../../types/Item';
import { PlacementResult } from '../../types/Placement';
import { priorityToColor } from '../../utils/colors';

interface ItemPlacementProps {
    items: Item[];
    selectedItem: Item | null;
    onItemSelect: (item: Item) => void;
    placementResult: PlacementResult | null;
}

const ItemPlacement: React.FC<ItemPlacementProps> = ({
    items,
    selectedItem,
    onItemSelect,
    placementResult
}) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [tabValue, setTabValue] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    //Filter items based on tab and search
    const getFilteredItems = () => {
        let filtered = [...items];

        // apply tab filter
        if (tabValue === 1) { // Placed items
            filtered = filtered.filter(item => item.container_id);
        } else if (tabValue === 2) { // Unplaced items
            filtered = filtered.filter(item => !item.container_id);
        }

        // apply search filter if provided
        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(item =>
                item.item_id.toLowerCase().includes(term) ||
                item.name.toLowerCase().includes(term) ||
                item.preferred_zone.toLowerCase().includes(term)
            );
        }

        return filtered;
    };

    const filteredItems = getFilteredItems();

    //Calculate counts for tabs
    const placedCount = items.filter(item => item.container_id).length;
    const unplacedCount = items.length - placedCount;

    //Handle pagination change
    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    //Tab change handler
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
        setPage(0);
    };

    // heck if an item is part of the placement result
    const getPlacementStatus = (item: Item) => {
        if (!placementResult) return null;

        const wasPlaced = placementResult.placements.some(p => p.itemId === item.item_id);
        if (wasPlaced) {
            return { status: 'placed', message: 'Successfully placed' };
        }

        const wasUnplaced = placementResult.unplaced_items.includes(item.item_id);
        if (wasUnplaced) {
            return { status: 'unplaced', message: 'Could not be placed - insufficient space' };
        }

        return null;
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                >
                    <Tab
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography>All Items</Typography>
                                <Chip size="small" label={items.length} sx={{ ml: 1 }} />
                            </Box>
                        }
                    />
                    <Tab
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography>Placed</Typography>
                                <Chip
                                    size="small"
                                    label={placedCount}
                                    color="success"
                                    sx={{ ml: 1 }}
                                />
                            </Box>
                        }
                    />
                    <Tab
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography>Unplaced</Typography>
                                <Chip
                                    size="small"
                                    label={unplacedCount}
                                    color={unplacedCount > 0 ? "warning" : "default"}
                                    sx={{ ml: 1 }}
                                />
                            </Box>
                        }
                    />
                </Tabs>

                <TextField
                    size="small"
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchOutlined />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ width: '300px' }}
                />
            </Box>

            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small" aria-label="items table">
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Dimensions (cm)</TableCell>
                            <TableCell>Priority</TableCell>
                            <TableCell>Preferred Zone</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredItems
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((item) => {
                                const isSelected = selectedItem?.item_id === item.item_id;
                                const placementStatus = getPlacementStatus(item);

                                return (
                                    <TableRow
                                        key={item.item_id}
                                        hover
                                        selected={isSelected}
                                        onClick={() => onItemSelect(item)}
                                        sx={{
                                            cursor: 'pointer',
                                            backgroundColor: isSelected ? 'action.selected' : 'inherit',
                                            '&:hover': {
                                                backgroundColor: 'action.hover',
                                            }
                                        }}
                                    >
                                        <TableCell component="th" scope="row">
                                            {item.item_id}
                                        </TableCell>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>
                                            {item.dimensions.width}×{item.dimensions.depth}×{item.dimensions.height}
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title={`Priority level: ${item.priority}`}>
                                                <Chip
                                                    label={item.priority}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: priorityToColor(item.priority),
                                                        color: item.priority >= 70 ? 'white' : 'black'
                                                    }}
                                                />
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>{item.preferred_zone}</TableCell>
                                        <TableCell>
                                            {item.container_id ? (
                                                <Chip
                                                    size="small"
                                                    color="success"
                                                    label={`In ${item.container_id}`}
                                                    icon={<CheckCircleOutline fontSize="small" />}
                                                />
                                            ) : placementStatus ? (
                                                <Chip
                                                    size="small"
                                                    color={placementStatus.status === 'placed' ? 'success' : 'warning'}
                                                    label={placementStatus.message}
                                                    icon={placementStatus.status === 'placed'
                                                        ? <CheckCircleOutline fontSize="small" />
                                                        : <WarningAmberOutlined fontSize="small" />}
                                                />
                                            ) : (
                                                <Chip
                                                    size="small"
                                                    variant="outlined"
                                                    label="Not placed"
                                                />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredItems.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Box>
    );
};

export default ItemPlacement;