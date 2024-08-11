#!/bin/bash

echo "Current directory: $(pwd)"
echo "Using tsconfig.json from: $(readlink -f tsconfig.json)"

yarn run tsc --noEmit