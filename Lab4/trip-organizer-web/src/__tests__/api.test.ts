import axios from 'axios';
import { AuthResponse, Trip, User } from '../types/api';
import { authService, tripService } from '../services/api';

// Mock axios completely before any usage
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

jest.mock('axios', () => ({
  create: jest.fn(() => mockAxiosInstance),
  isAxiosError: jest.fn()
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

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

      it('should return false when health check fails', async () => {
        mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

        const result = await authService.checkHealth();

        expect(result).toBe(false);
      });
    });

    describe('register', () => {
      const registerData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User'
      };

      it('should register successfully when API is healthy', async () => {
        // Mock health check
        mockAxiosInstance.get.mockResolvedValue({
          data: { status: 'healthy' }
        });
        
        // Mock registration
        mockAxiosInstance.post.mockResolvedValue({
          data: { message: 'User registered successfully' }
        });

        await expect(authService.register(registerData)).resolves.toBeUndefined();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/health');
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/register', registerData);
      });

      it('should throw error when API is unhealthy', async () => {
        mockAxiosInstance.get.mockResolvedValue({
          data: { status: 'unhealthy' }
        });

        await expect(authService.register(registerData)).rejects.toThrow('API is not healthy. Please try again later.');
      });

      it('should handle duplicate username error', async () => {
        mockAxiosInstance.get.mockResolvedValue({
          data: { status: 'healthy' }
        });

        const duplicateError = {
          response: {
            data: {
              errors: [{
                code: 'DuplicateUserName',
                description: 'Username already exists'
              }]
            }
          }
        };
        mockAxiosInstance.post.mockRejectedValue(duplicateError);

        await expect(authService.register(registerData)).rejects.toThrow("Username 'test@example.com' is already taken.");
      });

      it('should handle array of errors', async () => {
        mockAxiosInstance.get.mockResolvedValue({
          data: { status: 'healthy' }
        });

        const multipleErrors = {
          response: {
            data: {
              errors: [
                { description: 'Password too weak' },
                { message: 'Email invalid' }
              ]
            }
          }
        };
        mockAxiosInstance.post.mockRejectedValue(multipleErrors);

        await expect(authService.register(registerData)).rejects.toThrow('Password too weak Email invalid');
      });
    });

    describe('login', () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockAuthResponse: AuthResponse = {
        token: 'jwt-token',
        user: {
          id: '1',
          email: 'test@example.com',
          fullName: 'Test User'
        }
      };

      it('should login successfully when API is healthy', async () => {
        mockAxiosInstance.get.mockResolvedValue({
          data: { status: 'healthy' }
        });
        
        mockAxiosInstance.post.mockResolvedValue({
          data: mockAuthResponse
        });

        const result = await authService.login(loginData);

        expect(result).toEqual(mockAuthResponse);
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/health');
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/login', loginData);
      });

      it('should throw error when API is unhealthy', async () => {
        mockAxiosInstance.get.mockResolvedValue({
          data: { status: 'unhealthy' }
        });

        await expect(authService.login(loginData)).rejects.toThrow('API is not healthy. Please try again later.');
      });

      it('should handle login errors', async () => {
        mockAxiosInstance.get.mockResolvedValue({
          data: { status: 'healthy' }
        });

        const loginError = {
          response: {
            status: 401,
            data: { message: 'Invalid credentials' }
          }
        };
        mockAxiosInstance.post.mockRejectedValue(loginError);

        await expect(authService.login(loginData)).rejects.toEqual(loginError);
      });
    });

    describe('updateProfile', () => {
      const updateData = {
        fullName: 'Updated Name',
        email: 'updated@example.com',
        currentPassword: 'oldpass',
        newPassword: 'newpass'
      };

      const mockUser: User = {
        id: '1',
        email: 'updated@example.com',
        fullName: 'Updated Name'
      };

      it('should update profile successfully', async () => {
        mockAxiosInstance.put.mockResolvedValue({
          data: { user: mockUser }
        });

        const result = await authService.updateProfile(updateData);

        expect(result).toEqual(mockUser);
        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/auth/profile', updateData);
        expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
      });

      it('should handle update profile errors', async () => {
        const updateError = {
          response: {
            status: 400,
            data: { message: 'Invalid data' }
          }
        };
        mockAxiosInstance.put.mockRejectedValue(updateError);

        await expect(authService.updateProfile(updateData)).rejects.toEqual(updateError);
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
  });
});
