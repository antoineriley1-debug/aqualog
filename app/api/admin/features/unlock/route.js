/**
 * POST /api/admin/features/unlock
 * Unlock a premium feature for a specific user (admin only)
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getUserFromRequest, SUPER_ADMIN_ID } from '@/lib/auth';

export async function POST(request) {
  try {
    // Check super admin auth
    const user = await getUserFromRequest(request);
    if (!user || user.id !== SUPER_ADMIN_ID) {
      return NextResponse.json({ error: 'Forbidden — super admin only' }, { status: 403 });
    }

    const { userId, featureKey } = await request.json();

    if (!userId || !featureKey) {
      return NextResponse.json({ error: 'userId and featureKey required' }, { status: 400 });
    }

    const dataDir = path.join(process.cwd(), 'data');
    const featureLockFile = path.join(dataDir, 'feature-locks.json');

    // Load existing feature locks
    let featureLocks = {};
    if (fs.existsSync(featureLockFile)) {
      try {
        featureLocks = JSON.parse(fs.readFileSync(featureLockFile, 'utf8'));
      } catch {
        featureLocks = {};
      }
    }

    // Initialize user's unlocked features if needed
    if (!featureLocks[userId]) {
      featureLocks[userId] = {
        unlockedFeatures: [],
        lockedFeatures: [],
        lastModified: new Date().toISOString(),
      };
    }

    // Add to unlocked features if not already there
    if (!featureLocks[userId].unlockedFeatures.includes(featureKey)) {
      featureLocks[userId].unlockedFeatures.push(featureKey);
    }

    // Remove from locked features if it was there
    featureLocks[userId].lockedFeatures = featureLocks[userId].lockedFeatures.filter(f => f !== featureKey);
    featureLocks[userId].lastModified = new Date().toISOString();

    // Save back to file
    fs.writeFileSync(featureLockFile, JSON.stringify(featureLocks, null, 2));

    return NextResponse.json({
      success: true,
      message: `Feature ${featureKey} unlocked for user ${userId}`,
      unlockedFeatures: featureLocks[userId].unlockedFeatures,
    });
  } catch (err) {
    console.error('[admin/features/unlock] Error:', err);
    return NextResponse.json({ error: 'Failed to unlock feature: ' + err.message }, { status: 500 });
  }
}
