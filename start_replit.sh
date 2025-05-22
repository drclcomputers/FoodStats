#!/bin/bash

# Display Python version and path
python_path=$(which python3)
echo "Using Python3 from: $python_path"
python3 --version

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt --no-cache-dir

# Make sure frontend is copied to the right location
echo "Setting up frontend..."
mkdir -p frontend
cp -r frontend/* frontend/ || echo "Frontend already in place"

# Build Go backend
echo "Building backend..."
cd backend
go build -o app 

# Set environment variables
echo "export REPLIT=true" >> ~/.bashrc
export REPLIT=true

# Start the backend
echo "Starting backend server..."
./app &
backend_pid=$!

# Wait a bit for the backend to start
sleep 3

# Keep the script running to keep the backend alive
echo "FoodStats is now running!"
echo "Access the application at: https://${REPL_SLUG}.${REPL_OWNER}.repl.co"
echo "Press Ctrl+C to stop the application"

# Wait for backend to finish
wait $backend_pid