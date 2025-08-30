import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AuthProvider } from '../contexts/AuthContext';

// Mock the API service
jest.mock('../services/api', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    getCurrentUser: jest.fn(),
  }
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

const TestComponent = () => <div data-testid="protected-content">Protected Content</div>;

const renderWithAuth = (initialEntries = ['/protected'], user: any = null) => {
  if (user) {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'user') return JSON.stringify(user);
      if (key === 'token') return 'mock-token';
      return null;
    });
  } else {
    mockLocalStorage.getItem.mockReturnValue(null);
  }

  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders children when user is authenticated', async () => {
    const mockUser = { id: 1, email: 'test@example.com', fullName: 'Test User' };
    
    renderWithAuth(['/protected'], mockUser);
    
    // Wait for the component to render
    await screen.findByTestId('protected-content');
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  test('redirects to login when user is not authenticated', () => {
    renderWithAuth(['/protected'], null);
    
    // Should not render the protected content
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  test('shows loading state initially', () => {
    // Start with no user in localStorage
    mockLocalStorage.getItem.mockReturnValue(null);
    
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Initially, the component should be in loading state
    // The protected content should not be rendered yet
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  test('renders children when authentication is complete', async () => {
    const mockUser = { id: 1, email: 'test@example.com', fullName: 'Test User' };
    
    // Mock the API response
    const { authService } = require('../services/api');
    authService.getCurrentUser = jest.fn().mockResolvedValue(mockUser);
    
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'user') return JSON.stringify(mockUser);
      if (key === 'token') return 'mock-token';
      return null;
    });
    
    renderWithAuth(['/protected'], mockUser);
    
    // Should eventually render the protected content
    await screen.findByTestId('protected-content');
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });
});
