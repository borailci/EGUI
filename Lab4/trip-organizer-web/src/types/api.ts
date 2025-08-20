export interface User {
    id: string;
    email: string;
    fullName: string;
}

export interface Trip {
    id: number;
    name: string;
    destination: string;
    description: string;
    startDate: string;
    endDate: string;
    capacity: number;
    price: number;
    ownerId: string;
    currentParticipantCount: number;
    hasAvailableSpots: boolean;
    participants: User[];
    coOwners: User[];
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    fullName: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface CreateTripRequest {
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    price: number;
    description: string;
    capacity: number;
}

export interface UpdateTripRequest extends CreateTripRequest {} 