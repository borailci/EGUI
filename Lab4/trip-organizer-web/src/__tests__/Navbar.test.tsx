import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

// Mock the AuthContext
const mockLogout = jest.fn();
const mockUser = {
  id: 1,
  email: 'test@example.com',
  username: 'testuser'
};

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout
  })
}));

const renderNavbar = () => {
  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );
};

describe('Navbar Component', () => {
  beforeEach(() => {
    mockLogout.mockClear();
  });

  test('renders navigation links when user is logged in', () => {
    renderNavbar();
    
    expect(screen.getByText(/trip organizer/i)).toBeInTheDocument();
    expect(screen.getByText(/trips/i)).toBeInTheDocument();
    expect(screen.getByText(/profile/i)).toBeInTheDocument();
  });

  test('shows user email in navigation', () => {
    renderNavbar();
    
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
  });

  test('calls logout when logout button is clicked', () => {
    renderNavbar();
    
    const logoutButton = screen.getByText(/logout/i);
    fireEvent.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalled();
  });

  test('has correct navigation links', () => {
    renderNavbar();
    
    const tripsLink = screen.getByText(/trips/i).closest('a');
    const profileLink = screen.getByText(/profile/i).closest('a');
    
    expect(tripsLink).toHaveAttribute('href', '/trips');
    expect(profileLink).toHaveAttribute('href', '/profile');
  });
});
