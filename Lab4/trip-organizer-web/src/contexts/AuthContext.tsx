import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/api';
import axios from 'axios';
import { authService } from '../services/api';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName: string) => Promise<void>;
    logout: () => void;
    updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
            setUser(JSON.parse(userData));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const isHealthy = await authService.checkHealth();
            if (!isHealthy) {
                console.error('API is not accessible');
                throw new Error('Cannot connect to the server. Please make sure the backend is running.');
            }

            const response = await authService.login({ email, password });
            const { token, user } = response;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(user);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                throw new Error('Invalid email or password');
            }
            throw new Error('Failed to login. Please try again later.');
        }
    };

    const register = async (email: string, password: string, fullName: string) => {
        try {
            const isHealthy = await authService.checkHealth();
            if (!isHealthy) {
                throw new Error('Cannot connect to the server. Please make sure the backend is running.');
            }

            await authService.register({ email, password, fullName });
            const response = await authService.login({ email, password });
            
            localStorage.setItem('token', response.token);
            setUser(response.user);
        } catch (err) {
            console.error('Registration error:', err);
            throw err;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 