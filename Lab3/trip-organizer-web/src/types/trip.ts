export interface Trip {
    id: number;
    name: string;
    description: string;
    destination: string;
    startDate: string;
    endDate: string;
    capacity: number;
    price: number;
    currentParticipantCount: number;
    creatorId: string;
    creatorName: string;
    coOwners: string[];
    participants: string[];
} 