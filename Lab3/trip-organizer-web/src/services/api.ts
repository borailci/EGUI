import axios from 'axios';
import { AuthResponse, Trip, User, CreateTripRequest, UpdateTripRequest } from '../types/api';

const API_URL = 'http://localhost:5236/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});

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

// Add a response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error: ApiError) => {
        console.error('API Error:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            data: error.response?.data,
            headers: error.config?.headers
        });

        if (error.response?.status === 401) {
            localStorage.removeItem('user');
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

// Add a request interceptor to include user data
api.interceptors.request.use(
    (config) => {
        const user = localStorage.getItem('user');
        if (user && config.headers) {
            const userData = JSON.parse(user);
            config.headers['X-User-Id'] = userData.id;
            config.headers['X-User-Email'] = userData.email;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

interface UpdateProfileData {
    fullName: string;
    email: string;
    currentPassword?: string;
    newPassword?: string;
}

interface HealthResponse {
    status: string;
}

export const authService = {
    checkHealth: async (): Promise<boolean> => {
        try {
            const response = await api.get<HealthResponse>('/auth/health');
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
        } catch (error) {
            const apiError = error as ApiError;
            console.error('Registration error:', apiError);
            if (apiError.response) {
                console.error('Error response:', apiError.response.data);
                console.error('Error status:', apiError.response.status);
                console.error('Error headers:', apiError.response.headers);
            } else if (apiError.request) {
                console.error('Error request:', apiError.request);
            } else {
                console.error('Error message:', apiError.message);
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
            
            // Store user data in localStorage
            if (response.data.user) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
            
            return response.data;
        } catch (error) {
            const apiError = error as ApiError;
            console.error('Login error:', apiError);
            if (apiError.response) {
                console.error('Error response:', apiError.response.data);
                console.error('Error status:', apiError.response.status);
                console.error('Error headers:', apiError.response.headers);
            } else if (apiError.request) {
                console.error('Error request:', apiError.request);
            } else {
                console.error('Error message:', apiError.message);
            }
            throw error;
        }
    },

    getCurrentUser: async (): Promise<User | null> => {
        try {
            const response = await api.get<{ user: User }>('/auth/current-user');
            return response.data.user;
        } catch (error) {
            console.error('Get current user error:', error);
            return null;
        }
    },

    updateProfile: async (data: UpdateProfileData): Promise<User> => {
        try {
            const response = await api.put<User>('/auth/profile', data);
            const updatedUser = response.data;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return updatedUser;
        } catch (error) {
            const apiError = error as ApiError;
            console.error('Update profile error:', apiError);
            if (apiError.response) {
                console.error('Error response:', apiError.response.data);
                console.error('Error status:', apiError.response.status);
                console.error('Error headers:', apiError.response.headers);
            } else if (apiError.request) {
                console.error('Error request:', apiError.request);
            } else {
                console.error('Error message:', apiError.message);
            }
            throw error;
        }
    },

    logout: (): void => {
        localStorage.removeItem('user');
    },
};

export const tripService = {
    checkHealth: async (): Promise<void> => {
        const response = await api.get<void>('/trips/health');
        return response.data;
    },
    getFutureTrips: async (): Promise<Trip[]> => {
        const response = await api.get<Trip[]>('/trips/future');
            return response.data;
    },
    getTripById: async (id: number): Promise<Trip> => {
        const response = await api.get<Trip>(`/trips/${id}`);
        return response.data;
    },
    createTrip: async (trip: CreateTripRequest): Promise<Trip> => {
        const response = await api.post<Trip>('/trips', trip);
            return response.data;
    },
    updateTrip: async (id: number, trip: UpdateTripRequest): Promise<Trip> => {
        const response = await api.put<Trip>(`/trips/${id}`, trip);
        return response.data;
    },
    deleteTrip: async (id: number): Promise<void> => {
        await api.delete(`/trips/${id}`);
    },
    joinTrip: async (tripId: number): Promise<void> => {
        await api.post(`/trips/${tripId}/join`);
    },
    leaveTrip: async (tripId: number): Promise<void> => {
        await api.post(`/trips/${tripId}/leave`);
    },
    addCoOwner: async (tripId: number, userId: string): Promise<void> => {
        await api.post(`/trips/${tripId}/co-owner/${userId}`);
    },
    removeCoOwner: async (tripId: number, userId: string): Promise<void> => {
        await api.delete(`/trips/${tripId}/co-owner/${userId}`);
    }
};

export default api; 