/**
 * POST /api/admin/features/lock
 * Lock a premium feature for a specific user (admin only)
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

    // Initialize user's feature state if needed
    if (!featureLocks[userId]) {
      featureLocks[userId] = {
        unlockedFeatures: [],
        lockedFeatures: [],
        lastModified: new Date().toISOString(),
      };
    }

    // Remove from unlocked features
    featureLocks[userId].unlockedFeatures = featureLocks[userId].unlockedFeatures.filter(f => f !== featureKey);

    // Add to locked features if not already there
    if (!featureLocks[userId].lockedFeatures.includes(featureKey)) {
      featureLocks[userId].lockedFeatures.push(featureKey);
    }

    featureLocks[userId].lastModified = new Date().toISOString();

    // Save back to file
    fs.writeFileSync(featureLockFile, JSON.stringify(featureLocks, null, 2));

    return NextResponse.json({
      success: true,
      message: `Feature ${featureKey} locked for user ${userId}`,
      lockedFeatures: featureLocks[userId].lockedFeatures,
    });
  } catch (err) {
    console.error('[admin/features/lock] Error:', err);
    return NextResponse.json({ error: 'Failed to lock feature: ' + err.message }, { status: 500 });
  }
}
