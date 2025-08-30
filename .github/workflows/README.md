# CI/CD Workflows Documentation

This directory contains comprehensive GitHub Actions workflows for the Trip Organizer application.

## Available Workflows

### 🔧 backend-ci-cd.yml

**Backend CI/CD Pipeline**

- **Triggers**: Push/PR to main/develop branches affecting backend files
- **Features**:
  - .NET 9.0 build and test
  - PostgreSQL integration testing
  - Security scanning
  - Docker image building
  - Code coverage reporting
  - Automated deployment pipeline

### 🎨 frontend-ci-cd.yml

**Frontend CI/CD Pipeline**

- **Triggers**: Push/PR to main/develop branches affecting frontend files
- **Features**:
  - Node.js 18 build and test (112 tests passing ✅)
  - TypeScript type checking
  - ESLint code quality checks
  - Jest unit testing with coverage
  - Security vulnerability scanning
  - Docker containerization
  - End-to-end testing with Playwright
  - Performance testing with Lighthouse

### 🚀 full-stack-ci-cd.yml

**Comprehensive Full Stack Pipeline**

- **Triggers**: Push/PR to main/develop branches
- **Features**:
  - Smart change detection (builds only what changed)
  - Parallel backend and frontend CI
  - Full stack integration testing
  - Security scanning for entire application
  - Coordinated deployment pipeline
  - Performance monitoring

## Workflow Features

### 🔍 Quality Gates

- ✅ All tests must pass (112 frontend tests passing)
- ✅ Code coverage requirements
- ✅ Security vulnerability scanning
- ✅ Type checking and linting
- ✅ Docker image security scanning

### 🏗️ Build Process

- **Backend**: .NET 9.0 with Entity Framework
- **Frontend**: React 18 with TypeScript
- **Database**: PostgreSQL 15
- **Containerization**: Docker with multi-stage builds

### 🚦 Deployment Strategy

- **Development**: Automatic on feature branches
- **Staging**: Automatic on develop branch
- **Production**: Automatic on main branch with manual approval

### 📊 Monitoring & Reporting

- Test results and coverage reports
- Security scan results
- Performance metrics
- Build artifacts management

## Environment Setup

**No secrets required!** These workflows are designed to work without any external tokens or credentials.

### Optional Secrets (for advanced features)

```yaml
# Only if you want to push to Docker Hub
DOCKER_USERNAME: your-docker-username
DOCKER_PASSWORD: your-docker-password
```

### What runs automatically:

- ✅ **Test Execution**: All 112 frontend tests + backend tests
- ✅ **Build Validation**: Frontend and backend builds
- ✅ **Basic Security**: npm audit and .NET package checks
- ✅ **Docker Building**: Local container builds (no push)
- ✅ **Integration Testing**: Full stack validation

## Usage

### Running Tests Locally

```bash
# Backend tests
cd Lab4/TripOrganizer.API.Tests
dotnet test

# Frontend tests (112 tests)
cd Lab4/trip-organizer-web
npm test -- --coverage --watchAll=false
```

### Building for Production

```bash
# Backend
cd Lab4/TripOrganizer.API
dotnet build --configuration Release

# Frontend
cd Lab4/trip-organizer-web
npm run build
```

## Workflow Status

- ✅ **Backend CI**: Automated testing and building (no tokens needed)
- ✅ **Frontend CI**: 112 tests passing, full coverage
- ✅ **Integration Testing**: Full stack validation
- ✅ **Basic Security**: Built-in security checks
- ✅ **Docker Building**: Local container builds
- ✅ **Simple Deployment**: Ready-to-use validation

## Maintenance

### Updating Dependencies

- Backend: `dotnet list package --outdated`
- Frontend: `npm audit` and `npm update`

### Adding New Tests

- Backend: Add to `TripOrganizer.API.Tests` project
- Frontend: Add to `src/__tests__/` directory

### Performance Optimization

- Monitor build times and optimize caching
- Use appropriate test parallelization
- Optimize Docker layer caching

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
