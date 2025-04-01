import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#0D47A1', // Deeper blue for a more space/tech feel
            light: '#4285F4',
            dark: '#002171',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#7C4DFF', // Purple accent
            light: '#B47CFF',
            dark: '#3F1DCB',
            contrastText: '#ffffff',
        },
        background: {
            default: '#F5F7FA', // Light grayish blue background
            paper: '#FFFFFF',
        },
        error: {
            main: '#F44336',
        },
        warning: {
            main: '#FF9800',
        },
        info: {
            main: '#2196F3',
        },
        success: {
            main: '#4CAF50',
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 500,
        },
        h2: {
            fontWeight: 500,
        },
        h3: {
            fontWeight: 500,
        },
        h4: {
            fontWeight: 500,
        },
        h5: {
            fontWeight: 500,
        },
        h6: {
            fontWeight: 500,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                    fontWeight: 500,
                },
                containedPrimary: {
                    boxShadow: '0 4px 6px rgba(13, 71, 161, 0.2)',
                    '&:hover': {
                        boxShadow: '0 6px 10px rgba(13, 71, 161, 0.3)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                elevation1: {
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                },
            },
        },
    },
    shape: {
        borderRadius: 8,
    },
});

export default theme;