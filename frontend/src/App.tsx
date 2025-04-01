import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Layouts
import { Header, Sidebar } from './components';

// Pages
// import { Dashboard, ContainersList, ItemsList, PlacementView } from './components';
import { ContainersList, ItemsList, PlacementView } from './components';
import { Box, Container } from '@mui/material';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1565c0',
        },
        secondary: {
            main: '#7c4dff',
        },
        background: {
            default: '#f5f5f5',
        },
    },
});

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <Box sx={{ display: 'flex' }}>
                    <Header />
                    <Sidebar />
                    <Box
                        component="main"
                        sx={{
                            flexGrow: 1,
                            padding: 3,
                            marginTop: '3.5rem',
                            marginLeft: '2.5rem',
                            overflow: 'auto',
                        }}
                    >
                        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                            <Routes>
                                {/* <Route path="/" element={<Dashboard />} /> */}
                                <Route path="/containers" element={<ContainersList />} />
                                <Route path="/items" element={<ItemsList />} />
                                <Route path="/placement" element={<PlacementView />} />
                            </Routes>
                        </Container>
                    </Box>
                </Box>
            </Router>
        </ThemeProvider>
    );
}

export default App;