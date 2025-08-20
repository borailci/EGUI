# Trip Organizer

This repository contains the Trip Organizer application, which consists of:

1. ASP.NET Core Web API backend
2. React.js frontend
3. PostgreSQL database

## Prerequisites

- .NET 8.0 SDK
- Node.js 18+
- PostgreSQL

## Quick Start

1. Set up the database:

   - Install PostgreSQL if not already installed
   - Create a new database named 'triporganizer_lab4'
   - Update the connection string in `TripOrganizer.API/appsettings.Production.json` if needed

2. Build and run the application:

   ```bash
   ./build.sh
   cd bin && ./TripOrganizerAPI
   ```

   The backend will start on http://localhost:5000

3. The application will be available at:

   ```bash
   http://localhost:5000

   - API Endpoints:
     - Authentication: http://localhost:5000/api/auth
     - Health Check: http://localhost:5000/api/auth/health
   ```

## Architecture

The application uses a three-tier architecture:

- **Frontend**: React.js application
- **Backend**: ASP.NET Core Web API
- **Database**: PostgreSQL

## Configuration

Configuration is handled through appsettings files:

- `appsettings.Production.json` for production settings
- Database connection string
- JWT authentication settings
- CORS settings
- Health check settings

## API Endpoints

### Authentication

- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login and get JWT token
- GET `/api/auth/verify` - Verify JWT token
- GET `/api/auth/health` - Simple health check

## Security

- JWT authentication for API endpoints
- Secure password storage using ASP.NET Core Identity
- CORS configuration for frontend access
- Password requirements:
  - Minimum 8 characters
  - Must include uppercase and lowercase letters
  - Must include numbers
  - Must include special characters
