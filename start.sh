#!/bin/sh

echo "Running database migrations..."
npx prisma db push --accept-data-loss 2>&1 || echo "Migration may have failed"

echo "Seeding database..."
node prisma/seed.js 2>&1 || echo "Seed skipped"

echo "Starting workers..."
node dist/workers/index.js &

echo "Starting Kolio..."
exec node server.js
