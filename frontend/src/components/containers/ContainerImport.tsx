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
    Divider
} from '@mui/material';
import { CloudUpload, Description } from '@mui/icons-material';
import { importContainers } from '../../services/containerService';

interface ContainerImportProps {
    onClose: (refresh?: boolean) => void;
}

const ContainerImport: React.FC<ContainerImportProps> = ({ onClose }) => {
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
            const result = await importContainers(file);
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
    const csvTemplate = 'zone,container_id,width_cm,depth_cm,height_cm\nCrew_Quarters,CONT001,100,80,60\nStorage_Bay,CONT002,200,180,120';

    // Download template
    const downloadTemplate = () => {
        const blob = new Blob([csvTemplate], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'container_import_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <Box>
            <DialogTitle>Import Containers</DialogTitle>
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
                                Containers imported: {importResult?.containersImportedCount || 0}
                            </Typography>
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
                            Upload a CSV or Excel file containing container information.
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
                        <Typography variant="body2">
                            The file should include the following columns: container_id, zone, width, depth, height
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
                            {loading ? 'Importing...' : 'Import Containers'}
                        </Button>
                    </>
                )}
            </DialogActions>
        </Box>
    );
};

export default ContainerImport;