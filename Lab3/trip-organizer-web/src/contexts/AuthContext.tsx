import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/api';
import { authService } from '../services/api';

interface AuthContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
    register: (email: string, password: string, fullName: string) => Promise<void>;
    updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface ApiError {
    response?: {
        status: number;
        data: any;
    };
    request?: any;
    message: string;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Error parsing stored user:', error);
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await authService.login({ email, password });
            setUser(response.user);
            setIsAuthenticated(true);
        } catch (error) {
            const apiError = error as ApiError;
            if (apiError.response?.status === 401) {
                throw new Error('Invalid email or password');
            }
            throw new Error('Failed to login. Please try again later.');
        }
    };

    const register = async (email: string, password: string, fullName: string) => {
        try {
            await authService.register({ email, password, fullName });
        } catch (error) {
            const apiError = error as ApiError;
            if (apiError.response?.status === 400) {
                throw new Error('Invalid registration data');
            }
            throw new Error('Failed to register. Please try again later.');
        }
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ 
        user,
            setUser, 
            login, 
            logout, 
            isAuthenticated, 
        loading,
        register,
            updateUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 