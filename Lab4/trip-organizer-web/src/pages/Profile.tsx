import React, { useState, useEffect } from 'react';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Alert,
    CircularProgress,
    Avatar,
    Grid,
    Divider,
    useTheme,
    alpha
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';

export const Profile: React.FC = () => {
    const { user, updateUser } = useAuth();
    const theme = useTheme();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                fullName: user.fullName || '',
                email: user.email || ''
            }));
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Validate passwords if changing password
            if (formData.newPassword) {
                if (formData.newPassword !== formData.confirmPassword) {
                    throw new Error('New passwords do not match');
                }
                if (formData.newPassword.length < 6) {
                    throw new Error('New password must be at least 6 characters long');
                }
            }

            // Update profile
            const updatedUser = await authService.updateProfile({
                fullName: formData.fullName,
                email: formData.email,
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });

            // Update local user state
            updateUser(updatedUser);

            setSuccess('Profile updated successfully');
            
            // Clear password fields
            setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <Container maxWidth="md">
                <Box sx={{ py: 4 }}>
                    <Alert severity="error">Please log in to view your profile</Alert>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="md">
            <Box sx={{ py: 4 }}>
                <Paper 
                    elevation={3} 
                    sx={{ 
                        p: 4,
                        borderRadius: 2,
                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                        color: 'white',
                        mb: 4
                    }}
                >
                    <Box display="flex" alignItems="center" gap={2}>
                        <Avatar 
                            sx={{ 
                                width: 80, 
                                height: 80,
                                bgcolor: alpha(theme.palette.secondary.main, 0.2),
                                border: `2px solid ${theme.palette.secondary.main}`
                            }}
                        >
                            {user.fullName?.charAt(0) || user.email?.charAt(0)}
                        </Avatar>
                        <Box>
                            <Typography variant="h4" component="h1" gutterBottom>
                                {user.fullName || 'User'}
                            </Typography>
                            <Typography variant="body1">
                                {user.email}
                            </Typography>
                        </Box>
                    </Box>
                </Paper>

                <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                    <Typography variant="h5" component="h2" gutterBottom>
                        Update Profile
                    </Typography>

                    {error && (
                        <Alert 
                            severity="error" 
                            sx={{ mb: 2 }}
                            onClose={() => setError('')}
                        >
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert 
                            severity="success" 
                            sx={{ mb: 2 }}
                            onClose={() => setSuccess('')}
                        >
                            {success}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} role="form">
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Full Name"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }}>
                                    <Typography color="textSecondary">
                                        Change Password (Optional)
                                    </Typography>
                                </Divider>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Current Password"
                                    name="currentPassword"
                                    type="password"
                                    value={formData.currentPassword}
                                    onChange={handleChange}
                                    helperText="Required only if changing password"
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="New Password"
                                    name="newPassword"
                                    type="password"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    helperText="Leave blank to keep current password"
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Confirm New Password"
                                    name="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    error={formData.newPassword !== formData.confirmPassword}
                                    helperText={
                                        formData.newPassword !== formData.confirmPassword
                                            ? "Passwords don't match"
                                            : " "
                                    }
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    disabled={loading}
                                    sx={{ mt: 2 }}
                                >
                                    {loading ? (
                                        <CircularProgress size={24} color="inherit" />
                                    ) : (
                                        'Update Profile'
                                    )}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </Paper>
            </Box>
        </Container>
    );
}; 