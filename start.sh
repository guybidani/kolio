#!/bin/sh

echo "Running database migrations..."
node ./node_modules/prisma/build/index.js db push --schema=./prisma/schema.prisma --skip-generate --accept-data-loss 2>&1 || echo "Migration may have failed"

echo "Seeding database..."
node prisma/seed.js 2>&1 || echo "Seed skipped"

echo "Starting Kolio..."
exec node server.js
