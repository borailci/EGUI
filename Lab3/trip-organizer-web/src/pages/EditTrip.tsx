import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Alert,
    CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tripService } from '../services/api';
import { Trip, UpdateTripRequest } from '../types/api';

export const EditTrip = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [trip, setTrip] = useState<Trip | null>(null);
    const [formData, setFormData] = useState<UpdateTripRequest>({
        name: '',
        description: '',
        destination: '',
        startDate: '',
        endDate: '',
        capacity: 1,
        price: 0,
    });

    useEffect(() => {
        const fetchTrip = async () => {
            try {
                if (!id) return;
                const fetchedTrip = await tripService.getTripById(parseInt(id));
                setTrip(fetchedTrip);
                setFormData({
                    name: fetchedTrip.name,
                    description: fetchedTrip.description,
                    destination: fetchedTrip.destination,
                    startDate: fetchedTrip.startDate,
                    endDate: fetchedTrip.endDate,
                    capacity: fetchedTrip.capacity,
                    price: fetchedTrip.price,
                });
            } catch (err) {
                setError('Failed to load trip details');
                console.error('Error loading trip:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTrip();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (!formData.startDate || !formData.endDate) {
            setError('Please select both start and end dates');
            return;
        }

        try {
            if (!id) return;
            await tripService.updateTrip(parseInt(id), formData);
            navigate('/trips');
        } catch (err) {
            setError('Failed to update trip');
            console.error('Error updating trip:', err);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'capacity' || name === 'price' ? Number(value) : value
        }));
    };

    const handleDateChange = (field: 'startDate' | 'endDate', date: Date | null) => {
        if (date) {
            setFormData(prev => ({
                ...prev,
                [field]: date.toISOString()
            }));
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!trip) {
        return (
            <Container maxWidth="md">
                <Alert severity="error">Trip not found</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="md">
            <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Edit Trip
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                            <TextField
                        fullWidth
                        label="Name"
                        name="name"
                        value={formData.name}
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

                            <TextField
                                fullWidth
                                label="Destination"
                        name="destination"
                        value={formData.destination}
                        onChange={handleChange}
                        margin="normal"
                                required
                            />

                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <Box sx={{ mt: 2, mb: 2 }}>
                                <DatePicker
                                    label="Start Date"
                                value={formData.startDate ? new Date(formData.startDate) : null}
                                onChange={(date) => handleDateChange('startDate', date)}
                                sx={{ width: '100%', mb: 2 }}
                                />
                                <DatePicker
                                    label="End Date"
                                value={formData.endDate ? new Date(formData.endDate) : null}
                                onChange={(date) => handleDateChange('endDate', date)}
                                sx={{ width: '100%' }}
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
                                inputProps={{ min: trip.currentParticipantCount }}
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

                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            size="large"
                        >
                            Update Trip
                        </Button>
                        <Button
                            variant="outlined"
                            color="secondary"
                            size="large"
                            onClick={() => navigate('/trips')}
                        >
                            Cancel
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Container>
    );
}; 