# Docker Configuration for Trip Organizer

This document describes the Docker containerization setup for the Trip Organizer application.

## Overview

The application is containerized using Docker with the following components:

- **PostgreSQL Database** (postgres:15-alpine)
- **ASP.NET Core API** (Custom .NET 8.0 image)
- **React Frontend** (Node.js 18 with nginx for production)
- **Nginx** (Reverse proxy and static file serving)

## Files Structure

```
Lab4/
├── docker-compose.yml              # Main compose file
├── docker-compose.override.yml     # Development overrides
├── docker-compose.prod.yml         # Production configuration
├── .env.example                    # Environment variables template
├── docker-helper.sh               # Helper script for common tasks
├── TripOrganizer.API/
│   ├── Dockerfile                 # API containerization
│   └── .dockerignore              # Docker ignore rules
└── trip-organizer-web/
    ├── Dockerfile.dev             # Frontend containerization
    └── nginx.conf                 # Nginx configuration
```

## Quick Start

### Development Environment

1. **Setup environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

2. **Start development environment:**

   ```bash
   ./docker-helper.sh dev:up
   ```

3. **Access the application:**
   - Frontend (React dev server): http://localhost:3000
   - API: http://localhost:8080
   - Database: localhost:5432

### Production Environment

1. **Start production environment:**

   ```bash
   ./docker-helper.sh prod:up
   ```

2. **Access the application:**
   - Application (Nginx): http://localhost:8081
   - API: http://localhost:8080

## Docker Helper Script

The `docker-helper.sh` script provides convenient commands:

```bash
# Development
./docker-helper.sh dev:up      # Start development
./docker-helper.sh dev:down    # Stop development
./docker-helper.sh dev:logs    # View logs

# Production
./docker-helper.sh prod:up     # Start production
./docker-helper.sh prod:down   # Stop production

# Utilities
./docker-helper.sh build       # Build all images
./docker-helper.sh clean       # Clean up resources
./docker-helper.sh status      # Show container status
./docker-helper.sh health      # Health check
./docker-helper.sh db:reset    # Reset database
```

## Environment Variables

Key environment variables (see `.env.example`):

- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `JWT_SECRET_KEY` - JWT signing key
- `FRONTEND_URL` - Frontend URL for CORS
- `API_PORT` - API port (default: 8080)
- `FRONTEND_PORT` - Frontend port (default: 8081)

## Docker Compose Configurations

### Development (`docker-compose.yml` + `docker-compose.override.yml`)

- Hot reload for both frontend and backend
- Development database with exposed port
- Debug logging enabled
- Source code mounted as volumes

### Production (`docker-compose.prod.yml`)

- Optimized images with resource limits
- Production database configuration
- Nginx for static file serving
- Security-focused configuration
- Health checks and restart policies

## Container Details

### Database Container

- **Image**: postgres:15-alpine
- **Port**: 5432
- **Volume**: Persistent data storage
- **Health Check**: pg_isready command
- **Network**: Internal triporganizer_network

### API Container

- **Base Image**: mcr.microsoft.com/dotnet/aspnet:8.0
- **Port**: 8080
- **Health Check**: /health endpoint
- **Security**: Non-root user
- **Build**: Multi-stage with SDK for building

### Frontend Container (Development)

- **Base Image**: node:18-alpine
- **Port**: 3000
- **Hot Reload**: Source code mounted
- **Environment**: Development optimized

### Frontend Container (Production)

- **Base Image**: nginx:alpine
- **Port**: 80 (exposed as 8081)
- **Static Files**: Built React app
- **Proxy**: API requests to backend

## Security Features

- Non-root users in containers
- Resource limits in production
- Security headers in nginx
- Secrets via environment variables
- Network isolation
- Health checks for reliability

## Development Workflow

1. **Make changes** to source code
2. **Hot reload** automatically picks up changes
3. **View logs** with `./docker-helper.sh logs`
4. **Reset database** if needed with `./docker-helper.sh db:reset`
5. **Check health** with `./docker-helper.sh health`

## Production Deployment

1. **Set environment variables** for production
2. **Build images** with `./docker-helper.sh build`
3. **Start production** with `./docker-helper.sh prod:up`
4. **Monitor** with `./docker-helper.sh status`

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in `.env` file
2. **Permission issues**: Ensure docker-helper.sh is executable
3. **Database connection**: Check if database container is healthy
4. **Build failures**: Clean up with `./docker-helper.sh clean`

### Debugging Commands

```bash
# View container logs
docker-compose logs -f [service-name]

# Execute commands in containers
docker-compose exec api bash
docker-compose exec database psql -U postgres -d triporganizer_lab4

# Check container status
docker-compose ps

# View resource usage
docker stats
```

## CI/CD Integration

The Docker setup integrates with GitHub Actions:

- Build images in CI pipeline
- Run tests in containers
- Deploy to production environments
- Health checks for deployment verification

## Next Steps

1. Add Docker image scanning for security
2. Implement container orchestration (Kubernetes)
3. Set up monitoring and logging
4. Add backup strategies for database
5. Implement secrets management (Docker Secrets/HashiCorp Vault)
