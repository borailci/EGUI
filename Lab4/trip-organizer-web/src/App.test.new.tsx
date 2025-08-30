import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// Mock the AuthContext
jest.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-provider">{children}</div>,
  useAuth: () => ({
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
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
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
  });

  test('renders login page by default', () => {
    renderWithRouter();
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  test('renders register page when navigating to /register', () => {
    renderWithRouter(['/register']);
    expect(screen.getByTestId('register-page')).toBeInTheDocument();
  });
});
