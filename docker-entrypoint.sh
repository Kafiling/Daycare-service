#!/bin/bash
# docker-entrypoint.sh
set -e

echo "Applying runtime environment variables..."

# Ensure the variables exist to avoid bad replacements 
if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    # Replace the placeholders in all .js files within the built output
    find /app/.next /app/server.js -type f -name "*.js" -exec sed -i "s|RUNTIME_PUBLIC_SUPABASE_URL_PLACEHOLDER|${NEXT_PUBLIC_SUPABASE_URL}|g" {} +
    find /app/.next /app/server.js -type f -name "*.js" -exec sed -i "s|RUNTIME_PUBLIC_SUPABASE_ANON_KEY_PLACEHOLDER|${NEXT_PUBLIC_SUPABASE_ANON_KEY}|g" {} +
else
    echo "Warning: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set at runtime!"
fi

echo "Starting server..."
exec "$@"