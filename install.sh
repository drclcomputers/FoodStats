#!/bin/bash

# Make backend executable
chmod +x ./backend/FoodStats

# Install dependencies
npm install

# Install Python dependencies for FoodStats ML components

echo "Installing Python dependencies..."
pip3 install --no-cache-dir -r requirements.txt

# Verify installations
echo "Verifying installations:"
pip3 list | grep -E "numpy|pandas|scikit-learn"

echo "Python setup complete!"

# Start the application
npm start