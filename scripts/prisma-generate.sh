#!/bin/bash

# list of Prisma schemas to generate
names=(
  "duckkey"
  "inspector"
  "duckarchive"
  "catalog"
)

# run prisma generate for each schema
for name in "${names[@]}"; do
  echo "Generating Prisma client for $name..."
  PRISMA_CLIENT_OUTPUT="$(pwd)/generated/prisma/$name-client" \
  prisma generate --schema "node_modules/@duckarchive/prisma/prisma/$name/schema.prisma"
done