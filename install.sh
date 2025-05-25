#!/bin/bash

# TradeBot Installation Script
# Bu script uygulamayı tek komutla kurar ve çalıştırır

set -e  # Hata durumunda script'i durdur

echo "🚀 TradeBot Installation Script"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is installed
print_info "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed!"
    print_info "Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi
print_status "Docker is installed"

# Check if Docker Compose is installed
print_info "Checking Docker Compose installation..."
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed!"
    print_info "Please install Docker Compose from: https://docs.docker.com/compose/install/"
    exit 1
fi
print_status "Docker Compose is installed"

# Check if ports are available
print_info "Checking if required ports are available..."
ports=(3000 8000 5432 6379)
for port in "${ports[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        print_warning "Port $port is already in use!"
        read -p "Do you want to continue anyway? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Installation cancelled."
            exit 1
        fi
    fi
done
print_status "Required ports are available"

# Create .env file if not exists
print_info "Setting up environment configuration..."
if [ ! -f .env ]; then
    cp env.example .env
    print_status "Created .env file from template"
    print_warning "Please edit .env file with your configuration before running the application"
else
    print_info ".env file already exists"
fi

# Create necessary directories
print_info "Creating necessary directories..."
mkdir -p cache logs
chmod 755 cache logs
print_status "Directories created"

# Make scripts executable
print_info "Making scripts executable..."
chmod +x scripts/*.sh
print_status "Scripts are now executable"

# Pull and build Docker images
print_info "Building Docker images... (This may take a few minutes)"
if docker compose version &> /dev/null; then
    docker compose build --no-cache
else
    docker-compose build --no-cache
fi
print_status "Docker images built successfully"

# Start the application
print_info "Starting TradeBot application..."
if docker compose version &> /dev/null; then
    docker compose up -d
else
    docker-compose up -d
fi

# Wait for services to be healthy
print_info "Waiting for services to be ready..."
sleep 10

# Check service health
print_info "Checking service health..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        print_status "Backend is healthy"
        break
    fi

    attempt=$((attempt + 1))
    if [ $attempt -eq $max_attempts ]; then
        print_error "Backend health check failed after $max_attempts attempts"
        print_info "Check logs with: docker compose logs backend"
        exit 1
    fi

    print_info "Waiting for backend to be ready... (attempt $attempt/$max_attempts)"
    sleep 5
done

if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_status "Frontend is healthy"
else
    print_warning "Frontend health check failed, but may still be starting"
fi

echo ""
echo "🎉 TradeBot installation completed successfully!"
echo "================================"
echo ""
print_info "Application URLs:"
echo "  📱 Frontend: http://localhost:3000"
echo "  🔧 Backend API: http://localhost:8000"
echo "  📚 API Docs: http://localhost:8000/docs"
echo ""
print_info "Useful commands:"
echo "  📊 View logs: docker compose logs -f"
echo "  🔄 Restart: docker compose restart"
echo "  🛑 Stop: docker compose down"
echo "  🗑️  Remove all: docker compose down -v"
echo ""
print_warning "Remember to:"
echo "  1. Edit your .env file with proper API keys"
echo "  2. Change default passwords in production"
echo "  3. Set up SSL/TLS for production deployment"
echo ""
print_status "Happy trading! 🚀"
