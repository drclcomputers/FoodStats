#!/bin/bash

# Make backend executable
chmod +x ./backend/FoodStats

# Install dependencies
npm install
pip install -r requirements.txt

# Start the application
npm start