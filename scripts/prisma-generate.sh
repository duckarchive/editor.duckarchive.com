#!/bin/bash

# list of Prisma schemas to generate
names=(
  "duckkey"
  "inspector"
  "duckarchive"
)

# run prisma generate for each schema
for name in "${names[@]}"; do
  echo "Generating Prisma client for $name..."
  prisma generate --config "../prisma-$name.config.ts"
done