#!/bin/bash

# Display Python version and path
python_path=$(which python3)
echo "Using Python3 from: $python_path"
python3 --version

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt --no-cache-dir

# Build Go backend
echo "Building backend..."
cd backend
go build -o app 

# Modify AI service path for Replit
echo "export REPLIT=true" >> ~/.bashrc
export REPLIT=true

# Start the backend
echo "Starting backend server..."
./app &
backend_pid=$!

# Wait a bit for the backend to start
sleep 3

# Forward port for Replit
echo "Setting up port forwarding..."
curl -s https://educated-slimy-andesaurus.glitch.me/forward-port.html?port=8080 > /dev/null

# Keep the script running to keep the backend alive
echo "FoodStats is now running!"
echo "Access the application using the 'Webview' button in Replit"
echo "Press Ctrl+C to stop the application"

# Wait for backend to finish
wait $backend_pid