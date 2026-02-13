#!/bin/bash
set -e

echo "==> Applying D1 migrations locally..."
npx wrangler d1 migrations apply tektik-db --local

echo "==> Starting wrangler dev server..."
npx wrangler dev --port 8787 --ip 0.0.0.0 &
WRANGLER_PID=$!

# Wait for the server to be ready
echo "==> Waiting for server to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0
until curl -sf http://localhost:8787/ > /dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "ERROR: Server did not start within ${MAX_RETRIES} seconds"
        kill $WRANGLER_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done
echo "==> Server is ready!"

echo "==> Running integration tests..."
npx vitest run --config vitest.integration.config.ts
TEST_EXIT_CODE=$?

echo "==> Stopping server..."
kill $WRANGLER_PID 2>/dev/null || true
wait $WRANGLER_PID 2>/dev/null || true

exit $TEST_EXIT_CODE
