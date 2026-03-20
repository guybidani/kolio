#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma db push --schema=./prisma/schema.prisma --skip-generate 2>/dev/null || echo "Migration skipped or failed - DB may not be ready yet"

echo "Seeding database..."
node prisma/seed.js 2>/dev/null || echo "Seed skipped (may already exist)"

echo "Starting Kolio..."
exec node server.js
