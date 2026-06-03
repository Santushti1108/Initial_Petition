#!/bin/bash

echo "========================================="
echo "   NyayaLens - AI Legal Petition Analyzer"
echo "========================================="
echo ""

# Start backend
echo "[1/2] Starting Flask backend on port 5000..."
cd backend
source venv/bin/activate
python app.py &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
sleep 2

# Start frontend
echo "[2/2] Starting Vite frontend on port 5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================="
echo "  Backend:  http://localhost:5000"
echo "  Frontend: http://localhost:5173"
echo "========================================="
echo ""
echo "Press Ctrl+C to stop both servers"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
