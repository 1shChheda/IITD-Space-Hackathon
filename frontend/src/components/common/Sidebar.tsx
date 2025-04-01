import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';
import BarChartIcon from '@mui/icons-material/BarChart';
import HistoryIcon from '@mui/icons-material/History';

const Sidebar: React.FC = () => {
    const location = useLocation();

    const navItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
        { text: 'Containers', icon: <InventoryIcon />, path: '/containers' },
        { text: 'Items', icon: <CategoryIcon />, path: '/items' },
        { text: 'Placement', icon: <MoveToInboxIcon />, path: '/placement' },
        { text: 'Reports', icon: <BarChartIcon />, path: '/reports' },
        { text: 'History', icon: <HistoryIcon />, path: '/history' },
    ];

    return (
        <Drawer
            sx={{
                width: 240,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: 240,
                    boxSizing: 'border-box',
                    top: '64px',
                    height: 'calc(100% - 64px)',
                },
            }}
            variant="permanent"
            anchor="left"
        >
            <List>
                {navItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton
                            component={Link}
                            to={item.path}
                            selected={location.pathname === item.path}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Drawer>
    );
};

export default Sidebar;