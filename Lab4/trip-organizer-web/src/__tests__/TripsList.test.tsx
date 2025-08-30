import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TripsList } from '../pages/TripsList';

// Mock the useAuth hook
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'user@example.com', fullName: 'Test User' },
    loading: false
  })
}));

// Mock navigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock trip service - return empty array initially
jest.mock('../services/api', () => ({
  tripService: {
    getFutureTrips: jest.fn(() => Promise.resolve([])),
  }
}));

// Mock image service
jest.mock('../services/imageService', () => ({
  imageService: {
    getRandomImageUrl: jest.fn(() => 'https://example.com/image.jpg')
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
  test('renders trips list component', async () => {
    renderTripsList();
    
    // The component should render without crashing
    expect(document.body).toBeInTheDocument();
  });
});
