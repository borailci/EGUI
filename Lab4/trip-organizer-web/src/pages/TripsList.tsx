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
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Chip,
    CardMedia,
    Fade,
    Zoom,
    useTheme,
    alpha,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Divider
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
    LocationOn as LocationIcon,
    CalendarToday as CalendarIcon,
    AttachMoney as MoneyIcon,
    Group as GroupIcon,
    Description as DescriptionIcon,
    PersonAdd as PersonAddIcon,
    PersonRemove as PersonRemoveIcon,
    People as PeopleIcon
} from '@mui/icons-material';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`trips-tabpanel-${index}`}
            aria-labelledby={`trips-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export const TripsList: React.FC = () => {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
    const [tabValue, setTabValue] = useState(0);
    const [coOwnersDialogOpen, setCoOwnersDialogOpen] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const navigate = useNavigate();
    const { user } = useAuth();
    const theme = useTheme();

    const loadTrips = async () => {
        try {
            const data = await tripService.getFutureTrips();
            setTrips(data);
        } catch (err) {
            setError('Failed to load trips');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTrips();
    }, []);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });
    };

    const isTripPast = (trip: Trip) => {
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Set to end of day
        const tripEndDate = new Date(trip.endDate);
        tripEndDate.setHours(23, 59, 59, 999); // Set to end of day
        return tripEndDate <= today;
    };

    const currentTrips = trips.filter((trip: Trip) => !isTripPast(trip));
    const pastTrips = trips.filter((trip: Trip) => isTripPast(trip));

    const handleJoinTrip = async (tripId: number) => {
        try {
            await tripService.joinTrip(tripId);
            await loadTrips(); // Reload trips to update the UI
        } catch (err) {
            setError('Failed to join trip');
        }
    };

    const handleLeaveTrip = async (tripId: number) => {
        try {
            await tripService.leaveTrip(tripId);
            
            // Immediately update the local state to reflect changes
            setTrips(trips.map((trip: Trip) => {
                if (trip.id === tripId) {
                    // Remove user from participants
                    const updatedParticipants = trip.participants.filter((p: { id: string }) => p.id !== user?.id);
                    
                    // Remove user from coOwners if they were a co-owner
                    const updatedCoOwners = trip.coOwners.filter((co: { id: string }) => co.id !== user?.id);
                    
                    return {
                        ...trip,
                        participants: updatedParticipants,
                        coOwners: updatedCoOwners,
                        currentParticipantCount: trip.currentParticipantCount - 1
                    };
                }
                return trip;
            }));
            
            // Also reload from server to ensure consistency
            loadTrips();
            setError('');
        } catch (err) {
            setError('Failed to leave trip');
        }
    };

    const isOwner = (trip: Trip) => {
        return trip.ownerId === user?.id;
    };

    const isCoOwner = (trip: Trip) => {
        return trip.coOwners?.some((coOwner: { id: string }) => coOwner.id === user?.id) ?? false;
    };

    const isParticipant = (trip: Trip) => {
        return trip.participants.some((p: { id: string }) => p.id === user?.id);
    };

    const canEdit = (trip: Trip) => {
        return isOwner(trip) || isCoOwner(trip);
    };

    const handleDeleteClick = (trip: Trip) => {
        setTripToDelete(trip);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!tripToDelete) return;

        try {
            await tripService.deleteTrip(tripToDelete.id);
            setTrips(trips.filter((trip: Trip) => trip.id !== tripToDelete.id));
            setError('');
        } catch (err) {
            setError('Failed to delete trip');
        } finally {
            setDeleteDialogOpen(false);
            setTripToDelete(null);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setTripToDelete(null);
    };

    const handleManageCoOwners = async (trip: Trip) => {
        try {
            const updatedTrip = await tripService.getTrip(trip.id);
            setSelectedTrip(updatedTrip);
            setCoOwnersDialogOpen(true);
        } catch (err) {
            setError('Failed to load trip details');
        }
    };

    const handleAddCoOwner = async (tripId: number, userId: string) => {
        if (!selectedTrip) return;
        try {
            await tripService.addCoOwner(tripId, userId);
            const updatedTrip = await tripService.getTrip(tripId);
            setSelectedTrip(updatedTrip);
            setTrips(trips.map((trip: Trip) => 
                trip.id === tripId ? updatedTrip : trip
            ));
        } catch (err) {
            setError('Failed to add co-owner');
        }
    };

    const handleRemoveCoOwner = async (tripId: number, userId: string) => {
        if (!selectedTrip) return;
        try {
            await tripService.removeCoOwner(tripId, userId);
            const updatedTrip = await tripService.getTrip(tripId);
            setSelectedTrip(updatedTrip);
            setTrips(trips.map((trip: Trip) => 
                trip.id === tripId ? updatedTrip : trip
            ));
        } catch (err) {
            setError('Failed to remove co-owner');
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
        <Container maxWidth="lg">
            <Fade in={true} timeout={1000}>
                <Box sx={{ py: 4 }}>
                    <Box 
                        display="flex" 
                        justifyContent="space-between" 
                        alignItems="center" 
                        mb={4}
                        sx={{
                            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                            p: 3,
                            borderRadius: 2,
                            color: 'white',
                            boxShadow: 3
                        }}
                    >
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                            Your Trips
                        </Typography>
                        <Button
                            variant="contained"
                            color="secondary"
                            startIcon={<AddIcon />}
                            onClick={() => navigate('/trips/create')}
                            sx={{
                                backgroundColor: 'white',
                                color: theme.palette.primary.main,
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                }
                            }}
                        >
                            Create New Trip
                        </Button>
                    </Box>

                    {error && (
                        <Alert 
                            severity="error" 
                            sx={{ 
                                mb: 2,
                                animation: 'shake 0.5s ease-in-out'
                            }}
                        >
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs 
                            value={tabValue} 
                            onChange={handleTabChange}
                            sx={{
                                '& .MuiTab-root': {
                                    fontSize: '1.1rem',
                                    fontWeight: 500,
                                }
                            }}
                        >
                            <Tab label={`Upcoming Trips (${currentTrips.length})`} />
                            <Tab label={`Past Trips (${pastTrips.length})`} />
                        </Tabs>
                    </Box>

                    <TabPanel value={tabValue} index={0}>
                        <Grid container spacing={3}>
                            {currentTrips.map((trip: Trip, index: number) => (
                                <Grid item xs={12} sm={6} md={4} key={trip.id}>
                                    <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
                                        <Card 
                                            sx={{ 
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                transition: 'transform 0.2s',
                                                '&:hover': {
                                                    transform: 'translateY(-4px)',
                                                    boxShadow: 6
                                                }
                                            }}
                                        >
                                            <CardMedia
                                                component="img"
                                                height="200"
                                                image={imageService.getTripImage(trip.name, trip.destination)}
                                                alt={trip.name}
                                                sx={{
                                                    height: 200,
                                                    width: '100%',
                                                    objectFit: 'cover',
                                                    transition: 'transform 0.3s ease',
                                                    '&:hover': {
                                                        transform: 'scale(1.05)'
                                                    }
                                                }}
                                            />
                                            <CardContent sx={{ flexGrow: 1 }}>
                                                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                                                    {trip.name}
                                                </Typography>
                                                
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <LocationIcon color="primary" sx={{ mr: 1 }} />
                                                    <Typography color="textSecondary">
                                                        {trip.destination}
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <CalendarIcon color="primary" sx={{ mr: 1 }} />
                                                    <Typography variant="body2">
                                                        {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <MoneyIcon color="primary" sx={{ mr: 1 }} />
                                                    <Typography variant="body2">
                                                        ${trip.price}
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <GroupIcon color="primary" sx={{ mr: 1 }} />
                                                    <Typography variant="body2">
                                                        {trip.currentParticipantCount}/{trip.capacity} participants
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ mt: 2 }}>
                                                    <Typography variant="body2" color="textSecondary">
                                                        <DescriptionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                                        {trip.description}
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                    {trip.hasAvailableSpots && (
                                                        <Chip 
                                                            label="Spots Available" 
                                                            color="success" 
                                                            size="small" 
                                                        />
                                                    )}
                                                    {isOwner(trip) && (
                                                        <Chip 
                                                            label="You Own This Trip" 
                                                            color="primary" 
                                                            size="small" 
                                                        />
                                                    )}
                                                    {isCoOwner(trip) && (
                                                        <Chip 
                                                            label="You're a Co-Owner" 
                                                            color="info" 
                                                            size="small" 
                                                        />
                                                    )}
                                                    {isParticipant(trip) && (
                                                        <Chip 
                                                            label="You're Participating" 
                                                            color="secondary" 
                                                            size="small" 
                                                        />
                                                    )}
                                                </Box>
                                            </CardContent>
                                            <CardActions>
                                                {canEdit(trip) && (
                                                    <Button
                                                        size="small"
                                                        startIcon={<EditIcon />}
                                                        onClick={() => navigate(`/trips/${trip.id}/edit`)}
                                                    >
                                                        Edit
                                                    </Button>
                                                )}
                                                {isOwner(trip) && (
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
                                                            Manage Co-Owners
                                                        </Button>
                                                    </>
                                                )}
                                                {!isOwner(trip) && !isParticipant(trip) && (
                                                    <Button
                                                        size="small"
                                                        startIcon={<AddIcon />}
                                                        onClick={() => handleJoinTrip(trip.id)}
                                                        disabled={trip.participants.length >= trip.capacity}
                                                    >
                                                        Join Trip
                                                    </Button>
                                                )}
                                                {!isOwner(trip) && isParticipant(trip) && (
                                                    <Button
                                                        size="small"
                                                        startIcon={<DeleteIcon />}
                                                        onClick={() => handleLeaveTrip(trip.id)}
                                                        color="error"
                                                    >
                                                        Leave Trip
                                                    </Button>
                                                )}
                                            </CardActions>
                                        </Card>
                                    </Zoom>
                                </Grid>
                            ))}
                        </Grid>
                    </TabPanel>

                    <TabPanel value={tabValue} index={1}>
                        <Grid container spacing={3}>
                            {pastTrips.map((trip: Trip, index: number) => (
                                <Grid item xs={12} sm={6} md={4} key={trip.id}>
                                    <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
                                        <Card 
                                            sx={{ 
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                opacity: 0.8,
                                                '&:hover': {
                                                    opacity: 1
                                                }
                                            }}
                                        >
                                            <CardMedia
                                                component="img"
                                                height="200"
                                                image={imageService.getTripImage(trip.name, trip.destination)}
                                                alt={trip.name}
                                                sx={{
                                                    height: 200,
                                                    width: '100%',
                                                    objectFit: 'cover',
                                                    filter: 'grayscale(50%)'
                                                }}
                                            />
                                            <CardContent sx={{ flexGrow: 1 }}>
                                                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                                                    {trip.name}
                                                </Typography>
                                                
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <LocationIcon color="primary" sx={{ mr: 1 }} />
                                                    <Typography color="textSecondary">
                                                        {trip.destination}
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <CalendarIcon color="primary" sx={{ mr: 1 }} />
                                                    <Typography variant="body2">
                                                        {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <MoneyIcon color="primary" sx={{ mr: 1 }} />
                                                    <Typography variant="body2">
                                                        ${trip.price}
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <GroupIcon color="primary" sx={{ mr: 1 }} />
                                                    <Typography variant="body2">
                                                        {trip.currentParticipantCount}/{trip.capacity} participants
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ mt: 2 }}>
                                                    <Typography variant="body2" color="textSecondary">
                                                        <DescriptionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                                        {trip.description}
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                    <Chip 
                                                        label="Past Trip" 
                                                        color="default" 
                                                        size="small"
                                                        sx={{ bgcolor: 'rgba(0,0,0,0.1)' }}
                                                    />
                                                    {isOwner(trip) && (
                                                        <Chip 
                                                            label="You Owned This Trip" 
                                                            color="primary" 
                                                            size="small" 
                                                        />
                                                    )}
                                                    {isCoOwner(trip) && (
                                                        <Chip 
                                                            label="You Were a Co-Owner" 
                                                            color="info" 
                                                            size="small" 
                                                        />
                                                    )}
                                                    {isParticipant(trip) && (
                                                        <Chip 
                                                            label="You Participated" 
                                                            color="secondary" 
                                                            size="small" 
                                                        />
                                                    )}
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Zoom>
                                </Grid>
                            ))}
                            {pastTrips.length === 0 && (
                                <Grid item xs={12}>
                                    <Box sx={{ 
                                        p: 4, 
                                        bgcolor: 'background.paper',
                                        borderRadius: 2,
                                        boxShadow: 1,
                                        textAlign: 'center'
                                    }}>
                                        <Typography variant="subtitle1" color="text.secondary">
                                            No past trips found.
                                        </Typography>
                                    </Box>
                                </Grid>
                            )}
                        </Grid>
                    </TabPanel>
                </Box>
            </Fade>

            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        p: 1
                    }
                }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    Delete Trip
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete the trip "{tripToDelete?.name}"? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button 
                        onClick={handleDeleteCancel}
                        variant="outlined"
                        sx={{ mr: 1 }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleDeleteConfirm} 
                        color="error"
                        variant="contained"
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Co-Owners Management Dialog */}
            <Dialog 
                open={coOwnersDialogOpen} 
                onClose={() => setCoOwnersDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        p: 1
                    }
                }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    Manage Co-Owners
                </DialogTitle>
                <DialogContent>
                    {selectedTrip && (
                        <>
                            <Typography variant="h6" gutterBottom>
                                Current Co-Owners
                            </Typography>
                            <List>
                                {selectedTrip.coOwners.map((coOwner: { id: string; email: string }) => (
                                    <ListItem key={coOwner.id}>
                                        <ListItemText 
                                            primary={coOwner.email}
                                            secondary={coOwner.id === selectedTrip.ownerId ? "Main Owner" : "Co-Owner"}
                                        />
                                        {coOwner.id !== selectedTrip.ownerId && (
                                            <ListItemSecondaryAction>
                                                <IconButton
                                                    edge="end"
                                                    onClick={() => handleRemoveCoOwner(selectedTrip.id, coOwner.id)}
                                                    color="error"
                                                >
                                                    <PersonRemoveIcon />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        )}
                                    </ListItem>
                                ))}
                            </List>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                Add Co-Owner from Participants
                            </Typography>
                            <List>
                                {selectedTrip.participants
                                    .filter((participant: { id: string }) => 
                                        participant.id !== selectedTrip.ownerId && 
                                        !selectedTrip.coOwners.some((coOwner: { id: string }) => coOwner.id === participant.id)
                                    )
                                    .map((participant: { id: string; email: string }) => (
                                        <ListItem key={participant.id}>
                                            <ListItemText primary={participant.email} />
                                            <ListItemSecondaryAction>
                                                <IconButton
                                                    edge="end"
                                                    onClick={() => handleAddCoOwner(selectedTrip.id, participant.id)}
                                                    color="primary"
                                                >
                                                    <PersonAddIcon />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                {selectedTrip.participants.filter((participant: { id: string }) => 
                                    participant.id !== selectedTrip.ownerId && 
                                    !selectedTrip.coOwners.some((coOwner: { id: string }) => coOwner.id === participant.id)
                                ).length === 0 && (
                                    <ListItem>
                                        <ListItemText 
                                            primary="No participants available to add as co-owners"
                                            sx={{ color: 'text.secondary' }}
                                        />
                                    </ListItem>
                                )}
                            </List>
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button 
                        onClick={() => setCoOwnersDialogOpen(false)}
                        variant="contained"
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}; 