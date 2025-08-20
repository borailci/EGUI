import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Alert,

} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tripService } from '../services/api';

interface ApiError {
    response?: {
        status: number;
        data: any;
        headers: any;
    };
    request?: any;
    message: string;
    config?: {
        url?: string;
        method?: string;
        headers?: any;
    };
}

export const CreateTrip: React.FC = () => {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        destination: '',
        description: '',
        startDate: new Date(),
        endDate: new Date(),
        capacity: 1,
        price: 0
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'capacity' || name === 'price' ? Number(value) : value
        }));
    };

    const handleDateChange = (name: string) => (date: Date | null) => {
        if (date) {
            setFormData(prev => ({
                ...prev,
                [name]: date
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            const trip = {
                ...formData,
                startDate: formData.startDate.toISOString(),
                endDate: formData.endDate.toISOString()
            };

            await tripService.createTrip(trip);
            navigate('/trips');
        } catch (err) {
            console.error('Trip creation error in component:', err);
            
            const apiError = err as ApiError;
                console.error('API Error Details:', {
                status: apiError.response?.status,
                data: apiError.response?.data,
                message: apiError.message,
                headers: apiError.response?.headers
                });
                
            if (apiError.response?.status === 401) {
                    setError('You must be logged in to create a trip');
            } else if (apiError.response?.status === 400) {
                const errorMessage = apiError.response.data?.message || 'Invalid trip data';
                    setError(errorMessage);
            } else if (apiError.response?.status === 500) {
                console.error('Server error details:', apiError.response.data);
                    setError('Server error occurred. Please check if the backend is running and try again.');
            } else if (!apiError.response) {
                    setError('Cannot connect to the server. Please check if the backend is running.');
            } else {
                setError(apiError.response.data?.message || 'Failed to create trip. Please try again later.');
            }
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Create New Trip
                </Typography>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                <Box component="form" onSubmit={handleSubmit} noValidate>
                            <TextField
                                fullWidth
                                label="Trip Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        margin="normal"
                        required
                    />
                            <TextField
                                fullWidth
                                label="Destination"
                        name="destination"
                        value={formData.destination}
                        onChange={handleChange}
                        margin="normal"
                        required
                    />
                            <TextField
                                fullWidth
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        margin="normal"
                                multiline
                                rows={4}
                        required
                            />
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <Box sx={{ mt: 2, mb: 2 }}>
                                <DatePicker
                                    label="Start Date"
                                value={formData.startDate}
                                onChange={handleDateChange('startDate')}
                                sx={{ mr: 2 }}
                                />
                                <DatePicker
                                    label="End Date"
                                value={formData.endDate}
                                onChange={handleDateChange('endDate')}
                                />
                        </Box>
                            </LocalizationProvider>
                            <TextField
                                fullWidth
                        label="Capacity"
                        name="capacity"
                                type="number"
                        value={formData.capacity}
                        onChange={handleChange}
                        margin="normal"
                        required
                                inputProps={{ min: 1 }}
                            />
                            <TextField
                                fullWidth
                        label="Price"
                        name="price"
                                type="number"
                        value={formData.price}
                        onChange={handleChange}
                        margin="normal"
                        required
                                inputProps={{ min: 0, step: 0.01 }}
                            />
                        <Button
                            type="submit"
                            variant="contained"
                        color="primary"
                        fullWidth
                        sx={{ mt: 3 }}
                        >
                        Create Trip
                        </Button>
                </Box>
            </Paper>
        </Container>
    );
}; 