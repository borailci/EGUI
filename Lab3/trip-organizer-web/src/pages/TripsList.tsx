import React, { useEffect, useState } from 'react';
import {
    Container,
    Grid,
    Card,
    CardContent,
    CardActions,
    Typography,
    Button,
    Box,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    CardMedia,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Divider,
    Paper,
    TextField
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Trip } from '../types/api';
import { tripService } from '../services/api';
import { imageService } from '../services/imageService';
import { useAuth } from '../contexts/AuthContext';
import { 
    Add as AddIcon, 
    Delete as DeleteIcon, 
    Edit as EditIcon,
    PersonAdd as PersonAddIcon,
    PersonRemove as PersonRemoveIcon,
    People as PeopleIcon
} from '@mui/icons-material';

export const TripsList: React.FC = () => {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [coOwnersDialogOpen, setCoOwnersDialogOpen] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [activeTab, setActiveTab] = useState(0);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
    const [newTrip, setNewTrip] = useState({
        name: '',
        destination: '',
        startDate: '',
        endDate: '',
        price: 0,
        capacity: 0,
        description: ''
    });
    const navigate = useNavigate();
    const { user } = useAuth();

    const loadTrips = async () => {
        try {
            const data = await tripService.getFutureTrips();
            setTrips(data);
        } catch (err) {
            console.error('Failed to load trips:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTrips();
    }, []);

    const isTripPast = (trip: Trip) => {
        return new Date(trip.endDate) < new Date();
    };

    const filteredTrips = trips.filter(trip => {
        switch (activeTab) {
            case 0: // All Trips
                return true;
            case 1: // My Trips
                return user && (trip.ownerId === user.id || trip.participants.some(p => p.id === user.id));
            case 2: // Past Trips
                return isTripPast(trip);
            default:
                return true;
        }
    });

    const handleJoinTrip = async (tripId: number) => {
        try {
            await tripService.joinTrip(tripId);
            await loadTrips();
        } catch (err) {
            console.error('Failed to join trip:', err);
        }
    };

    const handleLeaveTrip = async (tripId: number) => {
        try {
            await tripService.leaveTrip(tripId);
            await loadTrips();
        } catch (err) {
            console.error('Failed to leave trip:', err);
        }
    };

    const handleDeleteClick = async (trip: Trip) => {
        try {
            await tripService.deleteTrip(trip.id);
            setTrips(trips.filter(t => t.id !== trip.id));
        } catch (err) {
            console.error('Failed to delete trip:', err);
        }
    };

    const handleManageCoOwners = async (trip: Trip) => {
        try {
            const updatedTrip = await tripService.getTripById(trip.id);
            setSelectedTrip(updatedTrip);
            setCoOwnersDialogOpen(true);
        } catch (err) {
            console.error('Failed to load trip details:', err);
        }
    };

    const handleAddCoOwner = async (tripId: number, userId: string) => {
        if (!selectedTrip) return;
        try {
            await tripService.addCoOwner(tripId, userId);
            const updatedTrip = await tripService.getTripById(tripId);
            setSelectedTrip(updatedTrip);
            setTrips(trips.map(trip => 
                trip.id === tripId ? updatedTrip : trip
            ));
        } catch (err) {
            console.error('Failed to add co-owner:', err);
        }
    };

    const handleRemoveCoOwner = async (tripId: number, userId: string) => {
        if (!selectedTrip) return;
        try {
            await tripService.removeCoOwner(tripId, userId);
            const updatedTrip = await tripService.getTripById(tripId);
            setSelectedTrip(updatedTrip);
            setTrips(trips.map(trip => 
                trip.id === tripId ? updatedTrip : trip
            ));
        } catch (err) {
            console.error('Failed to remove co-owner:', err);
        }
    };

    const handleOpenCreateDialog = () => {
        const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
        setCreateDialogOpen(true);
        setEditingTrip(null);
        setNewTrip({
            name: '',
            destination: '',
            startDate: today,
            endDate: today,
            price: 0,
            capacity: 0,
            description: ''
        });
    };

    const handleCloseCreateDialog = () => {
        setCreateDialogOpen(false);
    };

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStartDate = e.target.value;
        setNewTrip(prev => {
            // If the new start date is after the current end date, update end date to start date
            const endDate = new Date(newStartDate) > new Date(prev.endDate) ? newStartDate : prev.endDate;
            return { ...prev, startDate: newStartDate, endDate };
        });
    };

    const handleCreateTrip = async () => {
        if (editingTrip) {
            try {
                await tripService.updateTrip(editingTrip.id, newTrip);
                setTrips(trips.map(trip =>
                    trip.id === editingTrip.id ? { ...editingTrip, ...newTrip } : trip
                ));
            } catch (err) {
                console.error('Failed to update trip:', err);
            } finally {
                setEditingTrip(null);
                setCreateDialogOpen(false);
            }
        } else {
            try {
                const newTripData = { ...newTrip, startDate: new Date(newTrip.startDate).toISOString(), endDate: new Date(newTrip.endDate).toISOString() };
                const createdTrip = await tripService.createTrip(newTripData);
                setTrips([...trips, createdTrip]);
            } catch (err) {
                console.error('Failed to create trip:', err);
            } finally {
                setNewTrip({
                    name: '',
                    destination: '',
                    startDate: '',
                    endDate: '',
                    price: 0,
                    capacity: 0,
                    description: ''
                });
                setCreateDialogOpen(false);
            }
        }
    };

    const handleOpenEditDialog = (trip: Trip) => {
        setEditingTrip(trip);
        setNewTrip({
            name: trip.name,
            destination: trip.destination,
            startDate: trip.startDate,
            endDate: trip.endDate,
            price: trip.price,
            capacity: trip.capacity,
            description: trip.description
        });
        setCreateDialogOpen(true);
    };

    const handleJoinLeaveTrip = async (trip: Trip) => {
        if (trip.participants.some(p => p.id === user?.id)) {
            await handleLeaveTrip(trip.id);
        } else {
            await handleJoinTrip(trip.id);
        }
    };

    if (loading) {
        return (
            <Box 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                minHeight="80vh"
            >
                <CircularProgress size={60} thickness={4} />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h4" component="h1" gutterBottom>
                                Trips
                            </Typography>
                            {user && (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<AddIcon />}
                                    onClick={handleOpenCreateDialog}
                                >
                                    Create Trip
                                </Button>
                            )}
                        </Box>
                        <Tabs 
                            value={activeTab}
                            onChange={(_, newValue) => setActiveTab(newValue)}
                            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
                        >
                            <Tab label="All Trips" />
                            {user && <Tab label="My Trips" />}
                            <Tab label="Past Trips" />
                        </Tabs>
                        <Grid container spacing={2}>
                            {filteredTrips.map((trip) => (
                                <Grid item xs={12} sm={6} md={4} key={trip.id}>
                                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        <CardMedia
                                            component="img"
                                            height="140"
                                            image={imageService.getDestinationImage(trip.destination)}
                                            alt={trip.name}
                                        />
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            <Typography gutterBottom variant="h5" component="h2">
                                                {trip.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                {trip.destination}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Price: ${trip.price}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Participants: {trip.participants.length}/{trip.capacity}
                                            </Typography>
                                        </CardContent>
                                        <CardActions>
                                            {user ? (
                                                <>
                                                    {(trip.ownerId === user.id || trip.coOwners.some(co => co.id === user.id)) ? (
                                                        <>
                                                            <Button
                                                                size="small"
                                                                startIcon={<EditIcon />}
                                                                onClick={() => handleOpenEditDialog(trip)}
                                                            >
                                                                Edit
                                                            </Button>
                                                            {trip.ownerId === user.id ? (
                                                                <>
                                                                    <Button
                                                                        size="small"
                                                                        startIcon={<DeleteIcon />}
                                                                        onClick={() => handleDeleteClick(trip)}
                                                                        color="error"
                                                                    >
                                                                        Delete
                                                                    </Button>
                                                                    <Button
                                                                        size="small"
                                                                        startIcon={<PeopleIcon />}
                                                                        onClick={() => handleManageCoOwners(trip)}
                                                                    >
                                                                        Co-Owners
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <Button
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => handleLeaveTrip(trip.id)}
                                                                >
                                                                    Leave
                                                                </Button>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <Button
                                                            size="small"
                                                            color={trip.participants.some(p => p.id === user.id) ? "error" : "primary"}
                                                            onClick={() => handleJoinLeaveTrip(trip)}
                                                        >
                                                            {trip.participants.some(p => p.id === user.id) ? "Leave" : "Join"}
                                                        </Button>
                                                    )}
                                                </>
                                            ) : (
                                                <Button
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => navigate('/login')}
                                                >
                                                    Login to Join
                                                </Button>
                                            )}
                                        </CardActions>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>

            {/* Create/Edit Trip Dialog */}
            <Dialog open={createDialogOpen} onClose={handleCloseCreateDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingTrip ? 'Edit Trip' : 'Create New Trip'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <TextField
                            label="Trip Name"
                            value={newTrip.name}
                            onChange={(e) => setNewTrip({ ...newTrip, name: e.target.value })}
                            placeholder="Enter a descriptive name for your trip"
                            fullWidth
                            required
                        />
                        <TextField
                            label="Destination"
                            value={newTrip.destination}
                            onChange={(e) => setNewTrip({ ...newTrip, destination: e.target.value })}
                            placeholder="e.g., Paris, Tokyo, Bali"
                            fullWidth
                            required
                        />
                        <TextField
                            label="Start Date"
                            type="date"
                            value={newTrip.startDate}
                            onChange={handleStartDateChange}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ min: new Date().toISOString().split('T')[0] }}
                            fullWidth
                            required
                        />
                        <TextField
                            label="End Date"
                            type="date"
                            value={newTrip.endDate}
                            onChange={(e) => setNewTrip({ ...newTrip, endDate: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ min: newTrip.startDate }}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Price"
                            type="number"
                            value={newTrip.price}
                            onChange={(e) => setNewTrip({ ...newTrip, price: Number(e.target.value) })}
                            placeholder="Enter price in USD"
                            fullWidth
                            required
                            InputProps={{
                                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                            }}
                        />
                        <TextField
                            label="Capacity"
                            type="number"
                            value={newTrip.capacity}
                            onChange={(e) => setNewTrip({ ...newTrip, capacity: Number(e.target.value) })}
                            placeholder="Maximum number of participants"
                            fullWidth
                            required
                        />
                        <TextField
                            label="Description"
                            value={newTrip.description}
                            onChange={(e) => setNewTrip({ ...newTrip, description: e.target.value })}
                            placeholder="Describe your trip, include activities, accommodations, and any special requirements"
                            multiline
                            rows={4}
                            fullWidth
                            required
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCreateDialog}>Cancel</Button>
                    <Button 
                        onClick={handleCreateTrip} 
                        variant="contained" 
                        color="primary"
                        disabled={!newTrip.name || !newTrip.destination || !newTrip.startDate || !newTrip.endDate || !newTrip.price || !newTrip.capacity || !newTrip.description || new Date(newTrip.endDate) < new Date(newTrip.startDate)}
                    >
                        {editingTrip ? 'Update Trip' : 'Create Trip'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Co-Owners Management Dialog */}
            <Dialog open={coOwnersDialogOpen} onClose={() => setCoOwnersDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Manage Co-Owners</DialogTitle>
                <DialogContent>
                    {selectedTrip && (
                        <>
                            <Typography variant="h6" gutterBottom>
                                Current Co-Owners
                            </Typography>
                            <List>
                                {selectedTrip.coOwners.map((coOwner) => (
                                    <ListItem key={coOwner.id}>
                                        <ListItemText primary={coOwner.email} />
                                        <ListItemSecondaryAction>
                                            <IconButton
                                                edge="end"
                                                onClick={() => handleRemoveCoOwner(selectedTrip.id, coOwner.id)}
                                            >
                                                <PersonRemoveIcon />
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}
                            </List>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                Add Co-Owner from Participants
                            </Typography>
                            <List>
                                {selectedTrip.participants
                                    .filter(participant => 
                                        participant.id !== selectedTrip.ownerId && 
                                        !selectedTrip.coOwners.some(coOwner => coOwner.id === participant.id)
                                    )
                                    .map((participant) => (
                                        <ListItem key={participant.id}>
                                            <ListItemText primary={participant.email} />
                                            <ListItemSecondaryAction>
                                                <IconButton
                                                    edge="end"
                                                    onClick={() => handleAddCoOwner(selectedTrip.id, participant.id)}
                                                >
                                                    <PersonAddIcon />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                            </List>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCoOwnersDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}; 