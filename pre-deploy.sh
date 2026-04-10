#!/bin/bash

echo "🚀 ZedBeatz Production Deployment"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check 1: Database migration
echo "📊 Checking database..."
cd /home/jaeycop/projects/zedbeatz
node migrate.js > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Database migration complete${NC}"
else
  echo -e "${RED}❌ Database migration failed${NC}"
  exit 1
fi

# Check 2: Build frontend
echo ""
echo "🏗️  Building frontend..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Frontend build successful${NC}"
else
  echo -e "${RED}❌ Frontend build failed${NC}"
  exit 1
fi

# Check 3: Verify agent syntax
echo ""
echo "🔍 Checking agent code..."
cd /home/jaeycop/projects/agent
python3 -m py_compile music_api.py zedbeatz_uploader.py audio_tagger.py 2>/dev/null
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Agent code syntax valid${NC}"
else
  echo -e "${RED}❌ Agent code has syntax errors${NC}"
  exit 1
fi

# Summary
echo ""
echo "=================================="
echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""
echo "Ready to deploy:"
echo "  1. Agent:    cd /home/jaeycop/projects/agent && fly deploy"
echo "  2. Frontend: cd /home/jaeycop/projects/zedbeatz && vercel --prod"
echo ""
