#!/bin/bash
# Build Go app
cd backend
go build -o app
cd ..

# Set up Python virtual environment
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install --no-cache-dir -r requirements.txt