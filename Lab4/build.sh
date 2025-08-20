#!/bin/bash

# Exit on any error
set -e

echo "Starting build process..."

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed"
    exit 1
fi

# Check if dotnet is installed
if ! command -v dotnet &> /dev/null; then
    echo "Error: dotnet is not installed"
    exit 1
fi

# Build frontend
echo "Building frontend..."
cd trip-organizer-web
npm install
npm run build

# Create wwwroot directory if it doesn't exist
echo "Creating wwwroot directory..."
mkdir -p ../TripOrganizer.API/wwwroot

# Copy the build to the backend's wwwroot
echo "Copying frontend build to backend..."
cp -r build/* ../TripOrganizer.API/wwwroot/

# Build backend
echo "Building backend..."
cd ../TripOrganizer.API

# Clean any previous builds
dotnet clean

# Restore packages
dotnet restore

# Build and publish
echo "Publishing backend..."
dotnet publish -c Release -r osx-x64 --self-contained true \
    /p:PublishSingleFile=true \
    /p:IncludeNativeLibrariesForSelfExtract=true \
    /p:EnableCompressionInSingleFile=true \
    /p:DebugType=None \
    /p:DebugSymbols=false

# Create a bin directory in the root and copy everything there
echo "Creating simplified executable location..."
mkdir -p ../bin
rm -rf ../bin/*  # Clean the bin directory
cp -r ./bin/Release/net8.0/osx-x64/publish/* ../bin/
chmod +x ../bin/TripOrganizer.API

echo "Build completed successfully!"
echo "To run the application, cd bin && ./TripOrganizer.API"
