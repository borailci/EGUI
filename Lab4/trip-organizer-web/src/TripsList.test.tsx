import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TripsList } from './pages/TripsList';

// Mock the useAuth hook
jest.mock('./contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'user@example.com', fullName: 'Test User' },
    loading: false
  })
}));

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock trip service
const mockTrips = [
  {
    id: 1,
    name: 'Test Trip 1',
    destination: 'Paris',
    startDate: '2025-12-01',
    endDate: '2025-12-07',
    budget: 1000,
    description: 'A wonderful trip to Paris',
    ownerId: 1,
    coOwners: [],
    maxParticipants: 10,
    participants: []
  }
];

jest.mock('./services/api', () => ({
  tripService: {
    getFutureTrips: jest.fn(() => Promise.resolve(mockTrips)),
  }
}));

// Mock image service
jest.mock('./services/imageService', () => ({
  imageService: {
    getRandomImageUrl: jest.fn(() => 'https://example.com/image.jpg'),
    getTripImage: jest.fn(() => 'https://example.com/trip-image.jpg')
  }
}));

const renderTripsList = () => {
  return render(
    <MemoryRouter>
      <TripsList />
    </MemoryRouter>
  );
};

describe('TripsList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders trips list component', async () => {
    await act(async () => {
      renderTripsList();
    });
    
    // The component should render without crashing
    expect(document.body).toBeInTheDocument();
  });

  test('displays trips after loading', async () => {
    await act(async () => {
      renderTripsList();
    });
    
    await waitFor(() => {
      expect(screen.getByText('Test Trip 1')).toBeInTheDocument();
      expect(screen.getByText('Paris')).toBeInTheDocument();
    });
  });

  test('shows create trip button', async () => {
    await act(async () => {
      renderTripsList();
    });
    
    await waitFor(() => {
      expect(screen.getByText(/create new trip/i)).toBeInTheDocument();
    });
  });
});
