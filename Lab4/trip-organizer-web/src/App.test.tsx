import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// Mock the AuthContext
jest.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
    loading: false
  })
}));

// Mock components that might cause issues in tests
jest.mock('./pages/Login', () => ({
  Login: () => <div data-testid="login-page">Login Page</div>
}));

jest.mock('./pages/Register', () => ({
  Register: () => <div data-testid="register-page">Register Page</div>
}));

jest.mock('./components/Navbar', () => ({
  Navbar: () => <div data-testid="navbar">Navbar</div>
}));

const renderWithRouter = (initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <App />
    </MemoryRouter>
  );
};

describe('App Component', () => {
  test('renders without crashing', () => {
    renderWithRouter();
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });

  test('redirects to login page when accessing root', () => {
    renderWithRouter(['/']);
    // Should redirect to login since user is not authenticated
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  test('shows login page when navigating to /login', () => {
    renderWithRouter(['/login']);
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  test('shows register page when navigating to /register', () => {
    renderWithRouter(['/register']);
    expect(screen.getByTestId('register-page')).toBeInTheDocument();
  });
});
