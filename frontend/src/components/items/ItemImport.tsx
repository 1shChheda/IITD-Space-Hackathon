import React, { useState, useRef } from 'react';
import {
    Box,
    Button,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Alert,
    CircularProgress,
    Paper,
    Link,
    Divider,
    Chip
} from '@mui/material';
import { CloudUpload, Description } from '@mui/icons-material';
import { importItems } from '../../services/itemService';

interface ItemImportProps {
    onClose: (refresh?: boolean) => void;
}

const ItemImport: React.FC<ItemImportProps> = ({ onClose }) => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    const [importResult, setImportResult] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleImport = async () => {
        if (!file) {
            setError('Please select a file to import');
            return;
        }

        if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
            setError('Only CSV and Excel files are supported');
            return;
        }

        try {
            setLoading(true);
            const result = await importItems(file);
            setImportResult(result);
            setSuccess(true);
        } catch (err: any) {
            console.error('Import failed:', err);
            setError(err.response?.data?.detail || 'Import failed. Please check file format and try again.');
        } finally {
            setLoading(false);
        }
    };

    // Sample CSV template string that matches your actual data format
    const csvTemplate = 'item_id,name,width_cm,depth_cm,height_cm,mass_kg,priority,expiry_date,usage_limit,preferred_zone\n' +
        '1,Research_Samples,26.8,17.5,19.4,2.4,84,N/A,2304,Storage_Bay\n' +
        '6,Laptop,11.5,39.7,46,10.5,60,2026-06-30,2333,Command_Center\n' +
        '14,First_Aid_Kit,27.4,16.6,24.5,8.1,22,N/A,55,Crew_Quarters';

    // Download template
    const downloadTemplate = () => {
        const blob = new Blob([csvTemplate], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'item_import_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <Box>
            <DialogTitle>Import Items</DialogTitle>
            <DialogContent>
                {success ? (
                    <Box>
                        <Alert severity="success" sx={{ mb: 2 }}>
                            Import completed successfully
                        </Alert>
                        <Typography variant="body1" gutterBottom>
                            Import Summary:
                        </Typography>
                        <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                            <Typography variant="body2">
                                Items imported: {importResult?.itemsImportedCount || 0}
                            </Typography>
                            {importResult?.placement_stats && (
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2">
                                        Items placed: {importResult.placement_stats.placed_count || 0}
                                    </Typography>
                                    <Typography variant="body2">
                                        Items unplaced: {importResult.placement_stats.unplaced_count || 0}
                                    </Typography>
                                </Box>
                            )}
                            {importResult?.errors?.length > 0 && (
                                <>
                                    <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                                        Errors: {importResult.errors.length}
                                    </Typography>
                                    <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                                        {importResult.errors.slice(0, 5).map((err: any, idx: number) => (
                                            <Typography component="li" variant="body2" key={idx}>
                                                {err.row ? `Row ${err.row}: ${err.message}` : err}
                                            </Typography>
                                        ))}
                                        {importResult.errors.length > 5 && (
                                            <Typography variant="body2">
                                                ...and {importResult.errors.length - 5} more errors
                                            </Typography>
                                        )}
                                    </Box>
                                </>
                            )}
                        </Box>
                    </Box>
                ) : (
                    <Box>
                        <Typography variant="body1" gutterBottom>
                            Upload a CSV or Excel file containing item information.
                        </Typography>

                        <Paper
                            variant="outlined"
                            sx={{
                                mt: 2,
                                mb: 3,
                                p: 2,
                                border: '1px dashed',
                                borderColor: 'divider',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                cursor: 'pointer',
                                bgcolor: file ? 'action.selected' : 'background.paper',
                            }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                hidden
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".csv, .xlsx"
                            />

                            {file ? (
                                <Box sx={{ textAlign: 'center' }}>
                                    <Description color="primary" sx={{ fontSize: 48, mb: 1 }} />
                                    <Typography variant="body1" gutterBottom>
                                        {file.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </Typography>
                                </Box>
                            ) : (
                                <Box sx={{ textAlign: 'center' }}>
                                    <CloudUpload sx={{ fontSize: 48, mb: 1, color: 'text.secondary' }} />
                                    <Typography variant="body1" gutterBottom>
                                        Click to select a file
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        or drag and drop here
                                    </Typography>
                                </Box>
                            )}
                        </Paper>

                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="subtitle2" gutterBottom>
                            File Format Requirements:
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2">
                                The file should include the following columns:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                <Chip label="item_id" size="small" />
                                <Chip label="name" size="small" />
                                <Chip label="width" size="small" />
                                <Chip label="depth" size="small" />
                                <Chip label="height" size="small" />
                                <Chip label="mass" size="small" />
                                <Chip label="priority" size="small" />
                                <Chip label="expiry_date (optional)" size="small" />
                                <Chip label="usage_limit" size="small" />
                                <Chip label="preferred_zone" size="small" />
                            </Box>
                        </Box>

                        <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Notes:</strong>
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                            • Priority should be a number between 1-100 (higher = more important)
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                            • All dimensions should be in centimeters
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                            • Mass should be in kilograms
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1.5 }}>
                            • If successful, the system will automatically calculate optimal placement
                        </Typography>

                        <Link
                            component="button"
                            variant="body2"
                            onClick={downloadTemplate}
                            sx={{ mt: 1, display: 'block' }}
                        >
                            Download template file
                        </Link>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                {success ? (
                    <Button onClick={() => onClose(true)} variant="contained">
                        Done
                    </Button>
                ) : (
                    <>
                        <Button onClick={() => onClose()} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleImport}
                            disabled={!file || loading}
                            startIcon={loading ? <CircularProgress size={20} /> : undefined}
                        >
                            {loading ? 'Importing...' : 'Import Items'}
                        </Button>
                    </>
                )}
            </DialogActions>
        </Box>
    );
};

export default ItemImport;