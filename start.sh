#!/bin/bash
# Start the Go app (assuming it’s in backend/app)
./backend/app &

# Activate Python environment and run your script
source venv/bin/activate
python3 your_script.py  # or run background tasks here