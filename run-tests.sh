#!/bin/bash

# Set environment variable for testing
export NODE_ENV=test

# Run Jest with any passed arguments
npx jest "$@"