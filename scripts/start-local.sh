#!/bin/bash

# Start the local Supabase instance if it's not already running
supabase status > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "Starting local Supabase instance..."
  supabase start
else
  echo "Local Supabase instance is already running"
fi

# Copy the local development environment file
cp .env.local.dev .env.local

# Start the Next.js development server
echo "Starting Next.js with local Supabase configuration..."
npm run dev 