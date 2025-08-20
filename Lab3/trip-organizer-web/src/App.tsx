import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { theme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { TripsList } from './pages/TripsList';
import { CreateTrip } from './pages/CreateTrip';
import { EditTrip } from './pages/EditTrip';
import { Profile } from './pages/Profile';
import { Navbar } from './components/Navbar';
import './styles/global.css';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <Router>
                    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                        <Navbar />
                        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                            <Routes>
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route
                                    path="/trips"
                                    element={
                                        <ProtectedRoute>
                                            <TripsList />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/trips/create"
                                    element={
                                        <ProtectedRoute>
                                            <CreateTrip />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/trips/:id/edit"
                                    element={
                                        <ProtectedRoute>
                                            <EditTrip />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/profile"
                                    element={
                                        <ProtectedRoute>
                                            <Profile />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route path="/" element={<Navigate to="/trips" replace />} />
                            </Routes>
                        </Box>
                    </Box>
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
