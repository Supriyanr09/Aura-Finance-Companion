#!/bin/bash
# Run this once from the project root to install dependencies
# cd "/Users/supriyanr/Desktop/Claude Projects/Aura-Finance-ver2/Aura-Finance"
# bash install.sh

cd "$(dirname "$0")"
npm install
echo ""
echo "✅ Done. Now run: npm run dev"
