#!/bin/sh

echo "Running database migrations..."
./node_modules/prisma/build/index.js db push --schema=./prisma/schema.prisma --skip-generate --accept-data-loss 2>&1 || echo "Migration failed - check DATABASE_URL"

echo "Seeding database..."
node prisma/seed.js 2>&1 || echo "Seed skipped (may already exist)"

echo "Starting Kolio..."
exec node server.js
