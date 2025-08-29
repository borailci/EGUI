# GitHub Actions Workflows

This directory contains the CI/CD workflows for the Trip Organizer application.

## Workflows

### 1. Backend CI (`backend-ci.yml`)

**Purpose**: Continuous Integration for the ASP.NET Core API

**Triggers**:

- Push to `main` or `develop` branches (only when backend files change)
- Pull requests to `main` (only when backend files change)
- Manual workflow call

**What it does**:

- Sets up .NET 8.0 environment
- Starts PostgreSQL test database
- Restores NuGet packages with caching
- Builds the API project
- Runs unit tests (when available)
- Tests database connectivity via health check endpoint

**Path filters**: `Lab4/TripOrganizer.API/**`

### 2. Frontend CI (`frontend-ci.yml`)

**Purpose**: Continuous Integration for the React frontend

**Triggers**:

- Push to `main` or `develop` branches (only when frontend files change)
- Pull requests to `main` (only when frontend files change)
- Manual workflow call

**What it does**:

- Sets up Node.js 18.x environment
- Installs npm dependencies with caching
- Runs ESLint (if configured)
- Runs Jest tests with coverage
- Builds the React application
- Uploads build artifacts for 7 days

**Path filters**: `Lab4/trip-organizer-web/**`

### 3. Full CI Pipeline (`full-ci.yml`)

**Purpose**: Runs complete CI pipeline for both frontend and backend

**Triggers**:

- Push to `main` branch
- Pull requests to `main` branch

**What it does**:

- Runs backend and frontend CI jobs in parallel
- Generates integration summary
- Fails if either component fails

## Artifacts

The workflows generate the following artifacts:

- **frontend-build**: Production build of React app (7 days retention)
- **frontend-coverage**: Test coverage reports (7 days retention)

## Environment Variables

### Backend CI

- `DOTNET_VERSION`: .NET version (8.0.x)
- `PROJECT_PATH`: Path to API project (Lab4/TripOrganizer.API)

### Frontend CI

- `NODE_VERSION`: Node.js version (18.x)
- `PROJECT_PATH`: Path to React project (Lab4/trip-organizer-web)

## Database Configuration

The backend CI uses a PostgreSQL service container with:

- **Image**: postgres:15
- **Database**: triporganizer_test
- **User**: postgres
- **Password**: postgres
- **Port**: 5432

## Status Checks

Both workflows include:

- Build summary generation
- Artifact uploads
- Health checks (backend only)
- Test coverage (frontend only)

## Next Steps

1. Add unit tests to backend API
2. Configure ESLint for frontend
3. Add security scanning
4. Set up deployment workflows
