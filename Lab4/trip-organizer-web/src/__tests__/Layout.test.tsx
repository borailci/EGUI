import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { AuthProvider } from '../contexts/AuthContext';

// Mock the child components
jest.mock('../components/Navbar', () => ({
  Navbar: () => <div data-testid="navbar">Navbar</div>
}));

// Mock the API service
jest.mock('../services/api', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    getCurrentUser: jest.fn(),
  }
}));

const renderWithProviders = (children: React.ReactNode) => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Layout>{children}</Layout>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Layout', () => {
  test('renders navbar and children', () => {
    const testContent = <div data-testid="test-content">Test Content</div>;
    
    renderWithProviders(testContent);
    
    // Look for the AppBar by its role and content instead of data-testid
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('Trip Organizer')).toBeInTheDocument();
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  test('renders with proper structure', () => {
    const testContent = <div data-testid="test-content">Test Content</div>;
    
    renderWithProviders(testContent);
    
    // Check that the layout has the proper structure
    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveClass('MuiContainer-root');
    
    // Check that navbar and content are present
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  test('renders multiple children correctly', () => {
    const children = (
      <>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </>
    );
    
    renderWithProviders(children);
    
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });
});
