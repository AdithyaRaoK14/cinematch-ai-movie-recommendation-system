#!/bin/bash
set -e

echo "========================================="
echo "  CineMatch — Setup Script"
echo "========================================="

# Check .env
if [ ! -f .env ]; then
  cp .env .env.backup 2>/dev/null || true
  echo "ERROR: .env file not found. Copy .env and fill in TMDB_API_KEY."
  exit 1
fi

# Check TMDB key is set
if grep -q "your_tmdb_api_key_here" .env; then
  echo ""
  echo "  ⚠  TMDB_API_KEY is not set in .env"
  echo "     Get a free key at: https://www.themoviedb.org/settings/api"
  echo ""
  read -p "  Continue anyway? (y/N): " confirm
  [ "$confirm" != "y" ] && exit 1
fi

# Check Ollama
echo ""
echo "Checking Ollama..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
  echo "  ✓ Ollama is running"
  # Pull model if not present
  MODEL=$(grep OLLAMA_MODEL .env | cut -d= -f2)
  MODEL=${MODEL:-qwen2.5}
  echo "  Pulling model: $MODEL (skip if already downloaded)"
  ollama pull "$MODEL" 2>/dev/null || echo "  (ollama pull failed — make sure model is available)"
else
  echo "  ⚠  Ollama not detected at localhost:11434"
  echo "     Start Ollama before running the app for AI features"
fi

echo ""
echo "Building and starting containers..."
docker compose up --build -d

echo ""
echo "Waiting for services..."
sleep 5

# Check health
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
  echo "  ✓ Backend running at http://localhost:8000"
else
  echo "  ⚠  Backend not responding yet — check: docker compose logs backend"
fi

echo "  ✓ Frontend running at http://localhost:3000"
echo ""
echo "========================================="
echo "  Open: http://localhost:3000"
echo "  API docs: http://localhost:8000/docs"
echo "========================================="
