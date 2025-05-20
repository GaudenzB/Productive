#!/bin/bash
# Deployment script for ProductiTask
# This script handles the deployment process 

# Exit on any error
set -e

# Configuration
ENV=${1:-production}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="deploy_${TIMESTAMP}.log"

# Log function
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Check if database URL is provided
if [ -z "$DATABASE_URL" ]; then
  log "ERROR: DATABASE_URL environment variable is required"
  exit 1
fi

log "Starting deployment to $ENV environment"

# Build the application
log "Building application..."
npm run build >> $LOG_FILE 2>&1
log "Build completed"

# Run database migrations
log "Running database migrations..."
npm run db:push >> $LOG_FILE 2>&1
log "Database migrations completed"

# Start or restart the application
log "Starting application..."
if [ "$ENV" = "production" ]; then
  # For production, we'd use a process manager like PM2
  # pm2 restart productitask || pm2 start dist/index.js --name productitask
  NODE_ENV=production node dist/index.js &
else
  # For development/staging
  NODE_ENV=staging node dist/index.js &
fi

log "Application started successfully"
log "Deployment completed successfully"

# Save deployment info
echo "{\"version\": \"$TIMESTAMP\", \"environment\": \"$ENV\", \"date\": \"$(date +'%Y-%m-%d %H:%M:%S')\"}" > deploy_info.json

log "Deployment information saved to deploy_info.json"