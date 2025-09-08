import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { Profile } from '../pages/Profile';
import { theme } from '../theme';
import type { User } from '../types/api';
import { authService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Mock the services and contexts
jest.mock('../services/api', () => ({
  authService: {
    updateProfile: jest.fn(),
  },
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  fullName: 'Test User',
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('Profile Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      updateUser: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      loading: false,
    });
  });

  describe('Authentication State', () => {
    it('should display user information when authenticated', () => {
      renderWithTheme(<Profile />);
      
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Update Profile/i })).toBeInTheDocument();
    });

    it('should show error message when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        updateUser: jest.fn(),
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        loading: false,
      });

      renderWithTheme(<Profile />);
      
      expect(screen.getByText('Please log in to view your profile')).toBeInTheDocument();
    });
  });

  describe('Form Rendering', () => {
    it('should render form with user data pre-filled', () => {
      renderWithTheme(<Profile />);
      
      const fullNameInput = screen.getByDisplayValue('Test User');
      const emailInput = screen.getByDisplayValue('test@example.com');
      
      expect(fullNameInput).toBeInTheDocument();
      expect(emailInput).toBeInTheDocument();
    });
  });

  describe('Form Input Handling', () => {
    it('should update form fields when user types', () => {
      renderWithTheme(<Profile />);
      
      const fullNameInput = screen.getByDisplayValue('Test User');
      fireEvent.change(fullNameInput, { target: { value: 'Updated Name' } });
      
      expect(screen.getByDisplayValue('Updated Name')).toBeInTheDocument();
    });

    it('should handle password field changes', () => {
      renderWithTheme(<Profile />);
      
      const currentPasswordInput = screen.getByLabelText(/Current Password/i);
      fireEvent.change(currentPasswordInput, { target: { value: 'oldpass' } });
      
      expect(currentPasswordInput).toHaveValue('oldpass');
    });
  });

  describe('Password Validation', () => {
    it('should show error when passwords do not match', async () => {
      renderWithTheme(<Profile />);
      
      // Get password fields by their specific labels
      const newPasswordField = screen.getByLabelText(/^New Password/i) as HTMLInputElement;
      const confirmPasswordField = screen.getByLabelText(/^Confirm New Password/i) as HTMLInputElement;
      
      // Enter mismatched passwords
      fireEvent.change(newPasswordField, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordField, { target: { value: 'differentpassword' } });
      
      // Check that error message is displayed
      await waitFor(() => {
        expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
      });
      
      // Check that confirmPassword field has error attribute
      await waitFor(() => {
        expect(confirmPasswordField).toHaveAttribute('aria-invalid', 'true');
      });
    });
  });

  describe('Form Submission', () => {
    it('should call updateProfile service on form submission', async () => {
      mockAuthService.updateProfile.mockResolvedValue(mockUser);
      const mockUpdateUser = jest.fn();
      mockUseAuth.mockReturnValue({
        user: mockUser,
        updateUser: mockUpdateUser,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        loading: false,
      });

      renderWithTheme(<Profile />);
      
      const fullNameInput = screen.getByDisplayValue('Test User');
      fireEvent.change(fullNameInput, { target: { value: 'Updated Name' } });
      
      const submitButton = screen.getByRole('button', { name: /Update Profile/i });
      fireEvent.click(submitButton);
      
      expect(mockAuthService.updateProfile).toHaveBeenCalledWith({
        fullName: 'Updated Name',
        email: 'test@example.com',
        currentPassword: '',
        newPassword: ''
      });
    });

    it('should show success message after successful update', async () => {
      mockAuthService.updateProfile.mockResolvedValue(mockUser);

      renderWithTheme(<Profile />);
      
      const submitButton = screen.getByRole('button', { name: /Update Profile/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Profile updated successfully')).toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      mockAuthService.updateProfile.mockImplementation(() => new Promise(() => {}));

      renderWithTheme(<Profile />);
      
      const submitButton = screen.getByRole('button', { name: /Update Profile/i });
      fireEvent.click(submitButton);
      
      expect(submitButton).toBeDisabled();
    });

    it('should validate password length', async () => {
      const mockUpdateUser = jest.fn();
      mockUseAuth.mockReturnValue({ 
        user: mockUser, 
        updateUser: mockUpdateUser, 
        login: jest.fn(), 
        register: jest.fn(), 
        logout: jest.fn(), 
        loading: false 
      });

      renderWithTheme(<Profile />);
      
      // Fill form with short password
      const fullNameField = screen.getByLabelText(/Full Name/i) as HTMLInputElement;
      const emailField = screen.getByLabelText(/Email/i) as HTMLInputElement;
      const currentPasswordField = screen.getByLabelText(/Current Password/i) as HTMLInputElement;
      const newPasswordField = screen.getByLabelText(/^New Password/i) as HTMLInputElement;
      const confirmPasswordField = screen.getByLabelText(/^Confirm New Password/i) as HTMLInputElement;
      
      fireEvent.change(fullNameField, { target: { value: 'Updated Name' } });
      fireEvent.change(emailField, { target: { value: 'updated@example.com' } });
      fireEvent.change(currentPasswordField, { target: { value: 'currentpass' } });
      fireEvent.change(newPasswordField, { target: { value: '12345' } }); // Too short
      fireEvent.change(confirmPasswordField, { target: { value: '12345' } });
      
      const submitButton = screen.getByRole('button', { name: /Update Profile/i });
      fireEvent.click(submitButton);
      
      // Should show password length error
      await waitFor(() => {
        expect(screen.getByText('New password must be at least 6 characters long')).toBeInTheDocument();
      });
    });

    it('should clear password fields after successful update', async () => {
      mockAuthService.updateProfile.mockResolvedValue(mockUser);
      const mockUpdateUser = jest.fn();
      mockUseAuth.mockReturnValue({ 
        user: mockUser, 
        updateUser: mockUpdateUser, 
        login: jest.fn(), 
        register: jest.fn(), 
        logout: jest.fn(), 
        loading: false 
      });

      renderWithTheme(<Profile />);
      
      // Fill in password fields
      const currentPasswordField = screen.getByLabelText(/Current Password/i) as HTMLInputElement;
      const newPasswordField = screen.getByLabelText(/^New Password/i) as HTMLInputElement;
      const confirmPasswordField = screen.getByLabelText(/^Confirm New Password/i) as HTMLInputElement;
      
      fireEvent.change(currentPasswordField, { target: { value: 'currentpass' } });
      fireEvent.change(newPasswordField, { target: { value: 'newpassword123' } });
      fireEvent.change(confirmPasswordField, { target: { value: 'newpassword123' } });
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /Update Profile/i });
      fireEvent.click(submitButton);
      
      // Wait for success and check password fields are cleared
      await waitFor(() => {
        expect(screen.getByText('Profile updated successfully')).toBeInTheDocument();
      });
      
      // Password fields should be cleared
      expect(currentPasswordField).toHaveValue('');
      expect(newPasswordField).toHaveValue('');
      expect(confirmPasswordField).toHaveValue('');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockAuthService.updateProfile.mockRejectedValue(new Error('Update failed'));
      
      renderWithTheme(<Profile />);
      
      const submitButton = screen.getByRole('button', { name: /Update Profile/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Update failed')).toBeInTheDocument();
      });
    });
  });

  describe('Form Structure and Accessibility', () => {
    it('should have all required form fields', () => {
      renderWithTheme(<Profile />);
      
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Update Profile/i })).toBeInTheDocument();
    });

    it('should have proper form structure', () => {
      renderWithTheme(<Profile />);
      
      // Check form has the right structure - should contain all required fields
      expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Current Password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^New Password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Confirm New Password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Update Profile/i })).toBeInTheDocument();
    });

    it('should have required field attributes', () => {
      renderWithTheme(<Profile />);
      
      expect(screen.getByDisplayValue('Test User')).toHaveAttribute('required');
      expect(screen.getByDisplayValue('test@example.com')).toHaveAttribute('required');
      expect(screen.getByDisplayValue('test@example.com')).toHaveAttribute('type', 'email');
    });
  });

  describe('User Avatar', () => {
    it('should display user initials in avatar', () => {
      renderWithTheme(<Profile />);
      
      const avatar = screen.getByText('T');
      expect(avatar).toBeInTheDocument();
    });
  });
});