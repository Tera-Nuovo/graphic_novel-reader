#!/bin/bash

# Make a backup of the local environment file if it doesn't exist
if [ ! -f .env.local.backup ]; then
  echo "Creating backup of current .env.local..."
  cp .env.local .env.local.backup
fi

# Restore the original .env.local file if it exists
if [ -f .env.local.orig ]; then
  echo "Restoring original production environment..."
  cp .env.local.orig .env.local
else
  # If no original exists, create a new one without local Supabase settings
  echo "Warning: No original .env.local.orig found. You'll need to set your production Supabase credentials manually."
  # Stopping local Supabase is optional
  # echo "Stopping local Supabase instance..."
  # supabase stop
fi

# Start the Next.js development server
echo "Starting Next.js with production Supabase configuration..."
npm run dev 