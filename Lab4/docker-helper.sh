#!/bin/bash

# Docker Helper Scripts for Trip Organizer
# Usage: ./docker-helper.sh [command]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env exists
check_env_file() {
    if [ ! -f .env ]; then
        log_warning ".env file not found. Creating from template..."
        cp .env.example .env
        log_info "Please edit .env file with your configuration before running again."
        exit 1
    fi
}

# Development commands
dev_up() {
    log_info "Starting development environment..."
    check_env_file
    docker-compose -f docker-compose.yml -f docker-compose.override.yml up --build -d
    log_success "Development environment started!"
    log_info "API: http://localhost:8080"
    log_info "Frontend: http://localhost:3000"
    log_info "Database: localhost:5432"
}

dev_down() {
    log_info "Stopping development environment..."
    docker-compose -f docker-compose.yml -f docker-compose.override.yml down
    log_success "Development environment stopped!"
}

dev_logs() {
    docker-compose -f docker-compose.yml -f docker-compose.override.yml logs -f
}

# Production commands
prod_up() {
    log_info "Starting production environment..."
    check_env_file
    docker-compose -f docker-compose.prod.yml up --build -d
    log_success "Production environment started!"
    log_info "Application: http://localhost:8081"
    log_info "API: http://localhost:8080"
}

prod_down() {
    log_info "Stopping production environment..."
    docker-compose -f docker-compose.prod.yml down
    log_success "Production environment stopped!"
}

# Utility commands
build_all() {
    log_info "Building all Docker images..."
    docker-compose build --no-cache
    log_success "All images built successfully!"
}

clean() {
    log_info "Cleaning up Docker resources..."
    docker-compose down -v --remove-orphans
    docker system prune -f
    log_success "Cleanup completed!"
}

status() {
    log_info "Docker containers status:"
    docker-compose ps
}

logs() {
    if [ -n "$2" ]; then
        docker-compose logs -f "$2"
    else
        docker-compose logs -f
    fi
}

# Database commands
db_reset() {
    log_warning "This will delete all data in the database!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Resetting database..."
        docker-compose down
        docker volume rm lab4_postgres_data 2>/dev/null || true
        docker-compose up -d database
        log_success "Database reset completed!"
    else
        log_info "Database reset cancelled."
    fi
}

# Health check
health() {
    log_info "Checking application health..."
    
    # Check API health
    if curl -f http://localhost:8080/health >/dev/null 2>&1; then
        log_success "API is healthy ✓"
    else
        log_error "API is not responding ✗"
    fi
    
    # Check database connection
    if docker-compose exec -T database pg_isready -U postgres >/dev/null 2>&1; then
        log_success "Database is healthy ✓"
    else
        log_error "Database is not responding ✗"
    fi
}

# Help command
show_help() {
    echo "Trip Organizer Docker Helper"
    echo ""
    echo "Usage: ./docker-helper.sh [command]"
    echo ""
    echo "Development Commands:"
    echo "  dev:up      Start development environment"
    echo "  dev:down    Stop development environment" 
    echo "  dev:logs    View development logs"
    echo ""
    echo "Production Commands:"
    echo "  prod:up     Start production environment"
    echo "  prod:down   Stop production environment"
    echo ""
    echo "Utility Commands:"
    echo "  build       Build all Docker images"
    echo "  clean       Clean up Docker resources"
    echo "  status      Show container status"
    echo "  logs [service]  View logs (optionally for specific service)"
    echo "  health      Check application health"
    echo "  db:reset    Reset database (WARNING: deletes all data)"
    echo ""
    echo "Examples:"
    echo "  ./docker-helper.sh dev:up"
    echo "  ./docker-helper.sh logs api"
    echo "  ./docker-helper.sh health"
}

# Main command dispatcher
case "$1" in
    "dev:up")
        dev_up
        ;;
    "dev:down")
        dev_down
        ;;
    "dev:logs")
        dev_logs
        ;;
    "prod:up")
        prod_up
        ;;
    "prod:down")
        prod_down
        ;;
    "build")
        build_all
        ;;
    "clean")
        clean
        ;;
    "status")
        status
        ;;
    "logs")
        logs "$@"
        ;;
    "health")
        health
        ;;
    "db:reset")
        db_reset
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
