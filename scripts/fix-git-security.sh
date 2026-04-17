#!/bin/bash

# ════════════════════════════════════════════════════════════════════════════════
# FacilityH2O Git Security Fix
# Author: Antoine W. Riley Sr.
# © 2026 FacilityH2O Inc. All Rights Reserved.
# ════════════════════════════════════════════════════════════════════════════════
#
# CRITICAL: This script fixes the exposed GitHub PAT in git remote URL
# 
# Usage: bash scripts/fix-git-security.sh
#
# ════════════════════════════════════════════════════════════════════════════════

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  FacilityH2O Git Security Fix                                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# ════════════════════════════════════════════════════════════════════════════════
# STEP 1: Check current git remote
# ════════════════════════════════════════════════════════════════════════════════

echo "⏱️  Step 1: Checking current git remote..."
REMOTE_URL=$(git remote get-url origin)
echo "Current remote: $REMOTE_URL"

if [[ $REMOTE_URL == *"@"* ]]; then
  echo "⚠️  CRITICAL: Git remote contains credentials (PAT token exposed)"
  echo "   This is a security breach. The token must be revoked immediately."
else
  echo "✅ Git remote appears clean (no credentials visible)"
fi

echo ""

# ════════════════════════════════════════════════════════════════════════════════
# STEP 2: Check git history for exposed tokens
# ════════════════════════════════════════════════════════════════════════════════

echo "⏱️  Step 2: Scanning git history for exposed secrets..."

EXPOSED_PATTERNS=(
  "ghp_[A-Za-z0-9]\{36\}"
  "sk_live_[A-Za-z0-9]\{24\}"
  "sk_test_[A-Za-z0-9]\{24\}"
  "RESEND_API_KEY="
  "SESSION_SECRET="
)

FOUND_ISSUES=0

for pattern in "${EXPOSED_PATTERNS[@]}"; do
  if git log --all -p | grep -E "$pattern" >/dev/null 2>&1; then
    echo "❌ Found potential secret pattern: $pattern"
    FOUND_ISSUES=$((FOUND_ISSUES + 1))
  fi
done

if [ $FOUND_ISSUES -eq 0 ]; then
  echo "✅ No obvious secrets found in git history"
else
  echo "⚠️  $FOUND_ISSUES potential issues found in git history"
fi

echo ""

# ════════════════════════════════════════════════════════════════════════════════
# STEP 3: Fix .gitignore
# ════════════════════════════════════════════════════════════════════════════════

echo "⏱️  Step 3: Updating .gitignore..."

GITIGNORE_FILE=".gitignore"

if [ ! -f "$GITIGNORE_FILE" ]; then
  echo "❌ .gitignore not found"
  exit 1
fi

REQUIRED_PATTERNS=(
  ".env"
  ".env.local"
  ".env.*.local"
)

for pattern in "${REQUIRED_PATTERNS[@]}"; do
  if ! grep -q "^$pattern$" "$GITIGNORE_FILE"; then
    echo "$pattern" >> "$GITIGNORE_FILE"
    echo "  Added: $pattern"
  fi
done

echo "✅ .gitignore updated"
echo ""

# ════════════════════════════════════════════════════════════════════════════════
# STEP 4: Instructions for user
# ════════════════════════════════════════════════════════════════════════════════

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  NEXT STEPS (CRITICAL)                                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo "1️⃣  REVOKE THE EXPOSED GITHUB PAT TOKEN IMMEDIATELY"
echo "   Go to: https://github.com/settings/tokens"
echo "   Find the token that was in the git remote URL and delete it"
echo ""

echo "2️⃣  GENERATE A NEW GITHUB PAT"
echo "   Go to: https://github.com/settings/tokens/new"
echo "   Scopes: repo (full control of private repositories)"
echo "   Save the new token (you'll only see it once)"
echo ""

echo "3️⃣  UPDATE GIT REMOTE TO USE SSH (RECOMMENDED)"
echo "   Run: git remote set-url origin git@github.com:antoineriley1-debug/facilityh2o.git"
echo "   This uses SSH keys instead of PAT tokens (more secure)"
echo "   Or configure SSH: https://docs.github.com/en/authentication/connecting-to-github-with-ssh"
echo ""

echo "4️⃣  OR UPDATE GIT REMOTE TO USE NEW TOKEN"
echo "   Run: git remote set-url origin https://your-new-token@github.com/antoineriley1-debug/facilityh2o.git"
echo "   Replace 'your-new-token' with your new GitHub PAT"
echo ""

echo "5️⃣  VERIFY GIT REMOTE IS UPDATED"
echo "   Run: git remote -v"
echo "   Verify the URL does NOT contain credentials"
echo ""

echo "6️⃣  (OPTIONAL) REWRITE GIT HISTORY TO REMOVE TOKEN"
echo "   ⚠️  Only do this if the token was committed to history"
echo "   Run: git filter-branch --env-filter 'sed -i s/old_token/new_token/g \"\$GIT_AUTHOR_EMAIL\"' HEAD"
echo "   Or use: https://github.com/newren/git-filter-repo"
echo "   Force push: git push --force-with-lease"
echo ""

echo "7️⃣  ROTATE ALL ENVIRONMENT SECRETS"
echo "   - RESEND_API_KEY"
echo "   - SESSION_SECRET"
echo "   - CRON_SECRET"
echo "   - Any Stripe keys"
echo "   - Any other API keys"
echo ""

echo "8️⃣  UPDATE GITHUB SECRETS"
echo "   Go to: https://github.com/antoineriley1-debug/facilityh2o/settings/secrets"
echo "   Update all CI/CD environment variables with new values"
echo ""

echo "9️⃣  UPDATE VERCEL ENVIRONMENT VARIABLES"
echo "   Go to: Vercel Project Settings > Environment Variables"
echo "   Update all secrets with new values"
echo ""

echo "🔟 RUN SECURITY CHECKS"
echo "   Run: npm run test:security"
echo "   Run: npm run pre-deploy"
echo ""

echo "✅ This script has updated .gitignore"
echo "❌ YOU MUST COMPLETE THE STEPS ABOVE TO FULLY SECURE YOUR REPO"
echo ""

