import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    IconButton,
    Menu,
    MenuItem,
    Avatar,
    Box,
    Tabs,
    Tab,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

export const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleProfile = () => {
        handleClose();
        navigate('/profile');
    };

    const handleLogout = () => {
        handleClose();
        logout();
        navigate('/login');
    };

    const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
        navigate(newValue);
    };

    return (
        <AppBar position="static" sx={{ background: 'linear-gradient(45deg, #000000 30%, #333333 90%)' }}>
            <Toolbar>
                <Typography 
                    variant="h6" 
                    component="div" 
                    sx={{ 
                        flexGrow: 1,
                        color: '#FFD700',
                        fontWeight: 'bold',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                    }}
                >
                    TripMarket
                </Typography>
                {user ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Tabs 
                            value={location.pathname} 
                            onChange={handleTabChange}
                            textColor="inherit"
                            indicatorColor="secondary"
                            sx={{
                                '& .MuiTab-root': {
                                    color: '#FFD700',
                                    '&.Mui-selected': {
                                        color: '#FFD700',
                                        fontWeight: 'bold'
                                    }
                                }
                            }}
                        >
                            <Tab label="Trips" value="/trips" />
                            <Tab label="Profile" value="/profile" />
                        </Tabs>
                        <Typography variant="body1" sx={{ color: '#FFD700' }}>
                            Welcome, {user.fullName}!
                        </Typography>
                        <IconButton
                            size="large"
                            aria-label="account of current user"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleMenu}
                            sx={{ color: '#FFD700' }}
                        >
                            <Avatar sx={{ bgcolor: '#FFD700', color: '#000000' }}>
                                {user.fullName.charAt(0).toUpperCase()}
                            </Avatar>
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorEl}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                        >
                            <MenuItem onClick={handleProfile}>Profile</MenuItem>
                            <MenuItem onClick={handleLogout}>Logout</MenuItem>
                        </Menu>
                    </Box>
                ) : (
                    <Box>
                        <Button 
                            color="inherit" 
                            onClick={() => navigate('/login')}
                            sx={{ color: '#FFD700' }}
                        >
                            Login
                        </Button>
                        <Button 
                            color="inherit" 
                            onClick={() => navigate('/register')}
                            sx={{ color: '#FFD700' }}
                        >
                            Register
                        </Button>
                    </Box>
                )}
            </Toolbar>
        </AppBar>
    );
}; 