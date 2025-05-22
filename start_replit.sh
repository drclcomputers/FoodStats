#!/bin/bash

# Display Python version and path
python_path=$(which python3)
echo "Using Python3 from: $python_path"
python3 --version

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt --no-cache-dir

# Create a proper frontend directory structure
echo "Setting up frontend..."
mkdir -p /home/runner/FoodStats/frontend/src/css
mkdir -p /home/runner/FoodStats/frontend/src/js

# Copy all frontend files with proper structure
echo "Copying frontend files..."
cp -r frontend/*.html /home/runner/FoodStats/frontend/
cp -r frontend/src/css/* /home/runner/FoodStats/frontend/src/css/
cp -r frontend/src/js/* /home/runner/FoodStats/frontend/src/js/
cp -r frontend/src/favicon.ico /home/runner/FoodStats/frontend/src/ 2>/dev/null || true

# List files to verify the structure
echo "Files in frontend directory:"
find /home/runner/FoodStats/frontend -type f | sort

# Build Go backend
echo "Building backend..."
cd backend
go build -o app 

# Set environment variables
export REPLIT=true
export FRONTEND_PATH="/home/runner/FoodStats/frontend"
echo "export REPLIT=true" >> ~/.bashrc
echo "export FRONTEND_PATH=/home/runner/FoodStats/frontend" >> ~/.bashrc

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