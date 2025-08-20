import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { Trip } from '../types/api';
import { useAuth } from '../contexts/AuthContext';

export const EditTrip: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [trip, setTrip] = useState<Trip | null>(null);
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
    const { user } = useAuth();

    useEffect(() => {
        const loadTrip = async () => {
            try {
                const data = await tripService.getFutureTrips();
                const tripData = data.find(t => t.id === Number(id));
                if (tripData) {
                    const isOwner = tripData.ownerId === user?.id;
                    const isCoOwner = tripData.coOwners?.some(coOwner => coOwner.id === user?.id) ?? false;
                    
                    if (!isOwner && !isCoOwner) {
                        setError('You do not have permission to edit this trip');
                        return;
                    }

                    setTrip(tripData);
                    setName(tripData.name);
                    setDestination(tripData.destination);
                    setDescription(tripData.description);
                    setStartDate(new Date(tripData.startDate));
                    setEndDate(new Date(tripData.endDate));
                    setCapacity(tripData.capacity.toString());
                    setPrice(tripData.price.toString());
                } else {
                    setError('Trip not found');
                }
            } catch (err) {
                setError('Failed to load trip');
            }
        };

        loadTrip();
    }, [id, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!startDate || !endDate) {
            setError('Please select both start and end dates');
            return;
        }

        if (startDate > endDate) {
            setError('End date must be after start date');
            return;
        }

        try {
            setError('');
            setLoading(true);
            await tripService.updateTrip(Number(id), {
                name,
                destination,
                description,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                capacity: parseInt(capacity),
                price: parseFloat(price),
            });
            navigate('/trips');
        } catch (err) {
            setError('Failed to update trip');
        } finally {
            setLoading(false);
        }
    };

    if (!trip) {
        return (
            <Container>
                <Alert severity="error" sx={{ mt: 4 }}>
                    {error || 'Loading...'}
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="md">
            <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    Edit Trip
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
                                inputProps={{ min: trip.currentParticipantCount }}
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
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}; 