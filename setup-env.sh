#!/bin/bash

echo "Setting up environment files..."

if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env from template..."
    cp backend/env.template backend/.env
    echo "✓ Backend .env created"
else
    echo "Backend .env already exists, skipping..."
fi

if [ ! -f "frontend/.env" ]; then
    echo "Creating frontend/.env from template..."
    cp frontend/env.template frontend/.env
    echo "✓ Frontend .env created"
else
    echo "Frontend .env already exists, skipping..."
fi

echo ""
echo "⚠️  IMPORTANT: Update the .env files with your actual credentials:"
echo "   - backend/.env: Database, JWT secrets, OpenAI API key"
echo "   - frontend/.env: API URL (if different from default)"
echo ""
echo "Setup complete!"

