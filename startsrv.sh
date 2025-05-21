#!/bin/bash

cd backend || exit 1

# Build Go app
go build -o app || { echo "Go build failed"; exit 1; }

# Install Python dependencies
pip install -r requirements.txt || { echo "pip install failed"; exit 1; }
