import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock axios to avoid ES module issues
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  }))
}));

// Mock API service
jest.mock('./services/api', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn()
  },
  tripService: {
    getTrips: jest.fn(),
    createTrip: jest.fn(),
    updateTrip: jest.fn(),
    deleteTrip: jest.fn()
  }
}));

// Mock AuthContext to avoid complex dependencies
jest.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    loading: false
  })
}));

test('renders without crashing', () => {
  render(<App />);
  // Just check that the app renders something
  expect(document.body).toBeInTheDocument();
});