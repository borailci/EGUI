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
    Grid,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tripService } from '../services/api';
import axios from 'axios';

export const CreateTrip: React.FC = () => {
    const [name, setName] = useState('');
    const [destination, setDestination] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [capacity, setCapacity] = useState('');
    const [price, setPrice] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!name || !destination || !description || !startDate || !endDate || !capacity || !price) {
            setError('All fields are required');
            return;
        }

        if (!startDate || !endDate) {
            setError('Please select both start and end dates');
            return;
        }

        if (startDate > endDate) {
            setError('End date must be after start date');
            return;
        }

        const capacityNum = parseInt(capacity);
        if (isNaN(capacityNum) || capacityNum < 1) {
            setError('Capacity must be at least 1');
            return;
        }

        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum < 0) {
            setError('Price must be a positive number');
            return;
        }

        try {
            setError('');
            setLoading(true);
            
            const tripData = {
                name,
                destination,
                description,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                capacity: capacityNum,
                price: priceNum
            };
            
            await tripService.createTrip(tripData);
            navigate('/trips');
        } catch (err) {
            console.error('Trip creation error in component:', err);
            
            if (axios.isAxiosError(err)) {
                console.error('API Error Details:', {
                    status: err.response?.status,
                    data: err.response?.data,
                    message: err.message,
                    headers: err.response?.headers
                });
                
                if (err.response?.status === 401) {
                    setError('You must be logged in to create a trip');
                } else if (err.response?.status === 400) {
                    const errorMessage = err.response.data?.message || 'Invalid trip data';
                    setError(errorMessage);
                } else if (err.response?.status === 500) {
                    console.error('Server error details:', err.response.data);
                    setError('Server error occurred. Please check if the backend is running and try again.');
                } else if (!err.response) {
                    setError('Cannot connect to the server. Please check if the backend is running.');
                } else {
                    setError(err.response.data?.message || 'Failed to create trip. Please try again later.');
                }
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unexpected error occurred. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md">
            <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    Create New Trip
                </Typography>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                required
                                fullWidth
                                label="Trip Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                required
                                fullWidth
                                label="Destination"
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                required
                                fullWidth
                                multiline
                                rows={4}
                                label="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="Start Date"
                                    value={startDate}
                                    onChange={(newValue) => setStartDate(newValue)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            required: true,
                                        },
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="End Date"
                                    value={endDate}
                                    onChange={(newValue) => setEndDate(newValue)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            required: true,
                                        },
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                type="number"
                                label="Capacity"
                                value={capacity}
                                onChange={(e) => setCapacity(e.target.value)}
                                inputProps={{ min: 1 }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                type="number"
                                label="Price"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                inputProps={{ min: 0, step: 0.01 }}
                            />
                        </Grid>
                    </Grid>
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/trips')}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Trip'}
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}; 