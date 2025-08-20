import axios from 'axios';
import { AuthResponse, Trip, User } from '../types/api';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            data: error.response?.data,
            headers: error.config?.headers
        });

        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

interface UpdateProfileData {
    fullName: string;
    email: string;
    currentPassword?: string;
    newPassword?: string;
}

export const authService = {
    checkHealth: async (): Promise<boolean> => {
        try {
            const response = await api.get('/auth/health');
            return response.data.status === 'healthy';
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    },

    register: async (data: { email: string; password: string; fullName: string; }): Promise<void> => {
        try {
            const healthStatus = await authService.checkHealth();
            if (!healthStatus) {
                throw new Error('API is not healthy. Please try again later.');
            }

            const response = await api.post('/auth/register', data);
            console.log('Registration response:', response.data);
        } catch (error: any) {
            console.error('Registration error:', error);
            if (error.response?.data?.errors) {
                const errors = error.response.data.errors;
                if (Array.isArray(errors)) {
                    const errorMessages = errors.map((err: any) => {
                        if (err.code === 'DuplicateUserName') {
                            return `Username '${data.email}' is already taken.`;
                        }
                        return err.description || err.message;
                    });
                    throw new Error(errorMessages.join(' '));
                }
            }
            throw error;
        }
    },

    login: async (data: { email: string; password: string; }): Promise<AuthResponse> => {
        try {
            const healthStatus = await authService.checkHealth();
            if (!healthStatus) {
                throw new Error('API is not healthy. Please try again later.');
            }

            const response = await api.post<AuthResponse>('/auth/login', data);
            console.log('Login response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Login error:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
                console.error('Error status:', error.response.status);
                console.error('Error headers:', error.response.headers);
            } else if (error.request) {
                console.error('Error request:', error.request);
            } else {
                console.error('Error message:', error.message);
            }
            throw error;
        }
    },

    updateProfile: async (data: UpdateProfileData): Promise<User> => {
        try {
            const response = await api.put<{ user: User }>('/auth/profile', data);
            // Store the updated user data in localStorage
            localStorage.setItem('user', JSON.stringify(response.data.user));
            return response.data.user;
        } catch (error: any) {
            console.error('Profile update error:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
                console.error('Error status:', error.response.status);
                console.error('Error headers:', error.response.headers);
            } else if (error.request) {
                console.error('Error request:', error.request);
            } else {
                console.error('Error message:', error.message);
            }
            throw error;
        }
    },

    logout: (): void => {
        localStorage.removeItem('token');
    },
};

export const tripService = {
    checkHealth: async (): Promise<boolean> => {
        try {
            const response = await api.get('/health');
            return response.data.status === 'healthy';
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    },

    getFutureTrips: async (): Promise<Trip[]> => {
        try {
            console.log('Fetching future trips...');
            const response = await api.get('/trips/future');
            console.log('Future trips response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching future trips:', error);
            if (axios.isAxiosError(error)) {
                console.error('Error details:', {
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message,
                    config: {
                        url: error.config?.url,
                        method: error.config?.method,
                        headers: error.config?.headers,
                    }
                });
                
                if (error.response?.status === 401) {
                    throw new Error('You must be logged in to view trips');
                }
                
                if (error.response?.status === 405) {
                    throw new Error('Invalid request method. Please try again.');
                }
            }
            throw new Error('Failed to load trips. Please try again later.');
        }
    },

    getTrip: async (id: number): Promise<Trip> => {
        const response = await api.get<Trip>(`/trips/${id}`);
        return response.data;
    },

    createTrip: async (trip: {
        name: string;
        destination: string;
        description: string;
        startDate: string;
        endDate: string;
        capacity: number;
        price: number;
    }): Promise<Trip> => {
        try {
            console.log('Creating trip with data:', trip);
            const response = await api.post('/trips', trip);
            console.log('Trip creation response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Trip creation error:', error);
            if (axios.isAxiosError(error)) {
                console.error('Error details:', {
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message,
                    config: {
                        url: error.config?.url,
                        method: error.config?.method,
                        headers: error.config?.headers,
                    }
                });
                
                if (error.response?.status === 401) {
                    throw new Error('You must be logged in to create a trip');
                }
                
                if (error.response?.status === 400) {
                    const errorMessage = error.response.data?.message || 'Invalid trip data';
                    throw new Error(errorMessage);
                }

                if (error.response?.status === 500) {
                    console.error('Server error details:', error.response.data);
                    throw new Error('Server error occurred. Please check the server logs for more details.');
                }
            }
            throw new Error('Failed to create trip. Please try again later.');
        }
    },

    updateTrip: async (id: number, tripData: Partial<Trip>): Promise<Trip> => {
        const response = await api.put(`/trips/${id}`, tripData);
        return response.data;
    },

    deleteTrip: async (id: number): Promise<void> => {
        const response = await api.delete(`/trips/${id}`);
        return response.data;
    },

    joinTrip: async (tripId: number): Promise<void> => {
        await api.post(`/trips/${tripId}/join`);
    },

    leaveTrip: async (tripId: number): Promise<void> => {
        await api.post(`/trips/${tripId}/leave`);
    },

    addCoOwner: async (tripId: number, userId: string): Promise<void> => {
        try {
            await api.post(`/trips/${tripId}/co-owner/${userId}`);
        } catch (error) {
            console.error('Error adding co-owner:', error);
            throw new Error('Failed to add co-owner. Please try again later.');
        }
    },

    removeCoOwner: async (tripId: number, userId: string): Promise<void> => {
        try {
            await api.delete(`/trips/${tripId}/co-owner/${userId}`);
        } catch (error) {
            console.error('Error removing co-owner:', error);
            throw new Error('Failed to remove co-owner. Please try again later.');
        }
    },
};

export default api; 