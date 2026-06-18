#!/bin/sh
# Replit startup: install deps, seed DB on first run, then start Next.js

set -e

# Install dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Seed the database on first run (creates greenlight.db)
if [ ! -f "greenlight.db" ]; then
  echo "First run — seeding database with demo data..."
  npm run seed
  echo "Database ready."
fi

# Start Next.js in production mode (build first if .next is missing)
if [ ! -d ".next" ]; then
  echo "Building app..."
  npm run build
fi

echo "Starting Greenlight..."
npm run start
