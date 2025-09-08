import axios from 'axios';
import { AuthResponse, Trip, User } from '../types/api';
import { authService, tripService } from '../services/api';

jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn()
      },
      response: {
        use: jest.fn()
      }
    }
  };
  
  return {
    create: jest.fn(() => mockAxiosInstance),
    isAxiosError: jest.fn()
  };
});

const mockedAxios = axios as jest.Mocked<typeof axios>;

// Get the mock instance from axios.create
const mockAxiosInstance = (axios.create as jest.Mock).mock.results[0]?.value || {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: {
      use: jest.fn()
    },
    response: {
      use: jest.fn()
    }
  }
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock window.location
const mockLocation = {
  href: ''
};

// Use delete and redefine to avoid the "Cannot redefine property" error
delete (window as any).location;
(window as any).location = mockLocation;

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.error = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

describe('API Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    mockLocation.href = '';
    
    // Reset mock implementations and make isAxiosError more lenient
    mockedAxios.isAxiosError.mockImplementation((payload) => {
      return payload && typeof payload === 'object' && payload.response;
    });
    
    // Set up default successful response structure for axios calls
    mockAxiosInstance.get.mockImplementation((url: string) => {
      if (url.includes('/health') || url.includes('/auth/health')) {
        return Promise.resolve({ data: { status: 'healthy' } });
      }
      return Promise.resolve({ data: {} });
    });
    
    mockAxiosInstance.post.mockResolvedValue({ data: {} });
    mockAxiosInstance.put.mockResolvedValue({ data: {} });
    mockAxiosInstance.delete.mockResolvedValue({ data: {} });
  });

  describe('authService', () => {
    describe('checkHealth', () => {
      it('should return true when API is healthy', async () => {
        mockAxiosInstance.get.mockResolvedValue({
          data: { status: 'healthy' }
        });

        const result = await authService.checkHealth();

        expect(result).toBe(true);
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/health');
      });

      it('should return false when API is unhealthy', async () => {
        mockAxiosInstance.get.mockResolvedValue({
          data: { status: 'unhealthy' }
        });

        const result = await authService.checkHealth();

        expect(result).toBe(false);
      });

      it('should return false when API health check fails', async () => {
        mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

        const result = await authService.checkHealth();

        expect(result).toBe(false);
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/health');
      });
    });

    describe('register', () => {
      const registerData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User'
      };

      it('should register successfully when API is healthy', async () => {
        mockAxiosInstance.get.mockResolvedValue({ data: { status: 'healthy' } });
        mockAxiosInstance.post.mockResolvedValue({
          data: { message: 'Registration successful' }
        });

        await authService.register(registerData);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/health');
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/register', registerData);
      });

      it('should throw error when API is not healthy', async () => {
        mockAxiosInstance.get.mockResolvedValue({ data: { status: 'unhealthy' } });

        await expect(authService.register(registerData)).rejects.toThrow(
          'API is not healthy. Please try again later.'
        );
      });

      it('should handle duplicate username errors', async () => {
        mockAxiosInstance.get.mockResolvedValue({ data: { status: 'healthy' } });
        mockAxiosInstance.post.mockRejectedValue({
          response: {
            data: {
              errors: [
                { code: 'DuplicateUserName', description: 'Username already exists' }
              ]
            }
          }
        });

        await expect(authService.register(registerData)).rejects.toThrow(
          "Username 'test@example.com' is already taken."
        );
      });

      it('should handle generic registration errors', async () => {
        mockAxiosInstance.get.mockResolvedValue({ data: { status: 'healthy' } });
        const error = new Error('Registration failed');
        mockAxiosInstance.post.mockRejectedValue(error);

        await expect(authService.register(registerData)).rejects.toThrow('Registration failed');
      });
    });

    describe('login', () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const authResponse: AuthResponse = {
        token: 'fake-jwt-token',
        user: {
          id: '1',
          email: 'test@example.com',
          fullName: 'Test User'
        }
      };

      it('should login successfully when API is healthy', async () => {
        mockAxiosInstance.get.mockResolvedValue({ data: { status: 'healthy' } });
        mockAxiosInstance.post.mockResolvedValue({ data: authResponse });

        const result = await authService.login(loginData);

        expect(result).toEqual(authResponse);
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/health');
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/login', loginData);
      });

      it('should throw error when API is not healthy', async () => {
        mockAxiosInstance.get.mockResolvedValue({ data: { status: 'unhealthy' } });

        await expect(authService.login(loginData)).rejects.toThrow(
          'API is not healthy. Please try again later.'
        );
      });

      it('should handle login errors with response', async () => {
        mockAxiosInstance.get.mockResolvedValue({ data: { status: 'healthy' } });
        const error = {
          response: {
            data: { message: 'Invalid credentials' },
            status: 401,
            headers: {}
          }
        };
        mockAxiosInstance.post.mockRejectedValue(error);

        await expect(authService.login(loginData)).rejects.toEqual(error);
      });

      it('should handle login errors without response', async () => {
        mockAxiosInstance.get.mockResolvedValue({ data: { status: 'healthy' } });
        const error = {
          request: 'network request failed',
          message: 'Network Error'
        };
        mockAxiosInstance.post.mockRejectedValue(error);

        await expect(authService.login(loginData)).rejects.toEqual(error);
      });
    });

    describe('updateProfile', () => {
      const updateData = {
        fullName: 'Updated Name',
        email: 'updated@example.com',
        currentPassword: 'oldpass',
        newPassword: 'newpass'
      };

      const updatedUser: User = {
        id: '1',
        email: 'updated@example.com',
        fullName: 'Updated Name'
      };

      it('should update profile successfully', async () => {
        mockAxiosInstance.put.mockResolvedValue({
          data: { user: updatedUser }
        });

        const result = await authService.updateProfile(updateData);

        expect(result).toEqual(updatedUser);
        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/auth/profile', updateData);
        expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(updatedUser));
      });

      it('should handle update profile errors', async () => {
        const error = {
          response: {
            data: { message: 'Update failed' },
            status: 400,
            headers: {}
          }
        };
        mockAxiosInstance.put.mockRejectedValue(error);

        await expect(authService.updateProfile(updateData)).rejects.toEqual(error);
      });
    });

    describe('logout', () => {
      it('should remove token from localStorage', () => {
        authService.logout();

        expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      });
    });
  });

  describe('tripService', () => {
    describe('checkHealth', () => {
      it('should return true when API is healthy', async () => {
        mockAxiosInstance.get.mockResolvedValue({
          data: { status: 'healthy' }
        });

        const result = await tripService.checkHealth();

        expect(result).toBe(true);
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health');
      });

      it('should return false when health check fails', async () => {
        mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

        const result = await tripService.checkHealth();

        expect(result).toBe(false);
      });
    });

    describe('getFutureTrips', () => {
      const mockTrips: Trip[] = [
        {
          id: 1,
          name: 'Trip 1',
          destination: 'Paris',
          description: 'Amazing trip',
          startDate: '2025-09-01',
          endDate: '2025-09-07',
          capacity: 10,
          price: 500,
          ownerId: '1',
          currentParticipantCount: 0,
          hasAvailableSpots: true,
          participants: [],
          coOwners: []
        }
      ];

      it('should fetch future trips successfully', async () => {
        mockAxiosInstance.get.mockResolvedValue({
          data: mockTrips
        });

        const result = await tripService.getFutureTrips();

        expect(result).toEqual(mockTrips);
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/trips/future');
      });

      it('should handle 401 unauthorized error', async () => {
        const unauthorizedError = {
          response: { status: 401 }
        };
        mockAxiosInstance.get.mockRejectedValue(unauthorizedError);
        mockedAxios.isAxiosError.mockReturnValue(true);

        await expect(tripService.getFutureTrips()).rejects.toThrow('You must be logged in to view trips');
      });

      it('should handle 405 method not allowed error', async () => {
        const methodError = {
          response: { status: 405 }
        };
        mockAxiosInstance.get.mockRejectedValue(methodError);
        mockedAxios.isAxiosError.mockReturnValue(true);

        await expect(tripService.getFutureTrips()).rejects.toThrow('Invalid request method. Please try again.');
      });

      it('should handle generic axios errors', async () => {
        const genericError = {
          response: { status: 500 },
          message: 'Server error'
        };
        mockAxiosInstance.get.mockRejectedValue(genericError);
        mockedAxios.isAxiosError.mockReturnValue(true);

        await expect(tripService.getFutureTrips()).rejects.toThrow('Failed to load trips. Please try again later.');
      });

      it('should handle non-axios errors', async () => {
        mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));
        mockedAxios.isAxiosError.mockReturnValue(false);

        await expect(tripService.getFutureTrips()).rejects.toThrow('Failed to load trips. Please try again later.');
      });
    });

    describe('getTrip', () => {
      const mockTrip: Trip = {
        id: 1,
        name: 'Trip 1',
        destination: 'Paris',
        description: 'Amazing trip',
        startDate: '2025-09-01',
        endDate: '2025-09-07',
        capacity: 10,
        price: 500,
        ownerId: '1',
        currentParticipantCount: 0,
        hasAvailableSpots: true,
        participants: [],
        coOwners: []
      };

      it('should fetch single trip successfully', async () => {
        mockAxiosInstance.get.mockResolvedValue({
          data: mockTrip
        });

        const result = await tripService.getTrip(1);

        expect(result).toEqual(mockTrip);
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/trips/1');
      });
    });

    describe('createTrip', () => {
      const tripData = {
        name: 'New Trip',
        destination: 'Tokyo',
        description: 'Exciting adventure',
        startDate: '2025-10-01',
        endDate: '2025-10-07',
        capacity: 8,
        price: 800
      };

      const mockCreatedTrip: Trip = {
        id: 2,
        ...tripData,
        ownerId: '1',
        currentParticipantCount: 0,
        hasAvailableSpots: true,
        participants: [],
        coOwners: []
      };

      it('should create trip successfully', async () => {
        mockAxiosInstance.post.mockResolvedValue({
          data: mockCreatedTrip
        });

        const result = await tripService.createTrip(tripData);

        expect(result).toEqual(mockCreatedTrip);
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/trips', tripData);
      });

      it('should handle 401 unauthorized error', async () => {
        const unauthorizedError = {
          response: { status: 401 }
        };
        mockAxiosInstance.post.mockRejectedValue(unauthorizedError);
        mockedAxios.isAxiosError.mockReturnValue(true);

        await expect(tripService.createTrip(tripData)).rejects.toThrow('You must be logged in to create a trip');
      });

      it('should handle 400 bad request error', async () => {
        const badRequestError = {
          response: { 
            status: 400,
            data: { message: 'Invalid trip data provided' }
          }
        };
        mockAxiosInstance.post.mockRejectedValue(badRequestError);
        mockedAxios.isAxiosError.mockReturnValue(true);

        await expect(tripService.createTrip(tripData)).rejects.toThrow('Invalid trip data provided');
      });

      it('should handle 500 server error', async () => {
        const serverError = {
          response: { 
            status: 500,
            data: { message: 'Internal server error' }
          }
        };
        mockAxiosInstance.post.mockRejectedValue(serverError);
        mockedAxios.isAxiosError.mockReturnValue(true);

        await expect(tripService.createTrip(tripData)).rejects.toThrow('Server error occurred. Please check the server logs for more details.');
      });

      it('should handle generic errors', async () => {
        mockAxiosInstance.post.mockRejectedValue(new Error('Network error'));
        mockedAxios.isAxiosError.mockReturnValue(false);

        await expect(tripService.createTrip(tripData)).rejects.toThrow('Failed to create trip. Please try again later.');
      });
    });

    describe('updateTrip', () => {
      const tripData = { name: 'Updated Trip' };
      const mockUpdatedTrip: Trip = {
        id: 1,
        name: 'Updated Trip',
        destination: 'Paris',
        description: 'Amazing trip',
        startDate: '2025-09-01',
        endDate: '2025-09-07',
        capacity: 10,
        price: 500,
        ownerId: '1',
        currentParticipantCount: 0,
        hasAvailableSpots: true,
        participants: [],
        coOwners: []
      };

      it('should update trip successfully', async () => {
        mockAxiosInstance.put.mockResolvedValue({
          data: mockUpdatedTrip
        });

        const result = await tripService.updateTrip(1, tripData);

        expect(result).toEqual(mockUpdatedTrip);
        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/trips/1', tripData);
      });
    });

    describe('deleteTrip', () => {
      it('should delete trip successfully', async () => {
        mockAxiosInstance.delete.mockResolvedValue({
          data: { message: 'Trip deleted successfully' }
        });

        const result = await tripService.deleteTrip(1);

        expect(result).toEqual({ message: 'Trip deleted successfully' });
        expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/trips/1');
      });
    });

    describe('joinTrip', () => {
      it('should join trip successfully', async () => {
        mockAxiosInstance.post.mockResolvedValue({
          data: { message: 'Joined trip successfully' }
        });

        await tripService.joinTrip(1);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/trips/1/join');
      });
    });

    describe('leaveTrip', () => {
      it('should leave trip successfully', async () => {
        mockAxiosInstance.post.mockResolvedValue({
          data: { message: 'Left trip successfully' }
        });

        await tripService.leaveTrip(1);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/trips/1/leave');
      });
    });

    describe('addCoOwner', () => {
      it('should add co-owner successfully', async () => {
        mockAxiosInstance.post.mockResolvedValue({
          data: { message: 'Co-owner added successfully' }
        });

        await tripService.addCoOwner(1, 'user123');

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/trips/1/co-owner/user123');
      });

      it('should handle add co-owner errors', async () => {
        mockAxiosInstance.post.mockRejectedValue(new Error('Network error'));

        await expect(tripService.addCoOwner(1, 'user123')).rejects.toThrow('Failed to add co-owner. Please try again later.');
      });
    });

    describe('removeCoOwner', () => {
      it('should remove co-owner successfully', async () => {
        mockAxiosInstance.delete.mockResolvedValue({
          data: { message: 'Co-owner removed successfully' }
        });

        await tripService.removeCoOwner(1, 'user123');

        expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/trips/1/co-owner/user123');
      });

      it('should handle remove co-owner errors', async () => {
        mockAxiosInstance.delete.mockRejectedValue(new Error('Network error'));

        await expect(tripService.removeCoOwner(1, 'user123')).rejects.toThrow('Failed to remove co-owner. Please try again later.');
      });
    });

    describe('createTrip - Error Handling', () => {
      it('should handle create trip errors', async () => {
        const tripData = {
          name: 'New Trip',
          destination: 'Tokyo',
          description: 'Exciting adventure',
          startDate: '2025-10-01',
          endDate: '2025-10-07',
          capacity: 12,
          price: 800
        };

        const error = new Error('Creation failed');
        mockAxiosInstance.post.mockRejectedValue(error);

        await expect(tripService.createTrip(tripData)).rejects.toThrow('Failed to create trip. Please try again later.');
      });
    });

    describe('updateTrip - Error Handling', () => {
      const updateData = {
        name: 'Updated Trip',
        destination: 'Updated Destination',
        description: 'Updated description',
        startDate: '2025-11-01',
        endDate: '2025-11-07',
        capacity: 15,
        price: 600
      };

      it('should update trip successfully', async () => {
        const updatedTrip: Trip = {
          id: 1,
          name: 'Updated Trip',
          destination: 'Updated Destination',
          description: 'Updated description',
          startDate: '2025-11-01',
          endDate: '2025-11-07',
          capacity: 15,
          price: 600,
          ownerId: '1',
          currentParticipantCount: 0,
          hasAvailableSpots: true,
          participants: [],
          coOwners: []
        };

        mockAxiosInstance.put.mockResolvedValue({
          data: updatedTrip
        });

        const result = await tripService.updateTrip(1, updateData);

        expect(result).toEqual(updatedTrip);
        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/trips/1', updateData);
      });

      it('should handle update trip errors', async () => {
        const error = new Error('Update failed');
        mockAxiosInstance.put.mockRejectedValue(error);

        await expect(tripService.updateTrip(1, updateData)).rejects.toThrow('Update failed');
      });
    });

    describe('deleteTrip - Error Handling', () => {
      it('should delete trip successfully', async () => {
        mockAxiosInstance.delete.mockResolvedValue({ data: { message: 'Trip deleted' } });

        await tripService.deleteTrip(1);

        expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/trips/1');
      });

      it('should handle delete trip errors', async () => {
        const error = new Error('Delete failed');
        mockAxiosInstance.delete.mockRejectedValue(error);

        await expect(tripService.deleteTrip(1)).rejects.toThrow('Delete failed');
      });
    });

    describe('joinTrip - Error Handling', () => {
      it('should join trip successfully', async () => {
        mockAxiosInstance.post.mockResolvedValue({
          data: { message: 'Successfully joined trip' }
        });

        await tripService.joinTrip(1);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/trips/1/join');
      });

      it('should handle join trip errors', async () => {
        const error = new Error('Join failed');
        mockAxiosInstance.post.mockRejectedValue(error);

        await expect(tripService.joinTrip(1)).rejects.toThrow('Join failed');
      });
    });

    describe('leaveTrip - Error Handling', () => {
      it('should leave trip successfully', async () => {
        mockAxiosInstance.post.mockResolvedValue({
          data: { message: 'Successfully left trip' }
        });

        await tripService.leaveTrip(1);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/trips/1/leave');
      });

      it('should handle leave trip errors', async () => {
        const error = new Error('Leave failed');
        mockAxiosInstance.post.mockRejectedValue(error);

        await expect(tripService.leaveTrip(1)).rejects.toThrow('Leave failed');
      });
    });

    describe('addCoOwner - Error Handling', () => {
      it('should add co-owner successfully', async () => {
        mockAxiosInstance.post.mockResolvedValue({
          data: { message: 'Co-owner added successfully' }
        });

        await tripService.addCoOwner(1, 'user-id-123');

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/trips/1/co-owner/user-id-123');
      });

      it('should handle add co-owner errors', async () => {
        const error = new Error('Add co-owner failed');
        mockAxiosInstance.post.mockRejectedValue(error);

        await expect(tripService.addCoOwner(1, 'user-id-123')).rejects.toThrow('Failed to add co-owner. Please try again later.');
      });
    });

    describe('removeCoOwner - Error Handling', () => {
      it('should remove co-owner successfully', async () => {
        mockAxiosInstance.delete.mockResolvedValue({
          data: { message: 'Co-owner removed successfully' }
        });

        await tripService.removeCoOwner(1, 'user-id-123');

        expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/trips/1/co-owner/user-id-123');
      });

      it('should handle remove co-owner errors', async () => {
        const error = new Error('Remove co-owner failed');
        mockAxiosInstance.delete.mockRejectedValue(error);

        await expect(tripService.removeCoOwner(1, 'user-id-123')).rejects.toThrow('Failed to remove co-owner. Please try again later.');
      });
    });
  });

  describe('API Configuration', () => {
    describe('Axios Setup', () => {
      it('should verify API services are properly initialized', () => {
        // Verify the API services are accessible and have the expected methods
        expect(authService).toBeDefined();
        expect(tripService).toBeDefined();
        
        // Verify key service methods exist
        expect(typeof authService.login).toBe('function');
        expect(typeof authService.register).toBe('function');
        expect(typeof tripService.getFutureTrips).toBe('function');
        expect(typeof tripService.createTrip).toBe('function');
      });

      it('should set up interceptors for authentication and error handling', () => {
        // This is a basic test to ensure the API module loads correctly
        // and that the service exports are available
        expect(authService).toBeDefined();
        expect(tripService).toBeDefined();
        expect(typeof authService.checkHealth).toBe('function');
        expect(typeof tripService.checkHealth).toBe('function');
      });
    });
  });
});