import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    Tabs,
    Tab,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

export const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
        if (newValue === '/logout') {
            logout();
            navigate('/login');
        } else {
            navigate(newValue);
        }
    };

    const isAuthenticatedRoute = ['/trips', '/profile', '/logout'].includes(location.pathname);

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
                        {isAuthenticatedRoute && (
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
                                <Tab label="Logout" value="/logout" />
                            </Tabs>
                        )}
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