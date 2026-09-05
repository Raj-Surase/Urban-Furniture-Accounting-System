#!/usr/bin/env bash
set -e

echo "========================================================"
echo "🚀 Bootstrapping Hackathon Full-Stack Architecture Skeleton"
echo "========================================================"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Environment Checks
echo "🔍 Checking environment prerequisites..."
command -v php >/dev/null 2>&1 || { echo "❌ PHP is required but not installed."; exit 1; }
command -v composer >/dev/null 2>&1 || { echo "❌ Composer is required but not installed."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed."; exit 1; }

echo "✅ PHP: $(php -r 'echo PHP_VERSION;')"
echo "✅ Composer: $(composer --version | cut -d' ' -f3)"
echo "✅ Node: $(node -v)"
echo "✅ npm: $(npm -v)"

# 2. Root Monorepo
echo ""
echo "📦 Installing root runner dependencies..."
cd "$ROOT_DIR"
npm install --no-audit --no-fund

# 3. Realtime Server
echo ""
echo "⚡ Setting up Node.js + Socket.io Realtime server..."
cd "$ROOT_DIR/realtime"
if [ ! -f .env ]; then
  cp .env.example .env
fi
npm install --no-audit --no-fund

# 4. Backend (Laravel)
echo ""
echo "🐘 Setting up Laravel API Backend..."
cd "$ROOT_DIR/backend"
if [ ! -f .env ]; then
  cp .env.example .env
fi
touch database/database.sqlite
composer install --prefer-dist --no-interaction
php artisan key:generate --force
php artisan migrate:fresh --seed --force

# 5. Frontend (React + Vite)
echo ""
echo "⚛️ Setting up React + Vite Frontend..."
cd "$ROOT_DIR/frontend"
if [ ! -f .env ]; then
  cp .env.example .env
fi
npm install --no-audit --no-fund
npm run build

echo ""
echo "========================================================"
echo "🎉 Setup Complete! Everything is wired and ready to run."
echo "========================================================"
echo ""
echo "👉 Start all 3 services with ONE command:"
echo "   npm run dev"
echo ""
echo "Services will be accessible at:"
echo "   - React Frontend: http://localhost:5173"
echo "   - Laravel API:    http://localhost:8000/api"
echo "   - Realtime WS:    http://localhost:3001"
echo ""
echo "Default Accounts (Database is pre-seeded):"
echo "   - Admin:   admin@example.com / password (or password123) (role: admin)"
echo "   - Regular: user@example.com  / password (or password123) (role: user)"
echo "========================================================"

